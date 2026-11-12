/* =========================================================
   NOMI! CHANCE — game.js  順番管理・抽選・統計・履歴・プチュン再生
   state:
     idle    … CHANCE MODE で PUSH 待ち
     spin    … SLOT MODE でリール回転中（STOP 待ち）
     busy    … 抽選〜結果表示の切り替え中（入力無効）
     result  … ハズレ表示中（入力無効。終わると次のプレイヤーへ）
     play    … プチュン演出中（入力無効）
     lit     … 当選ランプ点灯・当選者表示中（タップで次のプレイヤーへ）
   1ゲーム＝CHANCE：PUSH 1回 / SLOT：第1停止〜3リール停止（当選なら第1〜第3停止のどこかでプチュン）。
   抽選は commit() の中で1ゲームにつき1回だけ（CHANCE は PUSH、SLOT は第1停止の瞬間）。
   ========================================================= */
(function () {
  const S = PEKA.Stage, Snd = PEKA.Sound, Reels = NOMI.Reels, Clips = NOMI.Clips;
  const $ = (s) => document.querySelector(s);
  const push = $('#pushBtn'), stops = [...document.querySelectorAll('.stop')], guide = $('#guide');
  const LIMIT_MS = 15000;

  const G = {
    data: null,
    state: 'idle',
    epoch: 0,
    playing: 0,            // このゲームをプレイ中のプレイヤー番号
    used: [false, false, false],
    stopped: 0,
    round: null,           // SLOT：第1停止で確定したこのゲームの抽選結果 { hit, fx, name, mode, at }
    readyAt: 0,
  };
  let timers = [];
  function later(fn, ms) { const ep = G.epoch; timers.push(setTimeout(() => { if (ep === G.epoch) fn(); }, ms)); }

  const rnd = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  G.odds = () => NOMI.ODDS[G.data.odds];
  G.player = (i) => G.data.players[i];
  G.nextIndex = (i) => (i + 1) % G.data.players.length;

  function setGuide(text, cls) { guide.textContent = text; guide.className = 'guide' + (cls ? ' ' + cls : ''); }
  function idleGuide() { setGuide(G.data.mode === 'chance' ? 'PUSH!' : 'STOP を3つ押せ！'); }
  function lockButtons(on) { [push, ...stops].forEach(b => b.classList.toggle('locked', on)); }
  function feel(el) {
    Snd.press();
    el.classList.add('down'); setTimeout(() => el.classList.remove('down'), 110);
    if (navigator.vibrate && !G.data.calm) { try { navigator.vibrate(10); } catch (e) {} }
  }

  /** プレイヤーの番を開始 */
  function enterTurn() {
    G.epoch++;
    timers.forEach(clearTimeout); timers = [];
    G.playing = G.data.current;
    G.used = [false, false, false];
    G.stopped = 0;
    G.round = null;
    lockButtons(false);
    stops.forEach(b => b.classList.remove('used', 'down'));
    document.body.dataset.mode = G.data.mode;
    if (G.data.mode === 'slot') { Reels.spinAll(); G.state = 'spin'; }
    else { Reels.halt(); G.state = 'idle'; }
    idleGuide();
    NOMI.UI.refresh();
    NOMI.UI.turnPop();
  }
  G.start = enterTurn;

  /**
   * 1ゲームの抽選（1ゲームにつき1回だけ）。統計・履歴を記録し、次のプレイヤーを確定して保存する。
   * 画面の統計表示はここでは更新しない（当たり外れが表示から先にバレないように）。
   *   CHANCE：PUSH の瞬間 / SLOT：第1停止の瞬間 に呼ぶ
   */
  function commit(mode) {
    const d = G.data, p = d.players[G.playing];
    const hit = rnd() < 1 / G.odds().n;
    d.total.push++; p.push++; d.total.hamari++;
    let fx = null;
    if (hit) {
      fx = NOMI.pickPuchun(rnd());
      d.total.hit++; p.hits++; p.lastHitGame = d.total.push;
      d.lastWinner = p.name; d.total.hamari = 0;
      d.history.push({ no: d.total.push, name: p.name, mode, fx: fx.id, fxName: fx.name, at: new Date().toISOString() });
    }
    d.current = G.nextIndex(G.playing);       // 次のプレイヤーを確定（演出中にリロードしても続きから）
    NOMI.Save.save(d);
    return { hit, fx, name: p.name, mode };
  }
  /** SLOT：当選時、何番目の停止でプチュンするか（config の SLOT_PUCHUN_STOP の重み） */
  function pickStop() {
    const w = NOMI.SLOT_PUCHUN_STOP, total = w.reduce((a, b) => a + b, 0);
    let x = rnd() * total;
    for (let i = 0; i < w.length; i++) if ((x -= w[i]) < 0) return i + 1;
    return 3;
  }

  /** 非当選：SAFE!（ここで統計表示を更新） */
  async function miss(mode) {
    NOMI.UI.refresh();
    if (mode === 'slot') await Reels.avoidTriple();
    G.state = 'result';
    setGuide('', 'hide');
    NOMI.UI.showMiss(G.player(G.data.current).name);
    later(enterTurn, NOMI.MISS_SHOW_MS);
  }

  /** プチュン演出 → ランプ点灯 → 当選者表示 → 8秒レインボー → タップ待ち */
  async function perform(fx, winner, mode) {
    const ep = G.epoch;
    G.state = 'play';
    setGuide('', 'hide');
    NOMI.UI.hideToast();
    S.syncAura();
    // 音声ファイルがあれば流し、合成音は消音（BGMも止める）
    const clip = Clips.play(fx.id, () => { if (G.state !== 'play') Snd.bgmHold(false); });
    if (clip) Snd.hush(true);
    let revealed = false;
    const ctx = {
      fx, winner, clip,
      reveal() {
        if (revealed) return; revealed = true;
        NOMI.UI.refresh(true);              // ここで TOTAL HIT・前回当選者を更新
        if (mode === 'slot') Reels.showHit();
        NOMI.UI.showWinner(winner, fx);
      },
    };
    const run = NOMI.FX[fx.id] || (async (s, c) => { await NOMI.C.revive(s, c); });
    try {
      await Promise.race([run(S, ctx), S.wait(LIMIT_MS)]);
    } catch (err) {
      console.error('[NOMI] puchun failed:', fx.id, err);
    }
    if (ep !== G.epoch) return;
    S.settle();                                   // 暗転解除・消音解除・ランプ点灯維持
    if (clip && Clips.playing()) Snd.bgmHold(true); // 音声ファイルが鳴り終わるまで BGM は止めたまま
    ctx.reveal();
    S.fever(NOMI.FEVER_MS);
    G.state = 'lit';
    G.readyAt = performance.now() + NOMI.FEVER_SKIP_MS;
    later(() => { if (G.state === 'lit') { NOMI.UI.winnerTap(true); setGuide('TAP TO NEXT', 'next'); } }, NOMI.FEVER_SKIP_MS);
  }

  /** 点灯中のタップ → 次のプレイヤーへ */
  G.tap = function () {
    if (G.state !== 'lit') return false;
    if (performance.now() < G.readyAt) return true;
    NOMI.UI.hideWinner();
    Clips.stopAll();
    S.reset();
    Snd.hush(false); Snd.bgmHold(false); Snd.bgmDuck(1);
    enterTurn();
    return true;
  };

  /** CHANCE MODE：PUSH 1回 = 1ゲーム */
  G.push = function () {
    if (G.state === 'lit') { G.tap(); return; }
    if (G.state !== 'idle' || G.data.mode !== 'chance') return;
    feel(push);
    G.state = 'busy';
    lockButtons(true);
    const r = commit('chance');
    if (r.hit) perform(r.fx, r.name, r.mode); else miss(r.mode);
  };

  /**
   * SLOT MODE：3リールを止めて1ゲーム。
   * 抽選は第1停止の瞬間に1回だけ。当選なら第1・第2・第3停止のどこかでプチュン（先告知あり）。
   * 非当選なら3リール停止で SAFE!。
   */
  G.stop = async function (i) {
    if (G.state === 'lit') { G.tap(); return; }
    if (G.state !== 'spin' || G.data.mode !== 'slot' || G.used[i]) return;
    const ep = G.epoch;
    G.used[i] = true;
    feel(stops[i]);
    stops[i].classList.add('used');
    if (!G.round) {                                   // 第1停止：このゲームの抽選
      G.round = commit('slot');
      if (G.round.hit) {
        G.round.at = pickStop();
        const h = G.data.history[G.data.history.length - 1];
        if (h) { h.stop = G.round.at; NOMI.Save.save(G.data); }
      }
    }
    const r = G.round, n = G.used.filter(Boolean).length;
    if (r.hit && n >= r.at) {                         // この停止でプチュン（残りのリールは回ったまま）
      G.state = 'busy';
      lockButtons(true);
      setGuide('', 'hide');
      await Reels.stop(i);
      if (ep !== G.epoch) return;
      perform(r.fx, r.name, r.mode);
      return;
    }
    if (n === 3) setGuide('', 'hide');
    await Reels.stop(i);
    if (ep !== G.epoch) return;
    G.stopped++;
    if (G.stopped === 3 && G.state === 'spin' && !r.hit) {
      G.state = 'busy';
      lockButtons(true);
      miss('slot');
    }
  };

  /** モード切替（演出中・結果表示中・SLOTで第1停止後は不可。統計は共通なので消えない） */
  G.canSwitch = () => G.state === 'idle' || (G.state === 'spin' && !G.round);
  G.setMode = function (mode) {
    if (G.data.mode === mode) return true;
    if (!G.canSwitch()) return false;
    G.data.mode = mode;
    NOMI.Save.save(G.data);
    enterTurn();                   // 第1停止前（抽選前）なので統計に影響なし
    return true;
  };

  /** 設定画面に戻る前の後始末 */
  G.suspend = function () {
    G.epoch++;
    timers.forEach(clearTimeout); timers = [];
    Reels.halt();
    G.state = 'idle';
  };

  NOMI.Game = G;
})();
