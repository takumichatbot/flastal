import prisma from '../config/prisma.js';

export const getStretchGoals = async (req, res) => {
    const { projectId } = req.params;
    try {
        const goals = await prisma.stretchGoal.findMany({
            where: { projectId },
            orderBy: { order: 'asc' },
        });
        res.json(goals);
    } catch {
        res.status(500).json({ message: '取得に失敗しました' });
    }
};

export const createStretchGoal = async (req, res) => {
    const { projectId } = req.params;
    const { targetAmount, title, description, order = 0 } = req.body;
    const userId = req.user.id;

    if (!targetAmount || !title?.trim()) {
        return res.status(400).json({ message: '目標金額とタイトルは必須です' });
    }

    try {
        const project = await prisma.project.findUnique({ where: { id: projectId }, select: { plannerId: true, members: { select: { userId: true } } } });
        if (!project) return res.status(404).json({ message: '企画が見つかりません' });

        const isAuthorized = project.plannerId === userId || project.members?.some(m => m.userId === userId);
        if (!isAuthorized) return res.status(403).json({ message: '権限がありません' });

        const goal = await prisma.stretchGoal.create({
            data: { projectId, targetAmount: parseInt(targetAmount), title, description: description || '', order: parseInt(order) },
        });
        res.status(201).json(goal);
    } catch {
        res.status(500).json({ message: '作成に失敗しました' });
    }
};

export const deleteStretchGoal = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const goal = await prisma.stretchGoal.findUnique({
            where: { id },
            include: { project: { select: { plannerId: true } } },
        });
        if (!goal) return res.status(404).json({ message: '見つかりません' });
        if (goal.project.plannerId !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: '権限がありません' });
        }
        await prisma.stretchGoal.delete({ where: { id } });
        res.json({ success: true });
    } catch {
        res.status(500).json({ message: '削除に失敗しました' });
    }
};

// Webhook 経由で collectedAmount 更新時に達成チェック（ノンブロッキングで呼ぶ）
export async function checkStretchGoalAchievements(projectId, collectedAmount) {
    try {
        const goals = await prisma.stretchGoal.findMany({
            where: { projectId, achieved: false, targetAmount: { lte: collectedAmount } },
        });
        if (goals.length === 0) return;
        await prisma.stretchGoal.updateMany({
            where: { id: { in: goals.map(g => g.id) } },
            data: { achieved: true, achievedAt: new Date() },
        });
    } catch { /* non-critical */ }
}
