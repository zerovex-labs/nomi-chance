/* =========================================================
   VIOLET FLARE（雰囲気参考：モンスターハンターライズ。演出・音はオリジナル）
     0.00s  プチュン音と同時に完全暗転
     0.15s〜1.30s  完全な闇と無音
     1.30s  青紫のもやが広がり、中央に小さな光
     1.45s  横長の刃のような閃光と細い十字に育つ（水平光線は左右いっぱい）
     2.00s  閃光が急拡大
     2.20s  重低音とともに虹色に爆発、ランプ点灯
   ========================================================= */
(function () {
  const P = PEKA.P, Snd = PEKA.Sound, C = NOMI.C;
  const T = { haze: 1.3, grow: 2.0, boom: 2.2 };
  const TINT = ['#4a3dff', '#8a7bff', '#d8d2ff'];

  NOMI.FX.violet = async (S, ctx) => {
    C.blackout(S);
    Snd.puchun();
    const L = S.layer((c, s) => {
      const t = s.t, W = s.W, Hh = s.H, cx = W / 2, cy = Hh / 2;
      c.fillStyle = '#000'; c.fillRect(0, 0, W, Hh);
      if (t < T.haze) return;
      const h = C.easeO((t - T.haze) / 0.35);
      const fade = t < T.boom ? 1 : Math.max(0, 1 - (t - T.boom) / 0.2);
      if (fade <= 0) return false;
      // 青紫のもや
      const g = c.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(W, Hh) * 0.55);
      g.addColorStop(0, P.rgba('#3a34c8', 0.85 * h)); g.addColorStop(0.45, P.rgba('#1a1670', 0.75 * h)); g.addColorStop(1, P.rgba('#05041a', 0.9 * h));
      c.globalAlpha = fade; c.fillStyle = g; c.fillRect(0, 0, W, Hh); c.globalAlpha = 1;
      // 光 → 横長の刃と十字
      const born = C.easeO((t - T.haze) / 0.15), arm = C.easeO((t - T.haze - 0.15) / 0.4);
      const flick = 1 + Math.sin(t * 80) * 0.05;
      const grow = t < T.grow ? 0 : Math.pow(C.clamp01((t - T.grow) / (T.boom - T.grow)), 2.2);
      C.flare(c, cx, cy, W, Hh, { arm: arm * flick, core: born * (0.5 + 0.5 * arm) * flick, blade: 1.25 * arm * flick, thick: grow * 30, vlen: 50, alpha: fade * born, tint: TINT });
      if (grow > 0) {   // 急拡大
        const R = 20 + grow * Math.hypot(W, Hh) * 0.9;
        const rg = c.createRadialGradient(cx, cy, 0, cx, cy, R);
        rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.35, 'rgba(255,255,255,.85)'); rg.addColorStop(0.7, P.rgba(TINT[1], 0.45)); rg.addColorStop(1, P.rgba(TINT[0], 0));
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = fade * (S.calm ? 0.5 : 1);
        c.fillStyle = rg; c.fillRect(cx - R, cy - R, R * 2, R * 2);
      }
    }, (T.boom + 0.4) * 1000, true);

    await S.wait(T.haze * 1000);
    Snd.whine(0.9); Snd.hum(0.9);
    await S.wait(200);
    Snd.shimmer(0.6);
    await S.wait((T.grow - T.haze) * 1000 - 200);
    Snd.riser(0.2);
    await S.wait((T.boom - T.grow) * 1000);
    await C.revive(S, ctx, { flashColor: '#e8e2ff' });
    L.stop();
  };
})();
