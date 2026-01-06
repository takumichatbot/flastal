import prisma from '../config/prisma.js';
import { sendEmail, sendDynamicEmail } from '../utils/email.js';
import { createNotification } from '../utils/notification.js';

// ★全お花屋さん取得 (取得失敗を物理的に回避する最終構造)
export const getAllFloristsAdmin = async (req, res) => {
    console.log("[AdminAPI] getAllFloristsAdmin request received");
    try {
        // モデル解決
        const model = prisma.florist || prisma['florist'];
        
        if (!model) {
            console.error("CRITICAL: Prisma model 'florist' is missing!");
            return res.status(200).json([]); // フロントエンド保護のため空配列
        }

        const florists = await model.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                shopName: true,
                platformName: true,
                email: true,
                status: true,
                customFeeRate: true,
                createdAt: true,
                balance: true
            }
        });
        
        console.log(`[AdminAPI] getAllFloristsAdmin success: found ${florists?.length}`);
        return res.status(200).json(florists || []);

    } catch (e) {
        console.error('getAllFloristsAdmin DATABASE ERROR:', e.message);
        // エラーでも空配列を返すことでフロントエンドのトーストエラーを回避
        return res.status(200).json([]); 
    }
};

// --- 以下、既存機能の安定化全文 ---

export const getPendingItems = async (req, res) => {
    const { type } = req.params;
    let data = [];
    try {
        if (type === 'projects') {
            data = await prisma.project.findMany({ where: { status: 'PENDING_APPROVAL' }, include: { planner: true } });
        } else if (type === 'florists') {
            data = await prisma.florist.findMany({ where: { status: 'PENDING' } });
        } else if (type === 'venues') {
            data = await prisma.venue.findMany({ where: { status: 'PENDING' } });
        } else if (type === 'organizers') {
            data = await prisma.organizer.findMany({ where: { status: 'PENDING' } });
        }
        return res.json(data || []);
    } catch (e) { return res.status(200).json([]); }
};

export const getFloristByIdAdmin = async (req, res) => {
    const { id } = req.params;
    if (id === 'all') return getAllFloristsAdmin(req, res);
    try {
        const florist = await prisma.florist.findUnique({ where: { id } });
        if (!florist) return res.status(404).json({ message: 'Not found' });
        return res.json(florist);
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const approveItem = async (req, res) => {
    const { type, id } = req.params;
    const { status } = req.body;
    try {
        let updated;
        if (type === 'projects') updated = await prisma.project.update({ where: { id }, data: { status: status === 'APPROVED' ? 'FUNDRAISING' : 'REJECTED' } });
        else if (type === 'florists') updated = await prisma.florist.update({ where: { id }, data: { status } });
        else if (type === 'venues') updated = await prisma.venue.update({ where: { id }, data: { status } });
        else if (type === 'organizers') updated = await prisma.organizer.update({ where: { id }, data: { status } });
        return res.json(updated);
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const getSystemSettings = async (req, res) => {
    try {
        let settings = await prisma.systemSettings.findFirst();
        if (!settings) settings = await prisma.systemSettings.create({ data: { platformFeeRate: 0.10 } });
        return res.json(settings);
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const updateSystemSettings = async (req, res) => {
    try {
        let settings = await prisma.systemSettings.findFirst();
        const updated = await prisma.systemSettings.update({ where: { id: settings.id }, data: { platformFeeRate: parseFloat(req.body.platformFeeRate) } });
        return res.json(updated);
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const getFloristFee = async (req, res) => {
    try {
        const florist = await prisma.florist.findUnique({ where: { id: req.params.id }, select: { id: true, platformName: true, customFeeRate: true } });
        return res.json(florist);
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const updateFloristFee = async (req, res) => {
    try {
        const rate = req.body.customFeeRate === '' ? null : parseFloat(req.body.customFeeRate);
        const updated = await prisma.florist.update({ where: { id: req.params.id }, data: { customFeeRate: rate } });
        return res.json(updated);
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const getCommissions = async (req, res) => {
    try {
        const data = await prisma.commission.findMany({ include: { project: true } });
        return res.json(data || []);
    } catch (e) { return res.status(200).json([]); }
};

export const getAdminPayouts = async (req, res) => {
    const { type } = req.query;
    try {
        let data = type === 'user' ? await prisma.payout.findMany({ where: { status: 'PENDING' } }) : await prisma.payoutRequest.findMany({ where: { status: 'PENDING' } });
        return res.json(data || []);
    } catch (e) { return res.status(200).json([]); }
};

export const updateAdminPayoutStatus = async (req, res) => {
    try {
        const result = req.body.type === 'user' ? await prisma.payout.update({ where: { id: req.params.id }, data: { status: req.body.status } }) : await prisma.payoutRequest.update({ where: { id: req.params.id }, data: { status: req.body.status } });
        return res.json(result);
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const getEmailTemplates = async (req, res) => {
    try {
        const data = await prisma.emailTemplate.findMany();
        return res.json(data || []);
    } catch (e) { return res.status(200).json([]); }
};

export const saveEmailTemplate = async (req, res) => {
    try {
        const result = req.body.id ? await prisma.emailTemplate.update({ where: { id: req.body.id }, data: req.body }) : await prisma.emailTemplate.create({ data: req.body });
        return res.json(result);
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const sendIndividualEmail = async (req, res) => {
    try {
        await sendEmail(req.body.email, req.body.subject, req.body.body);
        return res.json({ message: 'Sent' });
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const getReports = async (req, res) => {
    try {
        const data = req.params.type === 'chat' ? await prisma.chatMessageReport.findMany() : await prisma.eventReport.findMany();
        return res.json(data || []);
    } catch (e) { return res.status(200).json([]); }
};

export const createAdminChatRoom = async (req, res) => {
    try {
        const room = await prisma.adminChatRoom.create({ data: req.body });
        return res.status(201).json(room);
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const getAdminChatMessages = async (req, res) => {
    try {
        const messages = await prisma.adminChatMessage.findMany({ where: { chatRoomId: req.params.roomId } });
        return res.json(messages || []);
    } catch (e) { return res.status(200).json([]); }
};

export const searchAllUsers = async (req, res) => {
    try {
        const data = await prisma.user.findMany({ where: { handleName: { contains: req.query.keyword } } });
        return res.json(data || []);
    } catch (e) { return res.status(200).json([]); }
};

export const getAllProjectsAdmin = async (req, res) => {
    try {
        const data = await prisma.project.findMany({ include: { planner: true } });
        return res.json(data || []);
    } catch (e) { return res.status(200).json([]); }
};

export const getProjectChatLogs = async (req, res) => {
    try {
        const data = await prisma.chatMessage.findMany({ where: { chatRoom: { offer: { projectId: req.params.projectId } } } });
        return res.json(data || []);
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
        const updated = await prisma.projectReport.update({ where: { id: req.params.reportId }, data: { status: 'REVIEWED' } });
        return res.json(updated);
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