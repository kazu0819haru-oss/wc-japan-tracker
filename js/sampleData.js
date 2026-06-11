/* =========================================================
   デモ用サンプルデータ
   Workers URL 未設定時、または取得失敗時のフォールバック。
   ※あくまでデモ。実データはAPI経由で取得される。
   ========================================================= */

const now = Date.now();
const h = 3600 * 1000;
const d = 24 * h;

// 仮の対戦相手（デモ表示用。実際の組み合わせはAPIが返す）
export const sampleMatches = [
  {
    id: "s1",
    utcDate: new Date(now - 5 * d).toISOString(),
    status: "FINISHED",
    competition: "国際親善試合",
    stage: "FRIENDLY",
    homeTeam: { name: "日本", crest: "🇯🇵" },
    awayTeam: { name: "ガーナ", crest: "🇬🇭" },
    score: { home: 2, away: 0 },
    minute: null,
    scorers: [],
  },
  {
    id: "s2",
    utcDate: new Date(now - 2 * d).toISOString(),
    status: "FINISHED",
    competition: "W杯 グループステージ",
    stage: "GROUP_STAGE",
    homeTeam: { name: "日本", crest: "🇯🇵" },
    awayTeam: { name: "デモA", crest: "🅰️" },
    score: { home: 1, away: 1 },
    minute: null,
    scorers: [],
  },
  {
    id: "s3",
    utcDate: new Date(now - 2 * h).toISOString(),
    status: "IN_PLAY",
    competition: "W杯 グループステージ",
    stage: "GROUP_STAGE",
    homeTeam: { name: "日本", crest: "🇯🇵" },
    awayTeam: { name: "デモB", crest: "🅱️" },
    score: { home: 2, away: 1 },
    minute: 67,
    scorers: [
      { team: "home", player: "上田 綺世", minute: 23 },
      { team: "away", player: "オウンゴール", minute: 41 },
      { team: "home", player: "久保 建英", minute: 58 },
    ],
  },
  {
    id: "s4",
    utcDate: new Date(now + 3 * d + 4 * h).toISOString(),
    status: "SCHEDULED",
    competition: "W杯 グループステージ",
    stage: "GROUP_STAGE",
    homeTeam: { name: "日本", crest: "🇯🇵" },
    awayTeam: { name: "デモC", crest: "🇨" },
    score: { home: null, away: null },
    minute: null,
    scorers: [],
  },
  {
    id: "s5",
    utcDate: new Date(now + 9 * d + 2 * h).toISOString(),
    status: "SCHEDULED",
    competition: "W杯 ノックアウト",
    stage: "LAST_16",
    homeTeam: { name: "日本", crest: "🇯🇵" },
    awayTeam: { name: "未定", crest: "❓" },
    score: { home: null, away: null },
    minute: null,
    scorers: [],
  },
];

export const sampleStreams = [
  {
    videoId: "demo1",
    title: "【同時視聴】日本代表を全力応援！みんなで観よう🇯🇵",
    channel: "サッカー実況チャンネル",
    thumbnail: "",
    url: "https://www.youtube.com/results?search_query=" + encodeURIComponent("日本代表 同時視聴 ライブ"),
  },
  {
    videoId: "demo2",
    title: "W杯 日本戦 副音声実況ライブ｜熱狂ウォッチパーティ",
    channel: "ふぁんビューTV",
    thumbnail: "",
    url: "https://www.youtube.com/results?search_query=" + encodeURIComponent("ワールドカップ 日本 実況"),
  },
];
