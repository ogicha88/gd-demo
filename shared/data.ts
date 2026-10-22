// アプリ全体で使う定義データ

export type GdType = {
  id: string;
  name: string;
  tags: string[];
  hue: number;
  topics: Topic[];
};

export type Topic = {
  id: string;
  title: string;
};

export const GD_TYPES: GdType[] = [
  {
    id: "business",
    name: "ビジネス型",
    tags: ["売上向上", "新規事業"],
    hue: 205,
    topics: [
      { id: "biz-cafe", title: "街のカフェの売上を1年で2倍にする施策を考えよ" },
      { id: "biz-subsc", title: "大学生向けの新しいサブスクサービスを提案せよ" },
      { id: "biz-onsen", title: "地方の温泉旅館に若者を呼び込む施策を考えよ" },
    ],
  },
  {
    id: "problem",
    name: "課題解決型",
    tags: ["社会課題", "原因分析"],
    hue: 160,
    topics: [
      { id: "pro-vote", title: "若者の投票率を上げるための施策を考えよ" },
      { id: "pro-rush", title: "都市部の通勤ラッシュを解消する方法を考えよ" },
      { id: "pro-food", title: "家庭のフードロスを半減させる施策を考えよ" },
    ],
  },
  {
    id: "abstract",
    name: "抽象テーマ型",
    tags: ["定義づけ", "価値観"],
    hue: 280,
    topics: [
      { id: "abs-skill", title: "社会人にとって最も大切な力とは何か" },
      { id: "abs-team", title: "良いチームの条件とは何か" },
      { id: "abs-work", title: "「働く」とは何か" },
    ],
  },
  {
    id: "fermi",
    name: "フェルミ推定型",
    tags: ["数値推定", "ロジック"],
    hue: 35,
    topics: [
      { id: "fer-conv", title: "日本にあるコンビニの数を推定せよ" },
      { id: "fer-umbrella", title: "日本で1年間に売れる傘の本数を推定せよ" },
      { id: "fer-salon", title: "日本にある美容院の数を推定せよ" },
    ],
  },
  {
    id: "debate",
    name: "選択・ディベート型",
    tags: ["二択", "判断基準"],
    hue: 345,
    topics: [
      { id: "deb-training", title: "新入社員研修はオンラインと対面どちらが良いか" },
      { id: "deb-leader", title: "リーダーに必要なのはカリスマ性か調整力か" },
      { id: "deb-4day", title: "企業は週休3日制を導入すべきか" },
    ],
  },
];

export function findTopic(topicId: string): { type: GdType; topic: Topic } | null {
  for (const type of GD_TYPES) {
    const topic = type.topics.find((t) => t.id === topicId);
    if (topic) return { type, topic };
  }
  return null;
}

export type Role = {
  key: "facilitator" | "timekeeper" | "scribe" | "presenter" | "member";
  name: string;
  short: string;
  duty: string;
  color: string;
  tint: string; // 重要場面の背景色
};

// 話者番号 = 役割番号（0:司会 1:タイムキーパー 2:書記 3:発表者 4:メンバー）
export const ROLES: Role[] = [
  { key: "facilitator", name: "司会", short: "司会", duty: "議論の進行と論点整理", color: "#3d84f5", tint: "#e3eeff" },
  { key: "timekeeper", name: "タイムキーパー", short: "TK", duty: "時間配分の管理と残り時間の共有", color: "#ec9a0b", tint: "#fff1d6" },
  { key: "scribe", name: "書記", short: "書記", duty: "意見の記録と見える化", color: "#1fa874", tint: "#dcf6ea" },
  { key: "presenter", name: "発表者", short: "発表", duty: "結論のまとめと最終発表", color: "#ec4c84", tint: "#ffe1ec" },
  { key: "member", name: "メンバー", short: "メンバー", duty: "意見出しと深掘り", color: "#8b7cf0", tint: "#ece8ff" },
];

export const SIZE = 5;

export type Character = { name: string; hair: string; skin: string; shirt: string; style: number };

// 話者番号と同じ並び（0:はると=司会 1:さくら=TK 2:ゆうき=書記 3:みお=発表者 4:そうた=メンバー）
export const CHARACTERS: Character[] = [
  { name: "はると", hair: "#3b2f2f", skin: "#ffe0c7", shirt: "#7cc4ff", style: 0 },
  { name: "さくら", hair: "#5a3a2e", skin: "#ffe3cf", shirt: "#ffa8c5", style: 1 },
  { name: "ゆうき", hair: "#2a2a35", skin: "#f7d6bc", shirt: "#8fe3c0", style: 2 },
  { name: "みお", hair: "#7a4b32", skin: "#ffe6d3", shirt: "#c9b2ff", style: 3 },
  { name: "そうた", hair: "#463326", skin: "#f5d2b5", shirt: "#ffd36e", style: 4 },
];

// 流れと時間配分（docs/gd-guide.md 参照）
export const PHASES = [
  { name: "役割決め・時間配分", minutes: 2 },
  { name: "前提確認・定義", minutes: 3 },
  { name: "現状分析・課題特定", minutes: 3 },
  { name: "アイデア出し", minutes: 4 },
  { name: "検証・絞り込み", minutes: 4 },
  { name: "結論・発表準備", minutes: 2 },
  { name: "発表", minutes: 2 },
] as const;

export const TOTAL_MINUTES = PHASES.reduce((a, p) => a + p.minutes, 0);

export type ScriptLine = {
  s: number; // 話者（= 役割番号）
  p: number; // フェーズ番号
  t: string; // 発言
  role?: boolean; // 役割としての発言（太字で強調）
  assign?: boolean; // この発言で話者の役割が決まる
  note?: string; // 書記のボードに書かれるメモ
  key?: { title: string; why: string }; // 重要場面の解説（一時停止して表示）
};

export type Script = {
  topicId: string;
  conclusion: string;
  lines: ScriptLine[];
};
