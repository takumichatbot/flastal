import client from 'prom-client';

// デフォルトメトリクス（CPU, メモリ, イベントループ遅延など）
client.collectDefaultMetrics({ prefix: 'flastal_' });

// カスタムメトリクス
export const httpRequestDuration = new client.Histogram({
    name: 'flastal_http_request_duration_seconds',
    help: 'HTTP リクエスト処理時間',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

export const pledgeCounter = new client.Counter({
    name: 'flastal_pledges_total',
    help: '支援回数の合計',
    labelNames: ['payment_method'],
});

export const activeProjectsGauge = new client.Gauge({
    name: 'flastal_active_projects',
    help: '現在募集中の企画数',
});

export const register = client.register;

// Express ミドルウェア: レスポンス時間を記録
export function metricsMiddleware(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const route = req.route?.path || req.path || 'unknown';
        httpRequestDuration
            .labels(req.method, route, res.statusCode.toString())
            .observe((Date.now() - start) / 1000);
    });
    next();
}
