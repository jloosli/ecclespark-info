import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('/setup route loads successfully', async ({ page }) => {
    const response = await page.goto('/setup');
    expect(response?.status()).toBe(200);
  });

  test('unknown routes redirect to home page', async ({ page }) => {
    await page.goto('/nonexistent');

    // After redirect, URL should be the root path
    await expect(page).toHaveURL('/');

    // Header should be visible on the redirected page
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Eccles Park Ward Information');
  });
});
