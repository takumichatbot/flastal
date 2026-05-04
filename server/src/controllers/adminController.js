import prisma from '../config/prisma.js';
import { sendEmail, sendDynamicEmail } from '../utils/email.js';
import { createNotification } from '../utils/notification.js';

// ==========================================
// ★★★ プロジェクトごとの全チャット履歴取得 ★★★
// ==========================================
export const getProjectChatLogs = async (req, res) => {
    const { projectId } = req.params;
    try {
        const groupMessages = await prisma.groupChatMessage.findMany({
            where: { projectId },
            include: { user: { select: { handleName: true } } },
            orderBy: { createdAt: 'asc' }
        });

        const floristMessages = await prisma.chatMessage.findMany({
            where: { chatRoom: { offer: { projectId } } },
            include: {
                user: { select: { handleName: true } },
                florist: { select: { platformName: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        const allMessages = [
            ...groupMessages.map(m => ({
                id: m.id,
                type: 'GROUP',
                content: m.content,
                senderName: m.user?.handleName || '不明',
                createdAt: m.createdAt,
                messageType: m.messageType,
                fileUrl: m.fileUrl
            })),
            ...floristMessages.map(m => ({
                id: m.id,
                type: 'DIRECT',
                content: m.content,
                senderName: m.senderType === 'USER' ? (m.user?.handleName || '不明') : (m.florist?.platformName || '花屋'),
                createdAt: m.createdAt,
                messageType: m.messageType,
                fileUrl: m.fileUrl
            }))
        ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        return res.json(allMessages);
    } catch (e) {
        console.error('getProjectChatLogs Error:', e);
        return res.status(200).json([]);
    }
};

// --- 以下、既存の安定化された関数群 ---

export const getAllProjectsAdmin = async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            orderBy: { createdAt: 'desc' },
            include: { planner: { select: { handleName: true, email: true } } }
        });
        return res.json(projects || []);
    } catch (e) { return res.status(200).json([]); }
};

export const getReports = async (req, res) => {
    const { type } = req.params;
    try {
        if (type === 'chat') {
            const groupReports = await prisma.groupChatMessageReport.findMany({ where: { status: 'PENDING' }, include: { message: true, reporter: true } });
            const directReports = await prisma.chatMessageReport.findMany({ where: { status: 'PENDING' }, include: { message: true, reporter: true } });
            const formatted = [
                ...groupReports.map(r => ({ id: r.id, type: 'GROUP', content: r.message?.content, reporterName: r.reporter.handleName, createdAt: r.createdAt })),
                ...directReports.map(r => ({ id: r.id, type: 'DIRECT', content: r.message?.content, reporterName: r.reporter.handleName, createdAt: r.createdAt }))
            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return res.json(formatted);
        }
        return res.json([]);
    } catch (e) { return res.status(200).json([]); }
};

export const approveItem = async (req, res) => {
    const { type, id } = req.params;
    const { status } = req.body; 
    try {
        const finalStatus = status === 'APPROVED' ? 'APPROVED' : (status === 'REJECTED' ? 'REJECTED' : 'PENDING');
        let updated;
        const fm = prisma.florist || prisma['florist'];
        if (type === 'projects') updated = await prisma.project.update({ where: { id }, data: { status: status === 'APPROVED' ? 'FUNDRAISING' : 'REJECTED' } });
        else if (type === 'florists') updated = await fm.update({ where: { id }, data: { status: finalStatus } });
        else if (type === 'illustrators') updated = await prisma.user.update({ where: { id }, data: { status: finalStatus } });
        else if (type === 'venues') updated = await prisma.venue.update({ where: { id }, data: { status: finalStatus } });
        else if (type === 'organizers') updated = await prisma.organizer.update({ where: { id }, data: { status: finalStatus } });
        return res.json(updated);
    } catch (e) { return res.status(500).json({ message: '更新に失敗しました' }); }
};

export const getPendingItems = async (req, res) => {
    const { type } = req.params;
    try {
        let data = [];
        const fm = prisma.florist || prisma['florist'];
        if (type === 'projects') data = await prisma.project.findMany({ where: { status: 'PENDING_APPROVAL' }, include: { planner: true } });
        else if (type === 'florists') data = await fm.findMany({ where: { status: 'PENDING' } });
        else if (type === 'illustrators') data = await prisma.user.findMany({ where: { role: 'ILLUSTRATOR', status: 'PENDING' } });
        else if (type === 'venues') data = await prisma.venue.findMany({ where: { status: 'PENDING' } });
        else if (type === 'organizers') data = await prisma.organizer.findMany({ where: { status: 'PENDING' } });
        return res.json(data || []);
    } catch (e) { return res.status(200).json([]); }
};

export const getAllFloristsAdmin = async (req, res) => {
    try {
        const fm = prisma.florist || prisma['florist'];
        return res.json(await fm.findMany({ orderBy: { createdAt: 'desc' } }) || []);
    } catch (e) { return res.status(200).json([]); }
};

export const getFloristByIdAdmin = async (req, res) => {
    try {
        const fm = prisma.florist || prisma['florist'];
        return res.json(await fm.findUnique({ where: { id: req.params.id } }));
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
        const fm = prisma.florist || prisma['florist'];
        return res.json(await fm.findUnique({ where: { id: req.params.id }, select: { id: true, platformName: true, customFeeRate: true } }));
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const updateFloristFee = async (req, res) => {
    try {
        const fm = prisma.florist || prisma['florist'];
        const rate = req.body.customFeeRate === '' ? null : parseFloat(req.body.customFeeRate);
        return res.json(await fm.update({ where: { id: req.params.id }, data: { customFeeRate: rate } }));
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const getCommissions = async (req, res) => {
    try { return res.json(await prisma.commission.findMany({ include: { project: true } }) || []); } catch (e) { return res.status(200).json([]); }
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

// ==========================================
// ★★★ メールテンプレート管理 (CRUD) ★★★
// ==========================================

export const getEmailTemplates = async (req, res) => {
    try { 
        return res.json(await prisma.emailTemplate.findMany({ orderBy: { createdAt: 'desc' } }) || []); 
    } catch (e) { 
        return res.status(200).json([]); 
    }
};

export const getEmailTemplate = async (req, res) => {
    try {
        const template = await prisma.emailTemplate.findUnique({ where: { id: req.params.id } });
        if (!template) return res.status(404).json({ message: 'テンプレートが見つかりません' });
        return res.json(template);
    } catch (error) {
        return res.status(500).json({ message: 'テンプレートの取得に失敗しました' });
    }
};

export const createEmailTemplate = async (req, res) => {
    try {
        const { key, name, subject, body, targetRole, isSystemTemplate } = req.body;
        const existing = await prisma.emailTemplate.findUnique({ where: { key } });
        if (existing) return res.status(400).json({ message: 'このキーは既に使用されています' });

        const template = await prisma.emailTemplate.create({
            data: { key, name, subject, body, targetRole, isSystemTemplate }
        });
        return res.status(201).json(template);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'テンプレートの作成に失敗しました' });
    }
};

export const updateEmailTemplate = async (req, res) => {
    try {
        const { key, name, subject, body, targetRole, isSystemTemplate } = req.body;
        const template = await prisma.emailTemplate.update({
            where: { id: req.params.id },
            data: { key, name, subject, body, targetRole, isSystemTemplate }
        });
        return res.json(template);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'テンプレートの更新に失敗しました' });
    }
};

export const deleteEmailTemplate = async (req, res) => {
    try {
        const template = await prisma.emailTemplate.findUnique({ where: { id: req.params.id } });
        if (!template) return res.status(404).json({ message: 'テンプレートが見つかりません' });
        if (template.isSystemTemplate) return res.status(400).json({ message: 'システム必須テンプレートは削除できません' });

        await prisma.emailTemplate.delete({ where: { id: req.params.id } });
        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'テンプレートの削除に失敗しました' });
    }
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
    try { return res.json(await prisma.adminChatMessage.findMany({ where: { chatRoomId: req.params.roomId } }) || []); } catch (e) { return res.status(200).json([]); }
};


// ==========================================
// ★ 修正: 全テーブルを愚直に取得し、完全にマージするロジック
// ==========================================
// ==========================================
// ★ 修正: 独立した Illustrator テーブルのデータも取得する
// ==========================================
export const searchAllUsers = async (req, res) => {
    try {
        const keyword = req.query.keyword || '';
        const keywordLower = keyword.toLowerCase();

        // 1. 各テーブルから全件取得（★ Illustrator テーブルを追加）
        const [users, florists, organizers, venues, illustrators] = await Promise.all([
            prisma.user.findMany({ 
                include: { illustratorProfile: true },
                orderBy: { createdAt: 'desc' } 
            }).catch(() => []),
            prisma.florist.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []),
            prisma.organizer.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []),
            prisma.venue.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []),
            prisma.illustrator.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []) // ★ 追加
        ]);

        let finalUsers = [];

        // ① ファン・管理者・統合版イラストレーター（Userテーブル）
        users.forEach(u => {
            let role = u.role ? u.role.toUpperCase().trim() : 'USER';
            let displayName = u.handleName || u.name || '未設定';

            if (u.illustratorProfile || role === 'ILLUSTRATOR') {
                role = 'ILLUSTRATOR';
                displayName = u.illustratorProfile?.penName || u.handleName || '未設定'; 
            }

            finalUsers.push({
                id: u.id,
                email: u.email || '非公開',
                displayName: displayName,
                role: role,
                createdAt: u.createdAt,
                iconUrl: u.iconUrl || null
            });
        });

        // ② お花屋さん
        florists.forEach(f => {
            finalUsers.push({ id: f.id, email: f.email || '非公開', displayName: f.platformName || f.shopName || f.contactName || '未設定', role: 'FLORIST', createdAt: f.createdAt, iconUrl: f.iconUrl || null });
        });

        // ③ 主催者
        organizers.forEach(o => {
            finalUsers.push({ id: o.id, email: o.email || '非公開', displayName: o.name || '未設定', role: 'ORGANIZER', createdAt: o.createdAt, iconUrl: null });
        });

        // ④ 会場
        venues.forEach(v => {
            finalUsers.push({ id: v.id, email: v.email || '非公開', displayName: v.venueName || '未設定', role: 'VENUE', createdAt: v.createdAt, iconUrl: v.imageUrls && v.imageUrls.length > 0 ? v.imageUrls[0] : null });
        });

        // ⑤ ★旧イラストレーター（独立テーブル）
        if (illustrators && illustrators.length > 0) {
            illustrators.forEach(i => {
                finalUsers.push({
                    id: i.id,
                    email: i.email || '非公開',
                    displayName: i.name || i.handleName || '未設定',
                    role: 'ILLUSTRATOR_OLD', // 削除用に別名をつけておく
                    createdAt: i.createdAt,
                    iconUrl: i.iconUrl || null
                });
            });
        }

        if (keywordLower) {
            finalUsers = finalUsers.filter(u => 
                u.displayName?.toLowerCase().includes(keywordLower) || 
                u.email?.toLowerCase().includes(keywordLower) ||
                u.id?.toLowerCase().includes(keywordLower)
            );
        }

        finalUsers.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        return res.json(finalUsers);

    } catch (e) {
        console.error("searchAllUsers API Error:", e);
        return res.status(500).json([]);
    }
};

