/* =========================================================
   BLUE CROSS（雰囲気参考：リコリス・リコイル。演出・音はオリジナル）
     0.00s  完全暗転・一瞬の無音
     0.10s  白い全画面閃光＋衝撃音
     0.20s  濃紺の闇に青白い巨大十字フレア → 0.8秒かけて星になって消える（途中で虹色のレンズリング）
     1.00s  真っ黒
     1.10s  赤い告知画面（虹色のNOMI!エンブレム＋金のきらめき）→ ランプ点灯・当選者表示
     1.20s  色の連打（緑・水色・黄・マゼンタ）
     1.60s  黒・白・虹の高速切替（光・点滅を抑える設定では、ゆるやかな色の変化に置き換え）
     3.00s  虹色の玉ボケと光の奔流
     4.30s  終了 → 8秒レインボーへ
   ========================================================= */
(function () {
  const P = PEKA.P, Snd = PEKA.Sound, C = NOMI.C, RB = PEKA.H.RAINBOW;
  const T = { flash: 0.1, flare: 0.2, flareEnd: 1.0, red: 1.1, cycle: 1.2, strobe: 1.6, bokeh: 3.0, end: 4.3 };
  const BLUE = ['#2f5bff', '#5d8bff', '#cfe0ff'];
  const CYCLE = ['#22d36a', '#22c8e6', '#f2e224', '#e624c4'];
  const STROBE = 'kcwckckckckcwk';   // k=黒 c=虹 w=白（0.1秒ずつ）

  function sparkle(c, x, y, r, col) {
    c.fillStyle = col; c.beginPath();
    c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r * 0.28, y); c.quadraticCurveTo(x, y, x, y + r);
    c.quadraticCurveTo(x, y, x - r * 0.28, y); c.quadraticCurveTo(x, y, x, y - r); c.fill();
    c.beginPath(); c.moveTo(x - r * 0.7, y); c.quadraticCurveTo(x, y, x, y - r * 0.2); c.quadraticCurveTo(x, y, x + r * 0.7, y);
    c.quadraticCurveTo(x, y, x, y + r * 0.2); c.quadraticCurveTo(x, y, x - r * 0.7, y); c.fill();
  }
  function emblem(c, cx, cy, w) {     // 虹色の楕円エンブレム（NOMI!）
    const h = w * 0.6;
    const g = c.createLinearGradient(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
    RB.forEach((col, i) => g.addColorStop(i / (RB.length - 1), col));
    c.save();
    c.shadowColor = '#fff'; c.shadowBlur = 24;
    c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2); c.fill();
    c.lineWidth = 5; c.strokeStyle = '#fff'; c.stroke();
    c.shadowBlur = 0;
    c.font = `italic 900 ${Math.round(h * 0.42)}px "Arial Black", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 6; c.strokeStyle = '#4a0040'; c.strokeText('NOMI!', cx, cy + 2);
    c.fillStyle = '#fff'; c.fillText('NOMI!', cx, cy + 2);
    c.restore();
  }

  NOMI.FX.bluecross = async (S, ctx) => {
    const calm = S.calm;
    const W0 = P.W, H0 = P.H;
    const sparks = Array.from({ length: 22 }, () => ({ x: Math.random(), y: Math.random(), r: 6 + Math.random() * 22, col: Math.random() < 0.7 ? '#ffd54a' : P.pick(['#c46bff', '#6be0ff', '#ff6bd5']) }));
    const streaks = Array.from({ length: 7 }, () => ({ y: 0.45 + Math.random() * 0.45, w: 0.3 + Math.random() * 0.5, x: Math.random() }));
    const bokeh = Array.from({ length: 16 }, (_, i) => ({ x: Math.random(), y: Math.random(), r: 40 + Math.random() * 120, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, col: RB[i % 7] }));
    const warp = Array.from({ length: 70 }, () => ({ a: Math.random() * Math.PI * 2, d: Math.random(), v: 0.6 + Math.random() * 1.2, col: P.pick(RB.concat('#ffffff')) }));

    C.blackout(S);
    const L = S.layer((c, s) => {
      const t = s.t, W = s.W, Hh = s.H, cx = W / 2, cy = Hh / 2;
      // ---- 暗転〜フレア ----
      if (t < T.red) {
        c.fillStyle = '#000'; c.fillRect(0, 0, W, Hh);
        if (t >= T.flash && t < T.flare) {                 // 白い閃光
          const g = c.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(W, Hh) * 0.6);
          g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, '#fbf2ff'); g.addColorStop(1, '#d9b8f0');
          c.globalAlpha = calm ? 0.35 : 1; c.fillStyle = g; c.fillRect(0, 0, W, Hh); c.globalAlpha = 1;
        } else if (t >= T.flare && t < T.flareEnd) {       // 青白い十字フレアが縮んで星に
          const k = (t - T.flare) / (T.flareEnd - T.flare), s1 = 1 - C.easeO(k);
          const navy = 1 - C.clamp01(k / 0.55);
          if (navy > 0) {
            const g = c.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(W, Hh) * 0.6);
            g.addColorStop(0, P.rgba('#1a3cb0', 0.9 * navy)); g.addColorStop(0.5, P.rgba('#0a1650', 0.8 * navy)); g.addColorStop(1, P.rgba('#02040f', navy));
            c.fillStyle = g; c.fillRect(0, 0, W, Hh);
          }
          C.flare(c, cx, cy, W, Hh, { arm: 1, core: 0.25 + 0.75 * s1, blade: 1.4 * s1, thick: 12 * s1, vlen: 30 + Hh * 0.45 * s1,
            alpha: (calm ? 0.6 : 1) * (1 - 0.8 * C.easeI(k)), tint: BLUE });
          if (k > 0.2 && k < 0.85) {                        // 虹色のレンズリング
            const a = Math.sin((k - 0.2) / 0.65 * Math.PI) * 0.35, r0 = 70 + k * 40;
            c.globalCompositeOperation = 'lighter'; c.lineWidth = 2.2;
            RB.forEach((col, i) => { c.strokeStyle = P.rgba(col, a); c.beginPath(); c.arc(cx, cy, r0 + i * 2.2, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); c.beginPath(); c.arc(cx, cy, r0 + i * 2.2, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); });
            c.globalCompositeOperation = 'source-over';
          }
        }
        return;
      }
      // ---- 赤い告知 ----
      if (t < T.cycle) {
        c.globalAlpha = 0.93; c.fillStyle = '#b0000e'; c.fillRect(0, 0, W, Hh); c.globalAlpha = 1;
        c.globalCompositeOperation = 'lighter';
        streaks.forEach(st => { const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,140,0,0)'); g.addColorStop(st.x, 'rgba(255,170,40,.75)'); g.addColorStop(1, 'rgba(255,140,0,0)'); c.fillStyle = g; c.fillRect(0, st.y * Hh, W, 3); });
        c.globalCompositeOperation = 'source-over';
        emblem(c, cx, cy, Math.min(W * 0.62, 320));
        sparks.forEach(sp => sparkle(c, sp.x * W, sp.y * Hh, sp.r, sp.col));
        return;
      }
      // ---- 色の連打 ----
      if (t < T.strobe) {
        const col = CYCLE[Math.min(3, Math.floor((t - T.cycle) / 0.1))];
        c.globalAlpha = calm ? 0.3 : 0.78; c.fillStyle = col; c.fillRect(0, 0, W, Hh);
        return;
      }
      // ---- 黒・白・虹の高速切替（軽減時はゆるやかな虹） ----
      if (t < T.bokeh) {
        if (calm) {
          c.globalAlpha = 0.3; c.fillStyle = `hsl(${(t * 140) % 360}deg 90% 55%)`; c.fillRect(0, 0, W, Hh);
          return;
        }
        const i = Math.min(STROBE.length - 1, Math.floor((t - T.strobe) / 0.1)), f = STROBE[i];
        if (f === 'k') { c.fillStyle = '#000'; c.fillRect(0, 0, W, Hh); }
        else if (f === 'w') { c.globalAlpha = 0.95; c.fillStyle = '#fff'; c.fillRect(0, 0, W, Hh); }
        else {
          const g = c.createLinearGradient(0, i % 2 ? 0 : Hh, W, i % 2 ? Hh : 0);
          RB.forEach((col, j) => g.addColorStop(j / 6, RB[(j + i) % 7]));
          c.globalAlpha = 0.8; c.fillStyle = g; c.fillRect(0, 0, W, Hh);
        }
        return;
      }
      // ---- 虹の玉ボケと光の奔流 ----
      const k = C.clamp01((t - T.bokeh) / (T.end - T.bokeh)), ov = 1 - k;
      c.globalAlpha = 0.55 * ov; c.fillStyle = '#12002a'; c.fillRect(0, 0, W, Hh);
      c.globalCompositeOperation = 'lighter';
      bokeh.forEach(b => {
        const x = (b.x + b.vx * (t - T.bokeh)) * W, y = (b.y + b.vy * (t - T.bokeh)) * Hh;
        c.globalAlpha = 0.55 * ov; c.drawImage(P.glow(b.col), x - b.r, y - b.r, b.r * 2, b.r * 2);
      });
      const R = Math.hypot(W, Hh) * 0.6;
      warp.forEach(w => {
        const d = (w.d + (t - T.bokeh) * w.v) % 1, r1 = d * R, r2 = r1 + 40 + d * 120;
        c.globalAlpha = ov * Math.min(1, d * 3); c.strokeStyle = w.col; c.lineWidth = 1 + d * 3;
        c.beginPath(); c.moveTo(cx + Math.cos(w.a) * r1, cy + Math.sin(w.a) * r1); c.lineTo(cx + Math.cos(w.a) * r2, cy + Math.sin(w.a) * r2); c.stroke();
      });
      const wb = t - T.bokeh - 0.15;                         // 白いバースト
      if (wb > 0 && wb < 0.2) { c.globalAlpha = (calm ? 0.25 : 0.8) * (1 - wb / 0.2); c.fillStyle = '#fff'; c.fillRect(0, 0, W, Hh); }
    }, (T.end + 0.2) * 1000, true);

    // ---- 音と画面の切り替え ----
    await S.wait(T.flash * 1000);
    Snd.drop(1.3); Snd.impact(1); Snd.whine(0.9);
    await S.wait((T.red - T.flash) * 1000);
    S.body('void', false);                       // 告知と同時にランプ点灯・当選者表示
    C.lightLamp(S);
    S.shake(1.1, 600);
    Snd.fanfare();
    ctx.reveal();
    await S.wait((T.strobe - T.red) * 1000);
    if (!calm) for (let i = 0; i < STROBE.length; i++) setTimeout(() => Snd.tick(i % 2 === 0), i * 100);
    await S.wait((T.bokeh - T.strobe) * 1000);
    Snd.harp(); Snd.whoosh(1.2, true); Snd.bass(1.2);
    P.burst({ x: W0 / 2, y: H0 / 2, count: 140, colors: RB, speed: [500, 1800], gravity: 150, life: [1, 2.2], size: [3, 10], type: 'glow' });
    await S.wait((T.end - T.bokeh) * 1000);
    L.stop();
  };
})();
