const VIEWS_KEY = "gd-demo:views";
const INTRO_KEY = "gd-demo:intro-seen";

// 冒頭ガイドを見たかどうか（2回目以降はホームから始める）
export const intro = {
  seen(): boolean {
    try {
      return localStorage.getItem(INTRO_KEY) === "1";
    } catch {
      return false;
    }
  },
  markSeen() {
    try {
      localStorage.setItem(INTRO_KEY, "1");
    } catch {
      /* プライベートブラウズなど */
    }
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
