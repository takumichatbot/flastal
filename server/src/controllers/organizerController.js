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

        // トークンにロールを含める
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

// 主催者のダッシュボード用イベント取得
export const getOrganizerEvents = async (req, res) => {
    try {
        // 主催者が Planner として紐付いているプロジェクト、または直接関連するイベントを取得
        const projects = await prisma.project.findMany({
            where: { plannerId: req.user.id },
            include: {
                event: {
                    include: { venue: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // フロントエンドが期待するイベント形式に整形
        const events = projects
            .filter(p => p.event)
            .map(p => ({
                ...p.event,
                relatedProjectId: p.id,
                projectTitle: p.title
            }));

        res.json(events || []);
    } catch (e) {
        console.error('getOrganizerEvents Error:', e);
        res.status(500).json({ message: 'データの取得に失敗しました。' });
    }
};