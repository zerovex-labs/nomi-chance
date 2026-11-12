/* =========================================================
   PEKA!! — main.js  起動と入力の割り当て
   ========================================================= */
(function () {
  const G = PEKA.Game, UI = PEKA.UI, Snd = PEKA.Sound, S = PEKA.Stage;

  G.data = PEKA.Save.load();
  const set = () => G.data.settings;
  const persist = () => PEKA.Save.save(G.data);

  // ---------- 星空 ----------
  const sky = document.getElementById('sky'), frag = document.createDocumentFragment();
  for (let i = 0; i < 70; i++) {
    const s = document.createElement('i');
    if (Math.random() < 0.15) s.className = 'b';
    s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:${-Math.random() * 3}s;animation-duration:${2 + Math.random() * 3}s`;
    frag.appendChild(s);
  }
  sky.appendChild(frag);

  // ---------- 音声・BGMは最初の操作で起動（ブラウザの自動再生制限に対応） ----------
  const wake = () => {
    Snd.setVolume(set().volume); Snd.setBgmVolume(set().bgmVolume); Snd.setMuted(set().muted);
    Snd.setBgmOn(set().bgmOn);
    Snd.boot();
  };
  document.addEventListener('pointerdown', wake, true);
  document.addEventListener('keydown', wake, true);

  // ---------- 点灯中：画面のどこをタップしても次ゲーム ----------
  const isChrome = (t) => t.closest('.head, .meters, .modes, .modal, #toast');
  document.addEventListener('pointerdown', (e) => {
    if (G.state !== 'lit' || UI.isOpen() || isChrome(e.target)) return;
    e.preventDefault(); e.stopPropagation();   // 同じタップでボタンが反応しないように
    G.tap();
  }, true);

  // ---------- QUICK PEKA：PUSHボタン ----------
  const pushBtn = document.getElementById('pushBtn');
  pushBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!UI.isOpen()) G.push(); });
  pushBtn.addEventListener('contextmenu', (e) => e.preventDefault());

  // ---------- SLOT PEKA：3ボタン ----------
  document.querySelectorAll('.pad').forEach((b, i) => {
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!UI.isOpen()) G.press(i); });
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  // ---------- キーボード（PC） ----------
  const KEYS = { ArrowLeft: 0, ArrowDown: 1, ArrowRight: 2, '1': 0, '2': 1, '3': 2, a: 0, s: 1, d: 2 };
  document.addEventListener('keydown', (e) => {
    if (UI.isOpen()) { if (e.key === 'Escape') UI.close(); return; }
    if (e.repeat) return;
    const push = e.key === ' ' || e.key === 'Enter';
    if (!push && !(e.key in KEYS)) return;
    e.preventDefault();
    if (G.state === 'lit') { G.tap(); return; }
    if (set().game === 'quick') { G.push(); return; }
    if (e.key in KEYS) { G.press(KEYS[e.key]); return; }
    const free = G.used.findIndex(u => !u);   // Space/Enter は未使用ボタンを左から
    if (free >= 0) G.press(free);
  });

  // ---------- ヘッダー・モード切替 ----------
  document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => { Snd.press(); UI.open(b.dataset.open); }));
  document.getElementById('muteBtn').addEventListener('click', () => {
    set().muted = !set().muted; Snd.setMuted(set().muted); persist(); UI.refresh();
    if (!set().muted) Snd.press();
  });
  document.querySelectorAll('#tGame button').forEach(b => b.addEventListener('click', () => {
    if (UI.setGame(b.dataset.v)) { Snd.press(); persist(); UI.refresh(); }
  }));
  document.querySelectorAll('#tFx button').forEach(b => b.addEventListener('click', () => {
    set().fx = b.dataset.v; Snd.press(); persist(); UI.refresh();
  }));

  // ---------- 離脱時に確実に保存 ----------
  const flush = () => PEKA.Save.save(G.data, true);
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { Snd.bgmAway(document.hidden); if (document.hidden) flush(); });

  // ---------- 開始 ----------
  G.reset();
  S.syncAura();
  UI.refresh();
})();