// ==========================================
// ★ 修正: 旧イラストレーターの削除処理を追加
// ==========================================
export const deleteUserByAdmin = async (req, res) => {
    const { userId } = req.params;
    const { role } = req.query;

    try {
        await prisma.$transaction(async (tx) => {
            if (role === 'FLORIST') {
                const target = await tx.florist.findUnique({ where: { id: userId } });
                if (!target) throw new Error('お花屋さんのデータが見つかりません。');
                await tx.florist.delete({ where: { id: userId } });
                
            } else if (role === 'VENUE') {
                const target = await tx.venue.findUnique({ where: { id: userId } });
                if (!target) throw new Error('会場のデータが見つかりません。');
                await tx.venue.delete({ where: { id: userId } });
                
            } else if (role === 'ORGANIZER') {
                const target = await tx.organizer.findUnique({ where: { id: userId } });
                if (!target) throw new Error('主催者のデータが見つかりません。');
                await tx.organizer.delete({ where: { id: userId } });
                
            } else if (role === 'ILLUSTRATOR_OLD') {
                // ★ 旧テーブルのイラストレーター削除
                const target = await tx.illustrator.findUnique({ where: { id: userId } });
                if (!target) throw new Error('イラストレーターのデータが見つかりません。');
                await tx.illustrator.delete({ where: { id: userId } });

            } else {
                // USER または 新 ILLUSTRATOR (両方とも Userテーブル)
                const target = await tx.user.findUnique({ where: { id: userId } });
                if (!target) throw new Error('ユーザーが見つかりません。');
                
                if (target.role === 'ADMIN' && target.id === req.user.id) {
                    throw new Error('自身のアカウントは削除できません。');
                }
                await tx.user.delete({ where: { id: userId } });
            }
        });

        res.status(200).json({ message: 'アカウントを削除しました。' });
    } catch (error) {
        console.error('Admin User Delete Error:', error);
        if (error.code === 'P2003') {
            return res.status(400).json({ message: 'このアカウントに関連するデータ（企画など）が残っているため削除できません。' });
        }
        res.status(error.message.includes('見つかりません') ? 404 : 400).json({ 
            message: error.message || '削除に失敗しました。' 
        });
    }
};

