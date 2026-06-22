import { test, expect } from '@playwright/test';

// 支援フローはStripe決済を伴うため、実際の課金は発生しない staging/mock 環境でのみ実行
test.describe('支援（Pledge）フロー', () => {
  test('ログインなしで支援しようとするとログインへ誘導', async ({ page }) => {
    await page.goto('/projects');
    const firstProject = page.locator('a[href*="/projects/"]').first();
    await firstProject.waitFor({ timeout: 8000 });
    await firstProject.click();
    await expect(page).toHaveURL(/\/projects\/.+/, { timeout: 8000 });

    // 支援ボタンを探してクリック
    const pledgeBtn = page.locator('button, a').filter({ hasText: /支援する|支援|応援/ }).first();
    if (await pledgeBtn.count() > 0) {
      await pledgeBtn.click();
      // ログイン誘導モーダルまたはページへ遷移
      await expect(
        page.locator('text=/ログイン|サインイン|会員登録/i').first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('支援完了ページ（/success）にアクセスしても壊れない', async ({ page }) => {
    await page.goto('/payment/success?session_id=test_dummy');
    // エラーページ（500, 404）ではないこと
    await expect(page.locator('text=/500|Internal Server Error/i')).toHaveCount(0);
  });
});
