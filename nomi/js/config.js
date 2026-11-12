/* =========================================================
   NOMI! CHANCE — config.js
   ゲームの設定値と、プチュン（ブラックアウト）演出の登録表。
   ★ 確率・初期プレイヤー・演出の追加/重みはこのファイルで調整できます。
   ========================================================= */
window.PEKA = window.PEKA || {};   // PEKA!! の共通エンジン（sound / particles / stage）用
window.NOMI = window.NOMI || {};

NOMI.MIN_PLAYERS = 2;
NOMI.MAX_PLAYERS = 20;
NOMI.DEFAULT_PLAYERS = ['たろう', 'じろう', 'はなこ', 'ゆうた', 'りょう'];

/** 当選確率（分母） */
NOMI.ODDS = {
  easy:   { label: 'EASY',   n: 5 },
  normal: { label: 'NORMAL', n: 10 },
  hard:   { label: 'HARD',   n: 20 },
};
NOMI.DEFAULT_ODDS = 'hard';
NOMI.DEFAULT_MODE = 'chance';            // 'chance' | 'slot'
NOMI.MODE_LABEL = { chance: 'CHANCE MODE', slot: 'SLOT MODE' };

NOMI.MISS_SHOW_MS = 1000;                // ハズレ表示の時間（この間は次の抽選を受け付けない）
NOMI.FEVER_MS = 8000;                    // 暗転解除後のレインボー演出
NOMI.FEVER_SKIP_MS = 1000;               // レインボー開始から何ms後にタップで飛ばせるか

/**
 * SLOT MODE：当選時に何番目の停止でプチュンするかの重み [第1停止, 第2停止, 第3停止]
 * 抽選は第1停止の瞬間に1回だけ行い、当選ならこの重みで発生する停止を決める。
 */
NOMI.SLOT_PUCHUN_STOP = [1, 1, 2];

/** SLOT MODE のリール図柄。当選時は HIT_SYMBOL が3つ揃う */
NOMI.REEL_SYMBOLS = ['🍺', '🍶', '🍷', '🥃', '🍋', '🍒', '⭐'];
NOMI.HIT_SYMBOL = '🍺';

/*
  プチュン（ブラックアウト）演出の登録表
  ---------------------------------------------------------
  当選時は 100% この中から抽選する（weight の比率。weight: 0 の演出は出現しない）。
  id     : js/puchun/<id>.js で NOMI.FX.<id> として登録する演出スクリプト
  name   : 履歴などに表示する名前
  audio  : 演出の開始と同時に再生する音声ファイル（任意）。
           ファイルが無ければ合成音で鳴る。実機の音源は自動取得しない。
           利用する権利のある音声を nomi/audio/ に置いてください（audio/README.md 参照）。
  inspiredBy : 雰囲気の参考（メモ。画面には表示しない）。演出・音はすべてオリジナル。
  演出を追加するときは、この表に1行足して js/puchun/<id>.js を作り、index.html で読み込む。
*/
NOMI.PUCHUN = [
  { id: 'jikki',     name: 'BLACKOUT FLASH', weight: 1, audio: 'audio/jikki.mp3',
    desc: '当選の瞬間に白紫の鋭い十字閃光と細い水平光線 → 中心へ縮んで完全暗転 → 約1.5秒の闇 → 全画面ホワイトフラッシュ → レインボー' },
  // ↓ 以下の4種は weight: 0（出現しない）で保持。数値を1以上にすると抽選に戻る
  { id: 'bluecross', name: 'BLUE CROSS',     weight: 0, audio: 'audio/bluecross.mp3', inspiredBy: 'リコリス・リコイル',
    desc: '白い閃光 → 青白い巨大十字フレアが星になって消える → 赤い告知 → 色の連打 → 虹の光の奔流' },
  { id: 'crimson',   name: 'CRIMSON GLITCH', weight: 0, audio: 'audio/crimson.mp3',   inspiredBy: '革命機ヴァルヴレイヴ',
    desc: '暗転 → 静寂 → 赤い走査線とデジタルノイズ → 再暗転 → 真紅の横一閃で虹色に爆発' },
  { id: 'zan',       name: '斬 -ZAN-',        weight: 0, audio: 'audio/zan.mp3',       inspiredBy: '新鬼武者3',
    desc: '暗転 → 静寂に金の火の粉 → 鋭い一太刀が闇を斬り裂き、裂け目から光があふれる' },
  { id: 'violet',    name: 'VIOLET FLARE',   weight: 0, audio: 'audio/violet.mp3',    inspiredBy: 'モンスターハンターライズ',
    desc: '暗転 → 静寂 → 青紫のもやに横長の刃のような閃光が育ち、急拡大して虹色に爆発' },
];

NOMI.PUCHUN_MAP = Object.fromEntries(NOMI.PUCHUN.map(p => [p.id, p]));
/** r: 0..1 の乱数で演出を1つ選ぶ */
NOMI.pickPuchun = function (r) {
  const total = NOMI.PUCHUN.reduce((s, p) => s + p.weight, 0);
  let x = r * total;
  for (const p of NOMI.PUCHUN) if ((x -= p.weight) < 0) return p;
  return NOMI.PUCHUN[NOMI.PUCHUN.length - 1];
};
NOMI.FX = {};
