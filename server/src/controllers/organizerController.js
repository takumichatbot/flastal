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

// 主催者プロフィール取得
export const getOrganizerProfile = async (req, res) => {
    try {
        const organizer = await prisma.organizer.findUnique({
            where: { id: req.user.id }
        });
        if (!organizer) return res.status(404).json({ message: '主催者が見つかりません' });
        const { password, ...cleanData } = organizer;
        res.json(cleanData);
    } catch (e) {
        res.status(500).json({ message: 'プロフィールの取得に失敗しました' });
    }
};

// 主催者プロフィール更新 (歯車ボタン)
export const updateOrganizerProfile = async (req, res) => {
    const { id } = req.params;
    const { name, website, email } = req.body;
    const userId = req.user.id;

    if (id !== userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: '権限がありません。' });
    }

    try {
        const updated = await prisma.organizer.update({
            where: { id: id },
            data: {
                name: name || undefined,
                website: website || undefined,
                email: email || undefined
            }
        });
        const { password, ...cleanData } = updated;
        res.json(cleanData);
    } catch (e) {
        console.error('updateOrganizerProfile Error:', e);
        res.status(500).json({ message: 'プロフィールの更新に失敗しました。' });
    }
};

// 主催者によるイベント作成
export const createOrganizerEvent = async (req, res) => {
    try {
        const body = req.body;
        const userId = req.user.id;

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
                organizer: { connect: { id: userId } },
                sourceType: 'OFFICIAL',
                isStandAllowed: true
            }
        });

        res.status(201).json(event);
    } catch (e) {
        console.error('createOrganizerEvent Error:', e);
        res.status(500).json({ message: 'イベントの作成に失敗しました。' });
    }
};

// 主催者のイベント一覧取得
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
        res.status(500).json({ message: 'データの取得に失敗しました。' });
    }
};

// 主催者によるイベント更新
export const updateOrganizerEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

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
                venueId: req.body.venueId || undefined,
                sourceType: 'OFFICIAL'
            }
        });
        res.json(updated);
    } catch (e) {
        res.status(500).json({ message: '更新に失敗しました。' });
    }
};

// 主催者によるイベント削除
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
        res.status(500).json({ message: '削除に失敗しました。' });
    }
};