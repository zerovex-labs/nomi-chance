/* =========================================================
   PEKA!! — stage.js
   演出スクリプトから呼ぶ演出API（PEKA.Stage、演出内では S）
   「光・揺れ軽減（calm）」はここで一括して吸収する
   ========================================================= */
(function () {
  const $ = (s) => document.querySelector(s);
  const root = document.documentElement;
  const lamp = $('#lamp'), lampBox = $('#lampBox'), screen = $('#screen'), app = $('#app');
  const aura = $('#aura'), rays = $('#rays'), flashEl = $('#flash'), curtain = $('#curtain');
  const ctext = $('#curtainText'), banner = $('#banner');
  const P = PEKA.P, Snd = PEKA.Sound;

  const S = { calm: false, P, snd: Snd, rand: P.rand, pick: P.pick, lampEl: lamp, screenEl: screen, appEl: app, curtainEl: curtain };

  S.wait = (ms) => new Promise(r => setTimeout(r, ms));

  // ---------- 座標 ----------
  S.center = function () {
    const r = lampBox.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  };
  /** 表示中のボタンの中心（QUICKはPUSH、SLOTは i 番目） */
  S.padCenter = function (i = 1) {
    const el = document.body.dataset.game === 'quick' ? document.getElementById('pushBtn') : document.querySelectorAll('.pad')[i];
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  /** 表示中のボタン要素 */
  S.visibleButtons = () => [...document.querySelectorAll('.push, .pad')].filter(b => b.offsetParent !== null);
  S.syncAura = function () {
    const c = S.center();
    root.style.setProperty('--ax', c.x + 'px');
    root.style.setProperty('--ay', c.y + 'px');
  };
  window.addEventListener('resize', () => S.syncAura());

  // ---------- 汎用フェード（WAAPI） ----------
  function fade(el, to, dur = 300, easing = 'ease-out') {
    const from = parseFloat(getComputedStyle(el).opacity) || 0;
    el.getAnimations().forEach(a => a.cancel());
    el.style.opacity = to;
    if (dur > 0) el.animate([{ opacity: from }, { opacity: to }], { duration: dur, easing });
  }

  // ---------- ランプ ----------
  let lv = 0, raf = 0, settleTween = null;
  S.level = () => lv;
  function setLv(v) { lv = v; lamp.style.setProperty('--lv', v.toFixed(3)); }
  /**
   * ランプの明るさ 0..1。dur>0 ならトゥイーン。
   * 後続の呼び出しで中断されても、rAFが止まっていても、Promiseは必ず解決する。
   */
  S.lamp = function (to, dur = 0, ease = (k) => k) {
    cancelAnimationFrame(raf);
    if (settleTween) settleTween();
    if (!dur) { setLv(to); return Promise.resolve(); }
    const from = lv, t0 = performance.now();
    return new Promise(resolve => {
      let done = false;
      const finish = (snap) => {
        if (done) return; done = true; settleTween = null;
        clearTimeout(guard); cancelAnimationFrame(raf);
        if (snap) setLv(to);
        resolve();
      };
      settleTween = () => finish(false);
      const guard = setTimeout(() => finish(true), dur + 150);
      const step = (now) => {
        if (done) return;
        const k = Math.min(1, (now - t0) / dur);
        setLv(from + (to - from) * ease(k));
        if (k < 1) raf = requestAnimationFrame(step); else finish(false);
      };
      raf = requestAnimationFrame(step);
    });
  };
  S.color = function (lc = '#ff2448', core = '#ffd2dc') {
    lamp.style.setProperty('--lc', lc);
    lamp.style.setProperty('--lc2', core);
    root.style.setProperty('--aura', lc);
  };
  S.auraColor = (c) => root.style.setProperty('--aura', c);
  S.skin = (name) => { if (name) lamp.dataset.skin = name; else delete lamp.dataset.skin; };
  S.hold = (on) => lamp.classList.toggle('hold', on);
  S.lampAnim = (frames, opt) => lamp.animate(frames, opt);

  // ---------- 全画面の光 ----------
  /** オーラ：ランプの枠を越えて画面全体に広がる光 */
  S.aura = function (peak = 1, rest = 0.4, dur = 900) {
    if (S.calm) peak = Math.min(peak, 0.6);
    aura.getAnimations().forEach(a => a.cancel());
    aura.style.opacity = rest;
    aura.animate([
      { opacity: 0, transform: 'scale(.3)' },
      { opacity: peak, transform: 'scale(1.15)', offset: 0.25 },
      { opacity: rest, transform: 'scale(1)' },
    ], { duration: dur, easing: 'cubic-bezier(.2,.8,.3,1)' });
  };
  S.auraTo = (to, dur = 400) => fade(aura, to, dur);
  S.rays = (to, dur = 600) => fade(rays, to, dur);

  /** 全画面フラッシュ（軽減時は弱く・ゆっくり） */
  S.flash = function (color = '#fff', dur = 300, peak = 1) {
    if (S.calm) { peak = Math.min(peak, 0.28); dur = Math.max(dur, 380); }
    flashEl.getAnimations().forEach(a => a.cancel());
    flashEl.style.background = color;
    flashEl.style.opacity = 0;
    flashEl.animate([{ opacity: 0 }, { opacity: peak, offset: 0.08 }, { opacity: 0 }], { duration: dur, easing: 'ease-out' });
  };
  /** 連続閃光（軽減時は 3回以下・約2.6Hz以下） */
  S.strobe = async function (count = 10, gap = 70, colors = ['#fff'], onEach) {
    if (S.calm) { count = Math.min(count, 3); gap = Math.max(gap, 380); }
    for (let i = 0; i < count; i++) {
      S.flash(colors[i % colors.length], gap * 0.9, 0.92);
      if (onEach) onEach(i);
      await S.wait(gap);
    }
  };

  /** 暗転幕。1で完全暗転 */
  S.curtain = function (to, dur = 0, color = '#000') {
    curtain.style.background = color;
    fade(curtain, to, dur, 'linear');
    return S.wait(dur);
  };
  S.curtainText = function (text, color = '#ff1030', dur = 160) {
    ctext.textContent = text || '';
    ctext.style.color = color;
    ctext.style.textShadow = `0 0 20px ${color}`;
    fade(ctext, text ? 1 : 0, dur);
  };

  // ---------- 揺れ・スロー ----------
  S.shake = function (power = 1, dur = 500) {
    const amp = power * (S.calm ? 1.5 : 12), rot = S.calm ? 0.05 : 0.6;
    const n = Math.max(4, Math.round(dur / 35)), frames = [];
    for (let i = 0; i < n; i++) {
      const k = 1 - i / n;
      frames.push({ transform: `translate(${P.rand(-amp, amp) * k}px,${P.rand(-amp, amp) * k}px) rotate(${P.rand(-rot, rot) * k * power}deg)` });
    }
    frames.push({ transform: 'none' });
    app.animate(frames, { duration: dur });
  };
  /** 持続的に強まる振動 */
  S.quake = function (power = 1, dur = 1500) {
    const amp = power * (S.calm ? 1.2 : 8), n = Math.round(dur / 30), frames = [];
    for (let i = 0; i < n; i++) { const a = amp * (0.3 + i / n); frames.push({ transform: `translate(${P.rand(-a, a)}px,${P.rand(-a, a)}px)` }); }
    frames.push({ transform: 'none' });
    app.animate(frames, { duration: dur });
  };
  /** パーティクルのスローモーション（dur後に0.5秒かけて復帰） */
  S.slow = function (scale = 0.2, dur = 1200) {
    P.timeScale = scale;
    setTimeout(() => {
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / 500);
        P.timeScale = scale + (1 - scale) * k;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, dur);
  };

  // ---------- 文字 ----------
  const BANNER = {
    slam: [{ opacity: 0, transform: 'translateY(-50%) scale(3)' }, { opacity: 1, transform: 'translateY(-50%) scale(1)', offset: 0.12 }, { opacity: 1, transform: 'translateY(-50%) scale(1.05)', offset: 0.8 }, { opacity: 0, transform: 'translateY(-50%) scale(1.3)' }],
    fade: [{ opacity: 0, transform: 'translateY(-50%)' }, { opacity: 1, transform: 'translateY(-50%)', offset: 0.2 }, { opacity: 1, transform: 'translateY(-50%)', offset: 0.8 }, { opacity: 0, transform: 'translateY(-50%)' }],
  };
  S.banner = function (text, cls = '', dur = 1200, kind = 'slam') {
    banner.className = cls;
    banner.textContent = text;
    banner.getAnimations().forEach(a => a.cancel());
    banner.animate(BANNER[kind], { duration: dur, easing: 'ease-out' });
  };

  // ---------- クラス切替 ----------
  S.screen = (cls, on) => screen.classList.toggle(cls, on);
  S.body = (cls, on) => document.body.classList.toggle(cls, on);

  // ---------- パーティクルのショートカット（既定はランプ中心） ----------
  S.burst = (o = {}) => { const c = S.center(); P.burst(Object.assign({ x: c.x, y: c.y, jitter: c.w * 0.25 }, o)); };
  S.ring = (o = {}) => { const c = S.center(); P.ring(Object.assign({ x: c.x, y: c.y }, o)); };
  S.layer = (fn, dur, top) => P.layer(fn, dur, top);
  S.add = (o) => P.add(o);

  /**
   * 告知クライマックスの標準形：点灯＋全画面フラッシュ＋オーラ＋光線＋粒子＋衝撃波＋揺れ＋音
   * o: color, core, skin, power, sound('peka'|'soft'|'none'|関数), pitch, colors, count, rings,
   *    flash(false可), shake(false可), rays, rest, lampDur, burst{上書き}, after(ms)
   */
  S.peka = function (o = {}) {
    Snd.bgmHold(false);   // 告知＝フリーズからの復帰。BGM再開
    const k = o.power ?? 1;
    const col = o.color || '#ff2448';
    S.color(col, o.core || '#ffe0e6');
    S.skin(o.skin || null);
    S.syncAura();
    S.lamp(1, o.lampDur || 0);
    if (o.flash !== false) S.flash(o.flashColor || '#fff', 260 + k * 160, Math.min(1, 0.55 + k * 0.3));
    S.aura(Math.min(1, 0.7 + k * 0.25), o.rest ?? 0.38, 700 + k * 500);
    if (o.rays !== false) S.rays(o.rays ?? (k >= 1 ? 0.55 : 0.3));
    S.burst(Object.assign({
      count: o.count ?? Math.round(120 * k), colors: o.colors || [col, '#ffffff', '#ffd54a', '#ff7ac8'],
      speed: [250, 900 * Math.max(0.7, k)], gravity: 260, life: [0.8, 2.0], size: [3, 12],
    }, o.burst));
    const n = o.rings ?? (k >= 1 ? 2 : 1);
    for (let i = 0; i < n; i++) setTimeout(() => S.ring({ color: i % 2 ? '#fff' : col, width: 26 - i * 5, life: 0.7 + i * 0.25, squash: 0.62 }), i * 120);
    if (o.shake !== false) S.shake(0.4 + k * 0.5, 350 + k * 200);
    if (typeof o.sound === 'function') o.sound();
    else if (o.sound === 'soft') Snd.soft();
    else if (o.sound !== 'none') { Snd.peka(o.pitch || 0); if (k >= 1.2) Snd.bass(Math.min(1.6, k)); }
    return S.wait(o.after ?? 900);
  };

  /* ---------- 当選後レインボーフィーバー ----------
     画面全体を虹色で覆い、BGMの拍（138BPM）に合わせて
     虹の衝撃波・フラッシュ・噴水・紙吹雪を繰り返す。 */
  const feverEl = $('#fever');
  const RB = ['#ff004c', '#ff9a00', '#ffe600', '#2bff6b', '#00c8ff', '#6a5bff', '#ff00d4'];
  let fever = null;
  S.fever = function (dur = 8000) {
    S.feverStop(true);
    const calm = S.calm, beatMs = 60000 / 138, t0 = performance.now();
    const saved = { skin: lamp.dataset.skin || null, lc: lamp.style.getPropertyValue('--lc'), lc2: lamp.style.getPropertyValue('--lc2') };
    const st = { alive: true, raf: 0, iv: 0, emit: null, resolve: null };
    fever = st;

    document.body.classList.add('fever');
    fade(feverEl, calm ? 0.3 : 0.62, 500);
    S.skin('rainbow'); S.lamp(1); S.syncAura();
    S.rays(calm ? 0.45 : 0.8, 500); S.auraTo(calm ? 0.4 : 0.6, 500);
    Snd.bgmDuck(1); Snd.harp(); Snd.shimmer(1);

    // オーラ・光線の色を虹色に回し続ける
    const cycle = (now) => {
      if (!st.alive) return;
      root.style.setProperty('--aura', `hsl(${((now - t0) / (calm ? 40 : 7)) % 360}deg 100% 60%)`);
      st.raf = requestAnimationFrame(cycle);
    };
    st.raf = requestAnimationFrame(cycle);

    // 降り続ける紙吹雪と虹の星
    let acc = 0;
    st.emit = P.layer((c, s) => {
      acc += (calm ? 25 : 70) * s.dt;
      while (acc >= 1) {
        acc--;
        P.add(Math.random() < 0.7
          ? { type: 'confetti', x: P.rand(0, P.W), y: -10, vx: P.rand(-60, 60), vy: P.rand(120, 260), ay: 40, sway: 2.5, size: P.rand(8, 14), color: P.pick(RB), spin: P.rand(-6, 6), life: 4, fadeAt: 0.85 }
          : { type: 'star', x: P.rand(0, P.W), y: -10, vy: P.rand(200, 380), size: P.rand(4, 9), color: P.pick(RB), spin: 4, life: 3 });
      }
    }, 0);

    // 拍ごとの派手な打ち込み
    let beat = 0;
    const onBeat = () => {
      if (!st.alive) return;
      const col = RB[beat % RB.length], c = S.center();
      P.ring({ x: c.x, y: c.y, color: col, width: calm ? 8 : 26, life: 0.8, squash: 0.62, fill: !calm });
      if (!calm) S.flash(col, 260, 0.28);
      const side = beat % 2 ? P.W - 10 : 10;
      P.burst({ x: side, y: P.H, angle: beat % 2 ? -Math.PI * 0.62 : -Math.PI * 0.38, spread: 0.28, count: calm ? 12 : 40,
        colors: RB, speed: [700, 1300], gravity: 700, life: [1, 1.8], size: [3, 9], type: 'glow' });
      if (beat % 4 === 0) {
        P.burst({ x: c.x, y: c.y, count: calm ? 30 : 110, colors: RB.concat('#fff'), speed: [300, 1200], gravity: 250, life: [0.8, 1.8], size: [3, 11], type: 'star' });
        Snd.shimmer(0.4);
        S.lampAnim([{ transform: 'scale(1)' }, { transform: 'scale(1.07)' }, { transform: 'scale(1)' }], { duration: 300 });
        if (!calm) S.shake(0.35, 220);
      }
      beat++;
    };
    onBeat();
    st.iv = setInterval(onBeat, beatMs);

    const done = new Promise(r => { st.resolve = r; });
    setTimeout(() => { if (fever === st) S.feverStop(false, saved); }, dur);
    st.saved = saved;
    return done;
  };
  /** フィーバー終了。now=true で即時（次ゲームへのリセット時） */
  S.feverStop = function (now, saved) {
    const st = fever; if (!st) return;
    fever = null; st.alive = false;
    clearInterval(st.iv); cancelAnimationFrame(st.raf);
    if (st.emit) st.emit.stop();
    fade(feverEl, 0, now ? 0 : 800);
    document.body.classList.remove('fever');
    if (!now) {
      const sv = saved || st.saved;
      S.skin(sv.skin); if (sv.lc) S.color(sv.lc, sv.lc2 || '#ffe0e6');
      S.rays(0.5, 800); S.auraTo(0.38, 800);
    }
    st.resolve();
  };

  /** 告知後の「点灯維持」状態に整える */
  S.settle = function () {
    ['dark', 'mono', 'uv', 'stop', 'cut'].forEach(c => S.screen(c, false));
    S.body('glitch', false);
    S.body('void', false);
    if (parseFloat(getComputedStyle(curtain).opacity) > 0) S.curtain(0, 300);
    S.curtainText('');
    P.timeScale = 1;
    Snd.hush(false);
    Snd.bgmHold(false);
    if (lv < 1) S.lamp(1, 200);
    S.hold(true);
  };

  /** 次ゲームへ：完全リセット */
  S.reset = function () {
    S.feverStop(true);
    S.settle();
    S.hold(false);
    S.lamp(0, 160);
    fade(aura, 0, 250); fade(rays, 0, 250);
    lamp.getAnimations().forEach(a => a.cancel());
    banner.getAnimations().forEach(a => a.cancel()); banner.style.opacity = 0;
    S.skin(null); S.color();
    P.clear();
  };

  S.color();
  PEKA.Stage = S;
})();
