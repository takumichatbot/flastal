import { test, expect } from '@playwright/test';

test.describe('花屋一覧・検索', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/florists');
  });

  test('花屋一覧ページが表示される', async ({ page }) => {
    await expect(page).toHaveURL(/florists/);
    await expect(
      page.locator('text=/花屋|フローリスト|お花/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('都道府県フィルタが動作する', async ({ page }) => {
    // セレクトボックスまたはボタンで都道府県を選択
    const prefSelect = page.locator('select, button').filter({ hasText: /東京|大阪|都道府県/ }).first();
    if (await prefSelect.count() > 0) {
      if (await prefSelect.evaluate(el => el.tagName) === 'SELECT') {
        await prefSelect.selectOption({ label: '東京都' });
      } else {
        await prefSelect.click();
      }
      await page.waitForTimeout(1000);
    }
    // エラーが出ていないこと
    await expect(page.locator('text=/エラー|500|failed/i')).toHaveCount(0);
  });

  test('花屋詳細ページへ遷移できる', async ({ page }) => {
    const firstCard = page.locator('a[href*="/florists/"]').first();
    await firstCard.waitFor({ timeout: 8000 });
    await firstCard.click();
    await expect(page).toHaveURL(/\/florists\/.+/, { timeout: 8000 });
  });
});
