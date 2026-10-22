// Workers AI でグループディスカッションの台本を生成する
import type { Script, ScriptLine } from "../shared/data";
import { PHASES, findTopic, rolesForSize } from "../shared/data";
import { templateScript } from "./template";

const CACHE_VERSION = "v2";

const SCHEMA = {
  type: "object",
  properties: {
    lines: {
      type: "array",
      items: {
        type: "object",
        properties: {
          s: { type: "integer" },
          p: { type: "integer" },
          t: { type: "string" },
          note: { type: "string" },
          tip: { type: "string" },
        },
        required: ["s", "p", "t"],
      },
    },
    conclusion: { type: "string" },
  },
  required: ["lines", "conclusion"],
};

function buildPrompt(title: string, typeName: string, size: number): string {
  const roles = rolesForSize(size);
  const members = roles.map((r, i) => `${i}: ${r.name}（${r.duty}）`).join("\n");
  const phases = PHASES.map((p, i) => `${i}: ${p.name}（${p.minutes}分）`).join("\n");
  return `あなたは就職活動のグループディスカッション（GD）指導のプロです。
GD未経験の大学生が「こう進めればいいんだ」と具体的にイメージできる、模範的なGD（制限時間20分）の台本を書いてください。

# お題（${typeName}）
${title}

# 参加者（s の番号）
${members}

# フェーズ（p の番号）
${phases}

# ルール
- 全部で28〜34発言。各発言 t は40〜90文字の、実際に口にする自然な話し言葉（大学生同士の丁寧語）だけを書く。
- 参加者の名前は絶対に書かない（自己紹介もしない）。「私が司会をやります」のように役割で話す。
- p は0から5へ順番に進み、戻らない。フェーズ0〜4は各3発言以上。
- フェーズ0: 司会が開始を宣言して役割を確認し、タイムキーパーが具体的な時間配分を提案する。
- フェーズ1: ゴールや言葉の定義、前提条件をすり合わせる。
- フェーズ2: メンバー全員がお題に即した具体的なアイデアを理由つきで出す。
- フェーズ3: 評価軸を決めて案を比較し、反対意見や懸念も建設的に扱って絞り込む。
- フェーズ4: 司会が結論を確認し、全員で合意する。
- フェーズ5: 発表者(3)だけが「結論→理由→具体策」の順で発表する（2〜3発言）。
- タイムキーパー(1)はフェーズの切り替え時に残り時間を伝える。書記(2)は出た意見を整理して共有する。
- note: 書記がボードに書くメモ（20文字以内）。重要な発言の8〜10個にだけ付ける。t には含めない。
- tip: その発言のどこが良いかの学習ポイント（40文字以内）。8〜10個の発言にだけ付ける。t には含めない。
- conclusion: グループの最終結論（60文字以内）。

次の形式の JSON だけを出力してください（説明文やコードブロックは不要）。
{"lines":[{"s":0,"p":0,"t":"発言","note":"任意","tip":"任意"}],"conclusion":"結論"}`;
}

function clean(s: unknown, max: number): string {
  return String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function validate(raw: unknown, topicId: string, size: number): Script | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as { lines?: unknown; conclusion?: unknown };
  if (!Array.isArray(obj.lines)) return null;
  const lines: ScriptLine[] = [];
  let phase = 0;
  for (const l of obj.lines as Record<string, unknown>[]) {
    const s = Number(l?.s);
    const t = clean(l?.t, 120);
    if (!Number.isInteger(s) || s < 0 || s >= size || !t || /^(note|tip)\s*[:：]/i.test(t)) continue;
    const p = Math.min(PHASES.length - 1, Math.max(phase, Number(l?.p) || 0));
    phase = p;
    // 発表フェーズは発表者だけが話す
    if (p === PHASES.length - 1 && s !== 3) continue;
    const note = clean(l?.note, 30);
    const tip = clean(l?.tip, 60);
    lines.push({ s, t, p, ...(note ? { note } : {}), ...(tip ? { tip } : {}) });
  }
  const conclusion = clean(obj.conclusion, 120);
  if (lines.length < 18 || !conclusion) return null;
  const speakers = new Set(lines.map((l) => l.s));
  if (speakers.size < size) return null;
  const phasesSeen = new Set(lines.map((l) => l.p));
  if (phasesSeen.size < PHASES.length - 1) return null;
  return { topicId, size, lines, conclusion, source: "ai" };
}

// モデルによって返り値の形が違うので、どの形でも JSON を取り出せるようにする
function parseResponse(res: unknown): unknown {
  const r = res as { response?: unknown; choices?: { message?: { content?: unknown } }[] };
  const body = r?.response ?? r?.choices?.[0]?.message?.content ?? res;
  if (typeof body !== "string") return body;
  const text = body.replace(/<think>[\s\S]*?<\/think>/g, "");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function generateScript(env: Env, topicId: string, size: number, model: string = env.AI_MODEL): Promise<Script> {
  const found = findTopic(topicId);
  if (!found) throw new Error("unknown topic");
  const prompt = buildPrompt(found.topic.title, found.type.name, size);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await env.AI.run(model as keyof AiModels, {
        messages: [{ role: "user", content: prompt }],
        // 1 回目は JSON スキーマ指定、未対応モデル向けに 2 回目はプロンプトのみで生成する
        ...(attempt === 0 ? { response_format: { type: "json_schema", json_schema: SCHEMA } } : {}),
        max_tokens: 8000,
        temperature: 0.7,
      } as never);
      const script = validate(parseResponse(res), topicId, size);
      if (script) return script;
      console.warn("invalid AI script", { topicId, size, attempt, model });
    } catch (e) {
      console.error("AI error", model, e);
    }
  }
  return templateScript(topicId, size);
}

export async function getScript(env: Env, topicId: string, size: number, force = false, model?: string): Promise<Script> {
  const key = `${CACHE_VERSION}:${topicId}:${size}`;
  if (!force) {
    const cached = await env.SCRIPTS.get<Script>(key, "json");
    if (cached) return cached;
  }
  const script = await generateScript(env, topicId, size, model);
  // テンプレートにフォールバックした場合は短期間だけキャッシュし、AI 生成を再試行できるようにする
  await env.SCRIPTS.put(key, JSON.stringify(script), script.source === "ai" ? {} : { expirationTtl: 3600 });
  return script;
}
