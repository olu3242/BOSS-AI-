import { test, expect } from "@playwright/test";

/**
 * Gate 2 partial — Auth guard verification.
 * These tests do NOT require real Supabase credentials; they only verify
 * that unauthenticated requests are redirected to sign-in.
 */

test.describe("Auth guard", () => {
  test("unauthenticated /dashboard redirects to sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/auth/sign-in**", { timeout: 10_000 });
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated /businesses redirects to sign-in", async ({ page }) => {
    await page.goto("/businesses");
    await page.waitForURL("**/auth/sign-in**", { timeout: 10_000 });
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated /business/[id]/workspace redirects to sign-in", async ({ page }) => {
    await page.goto("/business/00000000-0000-0000-0000-000000000001/workspace");
    await page.waitForURL("**/auth/sign-in**", { timeout: 10_000 });
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated /onboarding/setup redirects to sign-in", async ({ page }) => {
    await page.goto("/onboarding/setup");
    await page.waitForURL("**/auth/sign-in**", { timeout: 10_000 });
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated /marketplace redirects to sign-in", async ({ page }) => {
    await page.goto("/marketplace");
    await page.waitForURL("**/auth/sign-in**", { timeout: 10_000 });
    await expect(page).toHaveURL(/sign-in/);
  });
});
