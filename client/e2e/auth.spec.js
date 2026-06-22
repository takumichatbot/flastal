import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_EMAIL || 'e2e_test@flastal.test';
const TEST_PASS  = process.env.E2E_PASSWORD || 'E2ePassw0rd!';

test.describe('認証フロー', () => {
  test('未ログインでマイページへアクセスするとログインページにリダイレクト', async ({ page }) => {
    await page.goto('/mypage');
    await expect(page).toHaveURL(/login/);
  });

  test('無効なメールアドレスでログイン失敗', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'notexist@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/メール|パスワード|見つかりません|ログイン/i')).toBeVisible({ timeout: 6000 });
  });

  test('正しい認証情報でログイン成功', async ({ page }) => {
    // E2E専用アカウントが必要。スキップ条件を設定
    test.skip(!process.env.E2E_EMAIL, 'E2E_EMAIL 未設定のためスキップ');
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASS);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/mypage|home|\/$/, { timeout: 10000 });
  });
});
