/* =========================================================
   斬 -ZAN-（雰囲気参考：新鬼武者3。演出・音はオリジナル）
     0.00s  プチュン音と同時に完全暗転
     0.20s〜1.50s  静寂の闇に、金の火の粉がかすかに舞い上がる
     1.50s  金属音とともに一太刀。右上から左下へ光の斬撃が走る
     1.75s  斬り口が開き、裂け目から白金の光があふれ出す
     1.95s  重低音とともに虹色に爆発、ランプ点灯
   ========================================================= */
(function () {
  const P = PEKA.P, Snd = PEKA.Sound, C = NOMI.C;
  const T = { ember: 0.2, cut: 1.5, cutEnd: 1.6, open: 1.75, boom: 1.95 };

  NOMI.FX.zan = async (S, ctx) => {
    const embers = Array.from({ length: 18 }, () => ({ x: Math.random(), y: 0.6 + Math.random() * 0.5, v: 0.05 + Math.random() * 0.08, s: 1.5 + Math.random() * 2.5, f: Math.random() * 6 }));
    C.blackout(S);
    Snd.puchun();
    const L = S.layer((c, s) => {
      const t = s.t, W = s.W, Hh = s.H;
      const x0 = W * 1.08, y0 = -Hh * 0.04, x1 = -W * 0.08, y1 = Hh * 1.04;   // 斬撃の軌道
      c.fillStyle = '#000'; c.fillRect(0, 0, W, Hh);
      c.globalCompositeOperation = 'lighter';
      // 金の火の粉
      if (t >= T.ember && t < T.boom) {
        embers.forEach(e => {
          const y = (e.y - e.v * (t - T.ember)) * Hh, a = 0.35 + 0.35 * Math.sin(t * 8 + e.f);
          c.globalAlpha = a * Math.min(1, (t - T.ember) / 0.5); c.drawImage(P.glow('#ffb43a'), e.x * W - e.s * 3, y - e.s * 3, e.s * 6, e.s * 6);
        });
        c.globalAlpha = 1;
      }
      if (t >= T.cut && t < T.boom + 0.2) {
        const k = C.clamp01((t - T.cut) / (T.cutEnd - T.cut));
        const ex = x0 + (x1 - x0) * k, ey = y0 + (y1 - y0) * k;
        // 斬り口の開き（光の帯）
        const open = t < T.open ? 0 : C.easeO((t - T.open) / (T.boom - T.open));
        const ang = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(ang), ny = Math.cos(ang);
        if (open > 0) {
          const w = 6 + open * Math.max(W, Hh) * 0.5;
          const g = c.createLinearGradient(W / 2 - nx * w, Hh / 2 - ny * w, W / 2 + nx * w, Hh / 2 + ny * w);
          g.addColorStop(0, 'rgba(255,180,40,0)'); g.addColorStop(0.4, 'rgba(255,215,120,.85)'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(0.6, 'rgba(255,215,120,.85)'); g.addColorStop(1, 'rgba(255,180,40,0)');
          c.globalAlpha = S.calm ? 0.55 : 1; c.fillStyle = g;
          c.beginPath(); c.moveTo(x0 + nx * w, y0 + ny * w); c.lineTo(x1 + nx * w, y1 + ny * w); c.lineTo(x1 - nx * w, y1 - ny * w); c.lineTo(x0 - nx * w, y0 - ny * w); c.closePath(); c.fill();
          c.globalAlpha = 1;
        }
        // 斬撃の線（金のにじみ＋白い芯）
        c.lineCap = 'round';
        c.shadowColor = '#ffb43a'; c.shadowBlur = 22;
        c.strokeStyle = 'rgba(255,190,70,.75)'; c.lineWidth = 10; c.beginPath(); c.moveTo(x0, y0); c.lineTo(ex, ey); c.stroke();
        c.shadowColor = '#fff'; c.shadowBlur = 8;
        c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.beginPath(); c.moveTo(x0, y0); c.lineTo(ex, ey); c.stroke();
        c.shadowBlur = 0;
      }
      if (t > T.boom + 0.2) return false;
    }, (T.boom + 0.4) * 1000, true);

    await S.wait(T.cut * 1000);
    Snd.pressAlt(); Snd.whoosh(0.2, true);
    // 斬撃に沿って火花を散らす
    const W = P.W, Hh = P.H;
    for (let i = 0; i < 26; i++) {
      const k = Math.random();
      P.add({ type: 'spark', x: W * 1.08 + (-W * 1.16) * k, y: -Hh * 0.04 + Hh * 1.08 * k, vx: P.rand(-260, 260), vy: P.rand(-260, 260), size: 5, color: P.pick(['#ffd27a', '#ffffff', '#ffb43a']), life: 0.45, trail: 3 });
    }
    await S.wait((T.open - T.cut) * 1000);
    Snd.riser(0.2);
    await S.wait((T.boom - T.open) * 1000);
    await C.revive(S, ctx, { flashColor: '#fff3c0' });
    L.stop();
  };
})();
