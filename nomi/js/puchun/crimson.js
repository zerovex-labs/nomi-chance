/* =========================================================
   CRIMSON GLITCH（雰囲気参考：革命機ヴァルヴレイヴ。演出・音はオリジナル）
     0.00s  プチュン音と同時に完全暗転
     0.15s〜1.30s  完全な闇と無音
     1.30s  赤い走査線が上から下へ2往復し、赤いデジタルノイズが走る
     2.10s  再び完全な闇（ため）
     2.30s  真紅の横一閃 → 光が上下に開く
     2.48s  重低音とともに虹色に爆発、ランプ点灯
   ========================================================= */
(function () {
  const P = PEKA.P, Snd = PEKA.Sound, C = NOMI.C;
  const T = { glitch: 1.3, dark2: 2.1, slash: 2.3, boom: 2.48 };

  NOMI.FX.crimson = async (S, ctx) => {
    const calm = S.calm;
    let blocks = [], lastGen = -1;
    C.blackout(S);
    Snd.puchun();
    const L = S.layer((c, s) => {
      const t = s.t, W = s.W, Hh = s.H, cy = Hh / 2;
      c.fillStyle = '#000'; c.fillRect(0, 0, W, Hh);
      if (t >= T.glitch && t < T.dark2) {
        const k = (t - T.glitch) / (T.dark2 - T.glitch);
        // 赤い走査線（2往復）
        const y = ((k * 2) % 1) * Hh;
        const g = c.createLinearGradient(0, y - 30, 0, y + 30);
        g.addColorStop(0, 'rgba(255,0,40,0)'); g.addColorStop(0.5, 'rgba(255,40,60,.75)'); g.addColorStop(1, 'rgba(255,0,40,0)');
        c.fillStyle = g; c.fillRect(0, y - 30, W, 60);
        c.fillStyle = '#ffd0d6'; c.fillRect(0, y - 1, W, 2);
        // 薄い六角グリッドの脈動
        c.strokeStyle = `rgba(255,30,60,${0.12 + 0.1 * Math.sin(t * 30)})`; c.lineWidth = 1;
        const r = 26, dx = r * 1.732;
        for (let row = -1, yy = 0; yy < Hh + r; row++, yy = row * r * 1.5) {
          for (let x = (row % 2) * dx / 2; x < W + dx; x += dx) {
            c.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; c.lineTo(x + Math.cos(a) * r, yy + Math.sin(a) * r); } c.closePath(); c.stroke();
          }
        }
        // デジタルノイズのブロック
        const gen = Math.floor(t / (calm ? 0.25 : 0.06));
        if (gen !== lastGen) {
          lastGen = gen;
          blocks = Array.from({ length: calm ? 3 : 8 }, () => ({ x: Math.random() * W, y: Math.random() * Hh, w: 20 + Math.random() * W * 0.5, h: 2 + Math.random() * 18, col: P.pick(['#ff1030', '#7a0010', '#ffffff', '#ff4060']) }));
        }
        c.globalAlpha = calm ? 0.35 : 0.75;
        blocks.forEach(b => { c.fillStyle = b.col; c.fillRect(b.x, b.y, b.w, b.h); });
        c.globalAlpha = 1;
      } else if (t >= T.slash && t < T.boom + 0.2) {
        // 真紅の横一閃 → 上下に開く光
        const k = C.easeO((t - T.slash) / (T.boom - T.slash)), band = 3 + k * Hh * 1.1;
        const g = c.createLinearGradient(0, cy - band / 2, 0, cy + band / 2);
        g.addColorStop(0, 'rgba(255,0,30,0)'); g.addColorStop(0.35, 'rgba(255,40,60,.9)'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(0.65, 'rgba(255,40,60,.9)'); g.addColorStop(1, 'rgba(255,0,30,0)');
        c.globalAlpha = calm ? 0.55 : 1; c.fillStyle = g; c.fillRect(0, cy - band / 2, W, band);
        c.globalAlpha = 1; c.fillStyle = '#fff'; c.fillRect(0, cy - 1.5, W, 3);
      }
      if (t > T.boom + 0.2) return false;
    }, (T.boom + 0.4) * 1000, true);

    await S.wait(T.glitch * 1000);
    Snd.glitch(0.8); Snd.static(0.8);
    await S.wait((T.slash - T.glitch) * 1000);
    Snd.laser(); Snd.crack();
    await S.wait((T.boom - T.slash) * 1000);
    await C.revive(S, ctx, { flashColor: '#ff3048' });
    L.stop();
  };
})();
