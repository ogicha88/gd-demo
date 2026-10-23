import { expect, test, type Locator, type Page } from "@playwright/test";

async function flick(page: Page, target: Locator, dx: number) {
  const box = (await target.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + Math.min(box.height / 2, 200);
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(x + (dx * i) / 6, y);
  await page.mouse.up();
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

test("初回: スタート画面でアプリの説明と5人のキャラクターが表示される", async ({ page }) => {
  await page.goto("/");
  const welcome = page.getByTestId("welcome");
  await expect(welcome).toBeVisible();
  await expect(welcome.locator(".welcome-person")).toHaveCount(5);
  await expect(welcome).toContainText("GDデモ");
  await expect(welcome).toContainText("模範デモで学べるアプリ");
  await expect(welcome).toContainText("スタートを押すと");
  // キャラクターが順番にあいさつする
  await expect(welcome.locator(".hello").first()).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId("guide")).toHaveCount(0);
  await expect(page.getByTestId("carousel")).toHaveCount(0);
  // 上フリックでも開始できる
  await page.waitForTimeout(1500);
  const box = (await welcome.boundingBox())!;
  await page.mouse.move(box.width / 2, box.height * 0.6);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(box.width / 2, box.height * 0.6 - 25 * i);
  await page.mouse.up();
  await expect(page.getByTestId("guide")).toBeVisible();
});

test("初回: スタート → GDの流れ・基本・人事の視点 → 「デモを見てみる」でお題選択へ進む", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("welcome-start").click();
  const guide = page.getByTestId("guide");
  await expect(guide).toBeVisible();
  await expect(page.getByTestId("carousel")).toHaveCount(0);

  // 1ページ目: GDの流れ（7ステップ）
  await expect(page.getByTestId("guide-page-0")).toContainText("GDの流れ");
  await expect(page.locator(".g-flow li")).toHaveCount(7);

  // 2ページ目: 押さえておきたい基本（役割5つとコツ）
  await page.getByTestId("guide-next").click();
  await expect(page.getByTestId("guide-page-1")).toContainText("押さえておきたい基本");
  await expect(page.locator(".g-role")).toHaveCount(5);
  await expect(page.locator(".g-tips li").first()).toBeVisible();

  // 3ページ目: 人事が見ているポイント（4つの観点とNG）
  await page.waitForTimeout(400);
  await flick(page, page.locator(".guide-body"), -160);
  await expect(page.getByTestId("guide-page-2")).toContainText("人事が見ているポイント");
  await expect(page.locator(".g-card")).toHaveCount(4);
  await expect(page.locator(".g-ng li")).toHaveCount(4);

  // 右フリックで戻れる
  await page.waitForTimeout(400);
  await flick(page, page.locator(".guide-body"), 160);
  await expect(page.getByTestId("guide-page-1")).toBeVisible();
  await page.getByTestId("guide-tab-2").click();
  await expect(page.getByTestId("guide-page-2")).toBeVisible();

  // 最後のページのボタンでお題選択へ
  await expect(page.getByTestId("guide-next")).toHaveText(/デモを見てみる/);
  await page.getByTestId("guide-next").click();
  await expect(page.getByTestId("carousel")).toBeVisible();
  await expect(guide).toHaveCount(0);

  // 2回目以降はガイドを飛ばしてお題選択から始まる
  await page.reload();
  await expect(page.getByTestId("carousel")).toBeVisible();
  await expect(page.getByTestId("guide")).toHaveCount(0);
  await expect(page.getByTestId("welcome")).toHaveCount(0);
});

test("初回ガイドはスキップもできる", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("welcome-start").click();
  await page.getByTestId("guide-skip").click();
  await expect(page.getByTestId("carousel")).toBeVisible();
});

test("お題選択画面とまとめ画面から、いつでもGDの基本を見返せる", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("gd-demo:intro-seen", "1"));
  await page.goto("/");
  await expect(page.getByTestId("carousel")).toBeVisible();

  // お題選択画面のボタンから開いて閉じる
  await page.getByTestId("open-guide").click();
  await expect(page.getByTestId("guide")).toBeVisible();
  await expect(page.getByTestId("guide-skip")).toHaveCount(0);
  await page.getByTestId("guide-tab-2").click();
  await expect(page.getByTestId("guide-page-2")).toContainText("人事が見ているポイント");
  await expect(page.getByTestId("guide-next")).toHaveText("閉じる");
  await page.getByTestId("guide-close").click();
  await expect(page.getByTestId("carousel")).toBeVisible();

  // まとめ画面からも開ける（閉じるとまとめ画面に戻る）
  await page.getByTestId("topic-biz-cafe").click();
  await page.getByTestId("start-demo").click();
  for (let i = 0; i < 80; i++) {
    if (await page.getByTestId("summary-screen").isVisible()) break;
    await page.getByTestId("key-next").or(page.getByTestId("next")).first().click({ timeout: 3000 }).catch(() => {});
  }
  await expect(page.getByTestId("summary-screen")).toBeVisible();
  await page.getByTestId("summary-guide").click();
  await expect(page.getByTestId("guide")).toBeVisible();
  await page.getByTestId("guide-close").click();
  await expect(page.getByTestId("summary-screen")).toBeVisible();
});
