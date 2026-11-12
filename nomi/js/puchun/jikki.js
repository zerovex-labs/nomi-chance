/* =========================================================
   BLACKOUT FLASH（実機風プチュン）— 閃光が先、暗転はその後
     0.00s  PUSH／3リール停止の直後、プチュン音と同時に
            非常に鋭い白紫色の閃光が走る（四方向の十字＋左右いっぱいの細い水平光線、中心は白・周囲は淡い紫）
            背後のゲーム画面は急速に暗くなる
     0.30s  閃光が中心へ吸い込まれるように縮み始める
     0.60s  閃光が消えて完全暗転（UI・ランプ・ボタンもすべて隠す）
     0.60〜2.10s  約1.5秒、真っ黒な画面と完全な静寂
     2.10s  全画面ホワイトフラッシュ → 重低音、NOMI! CHANCE ランプがレインボー点灯
     2.25s  白が抜け始め、当選者名を表示。虹色の光条が全画面に広がる
     （このあと game.js が8秒のレインボー演出を再生）
   「光・点滅を抑える」設定では、閃光と白フラッシュの強さを抑える。
   ========================================================= */
(function () {
  const P = PEKA.P, H = PEKA.H, Snd = PEKA.Sound, C = NOMI.C;
  const T = { shrink: 0.30, dark: 0.60, white: 2.10, hold: 2.25, end: 2.70 };
  const VIO = '#9a6bff', VIO2 = '#6c3cff', LAV = '#e4d8ff';

  /** 先の尖った光条（中心から角度 ang の方向へ長さ len） */
  function ray(c, cx, cy, ang, len, w, col, a, blur) {
    const ca = Math.cos(ang), sa = Math.sin(ang), nx = -sa, ny = ca;
    c.globalAlpha = a; c.fillStyle = col; c.shadowColor = VIO; c.shadowBlur = blur;
    c.beginPath();
    c.moveTo(cx + nx * w, cy + ny * w);
    c.lineTo(cx + ca * len, cy + sa * len);
    c.lineTo(cx - nx * w, cy - ny * w);
    c.closePath(); c.fill();
  }

  /**
   * 白紫の鋭い閃光
   * s: 大きさ 0..1（1=最大。縮むとき 1→0）  F: 明るさ 0..1
   */
  function drawFlash(c, W, Hh, s, F, flick) {
    if (s <= 0 || F <= 0) return;
    const cx = W / 2, cy = Hh / 2;
    c.save();
    c.globalCompositeOperation = 'lighter';
    // ① 淡い紫のにじみ
    const halo = (40 + 110 * s) * flick;
    c.globalAlpha = 0.65 * F; c.drawImage(P.glow(VIO2), cx - halo, cy - halo, halo * 2, halo * 2);
    // ② 左右の画面端まで伸びる細く長い水平光線（縮むときは中心へ引き込まれる）
    const half = (W / 2 + 40) * Math.min(1, s * 1.15), th = 1 + 2.6 * s;
    const hg = c.createLinearGradient(cx - half, 0, cx + half, 0);
    hg.addColorStop(0, P.rgba(VIO2, 0.0)); hg.addColorStop(0.1, P.rgba(VIO, 0.75)); hg.addColorStop(0.4, LAV);
    hg.addColorStop(0.5, '#ffffff'); hg.addColorStop(0.6, LAV); hg.addColorStop(0.9, P.rgba(VIO, 0.75)); hg.addColorStop(1, P.rgba(VIO2, 0.0));
    c.globalAlpha = 0.5 * F; c.shadowColor = VIO; c.shadowBlur = 18;
    c.fillStyle = P.rgba(VIO2, 0.5); c.fillRect(cx - half, cy - (4 + th * 2), half * 2, (4 + th * 2) * 2);
    c.globalAlpha = F; c.shadowBlur = 6; c.shadowColor = LAV;
    c.fillStyle = hg; c.fillRect(cx - half, cy - th / 2, half * 2, th);
    // ③ 四方向の鋭い十字（横は長め、縦は短め）＋かすかな斜めの光条
    const sh = (60 + W * 0.42 * s) * flick, sv = (40 + Hh * 0.2 * s) * flick, w = 1.4 + 3.2 * s;
    [0, Math.PI].forEach(a => { ray(c, cx, cy, a, sh, w * 2.2, VIO, 0.5 * F, 16); ray(c, cx, cy, a, sh * 0.82, w, '#ffffff', F, 6); });
    [Math.PI / 2, -Math.PI / 2].forEach(a => { ray(c, cx, cy, a, sv, w * 2.2, VIO, 0.5 * F, 16); ray(c, cx, cy, a, sv * 0.82, w, '#ffffff', F, 6); });
    [Math.PI / 4, 3 * Math.PI / 4, -Math.PI / 4, -3 * Math.PI / 4].forEach(a => ray(c, cx, cy, a, sv * 0.45, w * 0.9, LAV, 0.32 * F, 8));
    // ④ 白い芯
    c.shadowBlur = 0;
    const core = (6 + 16 * s) * flick;
    c.globalAlpha = F;
    c.drawImage(P.glow('#ffffff'), cx - core * 2, cy - core * 2, core * 4, core * 4);
    c.drawImage(P.glow('#ffffff'), cx - core, cy - core, core * 2, core * 2);
    c.restore();
  }

  NOMI.FX.jikki = async (S, ctx) => {
    const calm = S.calm;
    Snd.bgmHold(true);
    S.lamp(0);
    // ① 当選の瞬間：プチュン音と同時に鋭い閃光
    Snd.puchun(); Snd.whine(0.45);
    const L = S.layer((c, s) => {
      const t = s.t, W = s.W, Hh = s.H;
      // 背景：ゲーム画面 → 急速に暗く → 完全な黒（ホワイトフラッシュまで）
      if (t < T.white) {
        c.globalAlpha = Math.min(1, 0.55 + t / T.dark * 0.45); c.fillStyle = '#000'; c.fillRect(0, 0, W, Hh); c.globalAlpha = 1;
      }
      // 閃光：0.3秒間最大 → 0.3秒で中心へ縮んで消える
      if (t < T.dark) {
        const k = t < T.shrink ? 1 : 1 - C.easeI((t - T.shrink) / (T.dark - T.shrink));
        const born = C.easeO(t / 0.05);
        drawFlash(c, W, Hh, k * born, (calm ? 0.55 : 1) * (t < T.shrink ? 1 : 0.4 + 0.6 * k), 1 + Math.sin(t * 95) * 0.04);
      }
      // ホワイトフラッシュ → 抜ける
      if (t >= T.white && t < T.end) {
        const a = t < T.hold ? 1 : 1 - C.easeO((t - T.hold) / (T.end - T.hold));
        c.globalAlpha = a * (calm ? 0.45 : 1); c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, Hh);
      }
      if (t >= T.end) return false;
    }, (T.end + 0.3) * 1000, true);

    // ② 閃光が消えたら完全暗転（UIもすべて隠す）
    await S.wait(T.dark * 1000);
    S.body('void', true);
    // ③ 約1.5秒の完全な闇と静寂
    await S.wait((T.white - T.dark) * 1000 - 180);
    Snd.riser(0.18);
    await S.wait(180);

    // ④ ホワイトフラッシュ → 重低音、ランプをレインボー点灯、当選者名
    S.body('void', false);
    C.drop(S, 1.4);
    Snd.boom(0.9);
    C.lightLamp(S);
    setTimeout(() => ctx.reveal(), (T.hold - T.white) * 1000);   // 白が抜け始める瞬間に当選者名
    const cx = P.W / 2, cy = P.H / 2;
    C.rainbowRays(S, cx, cy, 1800);
    C.burst({ x: cx, y: cy, count: 160, colors: H.RAINBOW, speed: [400, 2000], gravity: 120, life: [1.2, 2.4], size: [3, 10], type: 'glow' });
    C.burst({ x: cx, y: cy, count: 150, colors: H.RAINBOW, speed: [600, 1900], gravity: 300, life: [0.8, 1.6], size: [4, 8], type: 'spark', trail: 4 });
    C.burst({ x: cx, y: cy, count: 90, colors: H.RAINBOW, speed: [300, 1400], gravity: 200, life: [1, 2], size: [5, 10], type: 'star' });
    H.RAINBOW.forEach((col, i) => setTimeout(() => P.ring({ x: cx, y: cy, color: col, width: 10, life: 1.1 }), 150 + i * 60));
    S.appEl.animate([{ transform: 'scale(1.08)' }, { transform: 'scale(.98)', offset: 0.5 }, { transform: 'scale(1)' }],
      { duration: calm ? 600 : 420, easing: 'cubic-bezier(.2,.9,.3,1)', composite: 'add' });
    S.slow(0.35, 700);
    await S.wait((T.end - T.white) * 1000 + 700);
    L.stop();
  };
})();
