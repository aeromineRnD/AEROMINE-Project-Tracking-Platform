import { test, expect } from "@playwright/test";

test.describe("Admin flow", () => {
  test("admin dashboard loads with project stats", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
    await expect(page.getByText("Total Projects")).toBeVisible();
  });

  test("admin can navigate to projects list", async ({ page }) => {
    await page.goto("/admin/projects");
    await expect(page.getByText("All Projects")).toBeVisible();
    await expect(page.getByRole("link", { name: /New Project/i })).toBeVisible();
  });

  test("admin project detail shows 3D viewer and stage progress", async ({ page }) => {
    await page.goto("/admin/dashboard");
    // Click first project card
    const card = page.locator("a[href*='/admin/projects/']").first();
    await card.click();
    await expect(page.getByText("3D Construction Model")).toBeVisible();
    await expect(page.getByText("Stage Progress")).toBeVisible();
  });
});
