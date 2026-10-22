const VIEWS_KEY = "gd-demo:views";

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
