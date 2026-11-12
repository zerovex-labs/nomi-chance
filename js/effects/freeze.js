/* =========================================================
   PEKA!! — フリーズ・暗転系＝プチュン系（No.31〜40）
   ========================================================= */
(function () {
  const FX = PEKA.FX, H = PEKA.H, P = PEKA.P, Snd = PEKA.Sound;
  const { rand, pick } = P;

  // 31 通常プチュン：暗転2.4秒 → 衝撃復活
  /*
    31 通常プチュン（突然の完全暗転・静寂・鋭い閃光・劇的な復帰）
      0.00s  プチュン音と同時に表示領域全体を #000 に。UIもすべて隠す。
             同時に鋭い十字の閃光が走り、水平光線が左右いっぱいに伸び、一瞬で中心へ吸い込まれて消える
      0.35s〜1.85s  完全な暗闇と完全な無音（約1.5秒）
      1.85s  中央に小さな白紫の光 → 横長の刃のような閃光と細い十字に育つ（約0.5秒）
      2.35s  閃光が急激に拡大
      2.55s  重低音とともに虹色の光が全画面に爆発し、告知ランプ点灯
      （このあと game.js が8秒のレインボーフィーバーを必ず再生）
  */
  const PU = { flashOut: 0.35, appear: 1.85, grow: 2.35, boom: 2.55, end: 3.3 };
  const VIO = '#a77bff', VIO2 = '#7c4dff', LAV = '#d9ccff';
  const clamp01 = (k) => Math.max(0, Math.min(1, k));
  const easeO = (k) => 1 - Math.pow(1 - clamp01(k), 3);

  /** 白紫の十字閃光（中心は白・外側は淡い紫、細く鋭く） */
  function drawCross(c, cx, cy, W, Hh, o) {
    const { arm, core, blade, thick, alpha } = o;
    if (alpha <= 0) return;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = alpha;
    // 中心：丸く強い白の芯と控えめな紫のにじみ
    const rv = 18 + 40 * core;
    c.globalAlpha = alpha * 0.55; c.drawImage(P.glow(VIO2), cx - rv, cy - rv, rv * 2, rv * 2);
    c.globalAlpha = alpha;
    const rw = 6 + 18 * core;
    c.drawImage(P.glow('#ffffff'), cx - rw, cy - rw, rw * 2, rw * 2);
    c.drawImage(P.glow('#ffffff'), cx - rw * 0.55, cy - rw * 0.55, rw * 1.1, rw * 1.1);
    // 横長の刃（菱形に伸びた強い光）
    if (blade > 0) {
      const bw = W * 0.34 * blade, bh = 7 + 10 * blade;
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, P.rgba(LAV, 0.9));
      g.addColorStop(0.65, P.rgba(VIO, 0.45)); g.addColorStop(1, P.rgba(VIO2, 0));
      c.save(); c.translate(cx, cy); c.scale(bw, bh); c.fillStyle = g;
      c.beginPath(); c.moveTo(-1, 0); c.quadraticCurveTo(0, -1.2, 1, 0); c.quadraticCurveTo(0, 1.2, -1, 0); c.fill(); c.restore();
    }
    if (arm > 0) {
      const half = (W / 2 + 30) * arm;
      const line = () => { c.beginPath(); c.moveTo(cx - half, cy); c.lineTo(cx + half, cy); c.stroke(); };
      c.lineCap = 'round';
      // 水平光線：柔らかい紫のにじみ → 中心だけ白く、外は左右の端まで明るい紫
      c.shadowColor = VIO; c.shadowBlur = 16;
      c.strokeStyle = P.rgba(VIO2, 0.45); c.lineWidth = 7 + thick; line();
      const hg = c.createLinearGradient(cx - half, 0, cx + half, 0);
      hg.addColorStop(0, P.rgba('#8f63ff', 0.75)); hg.addColorStop(0.32, '#b99bff');
      hg.addColorStop(0.44, '#efe8ff'); hg.addColorStop(0.5, '#ffffff'); hg.addColorStop(0.56, '#efe8ff');
      hg.addColorStop(0.68, '#b99bff'); hg.addColorStop(1, P.rgba('#8f63ff', 0.75));
      c.shadowColor = '#c9b3ff'; c.shadowBlur = 6;
      c.strokeStyle = hg; c.lineWidth = 2.6 + thick * 0.5; line();
      // 縦横のスパイク（鋭い菱形）
      const k = arm * (1 + thick / 4);
      const spike = (lx, ly, w, col, a, blur) => {
        c.globalAlpha = alpha * a; c.fillStyle = col; c.shadowColor = VIO; c.shadowBlur = blur;
        c.beginPath(); c.moveTo(cx, cy - ly); c.lineTo(cx + w, cy); c.lineTo(cx, cy + ly); c.lineTo(cx - w, cy); c.closePath(); c.fill();
        if (lx) { c.beginPath(); c.moveTo(cx - lx, cy); c.lineTo(cx, cy - w); c.lineTo(cx + lx, cy); c.lineTo(cx, cy + w); c.closePath(); c.fill(); }
      };
      spike(0, 60 * k, 7 * k, VIO, 0.55, 14);
      spike(66 * k, 40 * k, 3.2 * k, '#f2ecff', 0.95, 8);
    }
    c.restore();
  }

  /** look: 復帰後のランプの見た目 { color, core, skin }（省略時は虹） */
  FX.puchun = async (S, ctx, look) => {
    const T = PU, calm = S.calm;
    const lk = look || { color: '#ff3da6', core: '#ffffff', skin: 'rainbow' };
    // ---- 0s：プチュン。表示領域全体を完全な黒に、UIもすべて隠す ----
    Snd.bgmHold(true);
    Snd.puchun();
    S.body('void', true);                  // #app 等を visibility:hidden、背景 #000（同じフレームで真っ黒）
    S.lamp(0);
    setTimeout(() => Snd.hush(true), 170); // プチュン音の直後から完全無音

    const L = S.layer((c, s) => {
      const t = s.t, W = s.W, Hh = s.H, cx = W / 2, cy = Hh / 2;
      // 背景：完全な黒（爆発後に抜ける）
      const bg = t < T.boom ? 1 : Math.max(0, 1 - (t - T.boom) / 0.55);
      if (bg > 0) { c.fillStyle = `rgba(0,0,0,${bg})`; c.fillRect(0, 0, W, Hh); }

      // ① プチュンの瞬間の十字：全幅で光り、一瞬で中心へ吸い込まれて消える
      if (t < T.flashOut) {
        const k = t / T.flashOut, shrink = 1 - k * k;
        drawCross(c, cx, cy, W, Hh, { arm: shrink, core: 1 - k, blade: 0.6 * shrink, thick: 0, alpha: (calm ? 0.45 : 1) * (1 - k * 0.7) });
        return;
      }
      // ② 完全な暗闇（何も描かない）
      if (t < T.appear) return;

      // ③ 小さな白紫の光 → 横長の刃と十字に育つ
      const born = easeO((t - T.appear) / 0.18);
      const arm = easeO((t - T.appear - 0.12) / 0.3);
      const flick = 1 + Math.sin(t * 85) * 0.05;
      const grow = t < T.grow ? 0 : Math.pow(clamp01((t - T.grow) / (T.boom - T.grow)), 2.2);
      const fade = t < T.boom ? 1 : Math.max(0, 1 - (t - T.boom) / 0.18);
      drawCross(c, cx, cy, W, Hh, { arm: arm * flick, core: born * (0.5 + 0.5 * arm) * flick, blade: arm * flick, thick: grow * 30, alpha: fade * born });

      // ④ 急拡大：白→淡紫へ広がる光
      if (grow > 0 && fade > 0) {
        const R = 20 + grow * Math.hypot(W, Hh) * 0.9;
        const g = c.createRadialGradient(cx, cy, 0, cx, cy, R);
        g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.85)');
        g.addColorStop(0.7, P.rgba(VIO, 0.45)); g.addColorStop(1, P.rgba(VIO2, 0));
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = fade * (calm ? 0.5 : 1);
        c.fillStyle = g; c.fillRect(cx - R, cy - R, R * 2, R * 2);
      }
    }, (T.end + 0.3) * 1000, true);

    await S.wait(T.appear * 1000);
    Snd.hush(false);                       // 光の出現から音を戻す
    Snd.whine(0.8);
    await S.wait(150);
    Snd.shimmer(0.5);
    await S.wait((T.grow - T.appear) * 1000 - 150);
    Snd.riser(0.22);
    await S.wait((T.boom - T.grow) * 1000);

    // ---- 復帰：重低音と同時に虹色の光が全画面へ爆発、告知ランプ点灯 ----
    S.body('void', false);
    H.drop(S, 1.35);
    S.flash('#ffffff', 260, 0.65);
    S.appEl.animate([{ transform: 'scale(1.09)' }, { transform: 'scale(.98)', offset: 0.5 }, { transform: 'scale(1)' }],
      { duration: calm ? 600 : 380, easing: 'cubic-bezier(.2,.9,.3,1)', composite: 'add' });
    S.peka({ color: lk.color, core: lk.core, skin: lk.skin, power: 1.2, rest: 0.3, rings: 0, flash: false, shake: false,
      colors: H.RAINBOW.concat('#ffffff'), count: 0, after: 0, sound: () => Snd.peka(0) });
    const cx = P.W / 2, cy = P.H / 2;
    P.burst({ x: cx, y: cy, count: 150, colors: H.RAINBOW, speed: [400, 2000], gravity: 120, life: [1.2, 2.4], size: [3, 10], type: 'glow' });
    P.burst({ x: cx, y: cy, count: 160, colors: H.RAINBOW, speed: [600, 1900], gravity: 300, life: [0.8, 1.6], size: [4, 8], type: 'spark', trail: 4 });
    P.burst({ x: cx, y: cy, count: 90, colors: H.RAINBOW, speed: [300, 1400], gravity: 200, life: [1, 2], size: [5, 10], type: 'star' });
    H.RAINBOW.forEach((col, i) => setTimeout(() => P.ring({ x: cx, y: cy, color: col, width: 10, life: 1.1 }), i * 60));
    // 中心から虹色の光条が全画面へ放射し、回転しながら消える
    const RAYS = 28;
    S.layer((c, s) => {
      const k = Math.min(1, s.t / 0.35), a = s.p < 0.45 ? 1 : (1 - s.p) / 0.55;
      const R = Math.hypot(s.W, s.H) * (0.25 + 0.9 * (1 - Math.pow(1 - k, 3)));
      c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < RAYS; i++) {
        const an = i / RAYS * Math.PI * 2 + s.t * 0.9, w = Math.PI / RAYS * 0.55, col = H.RAINBOW[i % 7];
        const g = c.createRadialGradient(cx, cy, 0, cx, cy, R);
        g.addColorStop(0, P.rgba(col, 0.2 * a)); g.addColorStop(0.12, P.rgba(col, 0.85 * a)); g.addColorStop(0.6, P.rgba(col, 0.5 * a)); g.addColorStop(1, P.rgba(col, 0));
        c.fillStyle = g;
        c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R, an - w, an + w); c.closePath(); c.fill();
      }
    }, 1500, true);
    S.slow(0.3, 700);
    await S.wait((T.end - T.boom) * 1000 + 500);
    L.stop();
  };

  // 32 ロングプチュン：長い暗転の中にかすかな鼓動 → 最大級の復活
  FX.longpu = async (S) => {
    await H.puchun(S, 2600);
    for (let i = 0; i < 2; i++) { Snd.heartbeat(0.5); S.curtain(0.94, 60); await S.wait(160); S.curtain(1, 300); await S.wait(1200); }
    await S.wait(600);
    H.drop(S, 1.25);
    S.curtain(0, 60);
    S.slow(0.25, 1100);
    await S.peka({ power: 2, rings: 4, count: 300 });
  };

  // 33 二連プチュン：暗転 → 一瞬戻る → 再暗転 → 復活
  FX.doublepu = async (S) => {
    await H.puchun(S, 1500);
    S.curtain(0, 60);
    await S.wait(800);
    await H.puchun(S, 2000);
    await H.revive(S, { power: 1.8 });
  };

  // 34 無音暗転：プチュン音すら無い完全な無音の闇 → 轟音
  FX.silentdark = async (S) => {
    Snd.bgmHold(true);
    Snd.hush(true);
    S.curtain(1, 0); S.lamp(0);
    await S.wait(2800);
    Snd.hush(false);
    H.drop(S, 1.2);
    S.curtain(0, 40);
    await S.peka({ power: 1.9, rings: 3 });
  };

  // 35 ホワイトアウト：白に飲まれ、白の中から羽とともに現れる
  FX.whiteout = async (S) => {
    Snd.bgmHold(true);
    Snd.whine(1.1);
    await S.curtain(1, 1100, '#fff');
    await S.wait(900);
    S.color('#a8c0ff', '#ffffff'); S.skin('white'); S.lamp(1); S.syncAura();
    Snd.bgmHold(false);
    Snd.soft(); H.drop(S, 0.9);
    S.aura(0.9, 0.4, 2000); S.rays(0.5);
    S.curtain(0, 1600, '#fff');
    H.emit(S, 1500, 40, () => P.add({ type: 'feather', x: rand(0, P.W), y: -20, vy: rand(60, 140), vx: rand(-30, 30), size: rand(6, 10), color: 'rgba(255,255,255,.95)', life: 4, spin: rand(-1, 1) }));
    await S.wait(1700);
  };

  // 36 ブラックホール：降着円盤が回転し、闇が全てを吸い込み、吐き出す
  FX.blackhole = async (S) => {
    const c = S.center();
    await H.puchun(S, 700);
    S.curtain(0, 0);
    S.screen('dark', true);
    Snd.drone(2.4);
    let spin = 0;
    const R0 = Math.min(P.W, P.H) * 0.22;
    const L = S.layer((x, s) => {
      const R = s.p < 0.75 ? H.easeOut(s.p / 0.75) * R0 : (1 - (s.p - 0.75) / 0.25) * R0;
      spin += s.dt * 4;
      x.globalCompositeOperation = 'lighter';
      ['#a64dff', '#ff7a3a', '#ff3da6'].forEach((col, i) => {
        x.strokeStyle = P.rgba(col, 0.6); x.lineWidth = 6 + i * 4;
        x.beginPath(); x.ellipse(c.x, c.y, R * (1.5 + i * 0.25), R * (0.45 + i * 0.08), spin * 0.15 + i, 0, Math.PI * 2); x.stroke();
      });
      x.globalCompositeOperation = 'source-over';
      x.fillStyle = '#000'; x.beginPath(); x.arc(c.x, c.y, Math.max(0, R), 0, Math.PI * 2); x.fill();
      x.strokeStyle = 'rgba(255,200,255,.8)'; x.lineWidth = 2; x.stroke();
    }, 2400);
    H.emit(S, 2000, 80, () => { const a = rand(0, 6.283), d = rand(250, 500); P.add({ x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d, vx: -Math.sin(a) * 300, vy: Math.cos(a) * 300, pull: { x: c.x, y: c.y, k: 1200 }, size: rand(2, 5), color: pick(['#a64dff', '#ff7a3a', '#fff']), life: 2 }); });
    await S.wait(1800);
    Snd.rewind(0.6);
    await S.wait(600);
    L.stop();
    S.screen('dark', false);
    S.flash('#fff', 500, 1);
    H.drop(S, 1.15);
    S.slow(0.3, 700);
    await S.peka({ color: '#a64dff', core: '#f0e0ff', power: 1.9, rings: 4, colors: ['#a64dff', '#ff7a3a', '#fff', '#ff3da6'] });
  };

  // 37 ノイズフリーズ：砂嵐と映像の乱れ → ブツッと暗転 → 復活
  FX.noise = async (S) => {
    const nc = document.createElement('canvas'); nc.width = 90; nc.height = 160;
    const nx = nc.getContext('2d'), img = nx.createImageData(90, 160);
    let f = 0;
    Snd.static(1.7);
    S.body('glitch', true);
    const L = S.layer((x, s) => {
      if (f++ % (S.calm ? 8 : 2) === 0) {
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
        nx.putImageData(img, 0, 0);
      }
      x.globalAlpha = S.calm ? 0.5 : 0.85; x.imageSmoothingEnabled = false;
      x.drawImage(nc, 0, 0, s.W, s.H);
      x.globalAlpha = 0.5;
      for (let i = 0; i < 4; i++) { x.fillStyle = pick(['#f0f', '#0ff', '#fff']); x.fillRect(0, rand(0, s.H), s.W, rand(2, 12)); }
    }, 0);
    await S.wait(1700);
    L.stop(); S.body('glitch', false);
    await H.puchun(S, 1300);
    await H.revive(S, { power: 1.7 });
  };

  // 38 フリーズ解除失敗：復帰しかけて ERROR → 再暗転 → 完全復活
  FX.failfree = async (S) => {
    await H.puchun(S, 1500);
    S.body('glitch', true); Snd.glitch(0.6);
    S.curtain(0.35, 80);
    S.curtainText('ERROR', '#ff3030');
    await S.wait(650);
    Snd.error();
    S.body('glitch', false);
    S.curtain(1, 60);
    await S.wait(400);
    S.curtainText('');
    await S.wait(1400);
    await H.revive(S, { power: 2, rings: 4 });
  };

  // 39 暗転カウント：闇に浮かぶ赤い 5→1
  FX.darkcount = async (S) => {
    await H.puchun(S, 800);
    for (let n = 5; n >= 1; n--) {
      S.curtainText(String(n), '#ff1030', 80); Snd.beep(n === 1);
      await S.wait(650);
      S.curtainText('', '#ff1030', 120);
      await S.wait(80);
    }
    await H.revive(S, { power: 1.8 });
  };

  // 40 覚醒フリーズ：闇の中で黄金の瞳が開く
  FX.awaken = async (S) => {
    await H.puchun(S, 1200);
    const c = S.center();
    Snd.hum(2); Snd.choir(2.6);
    const L = S.layer((x, s) => {
      x.fillStyle = `rgba(0,0,0,${s.p > 0.85 ? 1 - (s.p - 0.85) / 0.15 : 1})`; x.fillRect(0, 0, s.W, s.H);
      const open = H.easeInOut(Math.min(1, s.p * 1.4)), w = s.W * 0.42, h = w * 0.42 * open;
      x.globalCompositeOperation = 'lighter';
      x.drawImage(P.glow('#ffb300'), c.x - w * 1.4, c.y - w * 0.6, w * 2.8, w * 1.2);
      x.fillStyle = '#ffd54a';
      x.beginPath(); x.moveTo(c.x - w, c.y); x.quadraticCurveTo(c.x, c.y - h * 2, c.x + w, c.y); x.quadraticCurveTo(c.x, c.y + h * 2, c.x - w, c.y); x.fill();
      if (open > 0.2) {
        x.globalCompositeOperation = 'source-over';
        const ir = x.createRadialGradient(c.x, c.y, 0, c.x, c.y, h * 0.9);
        ir.addColorStop(0, '#ffcf3a'); ir.addColorStop(0.6, '#c06000'); ir.addColorStop(1, '#5a2000');
        x.fillStyle = ir; x.beginPath(); x.arc(c.x, c.y, h * 0.9, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#000'; x.beginPath(); x.ellipse(c.x, c.y, h * 0.16, h * 0.8, 0, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#fff'; x.beginPath(); x.arc(c.x - h * 0.35, c.y - h * 0.35, h * 0.14, 0, Math.PI * 2); x.fill();
      }
    }, 2600, true);
    S.curtain(0, 0);   // 以降はCanvas側の黒で覆う
    await S.wait(2000);
    S.flash('#ffd54a', 600, 1); H.drop(S, 1.2);
    S.slow(0.3, 800);
    S.peka({ color: '#ffc61a', skin: 'gold', power: 2, rings: 4, colors: H.GOLDS, sound: 'none', after: 0 });
    H.premium(S);
    await S.wait(600); L.stop();
    await S.wait(1400);
  };
})();
