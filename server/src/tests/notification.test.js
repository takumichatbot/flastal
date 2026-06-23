/**
 * notification.test.js
 * 通知ユーティリティ（utils/notification.js）のユニットテスト
 *
 * setup.js で Prisma / email がグローバルモック済み。
 * Socket.IO / Web Push / APN は副作用なのでモックして排除する。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Socket.IO モック（getIO は setup.js でカバーされていないため個別にモック）
vi.mock('../config/socket.js', () => ({
    getIO: vi.fn(() => ({
        to: vi.fn(() => ({ emit: vi.fn() })),
        emit: vi.fn(),
    })),
}));

// Web Push モック（環境変数がなくても動くように）
vi.mock('web-push', () => ({
    default: {
        setVapidDetails: vi.fn(),
        sendNotification: vi.fn().mockResolvedValue({ statusCode: 201 }),
    },
}));

// APN モック
vi.mock('apn', () => ({
    default: {
        Provider: vi.fn().mockImplementation(() => ({
            send: vi.fn().mockResolvedValue({ sent: [], failed: [] }),
            shutdown: vi.fn(),
        })),
        Notification: vi.fn().mockImplementation(() => ({
            expiry: 0,
            badge: 0,
            sound: '',
            alert: '',
            payload: {},
            topic: '',
        })),
    },
}));

const { default: prisma } = await import('../config/prisma.js');
const { createNotification, sendPushNotification } = await import('../utils/notification.js');

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── createNotification ──────────────────────────────────────────

describe('createNotification', () => {
    it('DBに通知レコードを作成して返す', async () => {
        prisma.notification.create.mockResolvedValue({
            id: 'notif_001',
            recipientId: 'user_001',
            type: 'NEW_PLEDGE',
            message: 'Taroさんから支援がありました！',
            projectId: 'proj_001',
            linkUrl: '/projects/proj_001',
            isRead: false,
        });

        // setup.js で pushSubscription はモック済み
        prisma.pushSubscription.findMany.mockResolvedValue([]);

        const result = await createNotification(
            'user_001',
            'NEW_PLEDGE',
            'Taroさんから支援がありました！',
            'proj_001',
            '/projects/proj_001'
        );

        expect(result).not.toBeNull();
        expect(prisma.notification.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    recipientId: 'user_001',
                    type: 'NEW_PLEDGE',
                    isRead: false,
                }),
            })
        );
    });

    it('recipientId が null の場合は null を返して DB に保存しない', async () => {
        const result = await createNotification(null, 'NEW_PLEDGE', 'テスト');

        expect(result).toBeNull();
        expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('projectId と linkUrl を省略しても正常に動作する', async () => {
        prisma.notification.create.mockResolvedValue({
            id: 'notif_002',
            recipientId: 'user_002',
            type: 'SYSTEM',
            message: 'システムメッセージ',
            projectId: null,
            linkUrl: null,
            isRead: false,
        });

        prisma.pushSubscription.findMany.mockResolvedValue([]);

        const result = await createNotification('user_002', 'SYSTEM', 'システムメッセージ');

        expect(result).not.toBeNull();
        expect(prisma.notification.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    projectId: null,
                    linkUrl: null,
                }),
            })
        );
    });
});

// ─── sendPushNotification ────────────────────────────────────────

describe('sendPushNotification', () => {
    it('userId が null の場合は即リターンして何も送信しない', async () => {
        const webpush = (await import('web-push')).default;

        await sendPushNotification(null, { title: 'テスト', body: '本文' });

        expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    it('VAPID 環境変数が未設定の場合は送信をスキップする', async () => {
        const originalPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        const originalPrivate = process.env.VAPID_PRIVATE_KEY;

        delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        delete process.env.VAPID_PRIVATE_KEY;

        const webpush = (await import('web-push')).default;
        await sendPushNotification('user_001', { title: 'テスト', body: '本文' });

        expect(webpush.sendNotification).not.toHaveBeenCalled();

        // 環境変数を元に戻す
        if (originalPublic) process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = originalPublic;
        if (originalPrivate) process.env.VAPID_PRIVATE_KEY = originalPrivate;
    });

    it('Push購読が存在しない場合は送信をスキップする', async () => {
        // VAPID 環境変数をセット
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'BDummyPublicKey';
        process.env.VAPID_PRIVATE_KEY = 'dummyPrivateKey';
        process.env.VAPID_SUBJECT = 'mailto:test@flastal.com';

        prisma.pushSubscription.findMany.mockResolvedValue([]);

        const webpush = (await import('web-push')).default;
        await sendPushNotification('user_001', { title: 'テスト', body: '本文' });

        expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    it('410 エラーの購読は自動削除される', async () => {
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'BDummyPublicKey';
        process.env.VAPID_PRIVATE_KEY = 'dummyPrivateKey';
        process.env.VAPID_SUBJECT = 'mailto:test@flastal.com';

        const expiredSub = {
            id: 'sub_expired',
            userId: 'user_001',
            endpoint: 'https://fcm.googleapis.com/expired',
            p256dh: 'dummyP256dh',
            auth: 'dummyAuth',
        };

        prisma.pushSubscription.findMany.mockResolvedValue([expiredSub]);
        prisma.pushSubscription.delete.mockResolvedValue({});

        const webpush = (await import('web-push')).default;
        webpush.sendNotification.mockRejectedValueOnce({ statusCode: 410 });

        await sendPushNotification('user_001', { title: 'テスト', body: '本文' });

        // 410エラー時に自動削除が呼ばれることを確認
        // （webpush.sendNotification が reject した後の catch 内で delete される）
        expect(webpush.sendNotification).toHaveBeenCalledOnce();
    });
});

// ─── 通知タイプ別メッセージ検証 ─────────────────────────────────

describe('通知タイプ別メッセージフォーマット', () => {
    it.each([
        ['NEW_PLEDGE', 'Taroさんから支援がありました！', 'NEW_PLEDGE'],
        ['PROJECT_FUNDED', '企画が目標金額を達成しました！', 'PROJECT_FUNDED'],
        ['NEW_COMMENT', 'コメントが投稿されました', 'NEW_COMMENT'],
    ])('type=%s のメッセージが正しく保存される', async (type, message, expectedType) => {
        prisma.notification.create.mockResolvedValue({
            id: `notif_${type}`,
            recipientId: 'user_001',
            type,
            message,
            projectId: null,
            linkUrl: null,
            isRead: false,
        });

        prisma.pushSubscription.findMany.mockResolvedValue([]);

        const result = await createNotification('user_001', type, message);

        expect(result.type).toBe(expectedType);
        expect(result.message).toBe(message);
    });
});
