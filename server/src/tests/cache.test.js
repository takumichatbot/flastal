import { describe, it, expect, vi, beforeEach } from 'vitest';

// setup.js のモックより先にインポートしてよい（utils はモック対象外）
const { cache, withCache } = await import('../utils/cache.js');

beforeEach(() => {
    // テスト間でキャッシュをリセット
    cache.delByPrefix('');
});

describe('cache', () => {
    it('set/get でキャッシュを保存・取得できる', () => {
        cache.set('key1', { data: 'hello' }, 60);
        expect(cache.get('key1')).toEqual({ data: 'hello' });
    });

    it('TTL 0 秒後はすでに期限切れとして扱われる', async () => {
        cache.set('key2', 'value', -1); // 過去の期限
        expect(cache.get('key2')).toBeNull();
    });

    it('del でキャッシュを削除できる', () => {
        cache.set('key3', 'v', 60);
        cache.del('key3');
        expect(cache.get('key3')).toBeNull();
    });

    it('delByPrefix でプレフィックス一致キーを一括削除する', () => {
        cache.set('projects:public', [1, 2], 60);
        cache.set('projects:user:1', [3], 60);
        cache.set('florists:public', [4], 60);
        cache.delByPrefix('projects:');
        expect(cache.get('projects:public')).toBeNull();
        expect(cache.get('projects:user:1')).toBeNull();
        expect(cache.get('florists:public')).toEqual([4]);
    });
});

describe('withCache', () => {
    it('初回はfnを呼び、2回目はキャッシュから返す', async () => {
        const fn = vi.fn().mockResolvedValue('fetched');
        const r1 = await withCache('wc1', fn, 60);
        const r2 = await withCache('wc1', fn, 60);
        expect(r1).toBe('fetched');
        expect(r2).toBe('fetched');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('key が null のときは常に fn を呼ぶ', async () => {
        const fn = vi.fn().mockResolvedValue('dynamic');
        await withCache(null, fn, 60);
        await withCache(null, fn, 60);
        expect(fn).toHaveBeenCalledTimes(2);
    });
});
