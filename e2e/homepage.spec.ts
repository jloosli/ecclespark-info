import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('header is visible with expected text', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Eccles Park Ward Information');
    await expect(header).toContainText(
      'The Church of Jesus Christ of Latter-day Saints',
    );
  });

  test('shows loading state then transitions to content', async ({ page }) => {
    await page.goto('/');

    // The page should eventually show either broadcast results or a no-results message.
    // We wait for one of the two terminal states to appear.
    const results = page.locator('app-results');
    const noResults = page.getByText('No upcoming broadcasts are scheduled');

    await expect(results.or(noResults)).toBeVisible({ timeout: 15_000 });
  });
});
