import { expect, test, type Locator, type Page } from "@playwright/test";
import { GD_TYPES } from "../shared/data";

// 指定した要素の上でフリック（素早いドラッグ）する
async function flick(page: Page, target: Locator, dx: number, dy: number, from = { x: 0.5, y: 0.5 }) {
  const box = (await target.boundingBox())!;
  const x = box.x + box.width * from.x;
  const y = box.y + box.height * from.y;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(x + (dx * i) / 6, y + (dy * i) / 6);
  await page.mouse.up();
}

async function lineIndex(page: Page) {
  return Number((await page.getByTestId("counter").innerText()).split("/")[0].trim());
}
async function lineTotal(page: Page) {
  return Number((await page.getByTestId("counter").innerText()).split("/")[1].trim());
}
// 次へ進む（重要場面で止まっていれば「続きを見る」を押す）
async function advance(page: Page) {
  // 押す直前に解説カードへ切り替わることがあるので、見えている方を押し直す
  for (let i = 0; i < 5; i++) {
    try {
      await page.getByTestId("key-next").or(page.getByTestId("next")).first().click({ timeout: 3000 });
      return;
    } catch {
      if (await page.getByTestId("summary-screen").isVisible()) return;
    }
  }
}

// 毎回スタート画面から始まるので、スキップしてお題選択を開く
async function gotoHome(page: Page) {
  await page.goto("/");
  await page.getByTestId("welcome-skip").click();
  await expect(page.getByTestId("carousel")).toBeVisible();
}

async function openDemo(page: Page, topicId: string) {
  await gotoHome(page);
  const typeIndex = GD_TYPES.findIndex((t) => t.topics.some((p) => p.id === topicId));
  for (let i = 0; i < typeIndex; i++) await page.locator(".dot").nth(i + 1).click();
  await page.getByTestId(`topic-${topicId}`).click();
  await page.getByTestId("start-demo").click();
  await expect(page.getByTestId("demo-screen")).toBeVisible();
}

let consoleErrors: string[] = [];
test.beforeEach(({ page }) => {
  consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(e.message));
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
});
test.afterEach(() => {
  expect(consoleErrors, "コンソールエラーが出ていないこと").toEqual([]);
});

test("JS 読み込み前から全画面スケルトンが表示される", async ({ page }) => {
  await page.route("**/*.{js,ts,tsx}", async (route) => {
    await new Promise((r) => setTimeout(r, 1200));
    await route.continue();
  });
  await page.goto("/", { waitUntil: "commit" });
  await expect(page.locator(".boot[aria-busy=true]")).toBeVisible();
  await expect(page.getByTestId("welcome")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".boot")).toHaveCount(0);
});

test("ログインなしでホームが開き、5つの型と各3つのお題がある", async ({ page }) => {
  await gotoHome(page);
  await expect(page.locator(".type-card")).toHaveCount(5);
  for (const t of GD_TYPES) await expect(page.locator(".type-card h2", { hasText: t.name })).toHaveCount(1);
  await expect(page.locator(".topic-card")).toHaveCount(3);
  await expect(page.getByText(/ログイン/)).toHaveCount(0);
});

test("型カードを左右フリックで切り替えられる", async ({ page }) => {
  await gotoHome(page);
  const carousel = page.getByTestId("carousel");
  await expect(page.getByTestId("topic-biz-cafe")).toBeVisible();
  await flick(page, carousel, -220, 0, { x: 0.8, y: 0.5 });
  await expect(page.getByTestId("topic-pro-vote")).toBeVisible();
  await flick(page, carousel, -220, 0, { x: 0.8, y: 0.5 });
  await expect(page.getByTestId("topic-abs-skill")).toBeVisible();
  await flick(page, carousel, 220, 0, { x: 0.2, y: 0.5 });
  await expect(page.getByTestId("topic-pro-vote")).toBeVisible();
});

