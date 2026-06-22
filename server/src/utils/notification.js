import prisma from '../config/prisma.js';
import { getIO } from '../config/socket.js';
import webpush from 'web-push';
import apn from 'apn';

/**
 * 共通通知作成関数
 * DBへの保存 + Socket.IO + Web Push (VAPID) を同時に行います
 */
export async function createNotification(recipientId, type, message, projectId = null, linkUrl = null) {
    if (!recipientId) {
        console.warn('[Notification Warning] No recipientId provided.');
        return null;
    }

    try {
        // 1. DBに保存
        const notification = await prisma.notification.create({
            data: {
                recipientId,
                type,
                message,
                projectId,
                linkUrl,
                isRead: false
            },
        });

        // 2. リアルタイム通知を送信 (Socket.IO)
        try {
            const io = getIO();
            if (io) {
                io.to(recipientId).emit('newNotification', notification);
            }
        } catch (socketError) {
            console.warn('[Socket Warning] Could not emit notification via socket:', socketError.message);
        }

        // 3. Web Push 通知 (ブラウザ購読者向け)
        if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
            try {
                const subscriptions = await prisma.pushSubscription.findMany({
                    where: {
                        userId: recipientId,
                        endpoint: { not: { startsWith: 'apns:' } },
                    },
                });

                const payload = JSON.stringify({
                    title: 'FLASTAL',
                    body: message,
                    url: linkUrl || '/mypage',
                });

                await Promise.allSettled(
                    subscriptions.map(sub =>
                        webpush.sendNotification(
                            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                            payload
                        ).catch(async (err) => {
                            // 購読が無効 (410 Gone) の場合は削除
                            if (err.statusCode === 410) {
                                await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
                            }
                        })
                    )
                );
            } catch (pushError) {
                console.warn('[WebPush Warning]', pushError.message);
            }
        }

        // 4. APNs ネイティブ push 通知 (iOS Capacitor アプリ向け)
        if (
            process.env.APNS_KEY_ID &&
            process.env.APNS_TEAM_ID &&
            process.env.APNS_BUNDLE_ID &&
            process.env.APNS_KEY_CONTENT
        ) {
            try {
                const apnsSubscriptions = await prisma.pushSubscription.findMany({
                    where: {
                        userId: recipientId,
                        endpoint: { startsWith: 'apns:' },
                    },
                });

                if (apnsSubscriptions.length > 0) {
                    const provider = new apn.Provider({
                        token: {
                            key: Buffer.from(process.env.APNS_KEY_CONTENT, 'base64').toString('utf-8'),
                            keyId: process.env.APNS_KEY_ID,
                            teamId: process.env.APNS_TEAM_ID,
                        },
                        production: process.env.NODE_ENV === 'production',
                    });

                    const note = new apn.Notification();
                    note.expiry = Math.floor(Date.now() / 1000) + 3600;
                    note.badge = 1;
                    note.sound = 'ping.aiff';
                    note.alert = { title: 'FLASTAL', body: message };
                    note.topic = process.env.APNS_BUNDLE_ID;
                    note.payload = { url: linkUrl || '/mypage' };

                    const deviceTokens = apnsSubscriptions.map(s => s.endpoint.replace('apns:', ''));
                    await provider.send(note, deviceTokens);
                    provider.shutdown();
                }
            } catch (apnsError) {
                console.warn('[APNs Warning]', apnsError.message);
            }
        }

        return notification;
    } catch (error) {
        console.error(`[Notification Error] Failed to create notification for user ${recipientId}:`, error);
        return null;
    }
}