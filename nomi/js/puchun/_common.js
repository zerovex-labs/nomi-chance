/* =========================================================
   NOMI! CHANCE — puchun/_common.js
   プチュン演出の共通部品。
   演出スクリプトは  NOMI.FX.<id> = async (S, ctx) => {}  で登録する。
     S   : PEKA!! の演出API（stage.js）
     ctx : { fx, winner, reveal(), clip }  reveal() で当選者名を表示する
           clip が true のときは音声ファイルが鳴っている（合成音は自動で消音）
   どの演出も「完全暗転」で始まり、最後は NOMI.revive() 等でランプを点灯させて終わる。
   ========================================================= */
(function () {
  const P = PEKA.P, H = PEKA.H, Snd = PEKA.Sound;
  const RB = H.RAINBOW;
  const C = {};
  const clamp01 = (k) => Math.max(0, Math.min(1, k));
  C.clamp01 = clamp01;
  C.easeO = (k) => 1 - Math.pow(1 - clamp01(k), 3);
  C.easeI = (k) => Math.pow(clamp01(k), 3);

  /** 完全暗転の開始：UI・ランプ・ボタン・背景・文字をすべて隠し、#000 にする。BGM停止 */
  C.blackout = (S) => {
    Snd.bgmHold(true);
    S.body('void', true);
    S.lamp(0);
  };

  /**
   * 十字フレア（中心は白・外は指定色）。細く鋭い水平光線を左右いっぱいに伸ばす。
   * o: { arm 0..1（光線の伸び）, core 0..1（芯の強さ）, blade 0..1（横長の刃）, thick px, alpha,
   *      tint: [外側, 中間, 淡色], vlen（縦スパイク長）}
   */
  C.flare = (c, cx, cy, W, Hh, o) => {
    const { arm = 1, core = 1, blade = 0, thick = 0, alpha = 1, vlen = 60 } = o;
    const [OUT, MID, LITE] = o.tint || ['#7c4dff', '#a77bff', '#d9ccff'];
    if (alpha <= 0) return;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const rv = 18 + 40 * core;
    c.globalAlpha = alpha * 0.55; c.drawImage(P.glow(OUT), cx - rv, cy - rv, rv * 2, rv * 2);
    c.globalAlpha = alpha;
    const rw = 6 + 18 * core;
    c.drawImage(P.glow('#ffffff'), cx - rw, cy - rw, rw * 2, rw * 2);
    c.drawImage(P.glow('#ffffff'), cx - rw * 0.55, cy - rw * 0.55, rw * 1.1, rw * 1.1);
    if (blade > 0) {                         // 横長の刃（菱形に伸びた強い光）
      const bw = W * 0.36 * blade, bh = 7 + 12 * blade;
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, P.rgba(LITE, 0.9));
      g.addColorStop(0.65, P.rgba(MID, 0.45)); g.addColorStop(1, P.rgba(OUT, 0));
      c.save(); c.translate(cx, cy); c.scale(bw, bh); c.fillStyle = g;
      c.beginPath(); c.moveTo(-1, 0); c.quadraticCurveTo(0, -1.2, 1, 0); c.quadraticCurveTo(0, 1.2, -1, 0); c.fill(); c.restore();
    }
    if (arm > 0) {
      const half = (W / 2 + 30) * arm;
      const line = () => { c.beginPath(); c.moveTo(cx - half, cy); c.lineTo(cx + half, cy); c.stroke(); };
      c.lineCap = 'round';
      c.shadowColor = MID; c.shadowBlur = 16;
      c.strokeStyle = P.rgba(OUT, 0.45); c.lineWidth = 7 + thick; line();
      const hg = c.createLinearGradient(cx - half, 0, cx + half, 0);
      hg.addColorStop(0, P.rgba(OUT, 0.75)); hg.addColorStop(0.32, MID);
      hg.addColorStop(0.44, LITE); hg.addColorStop(0.5, '#ffffff'); hg.addColorStop(0.56, LITE);
      hg.addColorStop(0.68, MID); hg.addColorStop(1, P.rgba(OUT, 0.75));
      c.shadowColor = LITE; c.shadowBlur = 6;
      c.strokeStyle = hg; c.lineWidth = 2.6 + thick * 0.5; line();
      const k = arm * (1 + thick / 4);
      const spike = (lx, ly, w, col, a, blur) => {
        c.globalAlpha = alpha * a; c.fillStyle = col; c.shadowColor = MID; c.shadowBlur = blur;
        c.beginPath(); c.moveTo(cx, cy - ly); c.lineTo(cx + w, cy); c.lineTo(cx, cy + ly); c.lineTo(cx - w, cy); c.closePath(); c.fill();
        if (lx) { c.beginPath(); c.moveTo(cx - lx, cy); c.lineTo(cx, cy - w); c.lineTo(cx + lx, cy); c.lineTo(cx, cy + w); c.closePath(); c.fill(); }
      };
      spike(0, vlen * k, 7 * k, MID, 0.55, 14);
      spike(66 * k, vlen * 0.66 * k, 3.2 * k, '#f4f0ff', 0.95, 8);
    }
    c.restore();
  };

  /** 中心から虹色の光条が全画面へ放射し、回転しながら消える */
  C.rainbowRays = (S, cx, cy, dur = 1500) => S.layer((c, s) => {
    const k = Math.min(1, s.t / 0.35), N = 28;
    const a = (s.p < 0.45 ? 1 : (1 - s.p) / 0.55) * (S.calm ? 0.5 : 1);   // 光・点滅を抑える設定では半分
    const R = Math.hypot(s.W, s.H) * (0.25 + 0.9 * (1 - Math.pow(1 - k, 3)));
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < N; i++) {
      const an = i / N * Math.PI * 2 + s.t * 0.9, w = Math.PI / N * 0.55, col = RB[i % 7];
      const g = c.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, P.rgba(col, 0.2 * a)); g.addColorStop(0.12, P.rgba(col, 0.85 * a)); g.addColorStop(0.6, P.rgba(col, 0.5 * a)); g.addColorStop(1, P.rgba(col, 0));
      c.fillStyle = g;
      c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R, an - w, an + w); c.closePath(); c.fill();
    }
  }, dur, true);

  /** ランプ点灯（虹） */
  C.lightLamp = (S, o = {}) => S.peka(Object.assign({
    color: '#ff2fa0', core: '#ffffff', skin: 'rainbow', power: 1.2, rest: 0.3, rings: 0, flash: false, shake: false,
    colors: RB.concat('#ffffff'), count: 0, after: 0, sound: () => Snd.peka(0),
  }, o));

  /** 重低音（光・点滅を抑える設定では、白い衝撃波を出さずに音と小さな揺れだけ） */
  C.drop = (S, k = 1) => {
    if (!S.calm) { H.drop(S, k); return; }
    Snd.drop(k); S.shake(0.4 * k, 500);
  };
  /** 光の粒（抑える設定では数を減らす） */
  C.burst = (o) => P.burst(Object.assign({}, o, { count: Math.round(o.count * (PEKA.Stage.calm ? 0.35 : 1)) }));

  /** 暗転からの劇的な復帰：重低音＋虹色の爆発＋ランプ点灯＋当選者表示 */
  C.revive = async (S, ctx, o = {}) => {
    const cx = o.x ?? P.W / 2, cy = o.y ?? P.H / 2;
    S.body('void', false);
    H.drop(S, 1.35);
    S.flash(o.flashColor || '#ffffff', 260, 0.65);
    S.appEl.animate([{ transform: 'scale(1.09)' }, { transform: 'scale(.98)', offset: 0.5 }, { transform: 'scale(1)' }],
      { duration: S.calm ? 600 : 380, easing: 'cubic-bezier(.2,.9,.3,1)', composite: 'add' });
    C.lightLamp(S);
    P.burst({ x: cx, y: cy, count: 150, colors: RB, speed: [400, 2000], gravity: 120, life: [1.2, 2.4], size: [3, 10], type: 'glow' });
    P.burst({ x: cx, y: cy, count: 160, colors: RB, speed: [600, 1900], gravity: 300, life: [0.8, 1.6], size: [4, 8], type: 'spark', trail: 4 });
    P.burst({ x: cx, y: cy, count: 90, colors: RB, speed: [300, 1400], gravity: 200, life: [1, 2], size: [5, 10], type: 'star' });
    RB.forEach((col, i) => setTimeout(() => P.ring({ x: cx, y: cy, color: col, width: 10, life: 1.1 }), i * 60));
    C.rainbowRays(S, cx, cy);
    ctx.reveal();
    S.slow(0.3, 700);
    await S.wait(1300);
  };

  NOMI.C = C;
})();
