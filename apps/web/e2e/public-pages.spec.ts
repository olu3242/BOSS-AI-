import { test, expect } from "@playwright/test";

/**
 * Gate 1 partial — Public page availability and content verification.
 * No authentication required.
 */

test.describe("Public pages", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/BOSS/i);
    // Marketing nav is present
    await expect(page.getByRole("link", { name: /features/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /pricing/i }).first()).toBeVisible();
  });

  test("features page renders feature groups", async ({ page }) => {
    await page.goto("/features");
    await expect(page.getByRole("heading", { name: /features/i }).first()).toBeVisible();
    // At least one feature group heading is present
    await expect(page.getByText(/intelligence/i).first()).toBeVisible();
  });

  test("pricing page renders three tiers", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText(/starter/i).first()).toBeVisible();
    await expect(page.getByText(/growth/i).first()).toBeVisible();
    await expect(page.getByText(/enterprise/i).first()).toBeVisible();
  });

  test("privacy policy page renders", async ({ page }) => {
    await page.goto("/legal/privacy");
    await expect(page.getByRole("heading", { name: /privacy/i }).first()).toBeVisible();
  });

  test("terms of service page renders", async ({ page }) => {
    await page.goto("/legal/terms");
    await expect(page.getByRole("heading", { name: /terms/i }).first()).toBeVisible();
  });

  test("sign-in page renders form", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("sign-up page renders form", async ({ page }) => {
    await page.goto("/auth/sign-up");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign up|create account/i })).toBeVisible();
  });

  test("landing page footer legal links are real routes", async ({ page }) => {
    await page.goto("/");
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const privacyLink = page.getByRole("link", { name: /privacy/i });
    const termsLink = page.getByRole("link", { name: /terms/i });
    // Verify hrefs are not anchor-only placeholders
    const privacyHref = await privacyLink.first().getAttribute("href");
    const termsHref = await termsLink.first().getAttribute("href");
    expect(privacyHref).toMatch(/\/legal\/privacy/);
    expect(termsHref).toMatch(/\/legal\/terms/);
  });
});
