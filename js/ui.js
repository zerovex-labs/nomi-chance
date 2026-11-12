/* =========================================================
   PEKA!! — ui.js  ヘッダー表示 / 図鑑 / 統計 / 設定 / 通知
   ========================================================= */
(function () {
  const $ = (s) => document.querySelector(s);
  const Snd = PEKA.Sound, S = PEKA.Stage;
  const G = () => PEKA.Game;
  const DEBUG = /[?&]debug\b/.test(location.search);
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const no2 = (n) => String(n).padStart(2, '0');
  const pct = (x) => (x * 100).toFixed(x >= 0.01 ? 2 : 3) + '%';

  const UI = { DEBUG };
  const foundN = () => PEKA.EFFECTS.filter(e => G().data.found[e.id]).length;
  const known = (id) => DEBUG || !!G().data.found[id];

  // ---------- 上部表示 ----------
  /** 上部の表示を更新。hit=true なら当選回数を強調 */
  UI.refresh = function (hit) {
    const d = G().data, s = d.settings, st = d.stats;
    $('#mLevel').textContent = s.level;
    $('#mProb').textContent = '1/' + G().odds();
    $('#mLast').textContent = st.lastHit ? st.lastHit + 'G' : '-';
    $('#mTotal').textContent = st.games;
    $('#mHits').textContent = st.hits;
    $('#mHamari').textContent = st.hamari + 'G';
    if (hit) { const b = $('#mHits'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
    $('#zukanBadge').textContent = foundN() + '/' + PEKA.EFFECTS.length;
    document.querySelectorAll('#tGame button').forEach(b => b.classList.toggle('on', b.dataset.v === s.game));
    document.querySelectorAll('#tFx button').forEach(b => b.classList.toggle('on', b.dataset.v === s.fx));
    $('#muteBtn').classList.toggle('muted', s.muted);
    document.body.classList.toggle('calm', s.calm);
    S.calm = s.calm;
  };

  // ---------- モーダル ----------
  const RENDER = { zukan: renderZukan, stats: renderStats, settings: renderSettings };
  UI.open = function (name) { if (RENDER[name]) RENDER[name](); $('#m-' + name).classList.add('open'); };
  UI.close = function (m) { (m || document.querySelector('.modal.open'))?.classList.remove('open'); };
  UI.closeAll = () => document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
  UI.isOpen = () => !!document.querySelector('.modal.open');
  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('pointerdown', (e) => { if (e.target === m) UI.close(m); });
    m.querySelector('.x').addEventListener('click', () => UI.close(m));
  });

  // ---------- 演出図鑑 ----------
  function renderZukan() {
    const d = G().data, mode = d.settings.fx;
    $('#zukanCount').textContent = foundN() + '/' + PEKA.EFFECTS.length;
    let html = DEBUG ? '<p class="note" style="color:#ff8">DEBUG：全演出を閲覧・再生できます（記録はされません）</p>' : '';
    for (const cat of PEKA.CATEGORIES) {
      const list = PEKA.EFFECTS.filter(e => e.cat === cat.id);
      html += `<div class="zc-head">${cat.name}<small>${list.filter(e => d.found[e.id]).length}/${list.length}</small></div><div class="zgrid">`;
      for (const e of list) {
        if (e.parts && e.parts.dark === 0) html += `<div class="zc-sub">${PEKA.BLACKOUT.palettes[e.parts.palette].name}</div>`;
        const k = known(e.id);
        const cls = ['zcard', k ? '' : 'locked', e.premium ? 'premium' : '', e.group === 'puchun' ? 'puchun' : ''].join(' ');
        html += `<button class="${cls}" data-id="${e.id}">
          <span class="no">No.${no2(e.no)}</span>
          <span class="nm">${k ? esc(e.name) : '？？？？'}</span>
          ${k ? `<span class="ct">${d.found[e.id] || 0}回</span><span class="rt">${pct(PEKA.effectRate(e.id, mode))}</span>` : ''}
        </button>`;
      }
      html += '</div>';
    }
    $('#zukanBody').innerHTML = html;
  }
  $('#zukanBody').addEventListener('click', (ev) => {
    const card = ev.target.closest('.zcard'); if (!card) return;
    const e = PEKA.EFFECT_MAP[card.dataset.id];
    if (!known(e.id)) {
      Snd.tick(false);
      card.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], 160);
      return;
    }
    const cat = PEKA.CATEGORIES.find(c => c.id === e.cat).name;
    $('#detailTitle').textContent = `No.${no2(e.no)} ${e.name}`;
    $('#detailBody').innerHTML = `
      <p class="desc">${esc(e.desc)}</p>
      <div class="meta">
        <span>系統</span><b>${cat}${e.group === 'puchun' ? '（プチュン系）' : ''}${e.premium ? ' ★PREMIUM' : ''}</b>
        <span>発生回数</span><b>${G().data.found[e.id] || 0}回</b>
        <span>出現率</span><b>通常 ${pct(PEKA.effectRate(e.id, 'normal'))} ／ プチュン ${pct(PEKA.effectRate(e.id, 'puchun'))}</b>
        <span>SLOTでの告知</span><b>${e.timing}つ目のボタン</b>
      </div>
      <button class="btn" id="replayBtn">▶ この演出を再生</button>`;
    $('#replayBtn').onclick = () => {
      if (G().state === 'spin') { UI.toast('ゲームの途中は再生できません'); return; }
      UI.closeAll();
      G().replay(e.id);
    };
    UI.open('detail');
  });

  // ---------- 統計 ----------
  function renderStats() {
    const { stats: st, found } = G().data;
    const box = (l, v) => `<div class="sbox"><span>${l}</span><b>${v}</b></div>`;
    let html = `<div class="sgrid">
      ${box('総ゲーム数', st.games.toLocaleString())}
      ${box('総当選回数', st.hits.toLocaleString())}
      ${box('実際の当選率', st.hits ? '1/' + (st.games / st.hits).toFixed(1) : '—')}
      ${box('設定値', '1/' + G().odds())}
      ${box('現在のハマり', st.hamari + 'G')}
      ${box('最大ハマり', st.maxHamari + 'G')}
      ${box('前回の当選', st.lastHit ? st.lastHit + 'G' : '—')}
      ${box('演出発見数', foundN() + '/' + PEKA.EFFECTS.length)}
    </div><h3>演出別発生回数</h3>`;
    const list = PEKA.EFFECTS.filter(e => found[e.id]).sort((a, b) => found[b.id] - found[a.id] || a.no - b.no);
    if (!list.length) html += '<p class="empty">まだ当選がありません。</p>';
    const top = list.length ? found[list[0].id] : 1;
    for (const e of list) html += `<div class="srow"><span class="n">No.${no2(e.no)} ${esc(e.name)}</span><span class="bar"><i style="width:${(found[e.id] / top * 100).toFixed(1)}%"></i></span><span>${found[e.id]}回</span></div>`;
    $('#statsBody').innerHTML = html;
  }

  // ---------- 設定 ----------
  function renderSettings() {
    const s = G().data.settings;
    const on = (c) => c ? 'on' : '';
    $('#settingsBody').innerHTML = `
      <div class="row"><label>設定（当選確率）</label>
        <div class="chips c6">${PEKA.ODDS.map((d, i) => `<button data-level="${i + 1}" class="${on(s.level === i + 1)}">${i + 1}<small>1/${d}</small></button>`).join('')}</div>
        <p>毎ゲーム完全独立抽選。天井・確定当選はありません。</p></div>
      <div class="row"><label>ゲームモード</label>
        <div class="chips c2"><button data-game="quick" class="${on(s.game === 'quick')}">QUICK PEKA</button><button data-game="slot" class="${on(s.game === 'slot')}">SLOT PEKA</button></div>
        <p>QUICK：1プッシュで1ゲーム ／ SLOT：3つのボタンを好きな順番で押して1ゲーム</p></div>
      <div class="row"><label>演出モード</label>
        <div class="chips c2"><button data-fx="normal" class="${on(s.fx === 'normal')}">通常モード</button><button data-fx="puchun" class="${on(s.fx === 'puchun')}">プチュンモード</button></div>
        <p>当選時のプチュン系の割合：通常 ${PEKA.FX_MODES.normal.puchunShare * 100}% ／ プチュン ${PEKA.FX_MODES.puchun.puchunShare * 100}%（当選確率は変わりません）</p></div>
      <div class="row"><label>効果音の音量 <span id="volNum">${Math.round(s.volume * 100)}</span>%</label>
        <input type="range" id="vol" min="0" max="100" value="${Math.round(s.volume * 100)}"></div>
      <div class="row"><label>BGMの音量 <span id="bgmNum">${Math.round(s.bgmVolume * 100)}</span>%</label>
        <input type="range" id="bgmVol" min="0" max="100" value="${Math.round(s.bgmVolume * 100)}"></div>
      <div class="row sw"><div><label>BGM</label><p>オリジナルBGM。プチュン中は停止し、復帰で再開します</p></div><button class="switch ${on(s.bgmOn)}" data-sw="bgmOn" aria-label="BGM"></button></div>
      <div class="row sw"><div><label>ミュート（全体）</label><p>効果音とBGMをまとめて消音します</p></div><button class="switch ${on(s.muted)}" data-sw="muted" aria-label="ミュート"></button></div>
      <div class="row sw"><div><label>当選後レインボー（${PEKA.FEVER_MS / 1000}秒）</label><p>当選演出のあと画面全体が虹色に光ります。途中でタップすると飛ばして次のゲームへ進みます</p></div><button class="switch ${on(s.fever)}" data-sw="fever" aria-label="当選後レインボー"></button></div>
      <div class="row sw"><div><label>光・揺れ軽減</label><p>激しい点滅・フラッシュ・画面の揺れを抑えます</p></div><button class="switch ${on(s.calm)}" data-sw="calm" aria-label="光・揺れ軽減"></button></div>
      <div class="row"><button class="btn danger" id="wipeBtn">データをリセット（統計・図鑑）</button></div>
      <p class="note">PEKA!! はオリジナルのファンメイドゲームです。グラフィックと効果音はすべてプログラムで生成しています。<br>キーボード：Space / Enter＝PUSH、← ↓ → または 1 2 3＝SLOTの各ボタン。</p>`;
  }
  $('#settingsBody').addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    const s = G().data.settings;
    if (b.dataset.level) s.level = +b.dataset.level;
    else if (b.dataset.game) { if (!UI.setGame(b.dataset.game)) return; }
    else if (b.dataset.fx) s.fx = b.dataset.fx;
    else if (b.dataset.sw === 'muted') { s.muted = !s.muted; Snd.setMuted(s.muted); }
    else if (b.dataset.sw === 'bgmOn') { s.bgmOn = !s.bgmOn; Snd.setBgmOn(s.bgmOn); }
    else if (b.dataset.sw === 'calm') s.calm = !s.calm;
    else if (b.dataset.sw === 'fever') s.fever = !s.fever;
    else if (b.id === 'wipeBtn') {
      if (!confirm('統計と図鑑の記録をすべて消去します。よろしいですか？')) return;
      const keep = Object.assign({}, s);
      G().data = PEKA.Save.wipe();
      G().data.settings = keep;
      G().reset();
      UI.toast('データをリセットしました');
    } else return;
    Snd.press();
    PEKA.Save.save(G().data);
    renderSettings(); UI.refresh();
  });
  $('#settingsBody').addEventListener('input', (ev) => {
    const v = ev.target.value / 100, s = G().data.settings;
    if (ev.target.id === 'vol') { s.volume = v; Snd.setVolume(v); $('#volNum').textContent = ev.target.value; }
    else if (ev.target.id === 'bgmVol') { s.bgmVolume = v; Snd.setBgmVolume(v); $('#bgmNum').textContent = ev.target.value; }
    else return;
    PEKA.Save.save(G().data);
  });
  // 効果音スライダーを離したら試聴
  $('#settingsBody').addEventListener('change', (ev) => { if (ev.target.id === 'vol') Snd.press(); });

  /** ゲームモード切替（SLOTの途中では不可） */
  UI.setGame = function (mode) {
    const s = G().data.settings;
    if (s.game === mode) return true;
    if (!G().canSwitch()) { UI.toast('ゲームの途中は切り替えできません'); return false; }
    s.game = mode;
    G().reset();
    return true;
  };

  // ---------- 通知 ----------
  let toastTimer = 0;
  function showToast(html, ms) {
    const t = $('#toast');
    t.innerHTML = html; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  }
  UI.hideToast = () => { clearTimeout(toastTimer); $('#toast').classList.remove('show'); };
  UI.toast = (msg) => showToast(`<div class="msg">${esc(msg)}</div>`, 1600);
  /** 初回発見の特別通知 */
  UI.announce = function (e) {
    showToast(`<div class="new">★ NEW 演出発見！ ★</div><div class="name">No.${no2(e.no)} ${esc(e.name)}</div><div class="sub">図鑑 ${foundN()}/${PEKA.EFFECTS.length}</div>`, 2800);
    Snd.found();
    document.querySelector('[data-open="zukan"]').animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.25)', boxShadow: '0 0 20px #ffd54a' }, { transform: 'scale(1)' }],
      { duration: 600, iterations: 2 });
  };

  PEKA.UI = UI;
})();
