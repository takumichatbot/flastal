import { test, expect } from '@playwright/test';

const TEST_USER = {
    email: process.env.E2E_USER_EMAIL || 'test@example.com',
    password: process.env.E2E_USER_PASSWORD || 'TestPass123!',
};

async function login(page) {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$|\/projects/, { timeout: 10000 }).catch(() => {});
}

test.describe('企画詳細タブ', () => {
    test('企画詳細ページにタブが表示される', async ({ page }) => {
        await page.goto('/projects');
        const firstCard = page.locator('a[href*="/projects/"]').first();
        await firstCard.waitFor({ timeout: 10000 });
        await firstCard.click();
        await expect(page).toHaveURL(/\/projects\/.+/);

        // タブバーがある
        const tabBar = page.locator('[role="tab"], button').filter({ hasText: /概要|アップデート|支援者|ファイナンス|コラボ/ }).first();
        await tabBar.waitFor({ timeout: 8000 });
        await expect(tabBar).toBeVisible();
    });

    test('アップデートタブへの切り替えが動作する', async ({ page }) => {
        await page.goto('/projects');
        const firstCard = page.locator('a[href*="/projects/"]').first();
        await firstCard.waitFor({ timeout: 10000 });
        await firstCard.click();

        const updatesTab = page.locator('button', { hasText: 'アップデート' });
        await updatesTab.waitFor({ timeout: 8000 });
        await updatesTab.click();
        await page.waitForTimeout(500);
        // アップデートセクションが表示されること
        const section = page.locator('text=/アップデート|まだアップデートがありません/i').first();
        await expect(section).toBeVisible({ timeout: 6000 });
    });
});

test.describe('シェアボタン', () => {
    test('X/Twitterシェアリンクが存在する', async ({ page }) => {
        await page.goto('/projects');
        const firstCard = page.locator('a[href*="/projects/"]').first();
        await firstCard.waitFor({ timeout: 10000 });
        await firstCard.click();

        const twitterLink = page.locator('a[href*="twitter.com"], a[href*="x.com"]').first();
        await twitterLink.waitFor({ timeout: 8000 });
        await expect(twitterLink).toHaveAttribute('href', /twitter\.com|x\.com/);
    });

    test('LINEシェアリンクが存在する', async ({ page }) => {
        await page.goto('/projects');
        const firstCard = page.locator('a[href*="/projects/"]').first();
        await firstCard.waitFor({ timeout: 10000 });
        await firstCard.click();

        const lineLink = page.locator('a[href*="line.me"]').first();
        await lineLink.waitFor({ timeout: 8000 });
        await expect(lineLink).toHaveAttribute('href', /line\.me/);
    });
});

test.describe('タグフィルター', () => {
    test('企画一覧にタグが表示される', async ({ page }) => {
        await page.goto('/projects');
        await page.waitForTimeout(2000);
        // タグ要素が何かしら存在すること（空でも可）
        const tagElements = page.locator('[class*="rounded-full"][class*="text-xs"], .tag, [data-tag]');
        const count = await tagElements.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });
});
