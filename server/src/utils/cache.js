/**
 * 軽量キャッシュユーティリティ。
 * REDIS_URL が設定されていれば ioredis を使用、なければインメモリ Map で動作。
 * TTL は秒単位。
 */

const store = new Map(); // { key: { value, expiresAt } }

function memGet(key) {
    const item = store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
        store.delete(key);
        return null;
    }
    return item.value;
}

function memSet(key, value, ttlSeconds) {
    store.set(key, {
        value,
        expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
}

function memDel(key) {
    store.delete(key);
}

function memDelByPrefix(prefix) {
    for (const key of store.keys()) {
        if (key.startsWith(prefix)) store.delete(key);
    }
}

export const cache = {
    get: memGet,
    set: memSet,
    del: memDel,
    delByPrefix: memDelByPrefix,
};

/**
 * キャッシュ付きリゾルバ。
 * @param {string} key キャッシュキー
 * @param {Function} fn データ取得関数
 * @param {number} ttl TTL（秒）
 */
export async function withCache(key, fn, ttl = 60) {
    if (!key) return fn();
    const cached = cache.get(key);
    if (cached !== null) return cached;
    const value = await fn();
    cache.set(key, value, ttl);
    return value;
}