export const updateProjectVisibility = async (req, res) => {
    try {
        return res.json(await prisma.project.update({ where: { id: req.params.projectId }, data: { visibility: req.body.isVisible ? 'PUBLIC' : 'UNLISTED' } }));
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const reviewReport = async (req, res) => {
    try {
        return res.json(await prisma.projectReport.update({ where: { id: req.params.reportId }, data: { status: 'REVIEWED' } }));
    } catch (e) { return res.status(500).json({ message: 'Error' }); }
};

export const createVenueAdmin = async (req, res) => {
    try { return res.status(201).json(await prisma.venue.create({ data: req.body })); } catch(e) { return res.status(500).json({message:'Error'}); }
};
export const updateVenueAdmin = async (req, res) => {
    try { return res.json(await prisma.venue.update({ where: {id:req.params.id}, data: req.body })); } catch(e) { return res.status(500).json({message:'Error'}); }
};
export const deleteVenueAdmin = async (req, res) => {
    try { await prisma.venue.delete({ where: {id:req.params.id} }); return res.status(204).send(); } catch(e) { return res.status(500).json({message:'Error'}); }
};

export const banEvent = async (req, res) => {
    try {
        return res.json(await prisma.event.update({ where: { id: req.params.eventId }, data: { isBanned: req.body.isBanned } }));
    } catch(e) { return res.status(500).json({ message: 'Error' }); }
};
export const dismissEventReport = async (req, res) => {
    try { await prisma.eventReport.update({ where: { id: req.params.reportId }, data: { status: 'RESOLVED' } }); return res.json({message:'OK'}); } catch(e) { return res.status(500).json({message:'Error'}); }
};



// 企画の強制削除
export const deleteProjectByAdmin = async (req, res) => {
    const { projectId } = req.params;

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            return res.status(404).json({ message: '企画が見つかりません。' });
        }

        // トランザクションで削除
        await prisma.$transaction(async (tx) => {
            await tx.project.delete({
                where: { id: projectId }
            });
        });

        res.status(200).json({ message: '企画を削除しました。' });
    } catch (error) {
        console.error('Admin Project Delete Error:', error);
        
        if (error.code === 'P2003') {
            return res.status(400).json({ message: 'この企画に関連する決済データなどが存在するため、安全に削除できません。' });
        }
        
        res.status(500).json({ message: '企画の削除に失敗しました。' });
    }
};