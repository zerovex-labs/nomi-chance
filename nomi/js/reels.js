/* =========================================================
   NOMI! CHANCE — reels.js  SLOT MODE の3リール
   表示だけを担当（抽選は game.js が3リール停止後に1回だけ行う）
   ========================================================= */
(function () {
  const SYMS = NOMI.REEL_SYMBOLS, L = SYMS.length;
  const reelEls = [...document.querySelectorAll('.reel')];
  const R = reelEls.map(el => ({ el, strip: el.querySelector('.strip'), y: 0, spin: false, anim: null }));
  let h = 50, raf = 0, last = 0;

  function build() {
    R.forEach((r, i) => {
      // 2周分＋3コマ（表示窓ぶん）を並べ、y を 0..L*h で回す
      const list = SYMS.concat(SYMS, SYMS.slice(0, 3));
      r.strip.innerHTML = list.map(s => `<div class="sym">${s}</div>`).join('');
      r.y = Math.floor(Math.random() * L) * measure();
      draw(r);
    });
  }
  function measure() {
    const s = R[0].strip.querySelector('.sym');
    const v = s ? s.getBoundingClientRect().height : 0;
    if (v > 0) h = v;
    return h;
  }
  function draw(r) { r.strip.style.transform = `translateY(${-r.y}px)`; }
  const wrap = (y) => { const T = L * h; return ((y % T) + T) % T; };

  function loop(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    let busy = false;
    R.forEach(r => {
      if (r.spin) { r.y = wrap(r.y - h * 17 * dt); draw(r); busy = true; }
      else if (r.anim) {
        const a = r.anim, k = Math.min(1, (now - a.t0) / a.dur);
        // 少し行き過ぎて戻る停止アニメーション
        const e = k < 0.7 ? (k / 0.7) * 1.12 : 1.12 - 0.12 * ((k - 0.7) / 0.3);
        r.y = wrap(a.from + (a.to - a.from) * e); draw(r);
        if (k >= 1) { r.y = wrap(a.to); draw(r); const d = a.done; r.anim = null; d && d(); } else busy = true;
      }
    });
    raf = busy ? requestAnimationFrame(loop) : 0;
  }
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }

  /** 中央（ペイライン）の図柄 */
  function center(i) { const k = Math.round(R[i].y / h) % L; return SYMS[(k + 1) % L]; }

  const Reels = {
    init() { measure(); build(); window.addEventListener('resize', () => { const old = h; measure(); if (old !== h) R.forEach(r => { r.y = Math.round(r.y / old) * h; draw(r); }); }); },
    /** 3リールを回し始める */
    spinAll() {
      measure();
      R.forEach(r => { r.spin = true; r.anim = null; r.el.classList.remove('stopped', 'win'); });
      kick();
    },
    spinning: (i) => R[i].spin,
    anySpinning: () => R.some(r => r.spin || r.anim),
    /** i番目のリールを止める（停止アニメーション完了で resolve） */
    stop(i) {
      const r = R[i];
      if (!r.spin) return Promise.resolve();
      r.spin = false;
      const k = Math.floor(r.y / h);         // 進行方向（y減少）で次のコマ
      return new Promise(res => {
        r.anim = { from: r.y, to: k * h, t0: performance.now(), dur: 170, done: () => { r.el.classList.add('stopped'); res(); } };
        kick();
      });
    },
    center,
    /** 指定の図柄を中央に置く */
    setCenter(i, sym) {
      const r = R[i], idx = SYMS.indexOf(sym);
      r.spin = false; r.anim = null;
      r.y = wrap(((idx - 1 + L) % L) * h); draw(r);
    },
    /** ハズレなのに3つ揃ってしまった場合は3つ目を1コマずらす（すべり） */
    avoidTriple() {
      if (center(0) === center(1) && center(1) === center(2)) {
        const r = R[2];
        return new Promise(res => { r.anim = { from: r.y, to: r.y - h, t0: performance.now(), dur: 140, done: res }; kick(); });
      }
      return Promise.resolve();
    },
    /** 当選表示：3つとも HIT_SYMBOL にそろえて光らせる */
    showHit() { R.forEach((r, i) => { Reels.setCenter(i, NOMI.HIT_SYMBOL); r.el.classList.add('stopped', 'win'); }); },
    /** 全停止（モード切替時など） */
    halt() { R.forEach(r => { r.spin = false; r.anim = null; r.el.classList.remove('stopped', 'win'); r.y = Math.round(r.y / h) * h; draw(r); }); },
  };
  NOMI.Reels = Reels;
})();
