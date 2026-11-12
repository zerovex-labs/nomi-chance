/* =========================================================
   PEKA!! — 王道系（No.01〜10）
   ========================================================= */
(function () {
  const FX = PEKA.FX, TEASE = PEKA.FX_TEASE, H = PEKA.H, P = PEKA.P, Snd = PEKA.Sound;
  const { rand, pick } = P;

  // 01 通常ペカリ：一撃で点灯する基本形
  FX.normal = async (S) => {
    await S.peka({ color: '#ff2448' });
  };

  // 02 先ペカリ：ボタンから光の粒が駆け上がって即点灯
  FX.saki = async (S) => {
    const b = S.padCenter(1), c = S.center();
    Snd.whoosh(0.35, true);
    for (let i = 0; i < 40; i++) P.add({ x: b.x + rand(-30, 30), y: b.y, vx: rand(-60, 60), vy: rand(-900, -500), pull: { x: c.x, y: c.y, k: 2600 }, size: rand(3, 8), color: pick(['#fff', '#ff6b8a', '#ffd54a']), life: 0.9 });
    await S.wait(280);
    await S.peka({ pitch: 2, power: 1.1 });
  };

  // 03 無音ペカリ：音を完全停止、静かに星が舞う
  FX.muon = async (S) => {
    Snd.hush(true);
    S.color('#ff2448'); S.syncAura();
    S.lamp(1, 60);
    S.aura(0.8, 0.38, 2000);
    S.rays(0.25, 1500);
    H.emit(S, 2200, 40, () => { const c = S.center(); P.add({ x: c.x + rand(-c.w * 0.6, c.w * 0.6), y: c.y + rand(-c.h * 0.5, c.h * 0.5), vy: rand(-40, -15), type: 'star', size: rand(2, 6), color: '#ffd0e0', life: 1.8, fadeIn: 0.5 }); });
    await S.wait(2300);
  };

  // 04 遅れペカリ：完全な沈黙のあと不意打ち
  FX.okure = async (S) => {
    await S.wait(1400);
    S.ring({ color: '#fff', width: 6, life: 0.4, squash: 0.62, max: 200 });
    await S.peka({ power: 1.35, rings: 3 });
  };

  // 05 じわペカ：上昇音とともにゆっくり明るくなる
  FX.jiwa = async (S) => {
    S.color('#ff2448'); S.syncAura();
    Snd.riser(2.4);
    S.lamp(0.85, 2400, H.easeIn);
    S.auraTo(0.3, 2400);
    H.emit(S, 2400, 30, (s) => { const c = S.center(); P.add({ x: c.x + rand(-c.w / 2, c.w / 2), y: c.y + c.h * 0.5, vy: rand(-160, -60) * (0.4 + s.p), size: rand(2, 5) + s.p * 5, color: '#ff8aa0', life: 1.2 }); });
    await S.wait(2400);
    await S.peka({ power: 1.2 });
  };

  // 06 ふわペカ：泡が舞い、柔らかく灯る（揺れ・フラッシュなし）
  FX.fuwa = async (S) => {
    H.emit(S, 1600, 30, () => P.add({ type: 'bubble', x: rand(0, P.W), y: P.H + 20, vy: rand(-220, -120), sway: 2, size: rand(6, 18), color: 'rgba(255,200,230,.8)', life: 4, fadeIn: 0.3 }));
    await S.wait(500);
    await S.peka({ sound: 'soft', shake: false, flash: false, power: 0.6, lampDur: 1300, rest: 0.32, rings: 1,
      burst: { gravity: -40, speed: [30, 160], life: [1.5, 3], count: 70, type: 'glow', drag: 0.02 }, after: 1600 });
  };

  // 07 点滅ペカリ：リズム点滅から点きっぱなし
  FX.tenmetsu = async (S) => {
    S.color('#ff2448'); S.syncAura();
    const on = S.calm ? 320 : 130, off = S.calm ? 280 : 110;
    for (let i = 0; i < 6; i++) {
      S.lamp(1); S.auraTo(0.45, 40); Snd.beep(i % 2 === 1);
      await S.wait(on);
      S.lamp(0); S.auraTo(0, 40);
      await S.wait(off);
    }
    await S.peka({ pitch: 4 });
  };

  // 08 二段階ペカリ：半点灯 → 全開爆発
  TEASE.nidan = (S, step) => {
    if (step !== 2) return false;
    S.color('#ff2448'); S.syncAura();
    S.lamp(0.35, 150); S.auraTo(0.15, 300); Snd.hum(0.6);
    S.burst({ count: 24, speed: [80, 300], gravity: 100, life: [0.4, 0.9] });
    return true;
  };
  FX.nidan = async (S, ctx) => {
    if (!ctx.teased) { TEASE.nidan(S, 2); await S.wait(1000); } else await S.wait(450);
    await S.peka({ power: 1.6, rings: 3, count: 220 });
  };

  // 09 チラ見せペカリ：一瞬光って消え、焦らして点灯
  TEASE.chira = (S, step) => {
    if (step !== 1) return false;
    S.color('#ff2448'); H.flick(S, 70);
    return true;
  };
  FX.chira = async (S, ctx) => {
    S.color('#ff2448');
    if (!ctx.teased) { await H.flick(S, 70); await S.wait(260); }
    await H.flick(S, 40);
    await S.wait(1000);
    await S.peka({ power: 1.2 });
  };

  // 10 逆転ペカリ：青く光ったランプが裏返って真紅に
  FX.gyakuten = async (S) => {
    S.color('#3c6cff', '#d4e6ff'); S.skin('cold'); S.syncAura();
    S.lamp(1, 120); S.aura(0.4, 0.15, 800); Snd.boo();
    await S.wait(1000);
    Snd.whoosh(0.4, true);
    S.lampAnim([{ transform: 'rotateY(0)' }, { transform: 'rotateY(180deg) scale(1.1)' }, { transform: 'rotateY(360deg)' }], { duration: 650, easing: 'ease-in-out' });
    await S.wait(320);
    await S.peka({ color: '#ff2a1a', power: 1.4, colors: ['#ff2a1a', '#ff9a00', '#ffe600', '#fff'] });
  };
})();
