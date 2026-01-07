import prisma from '../config/prisma.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// 主催者ログイン
export const loginOrganizer = async (req, res) => {
    const { email, password } = req.body;
    try {
        const organizer = await prisma.organizer.findUnique({ where: { email } });
        if (!organizer) {
            return res.status(401).json({ message: 'メールアドレスまたはパスワードが正しくありません。' });
        }

        const isMatch = await bcrypt.compare(password, organizer.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'メールアドレスまたはパスワードが正しくありません。' });
        }

        const token = jwt.sign(
            { id: organizer.id, email: organizer.email, role: 'ORGANIZER' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ 
            token, 
            organizer: { 
                id: organizer.id, 
                name: organizer.name, 
                role: 'ORGANIZER',
                status: organizer.status
            } 
        });
    } catch (e) {
        console.error('loginOrganizer Error:', e);
        res.status(500).json({ message: 'ログイン処理に失敗しました。' });
    }
};

/**
 * ★ 主催者によるイベント作成 ★
 * 主催者画面からの作成なので sourceType を強制的に OFFICIAL にします
 */
export const createOrganizerEvent = async (req, res) => {
    try {
        const body = req.body;
        const userId = req.user.id; // 主催者のID

        const name = body.title || body.eventName;
        const targetVenueId = body.venueId || (body.venue ? body.venue.id : null);

        if (!name || !body.eventDate || !targetVenueId) {
            return res.status(400).json({ message: '入力内容が不足しています。' });
        }

        const event = await prisma.event.create({
            data: {
                title: name,
                description: body.description || '',
                eventDate: new Date(body.eventDate),
                venue: { connect: { id: targetVenueId } },
                organizer: { connect: { id: userId } }, // 主催者として紐付け
                sourceType: 'OFFICIAL', // ★ ここで公式に固定
                isStandAllowed: true
            }
        });

        res.status(201).json(event);
    } catch (e) {
        console.error('createOrganizerEvent Error:', e);
        res.status(500).json({ message: 'イベントの作成に失敗しました。' });
    }
};

/**
 * ★ 主催者のイベント一覧取得 ★
 */
export const getOrganizerEvents = async (req, res) => {
    try {
        const userId = req.user.id;
        const events = await prisma.event.findMany({
            where: {
                OR: [
                    { organizerId: userId },
                    { creatorId: userId }
                ]
            },
            include: {
                venue: { select: { venueName: true } },
                _count: { select: { projects: true } }
            },
            orderBy: { eventDate: 'desc' }
        });
        res.json(events || []);
    } catch (e) {
        console.error('getOrganizerEvents Error:', e);
        res.status(500).json({ message: 'データの取得に失敗しました。' });
    }
};

/**
 * ★ 主催者によるイベント更新 ★
 */
export const updateOrganizerEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // 権限確認
        const existing = await prisma.event.findUnique({ where: { id } });
        if (!existing || (existing.organizerId !== userId && existing.creatorId !== userId)) {
            return res.status(403).json({ message: '編集権限がありません。' });
        }

        const name = req.body.title || req.body.eventName;
        const updated = await prisma.event.update({
            where: { id },
            data: {
                title: name,
                description: req.body.description,
                eventDate: req.body.eventDate ? new Date(req.body.eventDate) : undefined,
                // 更新しても OFFICIAL 属性は維持
                sourceType: 'OFFICIAL'
            }
        });
        res.json(updated);
    } catch (e) {
        console.error('updateOrganizerEvent Error:', e);
        res.status(500).json({ message: '更新に失敗しました。' });
    }
};

/**
 * ★ 主催者によるイベント削除 ★
 */
export const deleteOrganizerEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const existing = await prisma.event.findUnique({ where: { id } });
        if (!existing || (existing.organizerId !== userId && existing.creatorId !== userId)) {
            return res.status(403).json({ message: '削除権限がありません。' });
        }

        await prisma.event.delete({ where: { id } });
        res.status(204).send();
    } catch (e) {
        console.error('deleteOrganizerEvent Error:', e);
        res.status(500).json({ message: '削除に失敗しました。' });
    }
};