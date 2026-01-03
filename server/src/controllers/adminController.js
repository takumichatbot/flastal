import prisma from '../config/prisma.js';
import { sendEmail, sendDynamicEmail } from '../utils/email.js';
import { createNotification } from '../utils/notification.js';

// ==========================================
// ★★★ 1. 審査・承認管理 (Approve/Reject) ★★★
// ==========================================

// 審査待ち一覧取得
export const getPendingItems = async (req, res) => {
    const { type } = req.params; // projects, florists, venues, organizers
    let data = [];
    try {
        if (type === 'projects') {
            data = await prisma.project.findMany({ 
                where: { status: 'PENDING_APPROVAL' }, 
                include: { planner: { select: { handleName: true, email: true } } },
                orderBy: { createdAt: 'asc' }
            });
        } else if (type === 'florists') {
            data = await prisma.florist.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' } });
        } else if (type === 'venues') {
            data = await prisma.venue.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' } });
        } else if (type === 'organizers') {
            data = await prisma.organizer.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' } });
        } else {
            return res.status(400).json({ message: 'Invalid type' });
        }
        res.json(data);
    } catch (e) { 
        console.error('getPendingItems Error:', e);
        res.status(500).json({ message: '取得に失敗しました' }); 
    }
};

// ★追加: 管理画面用お花屋さん全リスト取得
export const getAllFloristsAdmin = async (req, res) => {
    try {
        const florists = await prisma.florist.findMany({
            orderBy: { platformName: 'asc' },
            select: {
                id: true,
                shopName: true,
                platformName: true,
                email: true,
                status: true,
                customFeeRate: true,
                createdAt: true
            }
        });
        res.json(florists);
    } catch (e) {
        console.error('getAllFloristsAdmin Error:', e);
        res.status(500).json({ message: 'お花屋さんリストの取得に失敗しました' });
    }
};

// 審査実行 (プロジェクト・花屋・会場・主催者)
export const approveItem = async (req, res) => {
    const { type, id } = req.params;
    const { status, adminComment } = req.body; // status: 'APPROVED' / 'REJECTED'

    try {
        // --- A. プロジェクト承認/却下 ---
        if (type === 'projects') {
            const projectStatus = status === 'APPROVED' ? 'FUNDRAISING' : 'REJECTED';
            
            const project = await prisma.project.update({
                where: { id },
                data: { status: projectStatus },
                include: { planner: true }
            });

            try {
                if (projectStatus === 'FUNDRAISING') {
                    await createNotification(project.plannerId, 'PROJECT_APPROVED', '企画が承認され、公開されました！', id, `/projects/${id}`);
                    if (project.planner?.email) {
                        await sendDynamicEmail(project.planner.email, 'PROJECT_APPROVAL', {
                            userName: project.planner.handleName,
                            projectTitle: project.title,
                            projectUrl: `${process.env.FRONTEND_URL}/projects/${id}`
                        });
                    }
                } else {
                    await createNotification(project.plannerId, 'PROJECT_REJECTED', '企画が承認されませんでした。', id, `/mypage`);
                    if (project.planner?.email) {
                        await sendDynamicEmail(project.planner.email, 'PROJECT_REJECTED', {
                            userName: project.planner.handleName,
                            projectTitle: project.title,
                            reason: adminComment || 'ガイドライン不適合のため'
                        });
                    }
                }
            } catch (notifyErr) {
                console.error('Notification Error after Approval:', notifyErr);
            }

            return res.json(project);
        } 
        
        // --- B. アカウント承認/却下 ---
        let updated;
        let email = '';
        let name = '';
        const accountStatus = status; 

        if (type === 'florists') {
            updated = await prisma.florist.update({ where: { id }, data: { status: accountStatus } });
            email = updated.email; name = updated.platformName;
        } else if (type === 'venues') {
            updated = await prisma.venue.update({ where: { id }, data: { status: accountStatus } });
            email = updated.email; name = updated.venueName;
        } else if (type === 'organizers') {
            updated = await prisma.organizer.update({ where: { id }, data: { status: accountStatus } });
            email = updated.email; name = updated.name;
        }

        if (accountStatus === 'APPROVED' && email) {
            await sendDynamicEmail(email, 'ACCOUNT_APPROVED', {
                userName: name,
                loginUrl: `${process.env.FRONTEND_URL}/${type}/login`
            });
        }

        res.json(updated);

    } catch (e) { 
        console.error('approveItem Error:', e);
        res.status(500).json({ message: '更新エラーが発生しました' }); 
    }
};

// ==========================================
// ★★★ 2. システム設定・手数料 (System Settings) ★★★
// ==========================================

export const getSystemSettings = async (req, res) => {
    try {
        let settings = await prisma.systemSettings.findFirst();
        if (!settings) {
            settings = await prisma.systemSettings.create({ data: {} });
        }
        res.json(settings);
    } catch (e) { res.status(500).json({ message: '取得失敗' }); }
};