test("お題シート: 5人と役割が表示され、下フリックで閉じ、上フリックでデモが始まる", async ({ page }) => {
  await gotoHome(page);
  await page.getByTestId("topic-biz-cafe").click();
  const sheet = page.getByTestId("topic-sheet");
  await expect(sheet.locator(".crowd-person")).toHaveCount(5);
  for (const r of ["司会", "TK", "書記", "発表", "メンバー"]) await expect(sheet.locator(".role-chip", { hasText: r })).toHaveCount(1);
  await expect(page.getByText(/4人|6人/)).toHaveCount(0);
  await page.waitForTimeout(600); // シートが出きるのを待つ
  await flick(page, sheet.locator(".grabber"), 0, 200);
  await expect(sheet).toHaveCount(0);
  await page.getByTestId("topic-biz-cafe").click();
  await page.waitForTimeout(600);
  await flick(page, page.getByTestId("topic-sheet").locator("h3"), 0, -150);
  await expect(page.getByTestId("demo-screen")).toBeVisible();
});

test("デモ: 役割決めから始まり、重要場面で色が変わって解説と「続きを見る」が出る", async ({ page }) => {
  await openDemo(page, "biz-cafe");
  // 最初は役割未定（？）で、フェーズは役割決め
  await expect(page.getByTestId("phase-name")).toHaveText("役割決め・時間配分");
  await expect(page.locator(".seat-role.none")).toHaveCount(5);
  await expect(page.locator(".seat")).toHaveCount(5);
  // 最初の重要場面で止まる
  const card = page.getByTestId("key-card");
  await expect(card).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("demo-screen")).toHaveAttribute("data-key-open", "1");
  await expect(card).toContainText("のポイント");
  await expect(card.locator("p")).not.toBeEmpty();
  // 解説の対象の発言がカードに隠れず見えている
  await page.waitForTimeout(700);
  const bubble = (await page.getByTestId("current-bubble").boundingBox())!;
  const cardBox = (await card.boundingBox())!;
  expect(bubble.y + bubble.height).toBeLessThanOrEqual(cardBox.y + 2);
  // 背景色が役割のイメージカラーに変わる
  await expect
    .poll(() => page.locator(".tint-layer").evaluate((el) => Number(getComputedStyle(el).opacity)))
    .toBeGreaterThan(0.9);
  const at = await lineIndex(page);
  await page.waitForTimeout(2500);
  expect(await lineIndex(page), "解説中は止まっている").toBe(at);
  await page.getByTestId("key-next").click();
  await expect(card).toHaveCount(0);
  await expect.poll(() => lineIndex(page)).toBe(at + 1);
  // 役割が決まると「？」が役割名に変わっていく
  await expect.poll(() => page.locator(".seat-role.none").count(), { timeout: 30_000 }).toBeLessThan(5);
  // 役割としての発言は太字で強調される
  await expect(page.locator(".bubble.role-line").first()).toBeVisible();
  const weight = await page.locator(".bubble.role-line").first().evaluate((el) => Number(getComputedStyle(el).fontWeight));
  expect(weight).toBeGreaterThanOrEqual(700);
});

