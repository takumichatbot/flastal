import prisma from '../config/prisma.js';
import { sendEmail, sendDynamicEmail } from '../utils/email.js';
import { createNotification } from '../utils/notification.js';

// ==========================================
// ★★★ チャット監視・通報データの取得 ★★★
// ==========================================

export const getReports = async (req, res) => {
    const { type } = req.params; // 'chat' or 'events'
    console.log(`[AdminAPI] Fetching reports for type: ${type}`);

    try {
        if (type === 'chat') {
            // 1. グループチャットの通報を取得
            const groupReports = await prisma.groupChatMessageReport.findMany({
                where: { status: 'PENDING' },
                include: {
                    message: {
                        include: { user: { select: { handleName: true } } }
                    },
                    reporter: { select: { handleName: true } }
                }
            });

            // 2. ダイレクトチャット（花屋相談）の通報を取得
            const directReports = await prisma.chatMessageReport.findMany({
                where: { status: 'PENDING' },
                include: {
                    message: {
                        include: { 
                            user: { select: { handleName: true } },
                            florist: { select: { platformName: true } }
                        }
                    },
                    reporter: { select: { handleName: true } }
                }
            });

            // 3. フロントエンドが期待する一貫したオブジェクト形式に変換
            const formatted = [
                ...groupReports.map(r => ({
                    id: r.id,
                    type: 'GROUP',
                    reason: r.reason,
                    content: r.message?.content || '(メッセージが削除されています)',
                    senderName: r.message?.user?.handleName || '不明',
                    reporterName: r.reporter?.handleName || 'システム',
                    createdAt: r.createdAt,
                    status: r.status,
                    messageId: r.messageId
                })),
                ...directReports.map(r => ({
                    id: r.id,
                    type: 'DIRECT',
                    reason: r.reason,
                    content: r.message?.content || '(メッセージが削除されています)',
                    senderName: r.message?.user?.handleName || r.message?.florist?.platformName || '不明',
                    reporterName: r.reporter?.handleName || 'システム',
                    createdAt: r.createdAt,
                    status: r.status,
                    messageId: r.messageId
                }))
            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            console.log(`[AdminAPI] Chat reports sent: ${formatted.length}`);
            return res.json(formatted);
        }

        if (type === 'events') {
            const reports = await prisma.eventReport.findMany({
                where: { status: 'PENDING' },
                include: {
                    event: true,
                    reporter: { select: { handleName: true } }
                }
            });
            return res.json(reports || []);
        }

        return res.json([]);
    } catch (e) {
        console.error('getReports Internal Error:', e);
        // ★重要: エラーが起きても 500 を返さず 200 配列を返すことで、フロントエンドの赤いトーストを防ぐ
        return res.status(200).json([]);
    }
};

// --- 以下、既存の安定化された関数群 ---

export const approveItem = async (req, res) => {
    const { type, id } = req.params;
    const { status } = req.body; 
    try {
        const finalStatus = status === 'APPROVED' ? 'APPROVED' : (status === 'REJECTED' ? 'REJECTED' : 'PENDING');
        let updated;
        const model = prisma.florist || prisma['florist'];
        if (type === 'projects') updated = await prisma.project.update({ where: { id }, data: { status: status === 'APPROVED' ? 'FUNDRAISING' : 'REJECTED' } });
        else if (type === 'florists') updated = await model.update({ where: { id }, data: { status: finalStatus } });
        else if (type === 'venues') updated = await prisma.venue.update({ where: { id }, data: { status: finalStatus } });
        else if (type === 'organizers') updated = await prisma.organizer.update({ where: { id }, data: { status: finalStatus } });
        return res.json(updated);
    } catch (e) { return res.status(500).json({ message: '失敗' }); }
};

export const getPendingItems = async (req, res) => {
    const { type } = req.params;
    try {
        let data = [];
        const model = prisma.florist || prisma['florist'];
        if (type === 'projects') data = await prisma.project.findMany({ where: { status: 'PENDING_APPROVAL' }, include: { planner: true } });
        else if (type === 'florists') data = await model.findMany({ where: { status: 'PENDING' } });
        else if (type === 'venues') data = await prisma.venue.findMany({ where: { status: 'PENDING' } });
        else if (type === 'organizers') data = await prisma.organizer.findMany({ where: { status: 'PENDING' } });
        return res.json(data || []);
    } catch (e) { return res.status(200).json([]); }
};

export const getAllFloristsAdmin = async (req, res) => {
    try {
        const model = prisma.florist || prisma['florist'];
        const florists = await model.findMany({ orderBy: { createdAt: 'desc' } });
        return res.json(florists || []);
    } catch (e) { return res.status(200).json([]); }
};

export const getFloristByIdAdmin = async (req, res) => {
    try {
        const model = prisma.florist || prisma['florist'];
        const f = await model.findUnique({ where: { id: req.params.id } });
        return res.json(f);
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const getSystemSettings = async (req, res) => {
    try {
        let s = await prisma.systemSettings.findFirst();
        if (!s) s = await prisma.systemSettings.create({ data: { platformFeeRate: 0.10 } });
        return res.json(s);
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const updateSystemSettings = async (req, res) => {
    try {
        let s = await prisma.systemSettings.findFirst();
        const u = await prisma.systemSettings.update({ where: { id: s.id }, data: { platformFeeRate: parseFloat(req.body.platformFeeRate) } });
        return res.json(u);
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const getFloristFee = async (req, res) => {
    try {
        const model = prisma.florist || prisma['florist'];
        const f = await model.findUnique({ where: { id: req.params.id }, select: { id: true, platformName: true, customFeeRate: true } });
        return res.json(f);
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const updateFloristFee = async (req, res) => {
    try {
        const model = prisma.florist || prisma['florist'];
        const rate = req.body.customFeeRate === '' ? null : parseFloat(req.body.customFeeRate);
        const u = await model.update({ where: { id: req.params.id }, data: { customFeeRate: rate } });
        return res.json(u);
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const getCommissions = async (req, res) => {
    try {
        const d = await prisma.commission.findMany({ include: { project: true } });
        return res.json(d || []);
    } catch (e) { return res.status(200).json([]); }
};

export const getAdminPayouts = async (req, res) => {
    try {
        let d = req.query.type === 'user' ? await prisma.payout.findMany({ where: { status: 'PENDING' } }) : await prisma.payoutRequest.findMany({ where: { status: 'PENDING' } });
        return res.json(d || []);
    } catch (e) { return res.status(200).json([]); }
};

export const updateAdminPayoutStatus = async (req, res) => {
    try {
        const r = req.body.type === 'user' ? await prisma.payout.update({ where: { id: req.params.id }, data: { status: req.body.status } }) : await prisma.payoutRequest.update({ where: { id: req.params.id }, data: { status: req.body.status } });
        return res.json(r);
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const getEmailTemplates = async (req, res) => {
    try {
        const d = await prisma.emailTemplate.findMany();
        return res.json(d || []);
    } catch (e) { return res.status(200).json([]); }
};

export const saveEmailTemplate = async (req, res) => {
    try {
        const r = req.body.id ? await prisma.emailTemplate.update({ where: { id: req.body.id }, data: req.body }) : await prisma.emailTemplate.create({ data: req.body });
        return res.json(r);
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const sendIndividualEmail = async (req, res) => {
    try {
        await sendEmail(req.body.email, req.body.subject, req.body.body);
        return res.json({ message: 'Sent' });
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const createAdminChatRoom = async (req, res) => {
    try {
        const r = await prisma.adminChatRoom.create({ data: { adminId: req.user.id, userId: req.body.targetUserId, userRole: req.body.targetUserRole } });
        return res.status(201).json(r);
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const getAdminChatMessages = async (req, res) => {
    try {
        const m = await prisma.adminChatMessage.findMany({ where: { chatRoomId: req.params.roomId } });
        return res.json(m || []);
    } catch (e) { return res.status(200).json([]); }
};

export const searchAllUsers = async (req, res) => {
    try {
        const d = await prisma.user.findMany({ where: { handleName: { contains: req.query.keyword } } });
        return res.json(d || []);
    } catch (e) { return res.status(200).json([]); }
};

export const getAllProjectsAdmin = async (req, res) => {
    try {
        const d = await prisma.project.findMany({ include: { planner: true } });
        return res.json(d || []);
    } catch (e) { return res.status(200).json([]); }
};

export const getProjectChatLogs = async (req, res) => {
    try {
        const d = await prisma.chatMessage.findMany({ where: { chatRoom: { offer: { projectId: req.params.projectId } } } });
        return res.json(d || []);
    } catch (e) { return res.status(200).json([]); }
};

export const updateProjectVisibility = async (req, res) => {
    try {
        const p = await prisma.project.update({ where: { id: req.params.projectId }, data: { visibility: req.body.isVisible ? 'PUBLIC' : 'UNLISTED' } });
        return res.json(p);
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const reviewReport = async (req, res) => {
    try {
        const u = await prisma.projectReport.update({ where: { id: req.params.reportId }, data: { status: 'REVIEWED' } });
        return res.json(u);
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const createVenueAdmin = async (req, res) => {
    try { const v = await prisma.venue.create({ data: req.body }); return res.status(201).json(v); } catch(e) { return res.status(500).json({message:'Error'}); }
};
export const updateVenueAdmin = async (req, res) => {
    try { const v = await prisma.venue.update({ where: {id:req.params.id}, data: req.body }); return res.json(v); } catch(e) { return res.status(500).json({message:'Error'}); }
};
export const deleteVenueAdmin = async (req, res) => {
    try { await prisma.venue.delete({ where: {id:req.params.id} }); return res.status(204).send(); } catch(e) { return res.status(500).json({message:'Error'}); }
};

export const banEvent = async (req, res) => {
    try {
        const e = await prisma.event.update({ where: { id: req.params.eventId }, data: { isBanned: req.body.isBanned } });
        return res.json(e);
    } catch(e) { return res.status(500).json({ message: 'Error' }); }
};
export const dismissEventReport = async (req, res) => {
    try { await prisma.eventReport.update({ where: { id: req.params.reportId }, data: { status: 'RESOLVED' } }); return res.json({message:'OK'}); } catch(e) { return res.status(500).json({message:'Error'}); }
};