import { type Page, expect } from "@playwright/test";

export const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "e2e-test@example.com";
export const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "Test1234!";
export const TEST_ORG_NAME = "E2E Test Business";

/** Navigate to sign-in page and authenticate with test credentials. */
export async function signIn(page: Page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await page.goto("/auth/sign-in");
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  // Wait for redirect away from sign-in
  await page.waitForURL((url) => !url.pathname.startsWith("/auth/sign-in"), { timeout: 15_000 });
}

/** Wait for the dashboard to finish loading (skeleton → data or empty state). */
export async function waitForDashboard(page: Page) {
  await page.waitForURL("**/dashboard**", { timeout: 15_000 });
  // Wait for skeleton to resolve (either real data tile or empty state)
  await expect(
    page.locator('[data-testid="stat-tile"], [data-testid="empty-state"], [data-testid="dashboard-error"]')
  ).toBeVisible({ timeout: 20_000 });
}
