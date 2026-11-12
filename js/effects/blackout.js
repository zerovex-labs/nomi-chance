/* =========================================================
   PEKA!! — ブラックアウト系 100種（No.61〜160）
   config.js の PEKA.BLACKOUT（入り方10 × 闇の出来事10 × 復活10 × 発光色10）から
   各演出の部品を組み立てて再生する。

   闇は Canvas の「下層レイヤー」で塗る。こうすると、闇の中の出来事
   （火花・星・目・亀裂など）をパーティクルや上層レイヤーで闇の上に描ける。
   ========================================================= */
(function () {
  const FX = PEKA.FX, H = PEKA.H, P = PEKA.P, Snd = PEKA.Sound, B = PEKA.BLACKOUT;
  const { rand, pick } = P;

  /** 数値のトゥイーン（setIntervalなので rAF が止まっていても必ず終わる） */
  function tween(o, key, to, ms) {
    if (!ms) { o[key] = to; return Promise.resolve(); }
    const from = o[key], t0 = performance.now();
    return new Promise(res => {
      const iv = setInterval(() => {
        const k = Math.min(1, (performance.now() - t0) / ms);
        o[key] = from + (to - from) * k;
        if (k >= 1) { clearInterval(iv); res(); }
      }, 16);
    });
  }
  /** 闇（a: 0..1） */
  function darkness(S) {
    const D = { a: 0 };
    D.layer = S.layer((c, s) => {
      if (D.a <= 0.002) return;
      c.fillStyle = `rgba(0,0,0,${Math.min(1, D.a)})`;
      c.fillRect(0, 0, s.W, s.H);
    }, 0, false);
    D.to = (v, ms = 0) => tween(D, 'a', v, ms);
    return D;
  }
  /** 黒で塗り、指定の形だけ抜く上層レイヤー（円・帯など） */
  function mask(S, ms, draw) {
    return S.layer((c, s) => {
      const k = Math.min(1, s.t / (ms / 1000));
      c.fillStyle = '#000';
      draw(c, s, k);
    }, ms + 400, true);
  }

  /* =============== 1) 暗転の入り方 =============== */
  const INTRO = {
    async cut(S, D) { Snd.puchun(); D.to(1); await S.wait(60); },

    async fade(S, D) { Snd.whoosh(1.2, false); Snd.hum(1.2); await D.to(1, 1200); },

    async tvoff(S, D) {   // 画面が横線→点に潰れて消える
      Snd.puchun(); Snd.whine(0.5);
      const glow = S.calm ? 0.35 : 0.85;
      const L = S.layer((c, s) => {
        const k = Math.min(1, s.t / 0.55);
        c.fillStyle = '#000'; c.fillRect(0, 0, s.W, s.H);
        const h = Math.max(2, (1 - H.easeOut(Math.min(1, k * 2))) * s.H);
        const w = k < 0.5 ? s.W : Math.max(0, s.W * (1 - (k - 0.5) * 2));
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = `rgba(255,255,255,${glow})`; c.fillRect((s.W - w) / 2, (s.H - h) / 2, w, h);
        if (k < 1) c.drawImage(P.glow('#ffffff'), s.W / 2 - 30, s.H / 2 - 30, 60, 60);
      }, 0, true);
      await S.wait(620); D.to(1); await S.wait(60); L.stop();
    },

    async iris(S, D) {    // ランプへ向かって円が閉じる
      const c0 = S.center(), R = Math.hypot(Math.max(c0.x, P.W - c0.x), Math.max(c0.y, P.H - c0.y)) * 1.02;
      Snd.rewind(0.7);
      const L = mask(S, 700, (c, s, k) => {
        const r = Math.max(0, R * (1 - H.easeInOut(k)));
        c.beginPath(); c.rect(0, 0, s.W, s.H); c.arc(c0.x, c0.y, r, 0, Math.PI * 2, true); c.fill('evenodd');
      });
      await S.wait(720); Snd.puchun(); D.to(1); await S.wait(60); L.stop();
    },

    async blinds(S, D) {  // 8本の帯が順に閉じる
      const n = 8;
      for (let i = 0; i < n; i++) setTimeout(() => Snd.tick(i % 2 === 0), i * 70);
      const L = mask(S, 760, (c, s, k) => {
        const bh = s.H / n;
        for (let i = 0; i < n; i++) {
          const ki = Math.max(0, Math.min(1, (k * 1.6) - i * 0.08));
          c.fillRect(0, i * bh, s.W, bh * ki);
        }
      });
      await S.wait(780); D.to(1); await S.wait(60); L.stop();
    },

    async drop(S, D) {    // 上から黒幕が落ちる
      Snd.whoosh(0.5, false);
      const L = mask(S, 520, (c, s, k) => c.fillRect(0, 0, s.W, s.H * H.easeIn(k)));
      await S.wait(530); Snd.crack(); Snd.bass(0.6); D.to(1); await S.wait(60); L.stop();
    },

    async shutter(S, D) { // 上下から瞼のように閉じる
      Snd.whoosh(0.45, false);
      const L = mask(S, 460, (c, s, k) => {
        const h = s.H / 2 * H.easeIn(k);
        c.fillRect(0, 0, s.W, h); c.fillRect(0, s.H - h, s.W, h);
      });
      await S.wait(470); Snd.crack(); D.to(1); await S.wait(60); L.stop();
    },

    async glitch(S, D) {
      S.body('glitch', true); Snd.glitch(0.6); Snd.static(0.6);
      await S.wait(620);
      S.body('glitch', false); Snd.puchun(); D.to(1);
    },

    async drain(S, D) {   // 色が抜けてから暗転
      S.screen('mono', true); Snd.boo();
      await S.wait(700);
      await D.to(1, 450);
      S.screen('mono', false);
    },

    async flicker(S, D) { // 停電のように明滅
      const seq = S.calm ? [1, 0, 1] : [1, 0, 0.8, 0, 1, 0.2, 1];
      for (const a of seq) { D.to(a); if (a > 0.5) Snd.tick(false); await S.wait(S.calm ? 300 : rand(60, 160)); }
      Snd.puchun(); D.to(1);
    },
  };

  /* =============== 2) 闇の中の出来事（約2秒） =============== */
  const DARK = {
    async silence(S) { await S.wait(2000); },

    async heart(S, D, pal) {
      let pulse = 0;
      const L = S.layer((c, s) => {
        if (pulse <= 0.02) return;
        const g = c.createRadialGradient(s.W / 2, s.H / 2, 0, s.W / 2, s.H / 2, Math.max(s.W, s.H) * 0.7);
        g.addColorStop(0, P.rgba('#ff0020', 0)); g.addColorStop(1, P.rgba('#ff0020', 0.4 * pulse));
        c.fillStyle = g; c.fillRect(0, 0, s.W, s.H);
        pulse *= 0.93;
      }, 0, true);
      for (let i = 0; i < 3; i++) { Snd.heartbeat(0.7 + i * 0.2); pulse = 1; await S.wait(680); }
      L.stop();
    },

    async spark(S, D, pal) {
      const E = H.emit(S, 1900, 28, () => P.add({ type: 'spark', x: rand(0, P.W), y: rand(0, P.H), vx: rand(-260, 260), vy: rand(-260, 260),
        size: rand(3, 6), color: pick(['#ffd54a', '#ffffff', pal.color]), life: 0.25, trail: 2 }));
      for (let i = 0; i < 8; i++) setTimeout(() => Snd.tick(Math.random() < 0.5), rand(0, 1800));
      await S.wait(2000); E.stop();
    },

    async count(S, D, pal) {
      for (const n of ['3', '2', '1']) {
        S.curtainText(n, pal.color, 60); Snd.beep(n === '1');
        await S.wait(560); S.curtainText('', pal.color, 100); await S.wait(110);
      }
    },

    async eye(S, D, pal) {   // 闇の奥で二つの目が光り、瞬く
      const c0 = S.center();
      Snd.drone(2);
      const L = S.layer((c, s) => {
        const blink = Math.abs(Math.sin(s.t * 1.6)) < 0.12 ? 0.1 : 1;
        const a = Math.min(1, s.t / 0.6) * blink, r = 18 + Math.sin(s.t * 3) * 3;
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = a;
        [-1, 1].forEach(sd => c.drawImage(P.glow(pal.color), c0.x + sd * c0.w * 0.16 - r, c0.y - r, r * 2, r * 2));
      }, 0, true);
      await S.wait(2100); L.stop();
    },

    async thunder(S, D) {    // 遠くで雷光、闇がわずかに薄れる
      for (let i = 0; i < 2; i++) {
        await S.wait(450);
        const pts = P.bolt(rand(0, P.W), -10, rand(0, P.W), P.H * rand(0.3, 0.6), 60);
        const L = S.layer((c) => { c.globalAlpha = 0.55; P.beam(c, pts, '#9fb8ff', 2); }, 170, true);
        D.to(0.82); Snd.thunder();
        await S.wait(120); D.to(1, 300); await S.wait(380); L.stop();
      }
    },

    async whisper(S, D, pal) {
      const words = ['…', '来る', 'まだ', 'PEKA'];
      const marks = words.map((w, i) => ({ w, x: rand(0.2, 0.8), y: rand(0.2, 0.8), t0: i * 0.5 }));
      Snd.hum(2.2);
      const L = S.layer((c, s) => {
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 30px sans-serif';
        for (const m of marks) {
          const k = (s.t - m.t0) / 0.9; if (k < 0 || k > 1) continue;
          c.fillStyle = P.rgba(pal.color, Math.sin(k * Math.PI) * 0.75);
          c.fillText(m.w, m.x * s.W, m.y * s.H);
        }
      }, 0, true);
      await S.wait(2300); L.stop();
    },

    async stars(S, D, pal) {
      Snd.shimmer(2);
      for (let i = 0; i < 26; i++) {
        P.add({ x: rand(0, P.W), y: rand(0, P.H), size: rand(3, 8), color: pick(['#ffffff', pal.color]), life: 3, fadeIn: 0.25, fadeAt: 0.8 });
        await S.wait(75);
      }
      await S.wait(100);
    },

    async crack(S, D, pal) { // 中央に縦の光の亀裂が広がる
      Snd.riser(2);
      const L = S.layer((c, s) => {
        const w = 1 + s.t * 3, a = 0.6 + Math.sin(s.t * 18) * 0.25;
        c.globalCompositeOperation = 'lighter';
        const g = c.createLinearGradient(s.W / 2 - w * 6, 0, s.W / 2 + w * 6, 0);
        g.addColorStop(0, P.rgba(pal.color, 0)); g.addColorStop(0.5, P.rgba('#ffffff', a)); g.addColorStop(1, P.rgba(pal.color, 0));
        c.fillStyle = g; c.fillRect(s.W / 2 - w * 6, 0, w * 12, s.H);
      }, 0, true);
      await S.wait(2000); L.stop();
    },

    async rumble(S, D) {     // 地鳴り：闇が揺らぎ、砂ぼこりが落ちる
      Snd.rumble(2);
      const E = H.emit(S, 2000, 45, () => P.add({ type: 'dot', x: rand(0, P.W), y: -5, vy: rand(200, 500), ay: 600, size: rand(1, 2.5), color: '#8a7a90', life: 1.4 }));
      const t0 = performance.now();
      while (performance.now() - t0 < 2000) { D.to(rand(0.9, 1)); await S.wait(70); }
      D.to(1); E.stop();
    },
  };

  /* =============== 3) 復活の仕方 =============== */
  const pekaOf = (S, pal, o = {}) => S.peka(Object.assign({
    color: pal.color, core: pal.core, skin: pal.skin, power: 1.7, rings: 3,
    colors: [pal.color, '#ffffff', pal.core, '#ffd54a'],
  }, o));

  const REVIVE = {
    async burst(S, D, pal) { H.drop(S, 1.15); D.to(0); S.slow(0.35, 600); await pekaOf(S, pal); },

    async flash(S, D, pal) { S.flash('#fff', 700, 1); H.drop(S, 1); D.to(0); await pekaOf(S, pal, { flash: false }); },

    async iris(S, D, pal) {  // ランプから光の円が広がる
      const c0 = S.center(), R = Math.hypot(Math.max(c0.x, P.W - c0.x), Math.max(c0.y, P.H - c0.y)) * 1.02;
      const L = mask(S, 650, (c, s, k) => {
        if (D.a) D.a = 0;
        const r = R * H.easeOut(k);
        c.beginPath(); c.rect(0, 0, s.W, s.H); c.arc(c0.x, c0.y, r, 0, Math.PI * 2, true); c.fill('evenodd');
      });
      H.drop(S, 1.05);
      pekaOf(S, pal, { after: 0 });
      await S.wait(700); L.stop(); await S.wait(500);
    },

    async shatter(S, D, pal) {
      Snd.glass(); H.drop(S, 1.1); D.to(0);
      H.shards(S, 80, ['rgba(0,0,0,.92)', 'rgba(16,10,24,.9)', 'rgba(60,50,80,.8)']);
      await pekaOf(S, pal);
    },

    async rise(S, D, pal) {  // 闇の中でランプの光が膨らむ
      const c0 = S.center();
      Snd.riser(0.9);
      const L = S.layer((c, s) => {
        const r = c0.w * 0.9 * H.easeIn(Math.min(1, s.t / 0.9));
        c.globalCompositeOperation = 'lighter';
        c.drawImage(P.glow(pal.color), c0.x - r, c0.y - r * 0.62, r * 2, r * 1.24);
      }, 1500, true);
      await S.wait(900);
      H.drop(S, 0.95); D.to(0, 450);
      await pekaOf(S, pal, { power: 1.5 });
      L.stop();
    },

    async bolt(S, D, pal) {
      const c0 = S.center(), pts = P.bolt(c0.x + rand(-30, 30), -20, c0.x, c0.y, 80);
      S.layer((c) => P.beam(c, pts, '#e0ecff', 6), 320, true);
      Snd.thunder();
      await S.wait(130);
      S.flash('#e0ecff', 400, 1); H.drop(S, 1.1); D.to(0);
      await pekaOf(S, pal);
    },

    async wave(S, D, pal) {  // 衝撃波3発で闇が段階的に吹き飛ぶ
      for (let i = 0; i < 3; i++) {
        Snd.bass(0.9);
        S.ring({ color: i === 2 ? pal.color : '#ffffff', width: 40, life: 0.8, fill: true });
        D.to(1 - (i + 1) / 3, 150);
        await S.wait(260);
      }
      H.drop(S, 1); await pekaOf(S, pal);
    },

    async tvon(S, D, pal) {  // 横線が現れ、上下に開いて映像が戻る
      Snd.whine(0.3);
      const L = mask(S, 520, (c, s, k) => {
        if (D.a) D.a = 0;
        const w = s.W * Math.min(1, k * 2.2), h = Math.max(2, s.H * Math.max(0, (k - 0.45) / 0.55));
        const y0 = (s.H - h) / 2, x0 = (s.W - w) / 2;
        c.fillRect(0, 0, s.W, y0); c.fillRect(0, y0 + h, s.W, s.H - y0 - h);
        c.fillRect(0, y0, x0, h); c.fillRect(x0 + w, y0, s.W - x0 - w, h);
      });
      await S.wait(260);
      H.drop(S, 1.05);
      pekaOf(S, pal, { after: 0 });
      await S.wait(500); L.stop(); await S.wait(500);
    },

    async lift(S, D, pal) {  // 闇の幕が跳ね上がる
      Snd.whoosh(0.5, true);
      const L = mask(S, 480, (c, s, k) => { if (D.a) D.a = 0; c.fillRect(0, 0, s.W, s.H * (1 - H.easeIn(k))); });
      await S.wait(380);
      H.drop(S, 1.05);
      pekaOf(S, pal, { after: 0 });
      await S.wait(300); L.stop(); await S.wait(600);
    },

    async strobe(S, D, pal) {
      D.to(0);
      await S.strobe(6, 70, ['#ffffff', pal.color], (i) => Snd.tick(i % 2 === 0));
      H.drop(S, 1.1); await pekaOf(S, pal);
    },
  };

  /** 1つのブラックアウトを再生 */
  async function play(S, parts) {
    const pal = B.palettes[parts.palette];
    const D = darkness(S);
    try {
      Snd.bgmHold(true);                          // 暗転中はBGM完全停止
      S.lamp(0);
      await INTRO[B.intros[parts.intro].id](S, D, pal);
      await S.wait(250);
      await DARK[B.darks[parts.dark].id](S, D, pal);
      await S.wait(200);
      await REVIVE[B.revives[parts.revive].id](S, D, pal);   // S.peka で BGM 再開
      if (pal.premium) H.premium(S, pal.skin === 'rainbow' ? H.RAINBOW : H.GOLDS);
    } finally {
      D.layer.stop();
      S.curtainText('');
    }
  }

  // config で生成された100種を登録
  PEKA.EFFECTS.filter(e => e.cat === 'blackout').forEach(e => { FX[e.id] = (S) => play(S, e.parts); });
  PEKA.BLACKOUT_PARTS = { INTRO, DARK, REVIVE };
})();