test("デモ: 再生操作・フリック・ボード・まとめまで通しで動く", async ({ page }) => {
  await openDemo(page, "pro-vote");
  const total = await lineTotal(page);
  expect(total).toBeGreaterThanOrEqual(30);

  // 一時停止すると止まる（最初の重要場面の解説は閉じておく）
  await page.getByTestId("key-next").click({ timeout: 30_000 });
  await page.getByTestId("play").click();
  await expect(page.getByTestId("play")).toHaveAttribute("aria-label", "再生");
  const paused = await lineIndex(page);
  await page.waitForTimeout(3000);
  expect(await lineIndex(page)).toBe(paused);

  // 次へ・前へ
  await page.getByTestId("next").click();
  await expect.poll(() => lineIndex(page)).toBe(paused + 1);
  await page.getByTestId("prev").click();
  await expect.poll(() => lineIndex(page)).toBe(paused);
  // 左フリックで次、右フリックで前
  await flick(page, page.getByTestId("chat"), -160, 0);
  await expect.poll(() => lineIndex(page)).toBe(paused + 1);
  await flick(page, page.getByTestId("chat"), 160, 0);
  await expect.poll(() => lineIndex(page)).toBe(paused);

  // 再生速度
  await expect(page.getByTestId("speed")).toHaveText("×1");
  await page.getByTestId("speed").click();
  await expect(page.getByTestId("speed")).toHaveText("×1.5");

  // 人物とコメントが重ならない
  const seats = (await page.getByTestId("stage").boundingBox())!;
  const chat = (await page.getByTestId("chat").boundingBox())!;
  expect(seats.y + seats.height).toBeLessThanOrEqual(chat.y + 1);

  // 書記のボード（下フリックで閉じる）
  for (let i = 0; i < 12; i++) await advance(page);
  await expect(page.locator(".badge")).toHaveCount(1);
  await expect(page.locator(".badge")).toBeVisible();
  await page.getByTestId("board-btn").click();
  const board = page.getByTestId("board");
  await expect(board.locator(".note").first()).toBeVisible();
  await page.waitForTimeout(600);
  await flick(page, board.locator(".grabber"), 0, 120);
  await expect(board).toHaveCount(0);

  // ステージのタップで再生再開
  await page.getByTestId("stage").click();
  await expect(page.getByTestId("play")).toHaveAttribute("aria-label", "一時停止");

  // 最後まで進めるとまとめ画面
  for (let i = 0; i < total + 15; i++) {
    if (await page.getByTestId("summary-screen").isVisible()) break;
    await advance(page);
  }
  const summary = page.getByTestId("summary-screen");
  await expect(summary).toBeVisible();
  await expect(page.getByTestId("conclusion")).not.toBeEmpty();
  await expect(summary.locator(".flow-item")).toHaveCount(7);
  await expect(summary.locator(".points li").first()).toBeVisible();
  await page.getByTestId("role-tab-1").click();
  await expect(summary.locator(".points li").first()).toBeVisible();

  // もう一度見る → 閉じる
  await page.getByTestId("replay").click();
  await expect(page.getByTestId("demo-screen")).toBeVisible();
  await expect.poll(() => lineIndex(page)).toBe(1);
  await page.getByTestId("demo-close").click();
  await expect(page.getByTestId("carousel")).toBeVisible();
});

test("全15お題の台本がすぐに開ける（生成待ちなし）", async ({ page }) => {
  for (const type of GD_TYPES) {
    for (const topic of type.topics) {
      await openDemo(page, topic.id);
      await expect(page.getByTestId("demo-screen").locator(".seat")).toHaveCount(5);
      expect(await lineTotal(page)).toBeGreaterThanOrEqual(30);
      await expect(page.getByTestId("current-bubble")).toBeVisible({ timeout: 5000 });
    }
  }
});

test("まばたきは目を閉じる表現で、目の位置は動かない", async ({ page }) => {
  await gotoHome(page);
  await page.getByTestId("topic-biz-cafe").click();
  const av = page.locator(".crowd-person .avatar").first();
  await expect(av.locator(".av-eyes-closed path")).toHaveCount(2);
  const anim = await av.locator(".av-eyes-open").evaluate((el) => {
    const cs = getComputedStyle(el);
    return { name: cs.animationName, transform: cs.transform };
  });
  expect(anim.name).toBe("eyes-open");
  expect(anim.transform).toBe("none");
});

test("視聴済みバッジが付き、再読み込み後も残る", async ({ page }) => {
  await gotoHome(page);
  await page.getByTestId("topic-biz-cafe").click();
  await page.getByTestId("start-demo").click();
  await page.getByTestId("demo-close").click();
  await page.reload();
  await page.getByTestId("welcome-skip").click();
  await expect(page.getByTestId("topic-biz-cafe")).toContainText("視聴済み");
  await expect(page.getByTestId("topic-biz-subsc")).not.toContainText("視聴済み");
});

test("スマホ幅で横スクロールが出ず、シートも画面内に収まる", async ({ page }) => {
  await gotoHome(page);
  await expect(page.locator(".topic-card")).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await page.getByTestId("topic-biz-cafe").click();
  const box = (await page.getByTestId("topic-sheet").boundingBox())!;
  const vw = page.viewportSize()!.width;
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(vw + 1);
});

test("公開URLに mama-meal が含まれない", async ({ page, baseURL }) => {
  test.skip(!baseURL?.startsWith("https://"), "本番URLのときだけ確認");
  await gotoHome(page);
  expect(page.url()).not.toContain("mama-meal");
});
