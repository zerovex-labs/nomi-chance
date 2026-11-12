/* =========================================================
   PEKA!! — particles.js
   全画面Canvasの描画エンジン：パーティクル / 衝撃波 / 描画レイヤー
   timeScale によるスローモーション、描画が無い時はループ停止
   ========================================================= */
(function () {
  const cv = document.getElementById('cv');
  const g = cv.getContext('2d');
  const weak = (navigator.hardwareConcurrency || 4) <= 4;
  const CAP = weak ? 900 : 1600;
  let W = 0, H = 0, raf = 0, prev = 0;
  const parts = [], rings = [], layers = [];

  const P = { timeScale: 1, weak, get W() { return W; }, get H() { return H; } };
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[(Math.random() * a.length) | 0];
  P.rand = rand; P.pick = pick;

  function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, weak ? 1.5 : 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', fit);
  fit();

  /** '#rrggbb' → rgba() */
  function rgba(c, a) {
    if (c[0] !== '#') return c;
    let h = c.slice(1); if (h.length === 3) h = [...h].map(x => x + x).join('');
    const n = parseInt(h, 16);
    return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
  }
  P.rgba = rgba;

  // 発光スプライト（色ごとにキャッシュ、shadowBlurより高速）
  const glowCache = {};
  function glow(color) {
    if (glowCache[color]) return glowCache[color];
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.18, color);
    gr.addColorStop(0.45, rgba(color, 0.35));
    gr.addColorStop(1, rgba(color, 0));
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    return (glowCache[color] = c);
  }
  P.glow = glow;

  function start() { if (!raf) { prev = performance.now(); raf = requestAnimationFrame(frame); } }

  function frame(now) {
    // rAFの時刻は開始時の performance.now() より前になり得るので 0 未満にしない
    const dt = Math.max(0, Math.min(0.05, (now - prev) / 1000)) * P.timeScale;
    prev = now;
    try { render(dt); } catch (e) { console.error('[PEKA] render', e); }
    if (parts.length || rings.length || layers.length) raf = requestAnimationFrame(frame);
    else { raf = 0; g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H); }
  }

  function render(dt) {
    g.clearRect(0, 0, W, H);
    runLayers(false, dt);

    g.globalCompositeOperation = 'lighter';
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.t += dt;
      const k = r.t / r.life;
      if (k >= 1) { rings.splice(i, 1); continue; }
      const rad = Math.max(0, r.r0 + (r.max - r.r0) * (1 - Math.pow(1 - k, 3)));
      g.globalAlpha = (1 - k) * r.alpha;
      g.strokeStyle = r.color;
      g.lineWidth = Math.max(0.5, r.width * (1 - k * 0.8));
      g.beginPath(); g.ellipse(r.x, r.y, rad, rad * r.squash, 0, 0, Math.PI * 2); g.stroke();
      if (r.fill) { g.globalAlpha = (1 - k) * 0.22 * r.alpha; g.fillStyle = r.color; g.fill(); }
    }

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      if (p.t >= p.life) { parts[i] = parts[parts.length - 1]; parts.pop(); continue; }
      if (p.pull) {
        const dx = p.pull.x - p.x, dy = p.pull.y - p.y, d = Math.hypot(dx, dy) || 1;
        p.vx += dx / d * p.pull.k * dt; p.vy += dy / d * p.pull.k * dt;
        if (d < 12) p.t = p.life;
      }
      p.vx += p.ax * dt; p.vy += p.ay * dt;
      if (p.drag) { const f = Math.pow(1 - p.drag, dt * 60); p.vx *= f; p.vy *= f; }
      p.ox = p.x; p.oy = p.y;
      p.x += p.vx * dt + (p.sway ? Math.sin(p.t * p.sway + p.seed) * 40 * dt : 0);
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      draw(p);
    }

    runLayers(true, dt);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  function runLayers(top, dt) {
    for (let i = layers.length - 1; i >= 0; i--) {
      const L = layers[i];
      if (L.top !== top) continue;
      L.t += dt;
      let alive = !L.dead;
      if (alive) {
        g.save();
        try { alive = L.fn(g, { t: L.t, dt, p: L.dur ? Math.min(1, L.t / L.dur) : 0, W, H }) !== false; }
        catch (e) { console.error(e); alive = false; }
        g.restore();
      }
      if (L.dur && L.t >= L.dur) alive = false;
      if (!alive) layers.splice(i, 1);
    }
  }

  function draw(p) {
    const k = p.t / p.life;
    let a = p.alpha * (p.fadeIn ? Math.min(1, p.t / p.fadeIn) : 1);
    if (k > p.fadeAt) a *= 1 - (k - p.fadeAt) / (1 - p.fadeAt);
    if (a <= 0.01) return;
    const s = p.size + (p.size1 - p.size) * k;
    g.globalAlpha = a;
    g.globalCompositeOperation = p.blend;
    switch (p.type) {
      case 'glow': { const im = glow(p.color); g.drawImage(im, p.x - s, p.y - s, s * 2, s * 2); break; }
      case 'spark': {
        g.strokeStyle = p.color; g.lineWidth = Math.max(0.6, s * 0.35); g.lineCap = 'round';
        const L = p.trail || 3;
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - (p.x - p.ox) * L, p.y - (p.y - p.oy) * L); g.stroke();
        break;
      }
      case 'star': {
        g.fillStyle = p.color; g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.beginPath();
        for (let j = 0; j < 8; j++) { const r = j % 2 ? s * 0.22 : s, an = j * Math.PI / 4; g.lineTo(Math.cos(an) * r, Math.sin(an) * r); }
        g.closePath(); g.fill(); g.restore();
        break;
      }
      case 'petal': {
        g.fillStyle = p.color; g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
        g.scale(1, Math.abs(Math.cos(p.t * 4 + p.seed)) * 0.7 + 0.3);
        g.beginPath(); g.ellipse(0, 0, s, s * 0.6, 0, 0, Math.PI * 2); g.fill(); g.restore();
        break;
      }
      case 'feather': {
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot + Math.sin(p.t * 2 + p.seed) * 0.6);
        g.fillStyle = p.color; g.beginPath(); g.ellipse(0, 0, s * 0.35, s, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(200,220,255,.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -s); g.lineTo(0, s * 1.3); g.stroke();
        g.restore();
        break;
      }
      case 'shard': {
        g.fillStyle = p.color; g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1;
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.beginPath();
        g.moveTo(p.shape[0], p.shape[1]); g.lineTo(p.shape[2], p.shape[3]); g.lineTo(p.shape[4], p.shape[5]); g.closePath();
        g.fill(); g.stroke(); g.restore();
        break;
      }
      case 'coin': {
        g.save(); g.translate(p.x, p.y); g.scale(Math.cos(p.rot), 1);
        g.fillStyle = '#ffcc33'; g.beginPath(); g.arc(0, 0, s, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#a06800'; g.lineWidth = 2; g.stroke();
        g.fillStyle = '#fff6c0'; g.beginPath(); g.arc(-s * 0.3, -s * 0.3, s * 0.3, 0, Math.PI * 2); g.fill();
        g.restore();
        break;
      }
      case 'bubble': {
        g.strokeStyle = p.color; g.lineWidth = 1.5; g.beginPath(); g.arc(p.x, p.y, s, 0, Math.PI * 2); g.stroke();
        g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(p.x - s * 0.35, p.y - s * 0.35, s * 0.2, 0, Math.PI * 2); g.fill();
        break;
      }
      case 'confetti': {
        g.fillStyle = p.color; g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
        g.scale(1, Math.cos(p.t * 9 + p.seed));
        g.fillRect(-s / 2, -s / 4, s, s / 2); g.restore();
        break;
      }
      default: { g.fillStyle = p.color; g.beginPath(); g.arc(p.x, p.y, s, 0, Math.PI * 2); g.fill(); }
    }
  }

  const OPAQUE = { petal: 1, feather: 1, shard: 1, coin: 1, bubble: 1, confetti: 1 };

  /** パーティクル1つ */
  P.add = function (o) {
    if (parts.length >= CAP) return;
    parts.push({
      x: o.x, y: o.y, ox: o.x, oy: o.y, vx: o.vx || 0, vy: o.vy || 0, ax: o.ax || 0, ay: o.ay || 0, drag: o.drag || 0,
      t: 0, life: o.life || 1, size: o.size ?? 4, size1: o.size1 ?? o.size ?? 4,
      color: o.color || '#fff', type: o.type || 'glow', alpha: o.alpha ?? 1,
      blend: o.blend || (OPAQUE[o.type] ? 'source-over' : 'lighter'),
      rot: o.rot ?? rand(0, 6.28), spin: o.spin || 0, fadeIn: o.fadeIn || 0, fadeAt: o.fadeAt ?? 0.6,
      pull: o.pull || null, sway: o.sway || 0, seed: Math.random() * 10, trail: o.trail, shape: o.shape,
    });
    start();
  };

  /** 放射状バースト */
  P.burst = function (o) {
    const n = Math.round((o.count ?? 80) * (weak ? 0.6 : 1));
    const cols = o.colors || ['#fff'];
    const sp = o.speed || [200, 900], lf = o.life || [0.6, 1.6], sz = o.size || [3, 10], j = o.jitter || 0;
    for (let i = 0; i < n; i++) {
      const an = o.angle != null ? o.angle + rand(-(o.spread ?? 0.3), o.spread ?? 0.3) : rand(0, Math.PI * 2);
      const v = rand(sp[0], sp[1]);
      P.add({
        x: o.x + rand(-j, j), y: o.y + rand(-j * 0.6, j * 0.6),
        vx: Math.cos(an) * v, vy: Math.sin(an) * v, ay: o.gravity ?? 300, drag: o.drag ?? 0.03,
        life: rand(lf[0], lf[1]), size: rand(sz[0], sz[1]), size1: o.size1 ?? 0,
        color: pick(cols), type: o.type || pick(['glow', 'glow', 'spark']), spin: rand(-8, 8), trail: o.trail,
      });
    }
  };

  /** 衝撃波リング */
  P.ring = function (o) {
    rings.push({ x: o.x, y: o.y, r0: o.r0 || 10, max: o.max || Math.hypot(W, H), t: 0, life: o.life || 0.8,
      width: o.width || 20, color: o.color || '#fff', alpha: o.alpha ?? 1, squash: o.squash || 1, fill: !!o.fill });
    start();
  };

  /** 任意描画レイヤー：fn(ctx, {t, dt, p, W, H})。false を返すか dur(ms) 経過で終了 */
  P.layer = function (fn, dur, top) {
    const L = { fn, dur: dur ? dur / 1000 : 0, t: 0, top: !!top, dead: false };
    layers.push(L); start();
    return { stop() { L.dead = true; } };
  };

  /** ジグザグ線（稲妻） */
  P.bolt = function (x0, y0, x1, y1, rough = 40, depth = 6) {
    let pts = [[x0, y0], [x1, y1]], r = rough;
    for (let d = 0; d < depth; d++) {
      const np = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
        np.push([ax, ay], [(ax + bx) / 2 + rand(-r, r), (ay + by) / 2 + rand(-r, r) * 0.4]);
      }
      np.push(pts[pts.length - 1]); pts = np; r *= 0.55;
    }
    return pts;
  };
  /** 発光する線 */
  P.beam = function (c, pts, color, w) {
    c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; c.lineCap = 'round';
    const path = () => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); };
    c.strokeStyle = rgba(color, 0.25); c.lineWidth = w * 5; path();
    c.strokeStyle = color; c.lineWidth = w; path();
    c.strokeStyle = '#fff'; c.lineWidth = Math.max(1, w * 0.35); path();
  };

  P.clear = function () {
    parts.length = 0; rings.length = 0;
    layers.forEach(L => L.dead = true); layers.length = 0;
    P.timeScale = 1;
    g.clearRect(0, 0, W, H);
  };

  PEKA.P = P;
})();
