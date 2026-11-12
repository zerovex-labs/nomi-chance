/* =========================================================
   PEKA!! — カラフル・特殊発光系（No.41〜50）
   ========================================================= */
(function () {
  const FX = PEKA.FX, H = PEKA.H, P = PEKA.P, Snd = PEKA.Sound;
  const { rand, pick } = P;

  // 41 レインボー：虹のアーチ → 回転する虹色ランプ → 七色の星
  FX.rainbow = async (S) => {
    const c = S.center();
    Snd.harp();
    S.layer((x, s) => {
      x.globalCompositeOperation = 'lighter'; x.globalAlpha = s.p < 0.7 ? 1 : (1 - s.p) / 0.3;
      H.RAINBOW.forEach((col, i) => {
        x.strokeStyle = P.rgba(col, 0.55); x.lineWidth = 12;
        x.beginPath(); x.arc(c.x, c.y + c.h * 0.4, (c.w * 0.4 + i * 14) * H.easeOut(Math.min(1, s.p * 2)) * 1.5, Math.PI, 0); x.stroke();
      });
    }, 2200);
    await S.wait(350);
    await S.peka({ color: '#ff3da6', skin: 'rainbow', power: 1.4, colors: H.RAINBOW, count: 220 });
    H.rain(S, 1200, 70, () => ({ type: 'star', color: pick(H.RAINBOW), size: rand(3, 8), vy: rand(150, 300), spin: 3 }));
  };

  // 42 ゴールド：金貨の雨とコイン音
  FX.gold = async (S) => {
    let i = 0;
    const iv = setInterval(() => Snd.coin(i++), 90);
    H.rain(S, 1800, 40, () => ({ type: 'coin', size: rand(8, 14), vy: rand(250, 450), ay: 500, spin: rand(4, 10), life: 3 }));
    await S.wait(300);
    await S.peka({ color: '#ffc61a', core: '#fff6c8', skin: 'gold', power: 1.4, colors: H.GOLDS });
    await S.wait(600);
    clearInterval(iv);
  };

  // 43 プラチナ：斜めに走る白銀の光沢と鋭いきらめき
  FX.platinum = async (S) => {
    const c = S.center();
    S.layer((x, s) => {
      const bx = -s.W * 0.5 + s.p * s.W * 2;
      const gr = x.createLinearGradient(bx - 120, 0, bx + 120, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      x.globalCompositeOperation = 'lighter'; x.fillStyle = gr; x.setTransform(1, 0, -0.4, 1, 0, 0); x.fillRect(bx - 120 + s.H * 0.2, 0, 240, s.H);
    }, 900);
    Snd.shimmer(1.4);
    await S.wait(300);
    await S.peka({ color: '#c9d6f0', core: '#ffffff', skin: 'platinum', power: 1.3, colors: ['#fff', '#dfe8ff', '#b0c0e0'], pitch: 7 });
    H.emit(S, 1400, 18, () => P.add({ type: 'star', x: c.x + rand(-c.w, c.w), y: c.y + rand(-c.h, c.h), size: rand(8, 20), size1: 0, color: '#fff', life: 0.5, spin: 4 }));
  };

  // 44 オーロラ：夜空に揺らめく3色のカーテン
  FX.aurora = async (S) => {
    const cols = ['#3dffb5', '#3dd1ff', '#b45bff'];
    S.screen('dark', true);
    Snd.hum(2.5); Snd.soft();
    S.layer((x, s) => {
      const a = s.p < 0.2 ? s.p / 0.2 : s.p > 0.8 ? (1 - s.p) / 0.2 : 1;
      x.globalCompositeOperation = 'lighter'; x.lineWidth = 26;
      cols.forEach((col, b) => {
        x.strokeStyle = P.rgba(col, 0.09 * a);
        for (let l = 0; l < 6; l++) {
          x.beginPath();
          for (let px = -20; px <= s.W + 20; px += 16) {
            const py = s.H * (0.18 + b * 0.09) + Math.sin(px * 0.012 + s.t * 1.3 + b * 2) * 30 + Math.sin(px * 0.027 - s.t * 0.9) * 16 + l * 14;
            px < 0 ? x.moveTo(px, py) : x.lineTo(px, py);
          }
          x.stroke();
        }
      });
    }, 3200);
    await S.wait(1100);
    S.screen('dark', false);
    await S.peka({ color: '#3dffb5', core: '#e8fff6', skin: 'aurora', power: 1.1, pitch: 3, colors: cols.concat('#fff'), burst: { gravity: 40, speed: [100, 500] } });
  };

  // 45 炎：画面下から噴き上がる火柱
  FX.fire = async (S) => {
    Snd.fire(2);
    H.emit(S, 2200, S.calm ? 70 : 130, (s) => P.add({ x: rand(0, P.W), y: P.H + 10, vx: rand(-30, 30), vy: rand(-650, -300) * (0.5 + Math.min(1, s.t)), ay: -80, size: rand(14, 30), size1: 2, color: pick(['#ff3a00', '#ff8a00', '#ffd000', '#ff5a1a']), life: rand(0.8, 1.4), fadeAt: 0.3 }));
    await S.wait(700);
    Snd.roar();
    await S.peka({ color: '#ff6a00', core: '#fff0a0', skin: 'fire', power: 1.5, pitch: -3, colors: ['#ff3a00', '#ff8a00', '#ffd000', '#fff'], burst: { gravity: -200 } });
  };

  // 46 氷結：四方から霜が伸び、砕けて光る
  FX.ice = async (S) => {
    const W = P.W, Hh = P.H, branches = [];
    for (let i = 0; i < 26; i++) {
      const side = i % 4;
      let x = side === 0 ? 0 : side === 1 ? W : rand(0, W), y = side === 2 ? 0 : side === 3 ? Hh : rand(0, Hh);
      const a0 = Math.atan2(Hh / 2 - y, W / 2 - x) + rand(-0.5, 0.5), pts = [[x, y]];
      for (let j = 0; j < 8; j++) { x += Math.cos(a0 + rand(-0.6, 0.6)) * 24; y += Math.sin(a0 + rand(-0.6, 0.6)) * 24; pts.push([x, y]); }
      branches.push(pts);
    }
    Snd.shimmer(1.2); Snd.whine(1);
    const L = S.layer((x, s) => {
      const k = Math.min(1, s.t / 1.1);
      x.fillStyle = `rgba(120,200,255,${0.22 * k})`; x.fillRect(0, 0, s.W, s.H);
      x.strokeStyle = 'rgba(220,245,255,.9)'; x.lineWidth = 2; x.shadowColor = '#9ee6ff'; x.shadowBlur = 8;
      branches.forEach(b => H.partial(x, b, k));
    }, 0);
    H.rain(S, 2500, 25, () => ({ type: 'glow', color: '#dff8ff', size: rand(2, 5), vy: rand(40, 100), sway: 2, life: 4 }));
    await S.wait(1300);
    Snd.crack(); Snd.glass();
    L.stop();
    H.shards(S, 55, ['rgba(180,230,255,.6)', 'rgba(255,255,255,.5)']);
    await S.peka({ color: '#4ec8ff', core: '#f0fcff', skin: 'ice', power: 1.4, colors: ['#bff0ff', '#fff', '#6fd6ff'] });
  };

  // 47 桜吹雪：風に流れる花びら、点灯時に花びらが弾ける
  FX.sakura = async (S) => {
    const petal = () => ({ type: 'petal', x: rand(-60, P.W * 0.6), y: rand(-40, P.H * 0.3), vx: rand(120, 260), vy: rand(60, 160), ay: 20, sway: 3, size: rand(5, 9), color: pick(['#ffc0d8', '#ffb0cc', '#ffe0ec', '#ff8cc0']), spin: rand(-3, 3), life: 4.5, fadeIn: 0.2 });
    H.emit(S, 2600, S.calm ? 30 : 60, () => P.add(petal()));
    Snd.harp();
    await S.wait(600);
    await S.peka({ color: '#ff6aa8', core: '#fff0f6', skin: 'sakura', power: 1.2, colors: ['#ffc0d8', '#fff', '#ff8cc0'] });
    const c = S.center();
    for (let i = 0; i < 60; i++) P.add(Object.assign(petal(), { x: c.x, y: c.y, vx: rand(-400, 400), vy: rand(-400, 200), ay: 120 }));
  };

  // 48 銀河：ランプの背後で3本腕の渦巻銀河が回る
  FX.galaxy = async (S) => {
    const c = S.center(), R = Math.max(P.W, P.H) * 0.55;
    const stars = Array.from({ length: P.weak ? 260 : 480 }, (_, i) => {
      const r = Math.pow(Math.random(), 0.7) * R;
      return { r, a: (i % 3) * Math.PI * 2 / 3 + r * 0.012 + rand(-0.35, 0.35), col: pick(['#b08cff', '#7ab8ff', '#ff8ce0', '#ffffff']), s: rand(1, 2.5) };
    });
    Snd.hum(3); Snd.shimmer(2);
    S.screen('dark', true);
    S.layer((x, s) => {
      x.globalCompositeOperation = 'lighter'; x.globalAlpha = s.p < 0.2 ? s.p / 0.2 : s.p > 0.75 ? (1 - s.p) / 0.25 : 1;
      x.drawImage(P.glow('#c8a0ff'), c.x - 120, c.y - 70, 240, 140);
      const rot = s.t * 0.5;
      for (const st of stars) {
        const a = st.a + rot * (1.2 - st.r / R * 0.6);
        x.fillStyle = st.col; x.fillRect(c.x + Math.cos(a) * st.r, c.y + Math.sin(a) * st.r * 0.5, st.s, st.s);
      }
    }, 3600);
    await S.wait(1000);
    S.screen('dark', false);
    await S.peka({ color: '#8a5bff', core: '#efe6ff', skin: 'galaxy', power: 1.3, colors: ['#b08cff', '#7ab8ff', '#ff8ce0', '#fff'] });
  };

  // 49 クリスタル：プリズムの光線と漂う結晶
  FX.crystal = async (S) => {
    const c = S.center(), pastel = ['#bff3ff', '#ffd0fa', '#d0ffe1', '#e2d0ff', '#fff6c0'];
    Snd.pressAlt(); Snd.shimmer(1.6);
    S.layer((x, s) => {
      x.globalCompositeOperation = 'lighter'; x.globalAlpha = s.p > 0.7 ? (1 - s.p) / 0.3 : 1;
      const len = s.W * H.easeOut(Math.min(1, s.p * 2));
      for (let i = 0; i < 14; i++) {
        const a = i / 14 * Math.PI * 2 + s.t * 0.4;
        x.strokeStyle = P.rgba(pastel[i % 5], 0.5); x.lineWidth = 3 + (i % 3) * 2;
        x.beginPath(); x.moveTo(c.x, c.y); x.lineTo(c.x + Math.cos(a) * len, c.y + Math.sin(a) * len); x.stroke();
      }
    }, 2200);
    for (let i = 0; i < 40; i++) P.add({ type: 'shard', x: rand(0, P.W), y: rand(0, P.H), vy: rand(-30, -10), spin: rand(-1, 1), life: 2.5, size: 1, shape: H.tri(rand(8, 20)), color: P.rgba(pick(pastel), 0.35), fadeIn: 0.4 });
    await S.wait(400);
    await S.peka({ color: '#9ec8ff', core: '#ffffff', skin: 'crystal', power: 1.3, pitch: 9, colors: pastel.concat('#fff'), burst: { type: 'star' } });
  };

  // 50 ブラックライト：UVの闇に隠れたネオン文字が浮かぶ
  FX.uv = async (S) => {
    S.screen('uv', true);
    Snd.hum(2.6);
    const marks = Array.from({ length: 14 }, () => ({ x: rand(0.05, 0.95), y: rand(0.08, 0.92), t: pick(['PEKA', '★', '♥', '7', 'GO!', '✦']), s: rand(18, 46), r: rand(-0.5, 0.5), c: pick(['#c8ff00', '#ff3fd8', '#3dfcff']), d: rand(0, 1) }));
    S.layer((x, s) => {
      x.fillStyle = `rgba(30,0,70,${0.45 * Math.min(1, s.t)})`; x.fillRect(0, 0, s.W, s.H);
      x.textAlign = 'center'; x.textBaseline = 'middle';
      for (const m of marks) {
        const a = Math.max(0, Math.min(1, (s.t - m.d) * 1.5));
        x.save(); x.translate(m.x * s.W, m.y * s.H); x.rotate(m.r);
        x.font = `900 ${m.s}px sans-serif`; x.fillStyle = P.rgba(m.c, a * 0.9); x.shadowColor = m.c; x.shadowBlur = 14;
        x.fillText(m.t, 0, 0); x.restore();
      }
    }, 3400);
    await S.wait(1300);
    S.banner('PEKA!!', 'neon', 1500, 'fade');
    await S.peka({ color: '#9d2bff', core: '#e6b0ff', skin: 'uv', power: 1.2, colors: ['#c8ff00', '#ff3fd8', '#3dfcff', '#9d2bff'] });
  };
})();
