// フロントエンドと Worker の両方から参照する共有データ

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
};

export const ROLES: Record<Role["key"], Role> = {
  facilitator: { key: "facilitator", name: "司会", short: "司会", duty: "議論の進行と論点整理" },
  timekeeper: { key: "timekeeper", name: "タイムキーパー", short: "TK", duty: "時間配分の管理と残り時間の共有" },
  scribe: { key: "scribe", name: "書記", short: "書記", duty: "意見の記録と見える化" },
  presenter: { key: "presenter", name: "発表者", short: "発表", duty: "結論のまとめと最終発表" },
  member: { key: "member", name: "メンバー", short: "メンバー", duty: "意見出しと深掘り" },
};

export const SIZES = [4, 5, 6] as const;
export type Size = (typeof SIZES)[number];

export function rolesForSize(size: number): Role[] {
  const base: Role[] = [ROLES.facilitator, ROLES.timekeeper, ROLES.scribe, ROLES.presenter];
  while (base.length < size) base.push(ROLES.member);
  return base;
}

export type Character = { name: string; hair: string; skin: string; shirt: string; style: number };

export const CHARACTERS: Character[] = [
  { name: "はると", hair: "#3b2f2f", skin: "#ffe0c7", shirt: "#7cc4ff", style: 0 },
  { name: "さくら", hair: "#5a3a2e", skin: "#ffe3cf", shirt: "#ffa8c5", style: 1 },
  { name: "ゆうき", hair: "#2a2a35", skin: "#f7d6bc", shirt: "#8fe3c0", style: 2 },
  { name: "みお", hair: "#7a4b32", skin: "#ffe6d3", shirt: "#c9b2ff", style: 3 },
  { name: "そうた", hair: "#463326", skin: "#f5d2b5", shirt: "#ffd36e", style: 4 },
  { name: "あおい", hair: "#24304a", skin: "#ffe2cc", shirt: "#9ad7ff", style: 5 },
];

export const PHASES = [
  { name: "役割・時間配分", minutes: 2 },
  { name: "前提のすり合わせ", minutes: 3 },
  { name: "アイデア出し", minutes: 5 },
  { name: "議論・絞り込み", minutes: 6 },
  { name: "結論まとめ", minutes: 2 },
  { name: "発表", minutes: 2 },
] as const;

export const TOTAL_MINUTES = PHASES.reduce((a, p) => a + p.minutes, 0);

export type ScriptLine = {
  s: number; // 話者 index
  t: string; // 発言
  p: number; // フェーズ index
  note?: string; // 書記のボードに追加されるメモ
  tip?: string; // 学習ポイント
};

export type Script = {
  topicId: string;
  size: number;
  lines: ScriptLine[];
  conclusion: string;
  source: "ai" | "template";
};
