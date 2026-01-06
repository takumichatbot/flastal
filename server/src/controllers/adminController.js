import prisma from '../config/prisma.js';
import { sendEmail, sendDynamicEmail } from '../utils/email.js';
import { createNotification } from '../utils/notification.js';

// 審査実行 (プロジェクト・花屋・会場・主催者)
export const approveItem = async (req, res) => {
    const { type, id } = req.params;
    const { status, adminComment } = req.body; 

    try {
        // --- A. プロジェクト承認/却下 ---
        if (type === 'projects') {
            const projectStatus = status === 'APPROVED' ? 'FUNDRAISING' : 'REJECTED';
            const project = await prisma.project.update({
                where: { id },
                data: { status: projectStatus },
                include: { planner: true }
            });
            return res.json(project);
        } 
        
        // --- B. アカウント承認/却下 (花屋, 会場, 主催者) ---
        let updated;
        // 会場と主催者は ApprovalStatus (大文字) を使う必要がある場合があるため正規化
        const finalStatus = status === 'APPROVED' ? 'APPROVED' : (status === 'REJECTED' ? 'REJECTED' : 'PENDING');

        if (type === 'florists') {
            updated = await prisma['florist'].update({ where: { id }, data: { status: finalStatus } });
        } else if (type === 'venues') {
            updated = await prisma.venue.update({ where: { id }, data: { status: finalStatus } });
        } else if (type === 'organizers') {
            updated = await prisma.organizer.update({ where: { id }, data: { status: finalStatus } });
        } else {
            return res.status(400).json({ message: 'Invalid type specified' });
        }

        console.log(`[AdminAPI] ${type} ${id} status updated to ${finalStatus}`);
        return res.json(updated);

    } catch (e) { 
        console.error('approveItem Error:', e);
        res.status(500).json({ message: '承認処理に失敗しました。', error: e.message }); 
    }
};

// --- 以下、既存の安定した関数群 ---

export const getPendingItems = async (req, res) => {
    const { type } = req.params;
    let data = [];
    try {
        if (type === 'projects') {
            data = await prisma.project.findMany({ where: { status: 'PENDING_APPROVAL' }, include: { planner: true } });
        } else if (type === 'florists') {
            data = await prisma['florist'].findMany({ where: { status: 'PENDING' } });
        } else if (type === 'venues') {
            data = await prisma.venue.findMany({ where: { status: 'PENDING' } });
        } else if (type === 'organizers') {
            data = await prisma.organizer.findMany({ where: { status: 'PENDING' } });
        }
        res.json(data || []);
    } catch (e) { res.status(500).json({ message: '取得に失敗しました' }); }
};

export const getAllFloristsAdmin = async (req, res) => {
    try {
        const florists = await prisma['florist'].findMany({ orderBy: { platformName: 'asc' } });
        res.json(florists || []);
    } catch (e) { res.status(200).json([]); }
};

export const getFloristByIdAdmin = async (req, res) => {
    try {
        const florist = await prisma['florist'].findUnique({ where: { id: req.params.id } });
        res.json(florist);
    } catch (e) { res.status(500).json({ message: '取得失敗' }); }
};

export const getSystemSettings = async (req, res) => {
    try {
        let settings = await prisma.systemSettings.findFirst();
        if (!settings) settings = await prisma.systemSettings.create({ data: { platformFeeRate: 0.10 } });
        res.json(settings);
    } catch (e) { res.status(500).json({ message: '取得失敗' }); }
};

export const updateSystemSettings = async (req, res) => {
    try {
        let settings = await prisma.systemSettings.findFirst();
        const updated = await prisma.systemSettings.update({ where: { id: settings.id }, data: { platformFeeRate: parseFloat(req.body.platformFeeRate) } });
        res.json(updated);
    } catch (e) { res.status(500).json({ message: '更新失敗' }); }
};

export const getFloristFee = async (req, res) => {
    try {
        const f = await prisma['florist'].findUnique({ where: { id: req.params.id }, select: { id: true, platformName: true, customFeeRate: true } });
        res.json(f);
    } catch (e) { res.status(500).json({ message: '取得失敗' }); }
};

export const updateFloristFee = async (req, res) => {
    try {
        const rate = req.body.customFeeRate === '' ? null : parseFloat(req.body.customFeeRate);
        const updated = await prisma['florist'].update({ where: { id: req.params.id }, data: { customFeeRate: rate } });
        res.json(updated);
    } catch (e) { res.status(500).json({ message: '保存失敗' }); }
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
    } catch (e) { res.status(500).json({ message: '更新失敗' }); }
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
    } catch (e) { res.status(500).json({ message: '保存失敗' }); }
};

export const sendIndividualEmail = async (req, res) => {
    try {
        await sendEmail(req.body.email, req.body.subject, req.body.body);
        res.json({ message: 'Sent' });
    } catch (e) { res.status(500).json({ message: '送信失敗' }); }
};

export const getReports = async (req, res) => {
    try {
        const data = req.params.type === 'chat' ? await prisma.chatMessageReport.findMany() : await prisma.eventReport.findMany();
        res.json(data || []);
    } catch (e) { res.status(200).json([]); }
};

export const createAdminChatRoom = async (req, res) => {
    try {
        const room = await prisma.adminChatRoom.create({ data: { adminId: req.user.id, userId: req.body.targetUserId, userRole: req.body.targetUserRole } });
        res.status(201).json(room);
    } catch (e) { res.status(500).json({ message: '作成失敗' }); }
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
    } catch (e) { res.status(500).json({ message: '更新失敗' }); }
};

export const reviewReport = async (req, res) => {
    try {
        const updated = await prisma.projectReport.update({ where: { id: req.params.reportId }, data: { status: 'REVIEWED' } });
        res.json(updated);
    } catch (e) { res.status(500).json({ message: '失敗' }); }
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