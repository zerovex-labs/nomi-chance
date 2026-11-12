/* =========================================================
   PEKA!! — config.js
   ゲームバランスと演出データ。★調整はこのファイルだけで完結します。
   ========================================================= */
window.PEKA = window.PEKA || {};

/** 設定1〜6の当選確率（分母）。毎ゲーム独立抽選・天井なし */
PEKA.ODDS = [300, 200, 150, 100, 50, 20];
PEKA.DEFAULT_LEVEL = 3;

/** 当選後のレインボーフィーバー演出の長さ（ミリ秒）。設定画面でON/OFF可 */
PEKA.FEVER_MS = 8000;
/** フィーバー開始からタップで飛ばせるようになるまで（ミリ秒）。誤タップ防止 */
PEKA.FEVER_SKIP_MS = 1000;

/**
 * 演出モード。当選時に「プチュン系グループ」が選ばれる割合。
 * 当選確率そのものはモードに関係なく ODDS で決まる。
 */
PEKA.FX_MODES = {
  normal: { name: '通常モード',     puchunShare: 0.01 },
  puchun: { name: 'プチュンモード', puchunShare: 0.50 },
};

PEKA.CATEGORIES = [
  { id: 'royal',  name: '王道系' },
  { id: 'psych',  name: '違和感・心理戦系' },
  { id: 'impact', name: '衝撃・爆発系' },
  { id: 'freeze', name: 'フリーズ・暗転系' },
  { id: 'color',  name: 'カラフル・特殊発光系' },
  { id: 'god',    name: '神・究極プレミア系' },
  { id: 'blackout', name: 'ブラックアウト系' },
];

