import { Hono } from "hono";
import { SIZES, findTopic } from "../shared/data";
import { getScript } from "./generate";

const app = new Hono<{ Bindings: Env }>().basePath("/api");

app.get("/script", async (c) => {
  const topic = c.req.query("topic") ?? "";
  const size = Number(c.req.query("size"));
  if (!findTopic(topic) || !SIZES.includes(size as never)) return c.json({ error: "bad request" }, 400);
  const script = await getScript(c.env, topic, size);
  // 台本はお題×人数ごとに固定なので、ブラウザ側でもキャッシュさせる
  c.header("cache-control", script.source === "ai" ? "public, max-age=3600" : "no-store");
  return c.json(script);
});

// 管理用: 台本の事前生成・作り直し（WARM_TOKEN を知っている場合のみ）
app.post("/warm", async (c) => {
  if (!c.env.WARM_TOKEN || c.req.header("x-warm-token") !== c.env.WARM_TOKEN) return c.notFound();
  const topic = c.req.query("topic") ?? "";
  const size = Number(c.req.query("size"));
  if (!findTopic(topic) || !SIZES.includes(size as never)) return c.json({ error: "bad request" }, 400);
  const started = Date.now();
  const script = await getScript(c.env, topic, size, c.req.query("force") === "1", c.req.query("model"));
  return c.json({ ms: Date.now() - started, ...script });
});

export default app;
