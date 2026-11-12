/* =========================================================
   NOMI! CHANCE — ui.js  設定画面・統計表示・結果表示・成績・履歴
   ========================================================= */
(function () {
  const $ = (s) => document.querySelector(s);
  const G = () => NOMI.Game;
  const D = () => NOMI.Game.data;
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const UI = {};

  // ================= 開始（設定）画面 =================
  function defaultName(i) { return NOMI.DEFAULT_PLAYERS[i] || ''; }
  UI.renderSetup = function () {
    const d = D();
    $('#countNum').textContent = d.players.length;
    $('#countMinus').disabled = d.players.length <= NOMI.MIN_PLAYERS;
    $('#countPlus').disabled = d.players.length >= NOMI.MAX_PLAYERS;
    $('#nameList').innerHTML = d.players.map((p, i) =>
      `<label><b>${i + 1}</b><input type="text" maxlength="12" data-i="${i}" value="${esc(p.name)}" placeholder="プレイヤー${i + 1}" enterkeyhint="done"></label>`).join('');
    $('#oddsChips').innerHTML = Object.entries(NOMI.ODDS).map(([k, o]) =>
      `<button type="button" data-v="${k}" class="${d.odds === k ? 'on' : ''}">${o.label}<small>1/${o.n}</small></button>`).join('');
    document.querySelectorAll('#modeChips button').forEach(b => b.classList.toggle('on', b.dataset.v === d.mode));
    $('#calmSw').classList.toggle('on', d.calm);
    $('#resumeInfo').textContent = d.total.push > 0
      ? `続きから再開：TOTAL PUSH ${d.total.push} / HIT ${d.total.hit}　次は ${d.players[d.current] ? d.players[d.current].name || `プレイヤー${d.current + 1}` : ''}`
      : '';
  };
  /** 人数の増減（名前欄も自動で増減。既存プレイヤーの成績は保持） */
  UI.setCount = function (n) {
    const d = D();
    n = Math.max(NOMI.MIN_PLAYERS, Math.min(NOMI.MAX_PLAYERS, n));
    while (d.players.length < n) d.players.push(NOMI.Save.player(defaultName(d.players.length)));
    if (d.players.length > n) d.players.length = n;
    if (d.current >= n) d.current = 0;
    NOMI.Save.save(d);
    UI.renderSetup();
  };
  /** 空欄の名前は「プレイヤーN」に */
  UI.finalizeNames = function () {
    D().players.forEach((p, i) => { p.name = (p.name || '').trim() || `プレイヤー${i + 1}`; });
  };
  UI.showSetup = function (on) {
    $('#setup').hidden = !on;
    $('#app').hidden = on;
    if (on) UI.renderSetup();
  };

  // ================= ゲーム画面の表示 =================
  function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  UI.refresh = function (hit) {
    const d = D(), g = G();
    $('#sPush').textContent = d.total.push;
    $('#sHit').textContent = d.total.hit;
    $('#sHamari').textContent = d.total.hamari;
    $('#sLast').textContent = d.lastWinner || 'なし';
    if (hit) { bump($('#sHit')); bump($('#sLast')); }
    const cur = d.players[g.playing] || d.players[0];
    $('#turnName').textContent = cur.name;
    $('#nextName').textContent = d.players[g.nextIndex(g.playing)].name;
    $('#oddsTag').textContent = `${NOMI.ODDS[d.odds].label} 1/${NOMI.ODDS[d.odds].n}`;
    document.querySelectorAll('#modeToggle button').forEach(b => b.classList.toggle('on', b.dataset.v === d.mode));
    $('#muteBtn').classList.toggle('muted', d.sound.muted);
    document.body.classList.toggle('calm', d.calm);
    PEKA.Stage.calm = d.calm;
  };
  UI.turnPop = function () { const el = $('#turnName'); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); };

  /** 非当選：SAFE!（ランプは消灯のまま） */
  UI.showMiss = function (nextName) {
    const S = PEKA.Sound; S.step(3); setTimeout(() => S.step(6), 90);
    const r = $('#result');
    r.querySelector('.r-sub').textContent = `次は ${nextName}`;
    r.classList.remove('show'); void r.offsetWidth; r.classList.add('show');
  };
  UI.showWinner = function (name, fx) {
    $('#winnerName').textContent = name;
    $('#winnerTap').classList.remove('show');
    const w = $('#winner'); w.classList.remove('show'); void w.offsetWidth; w.classList.add('show');
  };
  UI.winnerTap = (on) => $('#winnerTap').classList.toggle('show', on);
  UI.hideWinner = () => { $('#winner').classList.remove('show'); $('#winnerTap').classList.remove('show'); };

  let toastTimer = 0;
  UI.toast = function (msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1600); };
  UI.hideToast = () => { clearTimeout(toastTimer); $('#toast').classList.remove('show'); };

  // ================= 成績ランキング・当選履歴 =================
  function renderRank() {
    const d = D(), g = G();
    const rows = d.players.map((p, i) => ({ p, i, rate: p.push ? p.hits / p.push : 0 }))
      .sort((a, b) => b.p.hits - a.p.hits || b.rate - a.rate || a.p.push - b.p.push || a.i - b.i);
    $('#rankBody').innerHTML = `<table class="rank"><thead><tr><th>#</th><th>名前</th><th>HIT</th><th>PUSH</th><th>当選率</th><th>最終当選</th></tr></thead><tbody>${
      rows.map((r, k) => `<tr class="${k < 3 && r.p.hits ? 'r' + (k + 1) : ''} ${r.i === g.playing ? 'cur' : ''}">
        <td>${k + 1}</td><td class="nm">${esc(r.p.name)}</td><td class="hit">${r.p.hits}</td><td>${r.p.push}</td>
        <td>${r.p.push ? (r.rate * 100).toFixed(1) + '%' : '-'}</td><td>${r.p.lastHitGame ? '#' + r.p.lastHitGame : '-'}</td></tr>`).join('')
    }</tbody></table>`;
  }
  function renderHistory() {
    const h = D().history.slice().reverse();
    $('#historyBody').innerHTML = h.length ? `<div class="hist">${h.map(e => {
      const dt = new Date(e.at);
      const when = isNaN(dt) ? '' : dt.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `<div class="hrow"><span class="no">#${e.no}</span><span class="who">${esc(e.name)}</span>
        <span class="meta">${NOMI.MODE_LABEL[e.mode] || e.mode}${e.stop ? `（第${e.stop}停止）` : ''} ・ ${esc(e.fxName || e.fx)} ・ ${when}</span></div>`;
    }).join('')}</div>` : '<p class="empty">まだ当選がありません</p>';
  }
  UI.open = function (name) {
    if (name === 'rank') renderRank();
    if (name === 'history') renderHistory();
    $('#m-' + name).classList.add('open');
  };
  UI.isOpen = () => !!document.querySelector('.modal.open');
  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('pointerdown', (e) => { if (e.target === m) m.classList.remove('open'); });
    m.querySelector('.x').addEventListener('click', () => m.classList.remove('open'));
  });

  NOMI.UI = UI;
})();
