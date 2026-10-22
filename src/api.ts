import type { Script } from "../shared/data";

const VIEWS_KEY = "gd-demo:views";

export const api = {
  script: async (topic: string, size: number): Promise<Script> => {
    const res = await fetch(`/api/script?topic=${encodeURIComponent(topic)}&size=${size}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<Script>;
  },
};

// 視聴履歴は端末のブラウザ内にだけ保存する
export const views = {
  load(): Record<string, number> {
    try {
      return JSON.parse(localStorage.getItem(VIEWS_KEY) ?? "{}");
    } catch {
      return {};
    }
  },
  add(topicId: string): Record<string, number> {
    const v = views.load();
    v[topicId] = (v[topicId] ?? 0) + 1;
    try {
      localStorage.setItem(VIEWS_KEY, JSON.stringify(v));
    } catch {
      /* プライベートブラウズなど */
    }
    return v;
  },
};
