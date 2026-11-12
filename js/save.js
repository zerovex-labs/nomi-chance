/* =========================================================
   PEKA!! — save.js  localStorage 永続化
   ========================================================= */
(function () {
  const KEY = 'peka.v2';

  function fresh() {
    return {
      settings: { level: PEKA.DEFAULT_LEVEL, game: 'quick', fx: 'normal', volume: 0.8, bgmVolume: 0.5, bgmOn: true, fever: true, muted: false, calm: false },
      stats: { games: 0, hits: 0, hamari: 0, maxHamari: 0, lastHit: 0 },
      found: {},   // { effectId: 発生回数 }
    };
  }

  function load() {
    const d = fresh();
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s) {
        Object.assign(d.settings, s.settings);
        Object.assign(d.stats, s.stats);
        Object.assign(d.found, s.found);
      }
    } catch (e) { /* 壊れたデータは無視 */ }
    // 値の検証
    if (!PEKA.ODDS[d.settings.level - 1]) d.settings.level = PEKA.DEFAULT_LEVEL;
    if (!['quick', 'slot'].includes(d.settings.game)) d.settings.game = 'quick';
    if (!PEKA.FX_MODES[d.settings.fx]) d.settings.fx = 'normal';
    for (const id in d.found) if (!PEKA.EFFECT_MAP[id]) delete d.found[id];
    return d;
  }

  let timer = 0, pending = null;
  function write() {
    timer = 0;
    try { localStorage.setItem(KEY, JSON.stringify(pending)); } catch (e) { /* 容量超過・プライベートモード */ }
  }
  function save(data, now) {
    pending = data;
    if (now) { clearTimeout(timer); write(); }
    else if (!timer) timer = setTimeout(write, 250);
  }
  function wipe() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    return fresh();
  }

  PEKA.Save = { load, save, wipe };
})();