/*
  演出テーブル
  ---------------------------------------------------------
  id      : 演出スクリプト名（js/effects/*.js の FX.<id>）
  weight  : 同じグループ内での相対的な出やすさ
  group   : 'puchun' = プチュン系 / 省略 = その他
  timing  : SLOT PEKA で告知が始まるボタン（1〜3）。1 = 先告知
  press   : そのゲームのボタン挙動 'mute'（無反応）/ 'alt'（音変化）
  tease   : true なら SLOT の途中ボタンで前振りを行う（FX_TEASE.<id>）
  premium : 図鑑で金枠表示
  fever   : 'always' なら設定に関係なく当選後レインボーを必ず再生
*/
PEKA.EFFECT_TABLE = [
  // ---------- 王道系 ----------
  { id: 'normal',   name: '通常ペカリ',     cat: 'royal', weight: 3000, timing: 3, desc: '最後のボタンでランプが点灯。いちばん基本の告知。' },
  { id: 'saki',     name: '先ペカリ',       cat: 'royal', weight: 900,  timing: 1, desc: '最初のボタンでいきなり点灯。光の粒がボタンからランプへ駆け上がる。' },
  { id: 'muon',     name: '無音ペカリ',     cat: 'royal', weight: 250,  timing: 3, silent: true, desc: '一切の音が消えたまま、ランプだけが静かに光る。' },
  { id: 'okure',    name: '遅れペカリ',     cat: 'royal', weight: 500,  timing: 3, desc: '何も起きずに終わったと思った頃、遅れて光る。' },
  { id: 'jiwa',     name: 'じわペカ',       cat: 'royal', weight: 300,  timing: 3, desc: 'ランプがじわじわ明るくなり、上昇音の頂点で全開になる。' },
  { id: 'fuwa',     name: 'ふわペカ',       cat: 'royal', weight: 300,  timing: 3, desc: '光の泡が舞い上がり、ランプがふんわり灯る。' },
  { id: 'tenmetsu', name: '点滅ペカリ',     cat: 'royal', weight: 300,  timing: 3, desc: 'リズムに合わせて点滅し、最後に点きっぱなしになる。' },
  { id: 'nidan',    name: '二段階ペカリ',   cat: 'royal', weight: 280,  timing: 3, tease: true, desc: 'まず半分だけ光り、一拍おいて全開で爆発する。' },
  { id: 'chira',    name: 'チラ見せペカリ', cat: 'royal', weight: 260,  timing: 3, tease: true, desc: '一瞬だけチラッと光って消え、焦らしてから点灯する。' },
  { id: 'gyakuten', name: '逆転ペカリ',     cat: 'royal', weight: 180,  timing: 3, desc: '冷たい青で光ったランプが裏返り、真紅に燃え上がる。' },

  // ---------- 違和感・心理戦系 ----------
  { id: 'noreact',   name: 'ボタン無反応',   cat: 'psych', weight: 160, timing: 3, press: 'mute', desc: 'ボタンを押しても音も手応えもない。その沈黙のあと光る。' },
  { id: 'altsound',  name: 'ボタン音変化',   cat: 'psych', weight: 160, timing: 3, press: 'alt',  desc: 'ボタン音がいつもと違う澄んだ音に変わり、点灯する。' },
  { id: 'blink',     name: 'ランプ一瞬消灯', cat: 'psych', weight: 140, timing: 3, desc: '星空もランプも一瞬すべて消え、復帰と同時に点灯する。' },
  { id: 'feint',     name: 'フェイント',     cat: 'psych', weight: 130, timing: 3, desc: '光りかけては引っ込むフェイントを2回挟み、3回目で本当に光る。' },
  { id: 'heart',     name: '心音',           cat: 'psych', weight: 120, timing: 3, tease: true, desc: '重い心音が響くたび、ランプが赤く脈打つ。' },
  { id: 'heartfast', name: '鼓動加速',       cat: 'psych', weight: 110, timing: 3, desc: '鼓動がどんどん速くなり、限界で弾ける。' },
  { id: 'fakemiss',  name: '偽ハズレ',       cat: 'psych', weight: 100, timing: 3, desc: '「ハズレ…」と思わせた直後に完全点灯する。' },
  { id: 'rewind',    name: '逆再生',         cat: 'psych', weight: 90,  timing: 3, desc: '光の粒が巻き戻るように吸い込まれ、逆再生音とともに点灯する。' },
  { id: 'timestop',  name: '時間停止',       cat: 'psych', weight: 90,  timing: 3, desc: '世界がモノクロで止まり、秒針の音だけが響く。時が動いた瞬間に光る。' },
  { id: 'countdown', name: 'カウントダウン', cat: 'psych', weight: 90,  timing: 3, desc: '3・2・1のカウントのあと点灯する。' },

  // ---------- 衝撃・爆発系 ----------
  { id: 'strobe',   name: 'ストロボ',       cat: 'impact', weight: 100, timing: 3, desc: '白い閃光が高速で連続し、点灯する。' },
  { id: 'thunder',  name: 'サンダー',       cat: 'impact', weight: 90,  timing: 3, desc: '天から稲妻が落ち、最後の一撃がランプを直撃する。' },
  { id: 'shock',    name: '衝撃波',         cat: 'impact', weight: 90,  timing: 3, desc: 'ランプから幾重もの衝撃波が広がり、重低音が腹に響く。' },
  { id: 'shatter',  name: '画面粉砕',       cat: 'impact', weight: 70,  timing: 3, desc: '画面にヒビが走り、ガラス片となって砕け散る。' },
  { id: 'pillar',   name: '光の柱',         cat: 'impact', weight: 70,  timing: 3, desc: '地面から光の柱が次々と立ち上がる。' },
  { id: 'quake',    name: '超振動',         cat: 'impact', weight: 70,  timing: 3, desc: '地鳴りとともに画面が揺れ続け、臨界で点灯する。' },
  { id: 'meteor',   name: '流星直撃',       cat: 'impact', weight: 60,  timing: 3, desc: '流星が空を切り裂いてランプに直撃する。' },
  { id: 'laser',    name: 'レーザー',       cat: 'impact', weight: 60,  timing: 3, desc: '四隅から放たれたレーザーがランプで交差する。' },
  { id: 'overload', name: 'エネルギー暴走', cat: 'impact', weight: 50,  timing: 3, desc: 'エネルギーが集まりランプが暴走、スパークとともに臨界突破する。' },
  { id: 'bigbang',  name: 'ビッグバン',     cat: 'impact', weight: 40,  timing: 3, desc: 'すべてが一点に収縮し、スローモーションで大爆発する。' },

  // ---------- フリーズ・暗転系（プチュン系） ----------
  { id: 'puchun',     name: '通常プチュン',     cat: 'freeze', group: 'puchun', weight: 400, timing: 1, fever: 'always', desc: 'プチュン音と同時に鋭い十字の閃光が走り、一瞬で完全な闇と無音へ。闇の中心に白紫の光が生まれ、刃のような閃光に育って急拡大し、重低音とともに虹色の光が爆発する。' },
  { id: 'longpu',     name: 'ロングプチュン',   cat: 'freeze', group: 'puchun', weight: 160, timing: 1, desc: '長い長い暗転。かすかな鼓動のあと、凄まじい衝撃で復活する。' },
  { id: 'doublepu',   name: '二連プチュン',     cat: 'freeze', group: 'puchun', weight: 110, timing: 1, desc: '暗転から一度戻り、もう一度プチュン。二重の暗転。' },
  { id: 'silentdark', name: '無音暗転',         cat: 'freeze', group: 'puchun', weight: 100, timing: 1, desc: '音もなく真っ暗に。突然の轟音で復活する。' },
  { id: 'whiteout',   name: 'ホワイトアウト',   cat: 'freeze', group: 'puchun', weight: 80,  timing: 1, desc: '高音とともに画面が真っ白に染まり、その中からランプが現れる。' },
  { id: 'blackhole',  name: 'ブラックホール',   cat: 'freeze', group: 'puchun', weight: 50,  timing: 1, desc: '中央に生まれた闇がすべてを飲み込み、光を吐き出す。' },
  { id: 'noise',      name: 'ノイズフリーズ',   cat: 'freeze', group: 'puchun', weight: 60,  timing: 1, desc: '砂嵐ノイズで画面が壊れ、ブツッと途切れてから復活する。' },
  { id: 'failfree',   name: 'フリーズ解除失敗', cat: 'freeze', group: 'puchun', weight: 40,  timing: 1, desc: '復帰しかけて「ERROR」。再び暗転し、2度目で完全復活する。' },
  { id: 'darkcount',  name: '暗転カウント',     cat: 'freeze', group: 'puchun', weight: 40,  timing: 1, desc: '暗闇に赤い数字が浮かび、カウントダウンののち復活する。' },
  { id: 'awaken',     name: '覚醒フリーズ',     cat: 'freeze', group: 'puchun', weight: 20,  timing: 1, premium: true, desc: '暗闇の中で黄金の瞳が開き、覚醒の光が溢れ出す。' },

  // ---------- カラフル・特殊発光系 ----------
  { id: 'rainbow',  name: 'レインボー',     cat: 'color', weight: 80, timing: 3, desc: '虹色に回転するランプと、七色の光が降り注ぐ。' },
  { id: 'gold',     name: 'ゴールド',       cat: 'color', weight: 80, timing: 3, desc: '黄金のランプとともに金貨の雨が降る。' },
  { id: 'platinum', name: 'プラチナ',       cat: 'color', weight: 50, timing: 3, desc: '白銀の光沢が走り、鋭いきらめきが散る。' },
  { id: 'aurora',   name: 'オーロラ',       cat: 'color', weight: 50, timing: 3, desc: '夜空にオーロラが揺らめき、ランプが極光に染まる。' },
  { id: 'fire',     name: '炎',             cat: 'color', weight: 60, timing: 3, desc: '画面下から炎が噴き上がり、ランプが燃え盛る。' },
  { id: 'ice',      name: '氷結',           cat: 'color', weight: 50, timing: 3, desc: '画面が凍りつき、砕けた氷の中から光る。' },
  { id: 'sakura',   name: '桜吹雪',         cat: 'color', weight: 60, timing: 3, desc: '桜吹雪が画面いっぱいに舞い、ランプが桜色に染まる。' },
  { id: 'galaxy',   name: '銀河',           cat: 'color', weight: 40, timing: 3, desc: 'ランプの背後に渦巻く銀河が広がる。' },
  { id: 'crystal',  name: 'クリスタル',     cat: 'color', weight: 40, timing: 3, desc: 'プリズムの光が乱反射し、結晶が煌めく。' },
  { id: 'uv',       name: 'ブラックライト', cat: 'color', weight: 40, timing: 3, desc: '紫外線の闇に、隠れていたネオン文字が浮かび上がる。' },

  // ---------- 神・究極プレミア系 ----------
  { id: 'god',       name: '神ペカリ',   cat: 'god', weight: 14, timing: 3, premium: true, desc: '天上から光が降り注ぎ、「神」の文字とファンファーレ。' },
  { id: 'ultimate',  name: '究極ペカリ', cat: 'god', weight: 8,  timing: 1, premium: true, desc: '暗転・ストロボ・虹・黄金。すべてを詰め込んだ究極の告知。' },
  { id: 'angel',     name: '天使降臨',   cat: 'god', weight: 12, timing: 3, premium: true, desc: '光の羽が舞い降り、天使の輪とともにランプが白く輝く。' },
  { id: 'demon',     name: '悪魔覚醒',   cat: 'god', weight: 12, timing: 3, premium: true, desc: '画面が血のように赤く染まり、咆哮とともに真紅に光る。' },
  { id: 'timecrash', name: '時空崩壊',   cat: 'god', weight: 8,  timing: 3, premium: true, desc: '画面が裂けてずれ、時が巻き戻り、崩壊の果てに光る。' },
  { id: 'cosmos',    name: '宇宙誕生',   cat: 'god', weight: 6,  timing: 3, premium: true, desc: '無の中に特異点が生まれ、星々が誕生して宇宙が広がる。' },
  { id: 'supernova', name: '超新星爆発', cat: 'god', weight: 6,  timing: 3, premium: true, desc: '星が収縮し、スローモーションで超新星爆発を起こす。' },
  { id: 'loop',      name: '無限ループ', cat: 'god', weight: 5,  timing: 3, premium: true, desc: '点灯と消灯が無限に繰り返し、加速の果てに確定する。' },
  { id: 'seven',     name: '777覚醒',    cat: 'god', weight: 5,  timing: 3, premium: true, desc: '7・7・7が刻まれ、黄金と真紅の覚醒が始まる。' },
  { id: 'final',     name: 'FINAL PEKA', cat: 'god', weight: 2,  timing: 1, premium: true, desc: 'プチュン、静寂、鼓動、ホワイトアウト、そして全てが弾ける最終告知。' },
];

