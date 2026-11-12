/* =========================================================
   PEKA!! — 違和感・心理戦系（No.11〜20）
   ========================================================= */
(function () {
  const FX = PEKA.FX, TEASE = PEKA.FX_TEASE, H = PEKA.H, P = PEKA.P, Snd = PEKA.Sound;
  const { rand, pick } = P;

  // 11 ボタン無反応（ボタン側の無音処理は game.js）：沈黙 → 3ボタンが順に光る → 点灯
  FX.noreact = async (S) => {
    await S.wait(800);
    S.visibleButtons().forEach((b, i) => b.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(2.6)' }, { filter: 'brightness(1)' }], { duration: 400, delay: i * 70 }));
    await S.wait(260);
    await S.peka({ pitch: -2, power: 1.15 });
  };

  // 12 ボタン音変化：澄んだ音とランプ周囲の星環
  FX.altsound = async (S) => {
    const c = S.center();
    Snd.pressAlt();
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2;
      P.add({ x: c.x + Math.cos(a) * c.w * 0.55, y: c.y + Math.sin(a) * c.h * 0.55, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, type: 'star', size: 8, color: '#bfe8ff', life: 1, spin: 3 });
    }
    await S.wait(450);
    await S.peka({ pitch: 5, colors: ['#ff2448', '#bfe8ff', '#fff'] });
  };

  // 13 ランプ一瞬消灯：星空ごと瞬断 → 復帰と同時に点灯
  FX.blink = async (S) => {
    S.screen('cut', true); S.screen('dark', true);
    await S.wait(500);
    S.screen('dark', false); S.screen('cut', false);
    await S.peka({ power: 1.3, rings: 3 });
  };

  // 14 フェイント：光りかけて引っ込む×2 → 本点灯
  FX.feint = async (S) => {
    S.color('#ff2448'); S.syncAura();
    for (let i = 0; i < 2; i++) {
      Snd.riser(0.5);
      S.lamp(0.55, 480, H.easeIn); S.auraTo(0.2, 480);
      await S.wait(500);
      S.lamp(0, 100); S.auraTo(0, 100); Snd.tick(false);
      await S.wait(550 + i * 250);
    }
    Snd.riser(0.35);
    await S.lamp(0.4, 300, H.easeIn);
    await S.peka({ power: 1.4 });
  };

  // 15 心音：鼓動に合わせて赤く脈打つ
  TEASE.heart = (S) => { Snd.heartbeat(); S.color('#ff1a3a'); S.lamp(0.3); S.lamp(0, 500); return true; };
  FX.heart = async (S, ctx) => {
    S.color('#ff1a3a');
    let beat = 0;
    const vg = H.vignette(S, '#c00018', () => beat * 0.7, 0);
    const n = ctx.teased ? 2 : 4;
    for (let i = 0; i < n; i++) {
      Snd.heartbeat(); beat = 1; S.lamp(0.35, 60); S.shake(0.12, 200);
      for (let t = 0; t < 850; t += 30) { await S.wait(30); beat = Math.max(0, beat - 0.06); S.lamp(Math.max(0, S.level() - 0.025)); }
    }
    vg.stop();
    await S.peka({ power: 1.3 });
  };

  // 16 鼓動加速：間隔が縮まり、限界で弾ける
  FX.heartfast = async (S) => {
    S.color('#ff1a3a');
    let beat = 0;
    const vg = H.vignette(S, '#d0001c', () => beat, 0);
    const gaps = [800, 640, 500, 400, 310, 240, 190, 150, 120, 100];
    for (let i = 0; i < gaps.length; i++) {
      const k = i / gaps.length;
      Snd.heartbeat(0.7 + k * 0.5); beat = 0.4 + k * 0.6; S.lamp(0.2 + k * 0.5); S.shake(0.1 + k * 0.5, 150);
      await S.wait(gaps[i] * 0.5); beat *= 0.4; S.lamp(0.05);
      await S.wait(gaps[i] * 0.5);
    }
    vg.stop();
    await S.wait(220);
    Snd.boom(1);
    await S.peka({ power: 1.7, rings: 3 });
  };

  // 17 偽ハズレ：モノクロで「ハズレ…」→ まさかの点灯
  FX.fakemiss = async (S) => {
    Snd.boo();
    S.banner('ハズレ…', 'dull', 1300, 'fade');
    S.screen('mono', true);
    await S.wait(1600);
    S.screen('mono', false);
    S.banner('!?', 'big', 800);
    await S.peka({ power: 1.6, rings: 3 });
  };

  // 18 逆再生：走査線と収縮リング、粒が逆流してランプへ
  FX.rewind = async (S) => {
    const c = S.center();
    S.color('#ff2448');
    Snd.rewind(1.4);
    S.layer((x, s) => {
      x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(160,200,255,.12)';
      for (let i = 0; i < 6; i++) x.fillRect(0, s.H - (s.t * 900 + i * s.H / 6) % s.H, s.W, 3);
    }, 1400);
    S.layer((x, s) => {
      const r = (1 - s.p) * c.w * 1.6 + 10;
      x.globalCompositeOperation = 'lighter'; x.strokeStyle = P.rgba('#ff7aa0', 0.7 * s.p); x.lineWidth = 4 + s.p * 10;
      x.beginPath(); x.ellipse(c.x, c.y, r, r * 0.62, 0, 0, Math.PI * 2); x.stroke();
    }, 1400);
    H.implode(S, 140, ['#fff', '#ff6b8a', '#ffd54a'], 900, [200, 600]);
    S.lamp(0.6, 1400, H.easeIn);
    await S.wait(1400);
    await S.peka({ power: 1.3 });
  };

  // 19 時間停止：モノクロ静止と秒針 → 時が動いて点灯
  FX.timestop = async (S) => {
    S.screen('mono', true); S.screen('stop', true);
    const c = S.center();
    let ang = 0;
    const clock = S.layer((x, s) => {
      const R = Math.min(s.W, s.H) * 0.42;
      x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 2;
      x.beginPath(); x.arc(c.x, c.y, R, 0, Math.PI * 2); x.stroke();
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.beginPath(); x.moveTo(c.x + Math.cos(a) * R * 0.9, c.y + Math.sin(a) * R * 0.9); x.lineTo(c.x + Math.cos(a) * R, c.y + Math.sin(a) * R); x.stroke(); }
      x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(c.x, c.y); x.lineTo(c.x + Math.sin(ang) * R * 0.8, c.y - Math.cos(ang) * R * 0.8); x.stroke();
    }, 0);
    for (let i = 0; i < 4; i++) { Snd.clock(); ang += Math.PI / 6; await S.wait(650); }
    clock.stop();
    S.screen('mono', false); S.screen('stop', false);
    Snd.whoosh(0.3, true);
    await S.peka({ power: 1.4, rings: 3 });
  };

  // 20 カウントダウン：3・2・1 → PEKA!!
  FX.countdown = async (S) => {
    for (const n of ['3', '2', '1']) {
      Snd.beep(false); S.banner(n, 'big', 650);
      S.ring({ color: '#ff7ac8', width: 8, life: 0.5, max: 160 });
      await S.wait(700);
    }
    Snd.beep(true);
    S.banner('PEKA!!', '', 1400);
    await S.peka({ power: 1.4 });
  };
})();
