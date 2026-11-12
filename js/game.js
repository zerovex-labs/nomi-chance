/* =========================================================
   PEKA!! — game.js  抽選とゲーム進行
   state:
     idle  … 待機（次のゲームを受け付ける）
     spin  … SLOT PEKA で1〜2ボタン押下済み
     play  … 演出中（入力はすべて無視＝連打対策）
     lit   … 当選ランプ点灯中（画面タップで次ゲーム）
   ゲームごとに epoch（世代番号）を進め、古い演出・タイマーが
   次のゲームの状態を書き換えないようにしている。
   ========================================================= */
(function () {
  const S = PEKA.Stage, Snd = PEKA.Sound;
  const pads = [...document.querySelectorAll('.pad')];
  const push = document.getElementById('pushBtn');
  const guide = document.getElementById('guide');
  const LIMIT_MS = 15000;      // 演出の上限時間（万一の進行不能防止）
  const TAP_GUARD_MS = 550;    // 演出終了直後の誤タップ防止
  const BGM_DUCK = 0.35;       // 演出中のBGM音量倍率

  const G = {
    data: null,
    state: 'idle',
    epoch: 0,
    steps: 0,
    used: [false, false, false],
    round: null,          // 今回のゲーム { hit, fx, teased, isNew }
    readyAt: 0,
    preview: false,
  };
  let timers = [];
  /** 現在のゲームに紐づくタイマー（リセットで全破棄） */
  function later(fn, ms) {
    const ep = G.epoch;
    timers.push(setTimeout(() => { if (G.epoch === ep) fn(); }, ms));
  }

  /** 暗号論的乱数 0..1 */
  const rnd = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  G.odds = () => PEKA.ODDS[G.data.settings.level - 1];
  const buttons = () => G.data.settings.game === 'quick' ? [push] : pads;

  /** 1ゲームにつき1回だけ呼ばれる独立抽選 */
  function draw() {
    const st = G.data.stats;
    st.games++;
    st.hamari++;
    st.maxHamari = Math.max(st.maxHamari, st.hamari);
    const hit = rnd() < 1 / G.odds();
    let fx = null, isNew = false;
    if (hit) {
      fx = PEKA.pickEffect(G.data.settings.fx, rnd(), rnd());
      st.hits++;                       // 当選回数はここでのみ加算（1当選＝1回）
      st.lastHit = st.hamari;
      st.hamari = 0;
      isNew = !G.data.found[fx.id];
      G.data.found[fx.id] = (G.data.found[fx.id] || 0) + 1;
    }
    G.round = { hit, fx, teased: 0, isNew };
    PEKA.Save.save(G.data, hit);       // 当選時は即時保存（直後の再読み込みでも消えない）
    PEKA.UI.refresh(hit);
  }

  /** ボタンの手応え（演出によって無反応・音変化） */
  function feel(el) {
    const fx = G.round && G.round.fx;
    if (fx && fx.press === 'mute') return;
    if (fx && fx.press === 'alt') Snd.pressAlt(); else Snd.press();
    el.classList.add('down');
    setTimeout(() => el.classList.remove('down'), 110);
    if (navigator.vibrate && !G.data.settings.calm) { try { navigator.vibrate(8); } catch (e) {} }
  }

  function setGuide(text, cls) {
    guide.textContent = text;
    guide.className = 'guide' + (cls ? ' ' + cls : '');
  }
  G.idleGuide = () => setGuide(G.data.settings.game === 'quick' ? 'PUSH!' : 'PUSH ×3  ANY ORDER');

  /** 演出再生 → 点灯維持 → タップ待ち */
  async function perform(fx, ctx) {
    const ep = G.epoch;
    G.state = 'play';
    PEKA.UI.hideToast();
    setGuide('', 'hide');
    buttons().forEach(b => b.classList.add('locked'));
    Snd.bgmDuck(BGM_DUCK);
    S.syncAura();
    // プチュン系は共通演出（config.js の PEKA.PUCHUN_UNIFIED）。図鑑・統計上は各演出として記録される
    const run = PEKA.isUnifiedPuchun(fx)
      ? (s, c) => PEKA.FX.puchun(s, c, PEKA.puchunLook(fx))
      : (PEKA.FX[fx.id] || ((s) => s.peka()));
    try {
      await Promise.race([run(S, ctx), S.wait(LIMIT_MS)]);
    } catch (err) {
      console.error('[PEKA] effect failed:', fx.id, err);
      if (G.epoch === ep) { S.curtain(0, 0); await S.peka(); }
    }
    if (G.epoch !== ep) return;        // 途中でリセットされた古い演出は何もしない
    S.settle();
    Snd.bgmDuck(1);
    G.state = 'lit';
    // 当選後レインボーフィーバー（約8秒）。開始1秒後からタップで飛ばして次ゲームへ進める
    const fever = G.data.settings.fever || fx.fever === 'always';
    if (fever) S.fever(PEKA.FEVER_MS);
    const guard = fever ? Math.max(PEKA.FEVER_SKIP_MS, TAP_GUARD_MS) : TAP_GUARD_MS;
    G.readyAt = performance.now() + guard;
    later(() => { if (G.state === 'lit') setGuide('TAP TO NEXT', 'next'); }, guard);
    if (G.round && G.round.isNew && !G.preview) PEKA.UI.announce(fx);
    PEKA.UI.refresh();
  }

  /** 次ゲームへ：ランプ消灯・ボタン・演出・フラグを完全リセット */
  G.reset = function () {
    G.epoch++;
    timers.forEach(clearTimeout); timers = [];
    S.reset();
    Snd.hush(false);
    Snd.bgmHold(false);
    Snd.bgmDuck(1);
    G.state = 'idle';
    G.steps = 0;
    G.used = [false, false, false];
    G.round = null;
    G.preview = false;
    G.readyAt = 0;
    [push, ...pads].forEach(b => b.classList.remove('used', 'locked', 'down'));
    document.body.dataset.game = G.data.settings.game;
    G.idleGuide();
    PEKA.UI.refresh();
  };

  /** 点灯中のタップ（ガード時間内は無視） */
  G.tap = function () {
    if (G.state !== 'lit') return false;
    if (performance.now() >= G.readyAt) G.reset();
    return true;
  };

  /** QUICK PEKA：PUSH 1回 = 1ゲーム */
  G.push = function () {
    if (G.state === 'lit') { G.tap(); return; }
    if (G.state !== 'idle' || G.data.settings.game !== 'quick') return;
    draw();
    feel(push);
    if (G.round.hit) {
      const fx = G.round.fx;
      G.state = 'play';
      later(() => perform(fx, { quick: true, teased: 0 }), fx.timing === 1 ? 30 : 140);
    }
  };

  /** SLOT PEKA：3ボタンを好きな順に。押したボタンはそのゲーム中無効 */
  G.press = function (i) {
    if (G.state === 'lit') { G.tap(); return; }
    if (G.data.settings.game === 'quick') { G.push(); return; }
    if (G.state !== 'idle' && G.state !== 'spin') return;
    if (G.used[i]) return;
    if (G.steps === 0) { draw(); G.state = 'spin'; setGuide('', 'hide'); }
    G.used[i] = true;
    G.steps++;
    feel(pads[i]);
    pads[i].classList.add('used');

    const r = G.round;
    if (r.hit) {
      if (G.steps >= r.fx.timing) { perform(r.fx, { quick: false, teased: r.teased }); return; }
      const tease = r.fx.tease && PEKA.FX_TEASE[r.fx.id];
      if (tease && tease(S, G.steps)) r.teased++;
      return;
    }
    if (G.steps >= 3) {
      // ハズレで1ゲーム終了 → すぐ次のゲームを受け付ける
      G.state = 'idle'; G.steps = 0; G.used = [false, false, false]; G.round = null;
      later(() => {
        if (G.state === 'idle' && G.steps === 0) { pads.forEach(p => p.classList.remove('used')); G.idleGuide(); }
      }, 160);
    }
  };

  /** 図鑑からの再生（統計に加算しない） */
  G.replay = function (id) {
    const fx = PEKA.EFFECT_MAP[id];
    if (!fx || G.state === 'play' || G.state === 'spin') return false;
    G.reset();
    G.preview = true;
    G.round = { hit: true, fx, teased: 0, isNew: false };
    G.state = 'play';
    later(() => perform(fx, { quick: true, teased: 0 }), 350);
    return true;
  };

  G.canSwitch = () => G.state === 'idle' || G.state === 'lit';

  PEKA.Game = G;
})();
