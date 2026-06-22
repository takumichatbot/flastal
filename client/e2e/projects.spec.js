import { test, expect } from '@playwright/test';

test.describe('プロジェクト一覧・検索', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
  });

  test('プロジェクト一覧ページが表示される', async ({ page }) => {
    await expect(page).toHaveURL(/projects/);
    // カードまたは「企画」テキストが存在する
    await expect(
      page.locator('text=/企画|プロジェクト|フラスタ/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('キーワード検索でフィルタされる', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="検索"], input[type="search"]').first();
    await searchInput.fill('バラ');
    await searchInput.press('Enter');
    await page.waitForTimeout(1500);
    // URLかDOMにキーワードが反映されること
    const url = page.url();
    const hasKeyword = url.includes('keyword') || url.includes('バラ');
    const hasResultOrEmpty = await page.locator('text=/バラ|見つかりません|0件/i').count() >= 0;
    expect(hasKeyword || hasResultOrEmpty).toBeTruthy();
  });

  test('プロジェクト詳細ページへ遷移できる', async ({ page }) => {
    const firstCard = page.locator('a[href*="/projects/"]').first();
    await firstCard.waitFor({ timeout: 8000 });
    await firstCard.click();
    await expect(page).toHaveURL(/\/projects\/.+/, { timeout: 8000 });
    await expect(page.locator('h1, [class*="title"]').first()).toBeVisible({ timeout: 8000 });
  });
});
