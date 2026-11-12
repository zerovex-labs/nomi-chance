/* =========================================================
   NOMI! CHANCE — save.js  localStorage 永続化（続きから再開）
   保存内容：参加人数・プレイヤー名・当選確率・ゲームモード・TOTAL PUSH/HIT・
            プレイヤー別成績・当選履歴・現在のプレイヤー・前回当選者・音設定
   ========================================================= */
(function () {
  const KEY = 'nomi.chance.v1';

  const player = (name) => ({ name, push: 0, hits: 0, lastHitGame: 0 });

  function fresh() {
    return {
      players: NOMI.DEFAULT_PLAYERS.map(player),
      odds: NOMI.DEFAULT_ODDS,
      mode: NOMI.DEFAULT_MODE,
      total: { push: 0, hit: 0, hamari: 0 },
      current: 0,
      lastWinner: null,
      history: [],     // { no, name, mode, fx, fxName, at }
      sound: { muted: false, bgm: true },
      calm: false,
    };
  }

  function load() {
    const d = fresh();
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s) {
        if (Array.isArray(s.players) && s.players.length >= NOMI.MIN_PLAYERS) {
          d.players = s.players.slice(0, NOMI.MAX_PLAYERS).map((p, i) => Object.assign(player(p.name || `プレイヤー${i + 1}`), p));
        }
        if (NOMI.ODDS[s.odds]) d.odds = s.odds;
        if (s.mode === 'chance' || s.mode === 'slot') d.mode = s.mode;
        Object.assign(d.total, s.total);
        if (Array.isArray(s.history)) d.history = s.history;
        d.lastWinner = s.lastWinner || null;
        d.current = Number.isInteger(s.current) ? s.current : 0;
        Object.assign(d.sound, s.sound);
        d.calm = !!s.calm;
      }
    } catch (e) { /* 壊れたデータは無視して初期状態 */ }
    if (d.current < 0 || d.current >= d.players.length) d.current = 0;
    return d;
  }

  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* 容量超過・プライベートモード */ }
  }

  /** 成績と履歴だけを消す（人数・名前・設定は残す） */
  function resetRecords(data) {
    data.players.forEach(p => { p.push = 0; p.hits = 0; p.lastHitGame = 0; });
    data.total = { push: 0, hit: 0, hamari: 0 };
    data.history = [];
    data.lastWinner = null;
    data.current = 0;
    save(data);
    return data;
  }

  NOMI.Save = { load, save, resetRecords, player };
})();
