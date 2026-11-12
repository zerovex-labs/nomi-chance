/* =========================================================
   NOMI! CHANCE — clips.js
   プチュン演出ごとの音声ファイル（任意）。
   nomi/audio/ に config.js の audio で指定したファイルがあれば、演出開始と同時に再生する。
   無ければ（読み込みエラー）合成音にフォールバックする。音源の自動取得はしない。
   ========================================================= */
(function () {
  const clips = {};   // id -> { el, ok }
  let muted = false;

  function preload() {
    NOMI.PUCHUN.forEach(p => {
      if (!p.audio || clips[p.id]) return;
      const el = new Audio();
      const c = { el, ok: false };
      el.preload = 'auto';
      el.addEventListener('canplaythrough', () => { c.ok = true; }, { once: true });
      el.addEventListener('error', () => { c.ok = false; }, { once: true });
      el.src = p.audio;
      clips[p.id] = c;
    });
  }

  const Clips = {
    preload,
    /** 音声ファイルが使えるか */
    has: (id) => !!(clips[id] && clips[id].ok),
    /** 再生。使えなければ false を返す（呼び出し側で合成音を鳴らす） */
    play(id, onEnd) {
      const c = clips[id];
      if (!c || !c.ok || muted) return false;
      try {
        c.el.currentTime = 0;
        c.el.onended = onEnd || null;
        const pr = c.el.play();
        if (pr && pr.catch) pr.catch(() => {});
        return true;
      } catch (e) { return false; }
    },
    playing: () => Object.values(clips).some(c => c.ok && !c.el.paused && !c.el.ended),
    stopAll() { Object.values(clips).forEach(c => { try { c.el.pause(); c.el.currentTime = 0; c.el.onended = null; } catch (e) {} }); },
    setMuted(m) { muted = m; if (m) Clips.stopAll(); },
    /** iOS の自動再生制限を解くため、最初の操作で無音再生しておく */
    unlock() {
      Object.values(clips).forEach(c => {
        try { c.el.muted = true; const pr = c.el.play(); if (pr && pr.then) pr.then(() => { c.el.pause(); c.el.currentTime = 0; c.el.muted = false; }).catch(() => { c.el.muted = false; }); } catch (e) {}
      });
    },
  };
  NOMI.Clips = Clips;
})();
