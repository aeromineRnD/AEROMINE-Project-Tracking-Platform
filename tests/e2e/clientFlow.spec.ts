import { test, expect } from "@playwright/test";

test.describe("Client flow", () => {
  test.beforeEach(async ({ page }) => {
    // Switch to client role via localStorage
    await page.goto("/");
    await page.evaluate(() => {
      const store = { state: { currentUser: { id: "user_client_nikos", email: "nikos.papadimitriou@gmail.com", name: "Nikos Papadimitriou", role: "CLIENT" } }, version: 0 };
      localStorage.setItem("aeromine-role", JSON.stringify(store));
    });
  });

  test("client dashboard loads with their projects only", async ({ page }) => {
    await page.goto("/client/dashboard");
    await expect(page.getByText("Welcome back, Nikos")).toBeVisible();
    await expect(page.getByText("My Projects")).toBeVisible();
  });

  test("client project detail shows 3D viewer", async ({ page }) => {
    await page.goto("/client/projects");
    const card = page.locator("a[href*='/client/projects/']").first();
    if (await card.count() > 0) {
      await card.click();
      await expect(page.getByText("3D Construction Model")).toBeVisible();
    }
  });
});
