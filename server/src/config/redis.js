import IORedis from 'ioredis';

let redis = null;

export function getRedis() {
    if (redis) return redis;
    if (!process.env.REDIS_URL) return null;
    redis = new IORedis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,  // BullMQ 必須設定
        enableReadyCheck: false,
        lazyConnect: true,
    });
    redis.on('error', (e) => {
        // 接続エラーは警告のみ。キューはフォールバックで動作継続
        console.warn('[Redis] Connection error:', e.message);
    });
    return redis;
}
