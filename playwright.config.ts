import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  timeout: 240_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:5173",
    ...devices["iPhone 13"],
    browserName: "chromium",
    screenshot: "only-on-failure",
  },
});