/*
  ブラックアウト系 100種（No.61〜160）
  ---------------------------------------------------------
  「暗転の入り方 × 闇の中の出来事 × 復活の仕方 × 発光色」を組み合わせて生成する。
  100種すべてで（入り方・出来事・復活）の流れが異なる組み合わせになる。
  名前は「発光色の＋出来事」。出現率は palettes の weight で調整できる。
  すべてプチュン系グループ（プチュンモードで出やすい）。
*/
PEKA.BLACKOUT = {
  intros: [
    { id: 'cut',     desc: 'プチュン音とともに一瞬で暗転' },
    { id: 'fade',    desc: 'じわりと闇に沈んでいく' },
    { id: 'tvoff',   desc: 'ブラウン管が切れるように光が線になって消える' },
    { id: 'iris',    desc: '円が閉じるように闇がランプを飲み込む' },
    { id: 'blinds',  desc: 'ブラインドが閉じるように縞状に暗転' },
    { id: 'drop',    desc: '黒い幕が上から落ちてくる' },
    { id: 'shutter', desc: '上下から瞼のように闇が閉じる' },
    { id: 'glitch',  desc: '映像が乱れてブツッと途切れる' },
    { id: 'drain',   desc: '色が抜け落ちてから暗転' },
    { id: 'flicker', desc: '電源が落ちるように明滅して消える' },
  ],
  darks: [
    { id: 'silence', name: '静寂', desc: '完全な静寂の闇' },
    { id: 'heart',   name: '鼓動', desc: '闇の中で心音が響く' },
    { id: 'spark',   name: '火花', desc: '暗闇に小さな火花が散る' },
    { id: 'count',   name: '刻',   desc: '闇に数字が浮かび時を刻む' },
    { id: 'eye',     name: '眼光', desc: '闇の奥で何かの目が光る' },
    { id: 'thunder', name: '遠雷', desc: '遠くで雷光が瞬く' },
    { id: 'whisper', name: '囁き', desc: '闇に文字が浮かんでは消える' },
    { id: 'stars',   name: '星屑', desc: '星がひとつずつ灯っていく' },
    { id: 'crack',   name: '亀裂', desc: '闇に一筋の光の亀裂が走る' },
    { id: 'rumble',  name: '地鳴り', desc: '地の底から地鳴りが迫る' },
  ],
  revives: [
    { id: 'burst',   desc: '重低音とともに爆発的に復活' },
    { id: 'flash',   desc: '真っ白な閃光で復活' },
    { id: 'iris',    desc: 'ランプを中心に光の円が広がって復活' },
    { id: 'shatter', desc: '闇が砕け散って復活' },
    { id: 'rise',    desc: 'ランプの光が闇から滲み出して復活' },
    { id: 'bolt',    desc: '雷が闇を貫いて復活' },
    { id: 'wave',    desc: '衝撃波が闇を吹き飛ばして復活' },
    { id: 'tvon',    desc: '光の線が広がるように映像が戻る' },
    { id: 'lift',    desc: '闇の幕が跳ね上がって復活' },
    { id: 'strobe',  desc: '連続閃光とともに復活' },
  ],
  palettes: [
    { name: '紅',   color: '#ff2448', core: '#ffe0e6', skin: null,       weight: 16 },
    { name: '氷',   color: '#4ec8ff', core: '#f0fcff', skin: 'ice',      weight: 12 },
    { name: '炎',   color: '#ff6a00', core: '#fff0a0', skin: 'fire',     weight: 12 },
    { name: '桜',   color: '#ff6aa8', core: '#fff0f6', skin: 'sakura',   weight: 12 },
    { name: '白銀', color: '#c9d6f0', core: '#ffffff', skin: 'platinum', weight: 10 },
    { name: '紫電', color: '#9d2bff', core: '#e6b0ff', skin: 'uv',       weight: 10 },
    { name: '銀河', color: '#8a5bff', core: '#efe6ff', skin: 'galaxy',   weight: 8 },
    { name: '血',   color: '#e00020', core: '#ffb0b0', skin: 'demon',    weight: 6 },
    { name: '黄金', color: '#ffc61a', core: '#fff6c8', skin: 'gold',     weight: 4, premium: true },
    { name: '虹',   color: '#ff3da6', core: '#ffffff', skin: 'rainbow',  weight: 3, premium: true },
  ],
};
(function () {
  const B = PEKA.BLACKOUT;
  for (let p = 0; p < 10; p++) {
    for (let d = 0; d < 10; d++) {
      const intro = (d + p) % 10, revive = (d + 2 * p + 1) % 10;
      const pal = B.palettes[p], dk = B.darks[d];
      PEKA.EFFECT_TABLE.push({
        id: `bo_${p}${d}`, name: `${pal.name}の${dk.name}`, cat: 'blackout', group: 'puchun',
        weight: pal.weight, timing: 1, premium: !!pal.premium,
        parts: { intro, dark: d, revive, palette: p },
        desc: `${B.intros[intro].desc}。${dk.desc}。${B.revives[revive].desc}。`,
      });
    }
  }
})();

