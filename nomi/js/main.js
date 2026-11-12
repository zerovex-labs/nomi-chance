/* =========================================================
   NOMI! CHANCE — main.js  起動と入力
   起動時は必ず設定画面から。GAME START で続きから再開。
   ========================================================= */
(function () {
  const $ = (s) => document.querySelector(s);
  const G = NOMI.Game, UI = NOMI.UI, Snd = PEKA.Sound, Clips = NOMI.Clips;

  G.data = NOMI.Save.load();
  const d = () => G.data;
  const persist = () => NOMI.Save.save(G.data);

  // ---------- 星空 ----------
  const sky = $('#sky'), frag = document.createDocumentFragment();
  for (let i = 0; i < 60; i++) {
    const s = document.createElement('i');
    if (Math.random() < 0.15) s.className = 'b';
    s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:${-Math.random() * 3}s;animation-duration:${2 + Math.random() * 3}s`;
    frag.appendChild(s);
  }
  sky.appendChild(frag);

  NOMI.Reels.init();
  Clips.preload();

  // ---------- 音（ブラウザの自動再生制限：最初の操作で起動） ----------
  let woke = false;
  const applySound = () => { Snd.setMuted(d().sound.muted); Clips.setMuted(d().sound.muted); Snd.setBgmOn(d().sound.bgm); };
  const wake = () => {
    applySound();
    Snd.boot();
    if (!woke) { woke = true; Clips.unlock(); }
  };
  document.addEventListener('pointerdown', wake, true);
  document.addEventListener('keydown', wake, true);

  // ================= 設定画面 =================
  $('#countMinus').addEventListener('click', () => { Snd.press(); UI.setCount(d().players.length - 1); });
  $('#countPlus').addEventListener('click', () => { Snd.press(); UI.setCount(d().players.length + 1); });
  $('#nameList').addEventListener('input', (e) => {
    const i = +e.target.dataset.i; if (!(i >= 0)) return;
    d().players[i].name = e.target.value;
    persist();
  });
  $('#oddsChips').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    d().odds = b.dataset.v; Snd.press(); persist(); UI.renderSetup();
  });
  $('#modeChips').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    d().mode = b.dataset.v; Snd.press(); persist(); UI.renderSetup();
  });
  $('#calmSw').addEventListener('click', () => { d().calm = !d().calm; Snd.press(); persist(); UI.renderSetup(); });
  $('#startBtn').addEventListener('click', () => {
    UI.finalizeNames();
    if (d().current >= d().players.length) d().current = 0;
    persist();
    Snd.peka(2);
    UI.showSetup(false);
    PEKA.Stage.syncAura();
    G.start();
  });
  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('TOTAL PUSH・TOTAL HIT・プレイヤー別成績・当選履歴をすべて消去します。\n（参加人数・名前・設定はそのまま）\nよろしいですか？')) return;
    NOMI.Save.resetRecords(d());
    UI.renderSetup();
    UI.toast('記録をリセットしました');
  });

  // ================= ゲーム画面 =================
  // 当選後：画面のどこをタップしても次のプレイヤーへ（ヘッダー・モーダル以外）
  const isChrome = (t) => t.closest('.head, .modes, .modal, #setup');
  document.addEventListener('pointerdown', (e) => {
    if (G.state !== 'lit' || UI.isOpen() || isChrome(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    G.tap();
  }, true);

  $('#pushBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); if (!UI.isOpen()) G.push(); });
  document.querySelectorAll('.stop').forEach((b, i) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!UI.isOpen()) G.stop(i); }));
  document.querySelectorAll('.push, .stop').forEach(b => b.addEventListener('contextmenu', (e) => e.preventDefault()));

  document.querySelectorAll('#modeToggle button').forEach(b => b.addEventListener('click', () => {
    if (G.setMode(b.dataset.v)) Snd.press();
    else UI.toast('演出中・結果表示中は切り替えできません');
  }));
  document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => { Snd.press(); UI.open(b.dataset.open); }));
  $('#toSetup').addEventListener('click', () => {
    if (!G.canSwitch()) { UI.toast('演出中・結果表示中は設定を開けません'); return; }
    Snd.press();
    G.suspend();
    UI.showSetup(true);
  });
  $('#muteBtn').addEventListener('click', () => {
    d().sound.muted = !d().sound.muted; applySound(); persist(); UI.refresh();
    if (!d().sound.muted) Snd.press();
  });

  // キーボード（PC）：Space/Enter = PUSH または左から STOP、1/2/3 = 各STOP
  document.addEventListener('keydown', (e) => {
    if (!$('#app').hidden && !UI.isOpen() && !e.repeat) {
      const k = e.key;
      if (k === ' ' || k === 'Enter') {
        e.preventDefault();
        if (G.state === 'lit') G.tap();
        else if (d().mode === 'chance') G.push();
        else { const i = G.used.findIndex(u => !u); if (i >= 0) G.stop(i); }
      } else if (['1', '2', '3'].includes(k)) { e.preventDefault(); if (G.state === 'lit') G.tap(); else G.stop(+k - 1); }
    }
  });

  // タブが裏に回ったら BGM を止め、確実に保存
  document.addEventListener('visibilitychange', () => { Snd.bgmAway(document.hidden); if (document.hidden) persist(); });
  window.addEventListener('pagehide', persist);

  // ---------- 起動：まず設定画面 ----------
  document.body.dataset.mode = d().mode;
  document.body.classList.toggle('calm', d().calm);
  PEKA.Stage.calm = d().calm;
  UI.showSetup(true);
})();
