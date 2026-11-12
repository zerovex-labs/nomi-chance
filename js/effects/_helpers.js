/* =========================================================
   PEKA!! — effects/_helpers.js
   演出スクリプト共通の部品。
   演出は PEKA.FX.<id> = async (S, ctx) => {}  として各ファイルで登録する。
     S   : PEKA.Stage（演出API）
     ctx : { quick: QUICKモードか, teased: SLOT途中で前振りを行った回数 }
   終了時にランプが点灯していればよい（未点灯ならゲーム側で点灯させる）。
   PEKA.FX_TEASE.<id> = (S, step) => bool  は SLOT の途中ボタンで呼ばれる前振り。
   ========================================================= */
PEKA.FX = {};
PEKA.FX_TEASE = {};

PEKA.H = (function () {
  const P = PEKA.P, Snd = PEKA.Sound;
  const rand = P.rand, pick = P.pick;
  const H = {
    RAINBOW: ['#ff004c', '#ff9a00', '#ffe600', '#2bff6b', '#00c8ff', '#6a5bff', '#ff00d4'],
    GOLDS: ['#ffd54a', '#fff2a8', '#ffb300', '#ffffff'],
    easeIn: k => k * k * k,
    easeOut: k => 1 - Math.pow(1 - k, 3),
    easeInOut: k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2,
  };

  /** 一定時間、毎秒 perSec 個のペースで fn を呼ぶ */
  H.emit = (S, dur, perSec, fn) => {
    let acc = 0;
    return S.layer((c, s) => { acc += perSec * s.dt; while (acc >= 1) { acc--; fn(s); } }, dur);
  };

  /** 画面周辺のビネット（alphaFn(s) で濃さ） */
  H.vignette = (S, color, alphaFn, dur) => S.layer((c, s) => {
    const a = alphaFn(s); if (a <= 0.01) return;
    const g = c.createRadialGradient(s.W / 2, s.H / 2, Math.min(s.W, s.H) * 0.2, s.W / 2, s.H / 2, Math.max(s.W, s.H) * 0.75);
    g.addColorStop(0, P.rgba(color, 0)); g.addColorStop(1, P.rgba(color, Math.min(1, a)));
    c.fillStyle = g; c.fillRect(0, 0, s.W, s.H);
  }, dur);

  /** 上から降らせる */
  H.rain = (S, dur, perSec, opt) => H.emit(S, dur, perSec, () => P.add(Object.assign(
    { x: rand(-20, P.W + 20), y: -20, vx: rand(-40, 40), vy: rand(80, 200), ay: 60, life: 4, size: 6, fadeAt: 0.8 },
    typeof opt === 'function' ? opt() : opt)));

  /** プレミア共通の締め：ファンファーレ＋光の雨 */
  H.premium = (S, colors = H.GOLDS) => {
    Snd.fanfare();
    H.rain(S, 1600, 60, () => ({ type: pick(['star', 'glow']), color: pick(colors), size: rand(3, 9), vy: rand(150, 320), spin: rand(-4, 4) }));
  };

  /** プチュン（瞬間暗転） */
  H.puchun = async (S, hold = 0) => {
    Snd.bgmHold(true);   // フリーズ中はBGM完全停止（S.peka / settle で再開）
    Snd.puchun();
    S.curtain(1, 0);
    S.lamp(0);
    if (hold) await S.wait(hold);
  };

  /**
   * 復活の重低音＋同期する揺れ・衝撃波・バイブ（光と低音を同時に叩く）
   * 0.38秒後に余震（音の2発目に合わせて揺れと衝撃波をもう一度）
   */
  H.drop = (S, k = 1) => {
    Snd.drop(k);
    S.shake(1.3 * k, 750);
    S.ring({ color: '#ffffff', width: 60, life: 0.9, fill: true });
    if (navigator.vibrate && !S.calm) { try { navigator.vibrate([140, 230, 220]); } catch (e) {} }
    setTimeout(() => {
      S.shake(0.9 * k, 650);
      S.ring({ color: '#ff3da6', width: 40, life: 1.1, fill: true });
    }, 380);
  };

  /** 暗転からの復活：重低音ドロップ・幕を開ける・スロー・告知 */
  H.revive = (S, o = {}) => {
    H.drop(S, o.power >= 2 ? 1.2 : 1);
    S.curtain(0, o.fade ?? 80);
    S.slow(o.slow ?? 0.35, o.slowDur ?? 600);
    return S.peka(Object.assign({ power: 1.6, rings: 3 }, o));
  };

  /** 中心から放射状のヒビ */
  H.cracks = (cx, cy, n) => {
    const out = [], len = Math.hypot(P.W, P.H);
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + rand(-0.2, 0.2), pts = [[cx, cy]];
      for (let d = 0; d < len; d += rand(30, 70)) pts.push([cx + Math.cos(a) * d + rand(-12, 12), cy + Math.sin(a) * d + rand(-12, 12)]);
      out.push(pts);
    }
    return out;
  };
  /** 折れ線を k(0..1) の割合まで描く */
  H.partial = (c, pts, k) => {
    const n = Math.min(pts.length, Math.max(2, Math.floor(pts.length * k)));
    c.beginPath(); for (let i = 0; i < n; i++) i ? c.lineTo(pts[i][0], pts[i][1]) : c.moveTo(pts[i][0], pts[i][1]); c.stroke();
  };
  H.tri = (s) => [rand(-s, s), rand(-s, s), rand(-s, s), rand(-s, s), rand(-s, s), rand(-s, s)];
  /** 画面全体にガラス片 */
  H.shards = (S, n, colors = ['rgba(200,230,255,.55)', 'rgba(255,255,255,.4)', 'rgba(255,170,220,.45)']) => {
    if (S.calm) n = Math.round(n * 0.5);
    for (let i = 0; i < n; i++) P.add({ type: 'shard', x: rand(0, P.W), y: rand(0, P.H), vx: rand(-200, 200), vy: rand(-300, 100), ay: 1400,
      spin: rand(-6, 6), life: rand(1, 1.8), size: 1, shape: H.tri(rand(14, 40)), color: pick(colors), fadeAt: 0.7 });
  };
  /** 周囲から中心へ吸い込まれる粒 */
  H.implode = (S, n, colors, k = 1500, r = [150, 500]) => {
    const c = S.center();
    for (let i = 0; i < n; i++) {
      const a = rand(0, 6.283), d = rand(r[0], r[1]);
      P.add({ x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d, pull: { x: c.x, y: c.y, k }, size: rand(2, 7), color: pick(colors), life: 1.6, fadeIn: 0.3 });
    }
  };
  /** ランプの一瞬のチラ光り */
  H.flick = async (S, ms) => {
    S.lamp(0.6); Snd.tick(true);
    const c = S.center();
    P.add({ x: c.x + c.w * 0.3, y: c.y - c.h * 0.3, type: 'star', size: 14, size1: 0, color: '#fff', life: 0.3 });
    await S.wait(ms); S.lamp(0);
  };
  /** 天から差す光の筋 */
  H.godRays = (S, dur, color = '#ffe08a') => S.layer((c, s) => {
    const a = s.p < 0.15 ? s.p / 0.15 : s.p > 0.85 ? (1 - s.p) / 0.15 : 1;
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const cx = s.W * (0.5 + Math.sin(i * 1.7 + s.t * 0.6) * 0.35), w = 40 + (i % 3) * 30;
      const gr = c.createLinearGradient(0, 0, 0, s.H);
      gr.addColorStop(0, P.rgba(color, 0.5 * a)); gr.addColorStop(1, P.rgba(color, 0));
      c.fillStyle = gr;
      c.beginPath(); c.moveTo(cx - w * 0.3, 0); c.lineTo(cx + w * 0.3, 0); c.lineTo(cx + w * 1.5, s.H); c.lineTo(cx - w * 1.5, s.H); c.fill();
    }
  }, dur);

  return H;
})();
