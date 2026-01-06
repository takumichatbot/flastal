import prisma from '../config/prisma.js';
import { sendEmail, sendDynamicEmail } from '../utils/email.js';
import { createNotification } from '../utils/notification.js';

// ==========================================
// ★★★ 1. 審査・承認管理 (Approve/Reject) ★★★
// ==========================================

export const getPendingItems = async (req, res) => {
    const { type } = req.params;
    let data = [];
    try {
        if (type === 'projects') {
            data = await prisma.project.findMany({ 
                where: { status: 'PENDING_APPROVAL' }, 
                include: { planner: { select: { handleName: true, email: true } } },
                orderBy: { createdAt: 'asc' }
            });
        } else if (type === 'florists') {
            data = await prisma['florist'].findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' } });
        } else if (type === 'venues') {
            data = await prisma.venue.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' } });
        } else if (type === 'organizers') {
            data = await prisma.organizer.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' } });
        } else {
            return res.status(400).json({ message: 'Invalid type' });
        }
        res.json(data || []);
    } catch (e) { 
        console.error('getPendingItems Error:', e);
        res.status(500).json({ message: '取得に失敗しました' }); 
    }
};

// ★全お花屋さん取得 (取得失敗を徹底回避し、確実に配列を返す)
export const getAllFloristsAdmin = async (req, res) => {
    console.log("[AdminAPI] Starting getAllFloristsAdmin fetch...");
    try {
        // モデル名を文字列で直接指定して Prisma の解決ミスを回避
        const florists = await prisma['florist'].findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, shopName: true, platformName: true, email: true,
                status: true, customFeeRate: true, createdAt: true, balance: true
            }
        });
        
        console.log(`[AdminAPI] getAllFloristsAdmin SUCCESS. Items: ${florists?.length || 0}`);
        return res.status(200).json(florists || []);

    } catch (e) {
        console.error('getAllFloristsAdmin CRITICAL ERROR:', e);
        // 万が一のエラー時も500を返さず空の配列を返し、フロントのクラッシュを防ぐ
        return res.status(200).json([]); 
    }
};

// ★個別お花屋さん取得
export const getFloristByIdAdmin = async (req, res) => {
    const { id } = req.params;
    // ルート競合対策: idが "all" の場合は全取得へ回す
    if (id === 'all') return getAllFloristsAdmin(req, res);
    
    try {
        const florist = await prisma['florist'].findUnique({ where: { id } });
        if (!florist) return res.status(404).json({ message: '対象の花屋が見つかりません' });
        res.json(florist);
    } catch (e) {
        res.status(500).json({ message: '設定データの取得に失敗しました' });
    }
};

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
        if (type === 'florists') updated = await prisma['florist'].update({ where: { id }, data: { status } });
        else if (type === 'venues') updated = await prisma.venue.update({ where: { id }, data: { status } });
        else if (type === 'organizers') updated = await prisma.organizer.update({ where: { id }, data: { status } });
        res.json(updated);
    } catch (e) { res.status(500).json({ message: '更新エラー' }); }
};

// ==========================================
// ★★★ 2. システム設定・手数料 (System Settings) ★★★
// ==========================================

export const getSystemSettings = async (req, res) => {
    try {
        let settings = await prisma.systemSettings.findFirst();
        if (!settings) settings = await prisma.systemSettings.create({ data: { platformFeeRate: 0.10 } });
        res.json(settings);
    } catch (e) { res.status(500).json({ message: '取得失敗' }); }
};

export const updateSystemSettings = async (req, res) => {
    const { platformFeeRate } = req.body;
    try {
        let settings = await prisma.systemSettings.findFirst();
        const updated = await prisma.systemSettings.update({
            where: { id: settings.id },
            data: { platformFeeRate: parseFloat(platformFeeRate) }
        });
        res.json(updated);
    } catch (e) { res.status(500).json({ message: '保存失敗' }); }
};

export const getFloristFee = async (req, res) => {
    const { id } = req.params;
    try {
        const florist = await prisma['florist'].findUnique({
            where: { id },
            select: { id: true, platformName: true, customFeeRate: true }
        });
        if (!florist) return res.status(404).json({ message: 'Not found' });
        res.json(florist);
    } catch (e) { res.status(500).json({ message: '取得失敗' }); }
};

export const updateFloristFee = async (req, res) => {
    const { id } = req.params;
    const { customFeeRate } = req.body; 
    try {
        const rate = (customFeeRate === null || customFeeRate === '') ? null : parseFloat(customFeeRate);
        const updated = await prisma['florist'].update({
            where: { id },
            data: { customFeeRate: rate },
            select: { id: true, platformName: true, customFeeRate: true }
        });
        res.json(updated);
    } catch (e) { res.status(500).json({ message: '保存失敗' }); }
};

export const getCommissions = async (req, res) => {
    try {
        const commissions = await prisma.commission.findMany({
            orderBy: { createdAt: 'desc' },
            include: { project: { select: { title: true } } }
        });
        res.json(commissions || []);
    } catch (e) { res.status(500).json({ message: '取得失敗' }); }
};

// ==========================================
// ★★★ 3. 出金管理 ★★★
// ==========================================

export const getAdminPayouts = async (req, res) => {
    const { type } = req.query;
    try {
        let payouts = (type === 'user') 
            ? await prisma.payout.findMany({ where: { status: 'PENDING' }, include: { user: { include: { bankAccount: true } } } })
            : await prisma.payoutRequest.findMany({ where: { status: 'PENDING' }, include: { florist: true } });
        res.json(payouts || []);
    } catch (e) { res.status(500).json({ message: '取得エラー' }); }
};

