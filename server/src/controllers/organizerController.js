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
 * ★ 修正: 主催者のイベント取得 ★
 * Projectテーブルではなく、Eventテーブルを直接取得するように変更します
 */
export const getOrganizerEvents = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`[OrganizerController] Fetching events for ID: ${userId}`);

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

        console.log(`[OrganizerController] Found ${events.length} events`);
        res.json(events || []);
    } catch (e) {
        console.error('getOrganizerEvents Error:', e);
        res.status(500).json({ message: 'データの取得に失敗しました。' });
    }
};