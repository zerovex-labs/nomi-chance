/* =========================================================
   PEKA!! — 衝撃・爆発系（No.21〜30）
   ========================================================= */
(function () {
  const FX = PEKA.FX, H = PEKA.H, P = PEKA.P, Snd = PEKA.Sound;
  const { rand, pick } = P;

  // 21 ストロボ：白とピンクの高速閃光
  FX.strobe = async (S) => {
    await S.strobe(14, 65, ['#fff', '#fff', '#ff3da6'], (i) => Snd.tick(i % 2 === 0));
    await S.peka({ power: 1.5, rings: 3 });
  };

  // 22 サンダー：稲妻3発、最後はランプ直撃
  FX.thunder = async (S) => {
    const c = S.center();
    S.screen('dark', true);
    for (let i = 0; i < 3; i++) {
      const last = i === 2;
      const pts = P.bolt(last ? c.x + rand(-40, 40) : rand(0, P.W), -20, last ? c.x : rand(0, P.W), last ? c.y : P.H * rand(0.5, 0.9), 90);
      S.layer((x) => { if (Math.random() < 0.3) return; P.beam(x, pts, '#bcd8ff', last ? 7 : 4); }, last ? 450 : 260);
      S.flash('#d8e8ff', 200, last ? 1 : 0.5);
      Snd.thunder(); S.shake(last ? 1.2 : 0.5, 300);
      await S.wait(last ? 160 : 550);
    }
    S.screen('dark', false);
    S.burst({ type: 'spark', count: 100, colors: ['#fff', '#bcd8ff', '#ffe14d'], speed: [500, 1300], gravity: 600, trail: 4 });
    await S.peka({ color: '#ffcc12', core: '#fffbe0', power: 1.5, colors: ['#ffe14d', '#fff', '#bcd8ff'] });
  };

  // 23 衝撃波：点灯後に5連の衝撃波と重低音
  FX.shock = async (S) => {
    await S.peka({ power: 1.2, rings: 1, after: 0 });
    for (let i = 0; i < 5; i++) {
      await S.wait(230);
      Snd.bass(0.8 + i * 0.1);
      S.ring({ color: i % 2 ? '#ff7ac8' : '#ffffff', width: 40 - i * 4, life: 1, squash: 0.62, fill: true });
      S.shake(0.6 + i * 0.15, 260);
    }
    await S.wait(500);
  };

  // 24 画面粉砕：ヒビ3段階 → ガラス片が崩落
  FX.shatter = async (S) => {
    const c = S.center();
    const lines = H.cracks(c.x + rand(-30, 30), c.y + rand(-20, 20), 11);
    let stage = 0;
    const L = S.layer((x) => {
      x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 2; x.shadowColor = '#bfe0ff'; x.shadowBlur = 6;
      lines.forEach(l => H.partial(x, l, stage / 3));
    }, 0);
    for (let i = 1; i <= 3; i++) { stage = i; Snd.crack(); S.shake(0.3 * i, 180); await S.wait(380); }
    L.stop();
    Snd.glass(); Snd.impact(1.2);
    H.shards(S, 70);
    await S.peka({ power: 1.6, rings: 3 });
  };

  // 25 光の柱：地面から5本の柱が順に立つ
  FX.pillar = async (S) => {
    const cols = [0.15, 0.85, 0.32, 0.68, 0.5], live = [];
    let now = 0;
    const L = S.layer((x, s) => {
      now = s.t;
      x.globalCompositeOperation = 'lighter';
      for (const b of live) {
        const k = H.easeOut(Math.min(1, (s.t - b.t0) / 0.35)), h = s.H * k, w = s.W * 0.11;
        const gr = x.createLinearGradient(b.x - w / 2, 0, b.x + w / 2, 0);
        gr.addColorStop(0, 'rgba(255,200,240,0)'); gr.addColorStop(0.5, `rgba(255,240,255,${0.85 * b.a})`); gr.addColorStop(1, 'rgba(255,200,240,0)');
        x.fillStyle = gr; x.fillRect(b.x - w / 2, s.H - h, w, h);
      }
    }, 0);
    for (const k of cols) {
      live.push({ x: P.W * k, t0: now, a: 1 }); Snd.whoosh(0.25, true); S.shake(0.2, 120);
      P.burst({ x: P.W * k, y: P.H, angle: -Math.PI / 2, spread: 0.2, count: 20, colors: ['#fff', '#ffc0f0'], speed: [600, 1200], gravity: 400 });
      await S.wait(170);
    }
    await S.wait(150);
    await S.peka({ power: 1.4, color: '#ff3da6', core: '#fff0fa' });
    for (let t = 0; t < 800; t += 40) { live.forEach(b => b.a *= 0.9); await S.wait(40); }
    L.stop();
  };

  // 26 超振動：地鳴りと加速する揺れ、砂ぼこり
  FX.quake = async (S) => {
    Snd.rumble(1.9);
    S.quake(1.3, 1900);
    S.color('#ff2448');
    H.rain(S, 1800, 50, () => ({ type: 'dot', size: rand(1, 3), color: '#c9a', vy: rand(200, 500), ay: 600, life: 1.5 }));
    const t0 = performance.now();
    while (performance.now() - t0 < 1900) { S.lamp(Math.random() * 0.25 * ((performance.now() - t0) / 1900)); await S.wait(50); }
    Snd.boom(1);
    await S.peka({ power: 1.7, rings: 3 });
  };

  // 27 流星直撃：右上から流星が飛来して着弾
  FX.meteor = async (S) => {
    const c = S.center(), x0 = P.W + 60, y0 = -60;
    Snd.whoosh(0.8, false);
    S.layer((x, s) => {
      const k = H.easeIn(s.p), hx = x0 + (c.x - x0) * k, hy = y0 + (c.y - y0) * k;
      for (let i = 0; i < 4; i++) P.add({ x: hx + rand(-6, 6), y: hy + rand(-6, 6), vx: rand(-40, 40) + 150, vy: rand(-40, 40) - 150, size: rand(6, 14), size1: 0, color: pick(['#ff8a1a', '#ffd54a', '#fff']), life: 0.5 });
      x.globalCompositeOperation = 'lighter';
      const r = 40 + k * 30; x.drawImage(P.glow('#ffb040'), hx - r, hy - r, r * 2, r * 2);
    }, 750);
    await S.wait(750);
    Snd.boom(1.2); S.flash('#ffd08a', 400, 1);
    S.burst({ count: 160, colors: ['#ff8a1a', '#ffd54a', '#fff', '#ff3a1a'], speed: [400, 1300], gravity: 700, type: 'spark', trail: 3 });
    S.slow(0.3, 500);
    await S.peka({ color: '#ff7a00', core: '#fff0c0', power: 1.7, rings: 3 });
  };

  // 28 レーザー：四隅からの光線が掃引してランプで交差
  FX.laser = async (S) => {
    const c = S.center();
    const corners = [[0, 0], [P.W, 0], [0, P.H], [P.W, P.H]];
    const cols = ['#20ffd0', '#ff3da6', '#ffe14d', '#6a8bff'];
    corners.forEach((_, i) => setTimeout(() => Snd.laser(), i * 120));
    S.layer((x, s) => {
      const k = H.easeOut(Math.min(1, s.p * 1.4));
      x.globalAlpha = s.p > 0.8 ? (1 - s.p) / 0.2 : 1;
      corners.forEach(([cx, cy], i) => {
        const a = Math.atan2(c.y - cy, c.x - cx) + (1 - k) * (i % 2 ? 0.7 : -0.7), L = Math.hypot(P.W, P.H) * 1.3;
        P.beam(x, [[cx, cy], [cx + Math.cos(a) * L, cy + Math.sin(a) * L]], cols[i], 5);
      });
    }, 1300);
    await S.wait(900);
    S.flash('#cffff4', 300, 1);
    await S.peka({ color: '#00e0b0', core: '#e0fff8', power: 1.5, colors: cols.concat('#fff') });
  };

  // 29 エネルギー暴走：渦を巻いて集まるエネルギー、ランプが不安定に明滅
  FX.overload = async (S) => {
    const c = S.center();
    S.color('#7a5cff', '#e8e0ff');
    Snd.riser(1.6); Snd.glitch(1.4);
    S.quake(0.8, 1600);
    H.emit(S, 1500, 90, () => { const a = rand(0, 6.283), d = rand(180, 420); P.add({ x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d, vx: -Math.sin(a) * 200, vy: Math.cos(a) * 200, pull: { x: c.x, y: c.y, k: 2200 }, size: rand(3, 7), color: pick(['#7a5cff', '#c0b0ff', '#fff', '#20e0ff']), life: 1.2 }); });
    H.emit(S, 1500, 25, () => { const a = rand(0, 6.283); P.add({ type: 'spark', x: c.x + Math.cos(a) * c.w * 0.45, y: c.y + Math.sin(a) * c.h * 0.45, vx: Math.cos(a) * 600, vy: Math.sin(a) * 600, size: 6, color: '#b0e8ff', life: 0.25, trail: 2 }); });
    const t0 = performance.now();
    while (performance.now() - t0 < 1600) { S.lamp(rand(0.1, 0.8)); await S.wait(S.calm ? 220 : 60); }
    S.flash('#fff', 500, 1); Snd.boom(1.4);
    await S.peka({ color: '#7a5cff', core: '#efeaff', power: 1.9, rings: 4, colors: ['#7a5cff', '#20e0ff', '#fff', '#ff7ae0'] });
  };

  // 30 ビッグバン：全てが一点に収縮 → 無音の一瞬 → スロー大爆発
  FX.bigbang = async (S) => {
    Snd.rewind(1.1);
    const c = S.center();
    for (let i = 0; i < 200; i++) P.add({ x: rand(0, P.W), y: rand(0, P.H), pull: { x: c.x, y: c.y, k: 1800 }, size: rand(2, 6), color: pick(H.RAINBOW.concat('#fff')), life: 1.3 });
    S.curtain(0.85, 1000);
    await S.wait(1100);
    S.curtain(1, 0);
    await S.wait(500);
    S.curtain(0, 0);
    S.slow(0.22, 1500);
    Snd.boom(1.6);
    S.flash('#fff', 600, 1);
    S.burst({ count: 380, colors: H.RAINBOW.concat(['#fff', '#fff']), speed: [300, 1800], gravity: 120, life: [1.2, 2.6], size: [3, 14], type: 'glow' });
    for (let i = 0; i < 4; i++) setTimeout(() => S.ring({ color: H.RAINBOW[i * 2], width: 30, life: 1.2, fill: true }), i * 150);
    await S.peka({ power: 2, rings: 0, flash: false, after: 1400 });
  };
})();
