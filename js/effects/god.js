/* =========================================================
   PEKA!! — 神・究極プレミア系（No.51〜60）
   すべてプレミア専用ファンファーレで締める
   ========================================================= */
(function () {
  const FX = PEKA.FX, H = PEKA.H, P = PEKA.P, Snd = PEKA.Sound;
  const { rand, pick } = P;

  // 51 神ペカリ：天上の光 → 「神」
  FX.god = async (S) => {
    Snd.choir(3);
    S.screen('dark', true);
    H.godRays(S, 4000);
    await S.wait(1300);
    S.screen('dark', false);
    S.flash('#fff3c0', 500, 1);
    S.banner('神', 'gold big', 2200);
    Snd.boom(1.2);
    S.peka({ color: '#ffd84d', core: '#fffbe8', skin: 'god', power: 2, rings: 4, colors: H.GOLDS, sound: 'none', after: 0 });
    H.premium(S);
    await S.wait(2200);
  };

  // 52 究極ペカリ：暗転 → 虹ストロボ → 虹点灯 → 金貨 → 「究極」
  FX.ultimate = async (S) => {
    await H.puchun(S, 1200);
    S.curtain(0, 0);
    Snd.bgmHold(false); H.drop(S, 1);
    await S.strobe(10, 75, H.RAINBOW, (i) => Snd.tick(i % 2 === 0));
    S.peka({ color: '#ff3da6', skin: 'rainbow', power: 1.6, colors: H.RAINBOW, after: 0 });
    H.rain(S, 2000, 30, () => ({ type: 'coin', size: rand(8, 14), vy: rand(250, 450), ay: 500, spin: rand(4, 10), life: 3 }));
    await S.wait(700);
    S.banner('究極', 'gold mid', 2000);
    Snd.boom(1.5);
    S.slow(0.3, 900);
    S.ring({ color: '#ffd54a', width: 40, life: 1.2, fill: true });
    S.burst({ count: 250, colors: H.RAINBOW.concat(H.GOLDS), speed: [400, 1500], type: 'star', gravity: 300 });
    H.premium(S, H.RAINBOW);
    await S.wait(2200);
  };

  // 53 天使降臨：光の羽、天使の輪が降りてくる
  FX.angel = async (S) => {
    const c = S.center();
    Snd.harp(); Snd.choir(3.2);
    H.godRays(S, 4200, '#ffffff');
    H.emit(S, 3000, S.calm ? 20 : 35, () => P.add({ type: 'feather', x: rand(0, P.W), y: -20, vx: rand(-30, 30), vy: rand(70, 150), size: rand(7, 12), color: 'rgba(255,255,255,.95)', life: 5, spin: rand(-1, 1) }));
    const halo = S.layer((x, s) => {
      const k = H.easeOut(Math.min(1, s.t / 1.2)), hy = c.y - c.h * 0.75 - (1 - k) * 120;
      x.globalCompositeOperation = 'lighter'; x.strokeStyle = '#ffe08a'; x.lineWidth = 7; x.shadowColor = '#ffd54a'; x.shadowBlur = 25;
      x.beginPath(); x.ellipse(c.x, hy, c.w * 0.28, c.w * 0.07, 0, 0, Math.PI * 2); x.stroke();
    }, 0);
    await S.wait(1400);
    S.flash('#ffffff', 500, 1);
    S.peka({ color: '#a8c0ff', core: '#ffffff', skin: 'white', power: 1.8, colors: ['#fff', '#ffe08a', '#d0e0ff'], sound: 'soft', after: 0 });
    Snd.bass(1.2);
    H.premium(S, ['#fff', '#ffe08a']);
    await S.wait(2400);
    halo.stop();
  };

  // 54 悪魔覚醒：赤い脈動と赤い稲妻、咆哮、黒煙
  FX.demon = async (S) => {
    const c = S.center();
    S.screen('dark', true);
    Snd.drone(2.6);
    let pulse = 0;
    const vg = H.vignette(S, '#a00010', () => 0.5 + pulse * 0.5, 0);
    for (let i = 0; i < 3; i++) {
      Snd.heartbeat(1.2); pulse = 1; S.shake(0.3, 250);
      const pts = P.bolt(rand(0, P.W), 0, c.x + rand(-80, 80), c.y, 70);
      S.layer((x) => P.beam(x, pts, '#ff1a1a', 3), 220);
      await S.wait(700); pulse = 0.3;
    }
    Snd.roar();
    S.flash('#ff0020', 500, 1);
    S.screen('dark', false);
    S.banner('覚醒', 'blood mid', 2000);
    for (let i = 0; i < 40; i++) P.add({ x: c.x + rand(-c.w / 2, c.w / 2), y: c.y + rand(-20, 20), vx: rand(-80, 80), vy: rand(-200, -60), size: rand(20, 40), size1: 60, color: 'rgba(20,0,0,.6)', type: 'dot', blend: 'source-over', life: 2, alpha: 0.5 });
    S.peka({ color: '#e00020', core: '#ffb0b0', skin: 'demon', power: 2, rings: 4, colors: ['#ff0020', '#660000', '#ff6a00', '#000000'], sound: 'none', after: 0 });
    Snd.boom(1.3);
    H.premium(S, ['#ff2a2a', '#ff8a00']);
    await S.wait(2300);
    vg.stop();
  };

  // 55 時空崩壊：映像が裂け、時刻が狂い、巻き戻り、砕ける
  FX.timecrash = async (S) => {
    S.body('glitch', true); Snd.glitch(1.4); Snd.static(1.2);
    let bands = [], f = 0;
    const L = S.layer((x, s) => {
      if (f++ % (S.calm ? 10 : 3) === 0) bands = Array.from({ length: 8 }, () => ({ y: rand(0, s.H), h: rand(4, 40), dx: rand(-40, 40), c: pick(['#ff00ff', '#00ffff', '#ffffff']) }));
      x.globalCompositeOperation = 'lighter';
      bands.forEach(b => { x.fillStyle = P.rgba(b.c, 0.35); x.fillRect(b.dx, b.y, s.W, b.h); });
      x.globalCompositeOperation = 'source-over'; x.fillStyle = 'rgba(255,255,255,.8)'; x.font = '900 28px monospace'; x.textAlign = 'center';
      for (let i = 0; i < 5; i++) x.fillText(String(Math.floor(rand(0, 99))).padStart(2, '0') + ':' + String(Math.floor(rand(0, 99))).padStart(2, '0'), rand(0, s.W), rand(0, s.H));
    }, 0);
    await S.wait(1300);
    L.stop(); S.body('glitch', false);
    Snd.rewind(1);
    S.screen('mono', true);
    H.implode(S, 120, ['#0ff', '#f0f', '#fff'], 1600);
    await S.wait(1000);
    S.screen('mono', false);
    H.shards(S, 40, ['rgba(0,255,255,.4)', 'rgba(255,0,255,.4)', 'rgba(255,255,255,.5)']);
    Snd.glass();
    S.flash('#fff', 500, 1);
    S.banner('時空崩壊', 'gold', 1800);
    S.slow(0.3, 800);
    S.peka({ color: '#00d8ff', core: '#f0ffff', skin: 'platinum', power: 2, rings: 4, colors: ['#0ff', '#f0f', '#fff'], sound: 'none', after: 0 });
    Snd.boom(1.4);
    H.premium(S, ['#00ffff', '#ff00ff', '#ffffff']);
    await S.wait(2200);
  };

  // 56 宇宙誕生：闇 → 特異点 → 星雲と星々が広がる
  FX.cosmos = async (S) => {
    const c = S.center();
    await S.curtain(1, 400);
    const clouds = Array.from({ length: 10 }, () => ({ a: rand(0, 6.283), d: rand(0.2, 1), col: pick(['#6a1bff', '#ff2a9a', '#2bd4ff', '#ff8a00']), s: rand(120, 260) }));
    const stars = Array.from({ length: 220 }, () => ({ x: rand(0, 1), y: rand(0, 1), b: rand(0, 1), s: rand(1, 2.5) }));
    Snd.hum(1.5);
    const L = S.layer((x, s) => {
      const out = s.p > 0.82 ? 1 - (s.p - 0.82) / 0.18 : 1;
      x.fillStyle = `rgba(0,0,0,${out})`; x.fillRect(0, 0, s.W, s.H);
      x.globalCompositeOperation = 'lighter';
      if (s.p < 0.3) { const r = 4 + s.p * 60; x.drawImage(P.glow('#ffffff'), c.x - r, c.y - r, r * 2, r * 2); return; }
      const e = H.easeOut((s.p - 0.3) / 0.7);
      x.globalAlpha = 0.6 * out;
      clouds.forEach(cl => { const r = cl.s * e * 1.5; x.drawImage(P.glow(cl.col), c.x + Math.cos(cl.a) * cl.d * s.W * 0.6 * e - r, c.y + Math.sin(cl.a) * cl.d * s.H * 0.4 * e - r, r * 2, r * 2); });
      x.globalAlpha = out; x.fillStyle = '#fff';
      stars.forEach(st => { if (st.b < e) x.fillRect(c.x + (st.x - 0.5) * s.W * 1.2 * e, c.y + (st.y - 0.5) * s.H * 1.2 * e, st.s, st.s); });
    }, 4200, true);
    S.curtain(0, 0);   // 以降はCanvas側の黒で覆う
    await S.wait(1260);
    Snd.boom(1.4); Snd.choir(3);
    S.burst({ count: 200, colors: ['#6a1bff', '#ff2a9a', '#2bd4ff', '#fff'], speed: [200, 1200], gravity: 0, drag: 0.02, life: [1.5, 3] });
    await S.wait(2000);
    S.peka({ color: '#c4127a', core: '#ffe0f4', skin: 'cosmos', power: 1.8, rings: 3, colors: ['#6a1bff', '#ff2a9a', '#2bd4ff', '#fff'], sound: 'none', flash: false, after: 0 });
    H.premium(S, ['#ff2a9a', '#2bd4ff', '#ffffff']);
    await S.wait(2000);
    L.stop();
  };

  // 57 超新星爆発：恒星が脈打ち収縮 → 超スローで大爆発
  FX.supernova = async (S) => {
    const c = S.center();
    S.screen('dark', true);
    Snd.riser(1.8);
    const L = S.layer((x, s) => {
      const r = (s.p < 0.6 ? 60 + Math.sin(s.t * 20) * 8 : 60 * (1 - (s.p - 0.6) / 0.4)) + 2;
      x.globalCompositeOperation = 'lighter';
      x.drawImage(P.glow('#ffe8a0'), c.x - r * 2, c.y - r * 2, r * 4, r * 4);
      x.drawImage(P.glow('#ffffff'), c.x - r, c.y - r, r * 2, r * 2);
    }, 1800);
    H.emit(S, 1800, 60, () => { const a = rand(0, 6.283), d = rand(150, 350); P.add({ x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d, pull: { x: c.x, y: c.y, k: 1500 }, size: rand(2, 4), color: '#ffe8a0', life: 1 }); });
    await S.wait(1800);
    L.stop();
    S.screen('dark', false);
    S.slow(0.18, 1600);
    S.flash('#fff', 900, 1);
    Snd.boom(2);
    const cols = ['#ffffff', '#ffe8a0', '#ff8a3a', '#7ab8ff', '#ff3da6'];
    for (let i = 0; i < 5; i++) setTimeout(() => S.ring({ color: cols[i], width: 50 - i * 6, life: 1.6, fill: true }), i * 110);
    S.burst({ count: 420, colors: cols, speed: [300, 2000], gravity: 80, life: [1.5, 3], size: [3, 14] });
    S.peka({ color: '#ffb84d', core: '#ffffff', skin: 'god', power: 2.2, rings: 0, flash: false, sound: 'none', after: 0 });
    H.premium(S, cols);
    await S.wait(2500);
  };

  // 58 無限ループ：虹色に点いては消えを加速しながら繰り返す → ∞
  FX.loop = async (S) => {
    S.syncAura();
    for (let i = 0; i < 12; i++) {
      const col = H.RAINBOW[i % 7];
      S.color(col); S.lamp(1); S.auraTo(0.5, 30); Snd.step(i);
      S.ring({ color: col, width: 10, life: 0.5, squash: 0.62, max: 260 });
      const on = Math.max(S.calm ? 260 : 50, 360 - i * 30);
      await S.wait(on);
      S.lamp(0); S.auraTo(0, 30);
      await S.wait(Math.max(S.calm ? 200 : 40, on * 0.6));
    }
    S.banner('∞', 'gold big', 1800);
    S.peka({ color: '#ff3da6', skin: 'rainbow', power: 2, rings: 4, colors: H.RAINBOW, after: 0 });
    Snd.bass(1.5);
    H.premium(S, H.RAINBOW);
    await S.wait(2200);
  };

  // 59 777覚醒：暗がりに 7・7・7 が刻まれる
  FX.seven = async (S) => {
    S.curtain(0.75, 300);
    await S.wait(300);
    for (const t of ['7', '7  7', '7  7  7']) {
      S.banner(t, t.length === 1 ? 'gold big' : 'gold mid', 900); Snd.impact(0.8); S.shake(0.6, 250);
      await S.wait(800);
    }
    S.curtain(0, 200);
    S.banner('777', 'gold mid', 2400);
    S.peka({ color: '#ff1a1a', core: '#fff0c0', skin: 'gold', power: 2.1, rings: 4, colors: ['#ff1a1a', '#ffd54a', '#fff'], sound: 'none', after: 0 });
    Snd.boom(1.4);
    S.burst({ type: 'coin', count: 60, speed: [400, 1000], gravity: 900 });
    H.premium(S, ['#ff1a1a', '#ffd54a']);
    await S.wait(2400);
  };

  // 60 FINAL PEKA：プチュン → 静寂 → 鼓動 → 闇が白へ反転 → 全部入りの最終告知
  FX.final = async (S) => {
    await H.puchun(S, 2200);
    for (let i = 0; i < 3; i++) {
      Snd.heartbeat(0.6 + i * 0.3); S.curtain(0.9 - i * 0.05, 60);
      await S.wait(150); S.curtain(1, 250);
      await S.wait(650 - i * 120);
    }
    Snd.whine(1.2);
    S.curtainEl.animate([{ background: '#000' }, { background: '#fff' }], { duration: 1100, fill: 'forwards' });
    await S.wait(1300);
    S.curtainEl.getAnimations().forEach(a => a.cancel());
    S.color('#ff3da6', '#ffffff'); S.skin('rainbow'); S.lamp(1); S.syncAura();
    Snd.bgmHold(false);
    H.drop(S, 1.3);
    S.curtain(0, 1000, '#fff');
    S.slow(0.22, 1800);
    S.banner('FINAL\nPEKA', 'gold', 3000);
    S.aura(1, 0.45, 2500); S.rays(0.7);
    for (let i = 0; i < 6; i++) setTimeout(() => S.ring({ color: H.RAINBOW[i], width: 50, life: 1.5, fill: true }), i * 130);
    S.burst({ count: 500, colors: H.RAINBOW.concat(H.GOLDS), speed: [300, 2000], gravity: 150, life: [1.5, 3], size: [3, 16] });
    S.burst({ type: 'coin', count: 40, speed: [400, 1100], gravity: 900 });
    S.shake(1.6, 900);
    H.premium(S, H.RAINBOW.concat(H.GOLDS));
    await S.wait(3200);
  };
})();