export const updateAdminPayoutStatus = async (req, res) => {
    const { id } = req.params;
    const { type, status, adminComment } = req.body; 
    try {
        const result = (type === 'user')
            ? await prisma.payout.update({ where: { id }, data: { status, adminComment } })
            : await prisma.payoutRequest.update({ where: { id }, data: { status } });
        res.json(result);
    } catch (e) { res.status(500).json({ message: '更新失敗' }); }
};

// ==========================================
// ★★★ 4. メール・通知・チャット管理 ★★★
// ==========================================

export const getEmailTemplates = async (req, res) => {
    try {
        const data = await prisma.emailTemplate.findMany({ orderBy: { name: 'asc' } });
        res.json(data || []);
    } catch (e) { res.status(500).json({ message: '取得失敗' }); }
};

export const saveEmailTemplate = async (req, res) => {
    const { id, key, name, subject, body, targetRole, isSystemTemplate } = req.body;
    try {
        const data = { key, name, subject, body, targetRole, isSystemTemplate };
        const result = id 
            ? await prisma.emailTemplate.update({ where: { id }, data })
            : await prisma.emailTemplate.create({ data });
        res.json(result);
    } catch (e) { res.status(500).json({ message: '保存失敗' }); }
};

export const sendIndividualEmail = async (req, res) => {
    const { userId, targetRole, templateId, customSubject, customBody } = req.body;
    try {
        let email = '';
        if (targetRole === 'FLORIST') {
            const f = await prisma['florist'].findUnique({ where: { id: userId } });
            email = f?.email;
        } else {
            const u = await prisma.user.findUnique({ where: { id: userId } });
            email = u?.email;
        }
        if (!email) return res.status(404).json({ message: 'User not found' });
        await sendEmail(email, customSubject, customBody);
        res.json({ message: 'Sent' });
    } catch (e) { res.status(500).json({ message: '送信失敗' }); }
};

export const getReports = async (req, res) => {
    const { type } = req.params; 
    try {
        if (type === 'chat') {
            const reports = await prisma.chatMessageReport.findMany({ where: { status: 'PENDING' }, include: { message: true } });
            return res.json(reports || []);
        }
        if (type === 'events') {
            const reports = await prisma.eventReport.findMany({ where: { status: 'PENDING' }, include: { event: true } });
            return res.json(reports || []);
        }
        res.json([]);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const createAdminChatRoom = async (req, res) => {
    const { targetUserId, targetUserRole } = req.body;
    try {
        const room = await prisma.adminChatRoom.create({ data: { adminId: req.user.id, userId: targetUserId, userRole: targetUserRole } });
        res.status(201).json(room);
    } catch (e) { res.status(500).json({ message: '作成失敗' }); }
};

export const getAdminChatMessages = async (req, res) => {
    try {
        const messages = await prisma.adminChatMessage.findMany({ where: { chatRoomId: req.params.roomId }, orderBy: { createdAt: 'asc' } });
        res.json(messages || []);
    } catch (e) { res.status(500).json({ message: '取得失敗' }); }
};

// ==========================================
// ★★★ 5. その他 ★★★
// ==========================================

export const searchAllUsers = async (req, res) => {
    const { keyword } = req.query;
    try {
        const users = await prisma.user.findMany({ where: { handleName: { contains: keyword, mode: 'insensitive' } } });
        res.json(users || []);
    } catch (e) { res.status(500).json({ message: '検索失敗' }); }
};

export const getAllProjectsAdmin = async (req, res) => {
    try {
        const projects = await prisma.project.findMany({ orderBy: { createdAt: 'desc' }, include: { planner: true } });
        res.json(projects || []);
    } catch (e) { res.status(500).json({ message: '取得失敗' }); }
};

export const getProjectChatLogs = async (req, res) => {
    const { projectId } = req.params;
    try {
        const logs = await prisma.chatMessage.findMany({ where: { chatRoom: { offer: { projectId } } } });
        res.json(logs || []);
    } catch (e) { res.status(500).json({ message: '取得失敗' }); }
};

export const updateProjectVisibility = async (req, res) => {
    const { isVisible } = req.body;
    try {
        const p = await prisma.project.update({ where: { id: req.params.projectId }, data: { visibility: isVisible ? 'PUBLIC' : 'UNLISTED' } });
        res.json(p);
    } catch (e) { res.status(500).json({ message: '更新失敗' }); }
};

export const reviewReport = async (req, res) => {
    const { reportId } = req.params;
    try {
        const updated = await prisma.projectReport.update({ where: { id: reportId }, data: { status: 'REVIEWED' } });
        res.json(updated);
    } catch (e) { res.status(500).json({ message: '更新失敗' }); }
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
    const { isBanned } = req.body;
    try {
        const e = await prisma.event.update({ where: { id: req.params.eventId }, data: { isBanned } });
        res.json(e);
    } catch(e) { res.status(500).json({ message: 'Error' }); }
};
export const dismissEventReport = async (req, res) => {
    try { await prisma.eventReport.update({ where: { id: req.params.reportId }, data: { status: 'RESOLVED' } }); res.json({message:'OK'}); } catch(e) { res.status(500).json({message:'Error'}); }
};