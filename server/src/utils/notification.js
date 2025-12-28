import prisma from '../config/prisma.js';
import { getIO } from '../config/socket.js'; // ★ 追加

/**
 * 共通通知作成関数
 * DBへの保存とSocket.IOによるリアルタイム通知を同時に行います
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
                // フロントエンド側で socket.emit('joinRoom', userId) して
                // 自分のIDのルームに入っている前提で送信します
                io.to(recipientId).emit('newNotification', notification);
            }
        } catch (socketError) {
            // サーバー起動直後など、Socket準備前でもDB保存は成功させるためエラーは握りつぶす
            console.warn('[Socket Warning] Could not emit notification via socket:', socketError.message);
        }
        
        return notification;
    } catch (error) {
        console.error(`[Notification Error] Failed to create notification for user ${recipientId}:`, error);
        return null;
    }
}