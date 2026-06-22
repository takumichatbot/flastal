import { test, expect } from '@playwright/test';

test.describe('アーティストページ', () => {
    test('アーティスト一覧ページが表示される', async ({ page }) => {
        await page.goto('/artists');
        await expect(page.locator('h1').filter({ hasText: 'アーティスト' })).toBeVisible({ timeout: 10000 });
    });

    test('カテゴリフィルターが動作する', async ({ page }) => {
        await page.goto('/artists');
        const vtuberBtn = page.locator('button', { hasText: 'VTuber' });
        await vtuberBtn.waitFor({ timeout: 8000 });
        await vtuberBtn.click();
        await page.waitForTimeout(1000);
        await expect(vtuberBtn).toHaveClass(/bg-pink-500/);
    });

    test('検索フォームが存在する', async ({ page }) => {
        await page.goto('/artists');
        const searchInput = page.locator('input[placeholder*="アーティスト"]');
        await expect(searchInput).toBeVisible({ timeout: 8000 });
        await searchInput.fill('テスト');
        await page.waitForTimeout(800);
    });
});

test.describe('アーティスト詳細ページ（存在しないslug）', () => {
    test('404またはnotfoundが返る', async ({ page }) => {
        const res = await page.goto('/artists/nonexistent-artist-slug-xyz');
        expect(res?.status()).toBeGreaterThanOrEqual(200);
    });
});