/*
  プチュン演出の統一
  ---------------------------------------------------------
  true  : プチュン系（group:'puchun'）の110種すべてを、共通の演出で再生する
          完全暗転＋十字閃光 → 約1.5秒の完全な闇と無音 → 白紫の光 → 急拡大 → 虹色爆発 → 8秒レインボー
          （ブラックアウト系は、復帰後のランプが各発光色になる）
  false : 各演出の元の流れで再生する
  どちらにしても、抽選確率・演出の振り分け・図鑑の種類数は変わらない。
*/
PEKA.PUCHUN_UNIFIED = true;
PEKA.PUCHUN_DESC = 'プチュン音と同時に完全暗転し、鋭い十字の閃光が走って闇へ消える。約1.5秒の静寂のあと、闇の中心に白紫の光が生まれ、刃のような閃光に育って急拡大し、重低音とともに虹色の光が爆発する。';

/* ---------- 以下は自動生成（編集不要） ---------- */
PEKA.EFFECTS = PEKA.EFFECT_TABLE.map((e, i) => Object.assign({
  no: i + 1, group: 'other', timing: 3, press: null, tease: false, silent: false, premium: false,
}, e));
PEKA.EFFECT_MAP = Object.fromEntries(PEKA.EFFECTS.map(e => [e.id, e]));

