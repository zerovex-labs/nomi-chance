/* =========================================================
   PEKA!! — sound.js
   Web Audio API による完全オリジナル合成サウンド（音源ファイル不使用）
   ========================================================= */
(function () {
  let ac = null, out = null, sfx = null, bgm = null, dry = null, verb = null, crunch = null, noiseBuf = null;
  let sfxVol = 0.8, bgmVol = 0.5, bgmOn = true, muted = false, hushed = false;
  let bgmHeld = false, bgmDuck = 1, bgmAway = false;
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  function boot() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();

    // [効果音 sfx] と [BGM bgm] を別々の音量で → master(out：ミュート/無音演出) → limiter → 出力
    out = ac.createGain();
    const lim = ac.createDynamicsCompressor();
    lim.threshold.value = -9; lim.knee.value = 6; lim.ratio.value = 12; lim.attack.value = 0.002; lim.release.value = 0.2;
    out.connect(lim).connect(ac.destination);
    sfx = ac.createGain(); sfx.connect(out);
    bgm = ac.createGain(); bgm.gain.value = 0; bgm.connect(out);
    dry = ac.createGain(); dry.connect(sfx);

    // 1.2秒分のホワイトノイズ
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 1.2, ac.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    // 生成インパルスのリバーブ
    verb = ac.createConvolver();
    const len = Math.floor(ac.sampleRate * 2.2);
    const ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = ir.getChannelData(c);
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8);
    }
    verb.buffer = ir;
    const vg = ac.createGain(); vg.gain.value = 0.32;
    verb.connect(vg).connect(sfx);

    // 重低音用サチュレーション
    crunch = ac.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) curve[i] = Math.tanh((i / 512 - 1) * 3.2);
    crunch.curve = curve;
    crunch.connect(dry);

    level(false);
    if (ac.state === 'suspended') ac.resume();
  }

  function ramp(param, v, tc) { const t = ac.currentTime; param.cancelScheduledValues(t); param.setTargetAtTime(v, t, tc); }
  function level(fast) {
    if (!out) return;
    ramp(out.gain, muted || hushed ? 0 : 1, fast ? 0.004 : 0.03);
    ramp(sfx.gain, sfxVol, 0.03);
    const bv = bgmOn && !bgmHeld && !bgmAway ? bgmVol * bgmDuck : 0;
    ramp(bgm.gain, bv, bgmHeld ? 0.002 : 0.12);   // フリーズ時は即カット
  }

  // ---------- 合成プリミティブ ----------
  function envelope(g, t0, peak, atk, dur, rel) {
    peak = Math.max(peak, 0.0002);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
    g.gain.setValueAtTime(peak, t0 + Math.max(atk, dur - rel));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  }
  function route(g, o) {
    g.connect(o.drive ? crunch : dry);
    if (o.wet) { const s = ac.createGain(); s.gain.value = o.wet; g.connect(s).connect(verb); }
  }
  /** 発振器 */
  function osc(type, f0, dur, o = {}) {
    const t0 = ac.currentTime + (o.at || 0);
    const v = ac.createOscillator();
    v.type = type;
    v.frequency.setValueAtTime(f0, t0);
    if (o.to) v.frequency.exponentialRampToValueAtTime(o.to, t0 + (o.glide || dur));
    if (o.detune) v.detune.value = o.detune;
    if (o.vib) {
      const l = ac.createOscillator(), lg = ac.createGain();
      l.frequency.value = o.vib; lg.gain.value = o.vibAmt || f0 * 0.015;
      l.connect(lg).connect(v.frequency); l.start(t0); l.stop(t0 + dur + 0.05);
    }
    const g = ac.createGain();
    envelope(g, t0, o.vol ?? 0.3, o.atk ?? 0.005, dur, o.rel ?? dur * 0.7);
    let n = v;
    if (o.lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; f.Q.value = o.q || 0.7; n.connect(f); n = f; }
    n.connect(g); route(g, o);
    v.start(t0); v.stop(t0 + dur + 0.05);
  }
  /** フィルタードノイズ */
  function noise(dur, o = {}) {
    const t0 = ac.currentTime + (o.at || 0);
    const s = ac.createBufferSource();
    s.buffer = noiseBuf; s.loop = true;
    const f = ac.createBiquadFilter();
    f.type = o.type || 'lowpass';
    f.frequency.setValueAtTime(o.f || 1000, t0);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    f.Q.value = o.q || 0.8;
    const g = ac.createGain();
    envelope(g, t0, o.vol ?? 0.3, o.atk ?? 0.005, dur, o.rel ?? dur * 0.8);
    s.connect(f).connect(g); route(g, o);
    s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
  }

  // ---------- サウンドライブラリ ----------
  const L = {
    /** ボタン操作音 */
    press() {
      osc('square', 1250, 0.05, { to: 480, vol: 0.12, rel: 0.04 });
      noise(0.03, { type: 'highpass', f: 3200, vol: 0.12 });
    },
    /** 変化したボタン音（澄んだベル） */
    pressAlt() {
      osc('sine', 2637, 0.55, { vol: 0.24, wet: 0.6 });
      osc('sine', 3951, 0.42, { vol: 0.14, wet: 0.6, at: 0.02 });
      osc('triangle', 1760, 0.12, { to: 3520, vol: 0.14 });
    },
    /** メインの告知音「ペカッ」 */
    peka(pitch = 0) {
      const p = Math.pow(2, pitch / 12);
      osc('square', 520 * p, 0.09, { to: 2700 * p, vol: 0.13, lp: 5200 });
      [76, 80, 83, 88, 92].forEach((n, i) => {
        osc('triangle', midi(n) * p, 0.95, { at: 0.03 + i * 0.034, vol: 0.16, wet: 0.5, rel: 0.85 });
        osc('sine', midi(n + 12) * p, 0.6, { at: 0.03 + i * 0.034, vol: 0.06, wet: 0.6 });
      });
      osc('sine', 125, 0.6, { to: 40, glide: 0.5, vol: 0.7 });
    },
    /** やわらかい告知音 */
    soft() { [72, 76, 79, 84].forEach((n, i) => osc('sine', midi(n), 1.5, { at: i * 0.08, vol: 0.14, atk: 0.05, wet: 0.85 })); },
    /** 重低音 */
    bass(k = 1) {
      osc('sine', 92, 1.2 * k, { to: 27, glide: 0.9 * k, vol: 0.9, drive: true });
      noise(0.25, { f: 420, to: 60, vol: 0.5 * k });
    },
    /** フリーズ後の衝撃音 */
    impact(k = 1) {
      L.bass(k);
      noise(1.4 * k, { f: 6500, to: 200, vol: 0.45, wet: 0.5 });
      osc('sawtooth', 165, 0.5, { to: 40, vol: 0.25, lp: 900, drive: true });
    },
    /**
     * プチュン復活専用の重低音ドロップ。
     * スマホのスピーカーは100Hz以下がほぼ出ないため、
     * ①超低音(イヤホン/外部SP用) ②歪ませた倍音(スマホでも聞こえる帯域の重さ)
     * ③アタックのキック ④0.38秒後の余震 ⑤長い地鳴りの尾 を重ねる。
     */
    drop(k = 1) {
      // ① 超低音：55Hz → 26Hz にゆっくり沈む
      osc('sine', 55, 2.6 * k, { to: 26, glide: 2.2 * k, vol: 1.0, atk: 0.004, rel: 2.0 * k });
      // ② 倍音の重さ：110Hz帯をサチュレーションで太く（スマホ用）
      osc('sine', 110, 1.6 * k, { to: 48, glide: 1.3 * k, vol: 0.85, atk: 0.004, drive: true });
      osc('sawtooth', 82, 1.4 * k, { to: 36, glide: 1.2 * k, vol: 0.4, lp: 380, drive: true });
      // ③ アタック：胸を打つキック＋破裂ノイズ
      osc('sine', 190, 0.18, { to: 45, glide: 0.14, vol: 1.0, drive: true });
      noise(0.5, { f: 1600, to: 70, vol: 0.85, drive: true });
      noise(0.08, { type: 'highpass', f: 2500, vol: 0.4 });
      // ④ 余震（2発目）
      osc('sine', 150, 0.2, { at: 0.38, to: 40, glide: 0.16, vol: 0.8, drive: true });
      osc('sine', 60, 1.4, { at: 0.38, to: 30, glide: 1.2, vol: 0.7 });
      // ⑤ 地鳴りの尾
      noise(3.2 * k, { f: 220, to: 50, vol: 0.55, atk: 0.05, rel: 2.6 * k, drive: true, wet: 0.4 });
    },
    boom(k = 1) { L.impact(k * 1.3); noise(2.4 * k, { f: 2200, to: 80, vol: 0.6, wet: 0.6, drive: true }); },
    /** プチュン音 */
    puchun() {
      osc('square', 3300, 0.09, { to: 170, vol: 0.25, lp: 6000 });
      osc('sine', 1250, 0.16, { to: 38, vol: 0.5 });
      noise(0.04, { type: 'highpass', f: 5000, vol: 0.3 });
    },
    /** プレミア専用ファンファーレ */
    fanfare() {
      const brass = (n, at, dur, v = 0.12) => {
        osc('sawtooth', midi(n), dur, { at, vol: v, lp: 2700, atk: 0.02, vib: 6, wet: 0.35 });
        osc('sawtooth', midi(n), dur, { at, vol: v * 0.7, lp: 2700, atk: 0.02, detune: 12, wet: 0.35 });
      };
      [0, 0.13, 0.26].forEach(t => brass(72, t, 0.12));
      brass(76, 0.39, 0.12); brass(79, 0.55, 0.25); brass(76, 0.82, 0.12); brass(79, 0.95, 0.12);
      [72, 76, 79, 84].forEach(n => brass(n, 1.1, 1.7, 0.09));
      [0, 0.55, 1.1].forEach(t => { osc('sine', 110, 0.4, { at: t, to: 50, vol: 0.6 }); noise(0.3, { at: t, f: 3000, to: 400, vol: 0.15 }); });
      L.shimmer(1.2, 1.1);
    },
    heartbeat(k = 1) {
      osc('sine', 72, 0.16, { to: 38, vol: 0.95 * k, drive: true });
      osc('sine', 62, 0.16, { to: 34, vol: 0.6 * k, at: 0.2, drive: true });
    },
    whoosh(dur = 0.6, up = true) { noise(dur, { type: 'bandpass', f: up ? 300 : 4500, to: up ? 5500 : 200, q: 2, vol: 0.35, atk: dur * 0.6 }); },
    riser(dur = 1.5) {
      osc('sawtooth', 120, dur, { to: 1900, vol: 0.14, lp: 3000, atk: dur * 0.8, rel: 0.05 });
      noise(dur, { type: 'bandpass', f: 400, to: 8000, q: 1.5, vol: 0.25, atk: dur * 0.9, rel: 0.05 });
    },
    thunder() {
      noise(0.12, { type: 'highpass', f: 2000, vol: 0.6 });
      noise(1.8, { f: 800, to: 60, vol: 0.7, at: 0.05, drive: true });
      osc('sine', 50, 1.2, { to: 30, vol: 0.6 });
    },
    laser() { osc('sawtooth', 3100, 0.35, { to: 140, vol: 0.18, lp: 5000 }); osc('square', 1500, 0.3, { to: 3000, vol: 0.06 }); },
    shimmer(dur = 1, at = 0) { for (let i = 0; i < 14; i++) osc('sine', 2000 + Math.random() * 4200, 0.3, { at: at + Math.random() * dur, vol: 0.05, wet: 0.9 }); },
    tick(hi) { osc('square', hi ? 1500 : 900, 0.04, { vol: 0.12 }); },
    clock() { noise(0.03, { type: 'bandpass', f: 3500, q: 4, vol: 0.5 }); osc('sine', 2200, 0.05, { vol: 0.08 }); },
    glitch(dur = 0.5) { for (let t = 0; t < dur; t += 0.04) osc('square', 100 + Math.random() * 2000, 0.03, { at: t, vol: 0.1 }); },
    static(dur = 1.5) { noise(dur, { type: 'bandpass', f: 3000, q: 0.5, vol: 0.35, atk: 0.01, rel: 0.02 }); },
    choir(dur = 2.5) {
      [57, 61, 64, 69, 73].forEach(n => {
        osc('sawtooth', midi(n), dur, { vol: 0.05, lp: 1800, atk: 0.6, vib: 5, wet: 1 });
        osc('sine', midi(n + 12), dur, { vol: 0.04, atk: 0.8, wet: 1 });
      });
    },
    drone(dur = 2) {
      [33, 34, 45].forEach(n => osc('sawtooth', midi(n), dur, { vol: 0.16, lp: 600, atk: 0.4, drive: true, vib: 3 }));
      noise(dur, { f: 300, vol: 0.25, atk: 0.5 });
    },
    roar() { osc('sawtooth', 90, 1.4, { to: 50, vol: 0.35, lp: 900, drive: true, vib: 18, vibAmt: 20 }); noise(1.3, { f: 1200, to: 200, vol: 0.4, drive: true }); },
    coin(i = 0) { osc('square', midi(83 + (i % 3)), 0.06, { vol: 0.08 }); osc('square', midi(88 + (i % 3)), 0.25, { at: 0.06, vol: 0.08, wet: 0.3 }); },
    glass() {
      noise(0.6, { type: 'highpass', f: 4000, vol: 0.4, wet: 0.5 });
      for (let i = 0; i < 10; i++) osc('sine', 3000 + Math.random() * 5000, 0.2, { at: Math.random() * 0.5, vol: 0.06, wet: 0.5 });
    },
    crack() { noise(0.08, { type: 'highpass', f: 2500, vol: 0.5 }); osc('square', 200, 0.05, { to: 60, vol: 0.2 }); },
    rewind(dur = 1.2) {
      noise(dur, { type: 'highpass', f: 1500, vol: 0.35, atk: dur * 0.95, rel: 0.02 });
      osc('sine', 200, dur, { to: 1600, vol: 0.15, atk: dur * 0.9, rel: 0.02 });
    },
    boo() { osc('square', 392, 0.25, { vol: 0.08, lp: 1500 }); osc('square', 294, 0.5, { at: 0.28, vol: 0.08, lp: 1500 }); },
    error() { [0, 0.18, 0.36].forEach(t => osc('square', 220, 0.12, { at: t, vol: 0.12, lp: 2000 })); },
    beep(hi) { osc('sine', hi ? 1760 : 880, 0.12, { vol: 0.2 }); },
    rumble(dur = 2) { noise(dur, { f: 120, vol: 0.7, atk: dur * 0.8, rel: 0.1, drive: true }); osc('sine', 40, dur, { to: 70, vol: 0.5, atk: dur * 0.8, rel: 0.1 }); },
    fire(dur = 1.5) { noise(dur, { f: 900, vol: 0.35, atk: 0.2, drive: true }); for (let i = 0; i < 12; i++) noise(0.02, { at: Math.random() * dur, type: 'highpass', f: 3000, vol: 0.25 }); },
    harp() { [60, 64, 67, 72, 76, 79, 84, 88, 91, 96].forEach((n, i) => osc('triangle', midi(n), 0.8, { at: i * 0.05, vol: 0.08, wet: 0.8 })); },
    step(i) { osc('triangle', midi(76 + i * 2), 0.12, { vol: 0.15 }); },
    found() { [84, 88, 91, 96].forEach((n, i) => osc('square', midi(n), 0.18, { at: i * 0.07, vol: 0.06, lp: 4000, wet: 0.4 })); L.shimmer(0.6, 0.25); },
    hum(dur = 1) { osc('sine', 220, dur, { vol: 0.1, atk: dur * 0.5 }); osc('sine', 330, dur, { vol: 0.06, atk: dur * 0.5 }); },
    whine(dur = 1) { osc('sine', 3520, dur, { vol: 0.07, atk: dur * 0.8, rel: 0.05 }); osc('sine', 3560, dur, { vol: 0.05, atk: dur * 0.8, rel: 0.05 }); },
  };

  /* =====================================================
     BGM：オリジナル8小節ループ（Cメジャー / 138BPM）
     C - Am - F - G ×2。メロディ・オクターブベース・裏拍コード・ドラム。
     先読みスケジューラで切れ目なくループする。
     ===================================================== */
  const BPM = 138, EIGHTH = 60 / BPM / 2, LOOP = 64;   // 8小節 × 8分音符8個
  // [MIDIノート or null, 8分音符の長さ] 各小節の合計は 8
  const MELODY = [
    [[76, 1], [79, 1], [84, 1], [79, 1], [81, 1], [79, 1], [76, 2]],
    [[72, 1], [76, 1], [81, 2], [79, 1], [76, 1], [74, 2]],
    [[77, 1], [81, 1], [84, 2], [81, 1], [77, 1], [79, 1], [81, 1]],
    [[83, 2], [81, 1], [79, 1], [74, 2], [null, 2]],
    [[76, 1], [79, 1], [84, 1], [86, 1], [88, 2], [86, 1], [84, 1]],
    [[81, 2], [84, 1], [81, 1], [79, 2], [76, 2]],
    [[77, 1], [79, 1], [81, 1], [84, 1], [83, 1], [81, 1], [79, 1], [77, 1]],
    [[74, 1], [77, 1], [79, 1], [83, 1], [86, 4]],
  ];
  const CHORDS = [[60, 64, 67], [57, 60, 64], [57, 60, 65], [55, 59, 62]];   // C Am F G
  const ROOTS = [36, 33, 41, 43];
  const melodyAt = new Array(LOOP).fill(null);
  MELODY.forEach((bar, b) => { let i = b * 8; bar.forEach(([n, len]) => { if (n) melodyAt[i] = [n, len]; i += len; }); });

  function bTone(type, f, t, dur, vol, lp) {
    const v = ac.createOscillator(), g = ac.createGain();
    v.type = type; v.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let n = v;
    if (lp) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; v.connect(fl); n = fl; }
    n.connect(g).connect(bgm);
    v.start(t); v.stop(t + dur + 0.02);
  }
  function bNoise(t, dur, vol, f, type = 'highpass') {
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; fl.type = type; fl.frequency.value = f;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl).connect(g).connect(bgm);
    s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
  function bKick(t) {
    const v = ac.createOscillator(), g = ac.createGain();
    v.frequency.setValueAtTime(130, t); v.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(0.55, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    v.connect(g).connect(bgm); v.start(t); v.stop(t + 0.2);
  }
  function playStep(i, t) {
    const bar = Math.floor(i / 8), beat = i % 8, chordIx = bar % 4;
    // ドラム
    if (beat % 2 === 0) bKick(t);
    if (beat === 2 || beat === 6) { bNoise(t, 0.12, 0.28, 1800, 'bandpass'); bTone('triangle', 190, t, 0.07, 0.12); }
    bNoise(t, beat % 2 ? 0.05 : 0.03, beat % 2 ? 0.07 : 0.045, 7000);
    if (bar === 7 && beat === 7) { bNoise(t, 0.08, 0.22, 1800, 'bandpass'); bNoise(t + EIGHTH / 2, 0.08, 0.26, 1800, 'bandpass'); }
    // ベース（オクターブで跳ねる）
    const root = ROOTS[chordIx];
    bTone('sawtooth', midi(beat % 2 ? root + 12 : root), t, EIGHTH * 0.9, 0.16, 700);
    // 裏拍のコードスタブ
    if (beat % 2 === 1) CHORDS[chordIx].forEach(n => bTone('square', midi(n), t, 0.09, 0.035, 2400));
    // メロディ（ほんのりビブラートのかかった矩形波＋1オクターブ上のきらめき）
    const m = melodyAt[i];
    if (m) {
      const dur = m[1] * EIGHTH * 0.92;
      bTone('square', midi(m[0]), t, dur, 0.075, 3200);
      bTone('triangle', midi(m[0] + 12), t, Math.min(dur, 0.25), 0.03);
    }
  }
  let bgmTimer = 0, bgmNext = 0, bgmStep = 0;
  function bgmTick() {
    while (bgmNext < ac.currentTime + 0.15) {
      playStep(bgmStep, bgmNext);
      bgmNext += EIGHTH;
      bgmStep = (bgmStep + 1) % LOOP;
    }
  }
  function bgmRun() {
    const want = ac && bgmOn && !bgmHeld && !bgmAway;
    if (want && !bgmTimer) { bgmNext = ac.currentTime + 0.06; bgmTimer = setInterval(bgmTick, 25); bgmTick(); }
    else if (!want && bgmTimer) { clearInterval(bgmTimer); bgmTimer = 0; }
    level();
  }

  const Sound = {
    boot() { boot(); bgmRun(); },
    get ready() { return !!ac; },
    get bgmPlaying() { return !!bgmTimer; },
    setVolume(v) { sfxVol = v; level(); },          // 効果音の音量
    setBgmVolume(v) { bgmVol = v; level(); },       // BGMの音量
    setBgmOn(on) { bgmOn = on; bgmRun(); },
    setMuted(m) { muted = m; level(); },            // 全体ミュート
    /** 無音演出用：一時的に全音を完全停止（鳴っている残響も即カット） */
    hush(on) { hushed = on; level(true); },
    /** プチュンフリーズ中は BGM を完全停止し、解除で再開 */
    bgmHold(on) { if (bgmHeld === on) return; bgmHeld = on; if (ac) { if (on) { level(); } bgmRun(); } },
    /** 演出中は効果音を引き立てるため BGM を下げる（1 = 通常） */
    bgmDuck(k) { bgmDuck = k; level(); },
    /** タブが裏に回ったら止める */
    bgmAway(on) { bgmAway = on; if (ac) bgmRun(); },
  };
  for (const k in L) Sound[k] = (...a) => { if (ac && !muted && !hushed) { try { L[k](...a); } catch (e) {} } };

  PEKA.Sound = Sound;
})();
