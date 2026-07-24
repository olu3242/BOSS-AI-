import { test, expect } from "@playwright/test";

/**
 * Gate 4 — Onboarding flow E2E.
 * Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD environment variables
 * pointing to a real Supabase test account that has been pre-verified
 * but has NO existing organization.
 *
 * Skip in CI unless E2E_ONBOARDING_ENABLED=true to avoid dependency on
 * a live Supabase project during standard CI runs.
 */

const ONBOARDING_ENABLED = process.env.E2E_ONBOARDING_ENABLED === "true";

test.describe("Onboarding flow", () => {
  test.skip(!ONBOARDING_ENABLED, "Set E2E_ONBOARDING_ENABLED=true and provide test credentials to run");

  test("sign-in → onboarding → dashboard", async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL ?? "";
    const password = process.env.E2E_TEST_PASSWORD ?? "";
    expect(email).toBeTruthy();
    expect(password).toBeTruthy();

    // 1. Sign in
    await page.goto("/auth/sign-in");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();

    // 2. Expect redirect to onboarding (new account) or dashboard (existing)
    await page.waitForURL((url) => url.pathname.startsWith("/onboarding") || url.pathname.startsWith("/dashboard"), {
      timeout: 20_000,
    });

    if (page.url().includes("/onboarding/organization")) {
      // 3. Create organization
      await expect(page.getByRole("heading", { name: /organization|business name/i })).toBeVisible();
      await page.getByRole("textbox").first().fill("E2E Test Org");
      await page.getByRole("button", { name: /continue|create|next/i }).click();
      await page.waitForURL("**/onboarding/setup**", { timeout: 15_000 });
    }

    if (page.url().includes("/onboarding/setup")) {
      // 4. Complete onboarding wizard
      // Step 1: Business name + industry
      await page.getByRole("textbox", { name: /business name/i }).fill("E2E Test Company");
      const industrySelect = page.getByRole("combobox").first();
      if (await industrySelect.isVisible()) {
        await industrySelect.selectOption({ index: 1 });
      }
      await page.getByRole("button", { name: /next|continue/i }).click();

      // Steps 2-5: Fill minimally and advance
      for (let step = 2; step <= 5; step++) {
        const nextBtn = page.getByRole("button", { name: /next|continue/i });
        if (await nextBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await nextBtn.click();
        }
        await page.waitForTimeout(500);
      }

      // Step 6: AI workforce — submit triggers business creation
      const launchBtn = page.getByRole("button", { name: /launch|create|finish|submit/i });
      if (await launchBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await launchBtn.click();
      }

      // Step 7: Launch confirmation
      await expect(page.getByText(/workspace|ready|launched|created/i).first()).toBeVisible({ timeout: 30_000 });
    }

    // Eventually ends at dashboard or workspace
    await expect(page).toHaveURL(/(dashboard|workspace)/);
  });
});