export const updateSystemSettings = async (req, res) => {
    const { platformFeeRate } = req.body;
    try {
        const settings = await prisma.systemSettings.findFirst();
        if (settings) {
            const updated = await prisma.systemSettings.update({
                where: { id: settings.id },
                data: { platformFeeRate: platformFeeRate !== undefined ? parseFloat(platformFeeRate) : undefined }
            });
            res.json(updated);
        } else {
            const created = await prisma.systemSettings.create({
                data: { platformFeeRate: platformFeeRate !== undefined ? parseFloat(platformFeeRate) : 0.10 }
            });
            res.json(created);
        }
    } catch (e) { res.status(500).json({ message: '更新失敗' }); }
};

export const getFloristFee = async (req, res) => {
    const { floristId } = req.params;
    try {
        const florist = await prisma.florist.findUnique({
            where: { id: floristId },
            select: { id: true, platformName: true, customFeeRate: true }
        });
        if (!florist) return res.status(404).json({ message: 'Not found' });
        res.json(florist);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const updateFloristFee = async (req, res) => {
    const { floristId } = req.params;
    const { customFeeRate } = req.body; 
    try {
        const rate = customFeeRate === null ? null : parseFloat(customFeeRate);
        const updated = await prisma.florist.update({
            where: { id: floristId },
            data: { customFeeRate: rate },
            select: { id: true, platformName: true, customFeeRate: true }
        });
        res.json(updated);
    } catch (e) { res.status(500).json({ message: '更新失敗' }); }
};

export const getCommissions = async (req, res) => {
    try {
        const commissions = await prisma.commission.findMany({
            orderBy: { createdAt: 'desc' },
            include: { project: { select: { title: true } } }
        });
        res.json(commissions);
    } catch (e) { res.status(500).json({ message: '取得失敗' }); }
};

// ==========================================
// ★★★ 3. 出金管理 (Payouts) ★★★
// ==========================================

export const getAdminPayouts = async (req, res) => {
    const { type } = req.query; // 'user' or 'florist'
    try {
        let payouts = [];
        if (type === 'user') {
            payouts = await prisma.payout.findMany({
                where: { status: 'PENDING' },
                include: { user: { include: { bankAccount: true } } },
                orderBy: { requestedAt: 'asc' }
            });
        } else {
            payouts = await prisma.payoutRequest.findMany({
                where: { status: 'PENDING' },
                include: { florist: true },
                orderBy: { createdAt: 'asc' }
            });
        }
        res.json(payouts);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const updateAdminPayoutStatus = async (req, res) => {
    const { id } = req.params;
    const { type, status, adminComment } = req.body; 

    try {
        if (type === 'user') {
            const result = await prisma.$transaction(async (tx) => {
                const payout = await tx.payout.findUnique({ where: { id } });
                if (!payout) throw new Error('Not found');
                const updated = await tx.payout.update({
                    where: { id },
                    data: { status, adminComment, completedAt: status === 'COMPLETED' ? new Date() : null }
                });
                if (status === 'REJECTED' && payout.status === 'PENDING') {
                    await tx.user.update({ where: { id: payout.userId }, data: { points: { increment: payout.amount } } });
                }
                return updated;
            });
            if (status === 'COMPLETED') {
                const user = await prisma.user.findUnique({ where: { id: result.userId } });
                if (user?.email) sendEmail(user.email, '【FLASTAL】出金手続き完了', `<p>${result.finalAmount}円の振込手続きが完了しました。</p>`);
            }
            res.json(result);
        } else {
            const updated = await prisma.payoutRequest.update({ where: { id }, data: { status } });
            if (status === 'REJECTED') {
                await prisma.florist.update({ where: { id: updated.floristId }, data: { balance: { increment: updated.amount } } });
            }
            res.json(updated);
        }
    } catch (e) { res.status(500).json({ message: 'Update failed' }); }
};

// ==========================================
// ★★★ 4. メール・通知・チャット管理 ★★★
// ==========================================

export const getEmailTemplates = async (req, res) => {
    try {
        const data = await prisma.emailTemplate.findMany({ orderBy: { name: 'asc' } });
        res.json(data);
    } catch (e) { res.status(500).json({ message: '取得失敗' }); }
};

export const saveEmailTemplate = async (req, res) => {
    const { id, key, name, subject, body, targetRole, isSystemTemplate } = req.body;
    try {
        if (id) {
            const updated = await prisma.emailTemplate.update({
                where: { id },
                data: { key, name, subject, body, targetRole, isSystemTemplate }
            });
            res.json(updated);
        } else {
            const created = await prisma.emailTemplate.create({
                data: { key, name, subject, body, targetRole, isSystemTemplate }
            });
            res.status(201).json(created);
        }
    } catch (e) { res.status(500).json({ message: 'Save failed' }); }
};

export const sendIndividualEmail = async (req, res) => {
    const { userId, targetRole, templateId, customSubject, customBody } = req.body;
    try {
        let targetUser;
        if (targetRole === 'FLORIST') {
            const f = await prisma.florist.findUnique({ where: { id: userId } });
            if (f) targetUser = { email: f.email, handleName: f.platformName };
        } else {
            targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, handleName: true } });
        }

        if (!targetUser || !targetUser.email) return res.status(404).json({ message: 'User not found' });

        let subject = customSubject;
        let body = customBody;

        if (templateId) {
            const t = await prisma.emailTemplate.findUnique({ where: { id: templateId } });
            if (t) { subject = t.subject; body = t.body; } 
        }
        await sendEmail(targetUser.email, subject, body);
        res.json({ message: 'Sent' });
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const getReports = async (req, res) => {
    const { type } = req.params; 
    try {
        if (type === 'chat') {
            const groupReports = await prisma.groupChatMessageReport.findMany({ where: { status: 'PENDING' }, include: { message: true, reporter: { select: { handleName: true } } } });
            const directReports = await prisma.chatMessageReport.findMany({ where: { status: 'PENDING' }, include: { message: true, reporter: { select: { handleName: true } } } });
            
            const formatted = [
                ...groupReports.map(r => ({ ...r, type: 'GROUP', content: r.message.content, projectId: r.message.projectId })),
                ...directReports.map(r => ({ ...r, type: 'DIRECT', content: r.message.content }))
            ];
            return res.json(formatted);
        }
        if (type === 'events') {
            const reports = await prisma.eventReport.findMany({ where: { status: 'PENDING' }, include: { event: true, reporter: true } });
            return res.json(reports);
        }
        res.json([]);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const createAdminChatRoom = async (req, res) => {
    const { targetUserId, targetUserRole } = req.body;
    try {
        let room = await prisma.adminChatRoom.findFirst({ where: { userId: targetUserId, userRole: targetUserRole } });
        if (!room) room = await prisma.adminChatRoom.create({ data: { adminId: req.user.id, userId: targetUserId, userRole: targetUserRole } });
        res.status(201).json(room);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const getAdminChatMessages = async (req, res) => {
    try {
        const messages = await prisma.adminChatMessage.findMany({ where: { chatRoomId: req.params.roomId }, orderBy: { createdAt: 'asc' } });
        res.json(messages);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

// ==========================================
// ★★★ 5. その他 (User Search, Venue Admin) ★★★
// ==========================================

export const searchAllUsers = async (req, res) => {
    const { keyword } = req.query;
    try {
        const users = await prisma.user.findMany({ where: { OR: [{ email: { contains: keyword, mode: 'insensitive' } }, { handleName: { contains: keyword, mode: 'insensitive' } }] }, select: { id: true, email: true, handleName: true, role: true, iconUrl: true } });
        const florists = await prisma.florist.findMany({ where: { OR: [{ email: { contains: keyword, mode: 'insensitive' } }, { platformName: { contains: keyword, mode: 'insensitive' } }] }, select: { id: true, email: true, platformName: true, iconUrl: true } });
        const formattedFlorists = florists.map(f => ({ id: f.id, email: f.email, handleName: f.platformName, role: 'FLORIST', iconUrl: f.iconUrl }));
        res.json([...users, ...formattedFlorists]);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const getAllProjectsAdmin = async (req, res) => {
    try {
        const projects = await prisma.project.findMany({ orderBy: { createdAt: 'desc' }, include: { planner: { select: { handleName: true } } } });
        res.json(projects);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const getProjectChatLogs = async (req, res) => {
    const { projectId } = req.params;
    try {
        const gc = await prisma.groupChatMessage.findMany({ where: { projectId }, include: { user: { select: { handleName: true } } }, orderBy: { createdAt: 'asc' } });
        const fc = await prisma.chatMessage.findMany({ where: { chatRoom: { offer: { projectId } } }, include: { user: true, florist: true }, orderBy: { createdAt: 'asc' } });
        res.json({ groupChat: gc, floristChat: fc });
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const updateProjectVisibility = async (req, res) => {
    const { isVisible } = req.body;
    try {
        const p = await prisma.project.update({ where: { id: req.params.projectId }, data: { visibility: isVisible ? 'PUBLIC' : 'UNLISTED' } });
        res.json(p);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const reviewReport = async (req, res) => {
    const { reportId } = req.params;
    try {
        const updated = await prisma.projectReport.update({
            where: { id: reportId },
            data: { status: 'REVIEWED' }
        });
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
        if(isBanned) await prisma.eventReport.updateMany({ where: { eventId: req.params.eventId }, data: { status: 'RESOLVED' } });
        res.json(e);
    } catch(e) { res.status(500).json({ message: 'Error' }); }
};
export const dismissEventReport = async (req, res) => {
    try { await prisma.eventReport.update({ where: { id: req.params.reportId }, data: { status: 'RESOLVED' } }); res.json({message:'OK'}); } catch(e) { res.status(500).json({message:'Error'}); }
};