/** プチュン系を共通演出で再生するか */
PEKA.isUnifiedPuchun = (e) => PEKA.PUCHUN_UNIFIED && e.group === 'puchun';
/** 共通プチュン演出での復帰後ランプの見た目（ブラックアウト系は発光色、その他は虹） */
PEKA.puchunLook = (e) => {
  if (e.parts) { const p = PEKA.BLACKOUT.palettes[e.parts.palette]; return { color: p.color, core: p.core, skin: p.skin, name: p.name }; }
  return { color: '#ff3da6', core: '#ffffff', skin: 'rainbow', name: '虹' };
};
if (PEKA.PUCHUN_UNIFIED) {
  PEKA.EFFECTS.forEach(e => {
    if (e.group !== 'puchun') return;
    e.fever = 'always';
    e.desc = PEKA.PUCHUN_DESC + (e.parts ? `復帰後のランプは「${PEKA.puchunLook(e).name}」の色で輝き続ける。` : '');
  });
}

function groupTotal(group) { return PEKA.EFFECTS.filter(e => e.group === group).reduce((s, e) => s + e.weight, 0); }

/** 当選時にこの演出が選ばれる確率（0..1） */
PEKA.effectRate = function (id, mode) {
  const e = PEKA.EFFECT_MAP[id];
  const share = PEKA.FX_MODES[mode].puchunShare;
  return (e.group === 'puchun' ? share : 1 - share) * e.weight / groupTotal(e.group);
};

/** 演出を1つ選ぶ。r1: グループ選択用, r2: グループ内選択用（0..1） */
PEKA.pickEffect = function (mode, r1, r2) {
  const group = r1 < PEKA.FX_MODES[mode].puchunShare ? 'puchun' : 'other';
  const pool = PEKA.EFFECTS.filter(e => e.group === group);
  let x = r2 * groupTotal(group);
  for (const e of pool) if ((x -= e.weight) < 0) return e;
  return pool[pool.length - 1];
};
