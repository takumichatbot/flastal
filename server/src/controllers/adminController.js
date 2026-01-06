import prisma from '../config/prisma.js';
import { sendEmail, sendDynamicEmail } from '../utils/email.js';
import { createNotification } from '../utils/notification.js';

// ==========================================
// ★★★ チャット監視・通報データの取得 ★★★
// ==========================================

export const getReports = async (req, res) => {
    const { type } = req.params; 
    console.log(`[AdminAPI] Fetching reports. Type requested: ${type}`);

    try {
        if (type === 'chat') {
            // 1. グループチャット通報
            const groupReports = await prisma.groupChatMessageReport.findMany({
                where: { status: 'PENDING' },
                include: {
                    message: { include: { user: { select: { handleName: true } } } },
                    reporter: { select: { handleName: true } }
                }
            });

            // 2. ダイレクトチャット通報
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

            // 3. 統合
            const formatted = [
                ...groupReports.map(r => ({
                    id: r.id,
                    type: 'GROUP',
                    reason: r.reason,
                    content: r.message?.content || '(メッセージ削除済み)',
                    senderName: r.message?.user?.handleName || '不明',
                    reporterName: r.reporter?.handleName || 'システム',
                    createdAt: r.createdAt
                })),
                ...directReports.map(r => ({
                    id: r.id,
                    type: 'DIRECT',
                    reason: r.reason,
                    content: r.message?.content || '(メッセージ削除済み)',
                    senderName: r.message?.user?.handleName || r.message?.florist?.platformName || '不明',
                    reporterName: r.reporter?.handleName || 'システム',
                    createdAt: r.createdAt
                }))
            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return res.json(formatted);
        }

        if (type === 'events') {
            const reports = await prisma.eventReport.findMany({
                where: { status: 'PENDING' },
                include: { event: true, reporter: { select: { handleName: true } } }
            });
            return res.json(reports || []);
        }

        return res.json([]);
    } catch (e) {
        console.error('getReports Error:', e);
        // フロントエンドのトーストエラーを防ぐため200を返す
        return res.status(200).json([]);
    }
};

// 審査実行 (プロジェクト・花屋・会場・主催者)
export const approveItem = async (req, res) => {
    const { type, id } = req.params;
    const { status } = req.body; 

    try {
        if (type === 'projects') {
            const projectStatus = status === 'APPROVED' ? 'FUNDRAISING' : 'REJECTED';
            const project = await prisma.project.update({ where: { id }, data: { status: projectStatus } });
            return res.json(project);
        } 
        
        let updated;
        const finalStatus = status === 'APPROVED' ? 'APPROVED' : (status === 'REJECTED' ? 'REJECTED' : 'PENDING');
        const floristModel = prisma.florist || prisma['florist'];

        if (type === 'florists') updated = await floristModel.update({ where: { id }, data: { status: finalStatus } });
        else if (type === 'venues') updated = await prisma.venue.update({ where: { id }, data: { status: finalStatus } });
        else if (type === 'organizers') updated = await prisma.organizer.update({ where: { id }, data: { status: finalStatus } });

        return res.json(updated);
    } catch (e) { 
        console.error('approveItem Error:', e);
        res.status(500).json({ message: '失敗' }); 
    }
};

// --- 以下、安定版関数群 ---

export const getPendingItems = async (req, res) => {
    const { type } = req.params;
    try {
        let data = [];
        const fm = prisma.florist || prisma['florist'];
        if (type === 'projects') data = await prisma.project.findMany({ where: { status: 'PENDING_APPROVAL' }, include: { planner: true } });
        else if (type === 'florists') data = await fm.findMany({ where: { status: 'PENDING' } });
        else if (type === 'venues') data = await prisma.venue.findMany({ where: { status: 'PENDING' } });
        else if (type === 'organizers') data = await prisma.organizer.findMany({ where: { status: 'PENDING' } });
        res.json(data || []);
    } catch (e) { res.status(200).json([]); }
};

export const getAllFloristsAdmin = async (req, res) => {
    try {
        const fm = prisma.florist || prisma['florist'];
        const florists = await fm.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(florists || []);
    } catch (e) { res.status(200).json([]); }
};

export const getFloristByIdAdmin = async (req, res) => {
    try {
        const fm = prisma.florist || prisma['florist'];
        const f = await fm.findUnique({ where: { id: req.params.id } });
        res.json(f);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const getSystemSettings = async (req, res) => {
    try {
        let settings = await prisma.systemSettings.findFirst();
        if (!settings) settings = await prisma.systemSettings.create({ data: { platformFeeRate: 0.10 } });
        res.json(settings);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const updateSystemSettings = async (req, res) => {
    try {
        let settings = await prisma.systemSettings.findFirst();
        const updated = await prisma.systemSettings.update({ where: { id: settings.id }, data: { platformFeeRate: parseFloat(req.body.platformFeeRate) } });
        res.json(updated);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const getFloristFee = async (req, res) => {
    try {
        const fm = prisma.florist || prisma['florist'];
        const f = await fm.findUnique({ where: { id: req.params.id }, select: { id: true, platformName: true, customFeeRate: true } });
        res.json(f);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const updateFloristFee = async (req, res) => {
    try {
        const fm = prisma.florist || prisma['florist'];
        const rate = req.body.customFeeRate === '' ? null : parseFloat(req.body.customFeeRate);
        const updated = await fm.update({ where: { id: req.params.id }, data: { customFeeRate: rate } });
        res.json(updated);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const getCommissions = async (req, res) => {
    try {
        const data = await prisma.commission.findMany({ include: { project: true } });
        res.json(data || []);
    } catch (e) { res.status(200).json([]); }
};

export const getAdminPayouts = async (req, res) => {
    try {
        let data = req.query.type === 'user' ? await prisma.payout.findMany({ where: { status: 'PENDING' } }) : await prisma.payoutRequest.findMany({ where: { status: 'PENDING' } });
        res.json(data || []);
    } catch (e) { res.status(200).json([]); }
};

export const updateAdminPayoutStatus = async (req, res) => {
    try {
        const result = req.body.type === 'user' ? await prisma.payout.update({ where: { id: req.params.id }, data: { status: req.body.status } }) : await prisma.payoutRequest.update({ where: { id: req.params.id }, data: { status: req.body.status } });
        res.json(result);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const getEmailTemplates = async (req, res) => {
    try {
        const data = await prisma.emailTemplate.findMany();
        res.json(data || []);
    } catch (e) { res.status(200).json([]); }
};

export const saveEmailTemplate = async (req, res) => {
    try {
        const result = req.body.id ? await prisma.emailTemplate.update({ where: { id: req.body.id }, data: req.body }) : await prisma.emailTemplate.create({ data: req.body });
        res.json(result);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const sendIndividualEmail = async (req, res) => {
    try {
        await sendEmail(req.body.email, req.body.subject, req.body.body);
        res.json({ message: 'Sent' });
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const createAdminChatRoom = async (req, res) => {
    try {
        const room = await prisma.adminChatRoom.create({ data: { adminId: req.user.id, userId: req.body.targetUserId, userRole: req.body.targetUserRole } });
        res.status(201).json(room);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const getAdminChatMessages = async (req, res) => {
    try {
        const messages = await prisma.adminChatMessage.findMany({ where: { chatRoomId: req.params.roomId } });
        res.json(messages || []);
    } catch (e) { res.status(200).json([]); }
};

export const searchAllUsers = async (req, res) => {
    try {
        const data = await prisma.user.findMany({ where: { handleName: { contains: req.query.keyword } } });
        res.json(data || []);
    } catch (e) { res.status(200).json([]); }
};

export const getAllProjectsAdmin = async (req, res) => {
    try {
        const data = await prisma.project.findMany({ include: { planner: true } });
        res.json(data || []);
    } catch (e) { res.status(200).json([]); }
};

export const getProjectChatLogs = async (req, res) => {
    try {
        const data = await prisma.chatMessage.findMany({ where: { chatRoom: { offer: { projectId: req.params.projectId } } } });
        res.json(data || []);
    } catch (e) { res.status(200).json([]); }
};

export const updateProjectVisibility = async (req, res) => {
    try {
        const p = await prisma.project.update({ where: { id: req.params.projectId }, data: { visibility: req.body.isVisible ? 'PUBLIC' : 'UNLISTED' } });
        res.json(p);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const reviewReport = async (req, res) => {
    try {
        const updated = await prisma.projectReport.update({ where: { id: req.params.reportId }, data: { status: 'REVIEWED' } });
        res.json(updated);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const createVenueAdmin = async (req, res) => {
    try { const v = await prisma.venue.create({ data: req.body }); res.status(201).json(v); } catch(e) { res.status(500).json({message:'Error'}); }
};
export const updateVenueAdmin = async (req, res) => {
    try { const v = await prisma.venue.update({ where: {id:req.params.id}, data: req.body }); res.json(v); } catch(e) { res.status(500).json({message:'Error'}); }
};
export const deleteVenueAdmin = async (req, res) => {
    try { await prisma.venue.delete({ where: {id:req.params.id} }); res.status(204).send(); } catch(e) { res.status(500).json({message:'Error'}); }
};

export const banEvent = async (req, res) => {
    try {
        const e = await prisma.event.update({ where: { id: req.params.eventId }, data: { isBanned: req.body.isBanned } });
        res.json(e);
    } catch(e) { res.status(500).json({ message: 'Error' }); }
};
export const dismissEventReport = async (req, res) => {
    try { await prisma.eventReport.update({ where: { id: req.params.reportId }, data: { status: 'RESOLVED' } }); res.json({message:'OK'}); } catch(e) { res.status(500).json({message:'Error'}); }
};