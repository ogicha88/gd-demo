import { test } from "@playwright/test";

// 目視確認用: デモの各場面のスクリーンショットを撮る（WALKTHROUGH=1 のときだけ実行）
test.skip(!process.env.WALKTHROUGH, "目視確認用");

test("walkthrough", async ({ page }) => {
  const out = process.env.SHOT_DIR ?? "shots";
  const shot = (name: string) => page.screenshot({ path: `${out}/${name}.png` });
  await page.goto("/");
  await page.getByTestId("topic-biz-cafe").waitFor();
  await page.waitForTimeout(800);
  await shot("01-home");
  await page.getByTestId("topic-biz-cafe").click();
  await page.waitForTimeout(900);
  await shot("02-sheet");
  await page.getByTestId("start-demo").click();
  await page.waitForTimeout(2600);
  await shot("03-demo-start");
  await page.getByTestId("key-card").waitFor({ timeout: 30_000 });
  await page.waitForTimeout(900);
  await shot("04-key-1");
  await page.getByTestId("key-next").click();
  await page.waitForTimeout(6000);
  await shot("05-roles-deciding");
  await page.getByTestId("key-card").waitFor({ timeout: 60_000 });
  await page.waitForTimeout(900);
  await shot("06-key-2");
  for (let i = 0; i < 12; i++) await page.getByTestId("next").or(page.getByTestId("key-next")).first().click();
  await page.waitForTimeout(2500);
  await shot("07-mid");
  await page.getByTestId("board-btn").click().catch(() => {});
  await page.waitForTimeout(700);
  await shot("08-board");
  await page.mouse.click(10, 10);
  await page.waitForTimeout(500);
  for (let i = 0; i < 40; i++) {
    if (await page.getByTestId("summary-screen").isVisible()) break;
    await page.getByTestId("next").or(page.getByTestId("key-next")).first().click();
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(1200);
  await shot("09-summary");
});
