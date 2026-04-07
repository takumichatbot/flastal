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
        else if (type === 'illustrators') data = await prisma.user.findMany({ where: { role: 'ILLUSTRATOR', status: 'PENDING' }, include: { illustratorProfile: true } });
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

export const getEmailTemplates = async (req, res) => {
    try { return res.json(await prisma.emailTemplate.findMany() || []); } catch (e) { return res.status(200).json([]); }
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
    try { return res.json(await prisma.adminChatMessage.findMany({ where: { chatRoomId: req.params.roomId } }) || []); } catch (e) { return res.status(200).json([]); }
};


// ==========================================
// ★ 修正: Prismaエラーを回避する完全なマージロジック
// ==========================================
export const searchAllUsers = async (req, res) => {
    try {
        const keyword = req.query.keyword || '';
        const keywordLower = keyword.toLowerCase();

        // 1. Userテーブルから取得
        // ★ エラーの原因だった florist: true, organizer: true 等の include を削除し、
        // Prismaスキーマに確実に存在する illustratorProfile だけを含める
        const baseUsers = await prisma.user.findMany({
            include: { illustratorProfile: true },
            orderBy: { createdAt: 'desc' }
        });

        // 2. 独立している各テーブルを全件取得（エラー時は空配列でフォールバック）
        const [florists, organizers, venues] = await Promise.all([
            prisma.florist?.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []),
            prisma.organizer?.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []),
            prisma.venue?.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => [])
        ]);

        // 3. マップを使って結合 (userId か id をベースに合体させる)
        const userMap = new Map();

        // ① まず User (ファン、管理者、クリエイター) をセット
        baseUsers.forEach(u => {
            let role = u.role ? u.role.toUpperCase() : 'USER';
            if (u.illustratorProfile || role === 'ILLUSTRATOR') {
                role = 'ILLUSTRATOR';
            }
            userMap.set(u.id, {
                id: u.id,
                email: u.email || '非公開',
                displayName: u.illustratorProfile?.penName || u.handleName || u.name || '未設定',
                role: role,
                createdAt: u.createdAt,
                iconUrl: u.iconUrl || null
            });
        });

        // ② お花屋さんの情報を上書き/追加
        florists.forEach(f => {
            const uid = f.userId || f.id;
            const existing = userMap.get(uid) || {};
            userMap.set(uid, {
                ...existing,
                id: uid,
                email: existing.email || f.email || '非公開',
                displayName: f.platformName || f.storeName || f.shopName || f.contactName || existing.displayName || '未設定',
                role: 'FLORIST',
                createdAt: existing.createdAt || f.createdAt,
                iconUrl: existing.iconUrl || f.iconUrl || null
            });
        });

        // ③ 主催者の情報を上書き/追加
        organizers.forEach(o => {
            const uid = o.userId || o.id;
            const existing = userMap.get(uid) || {};
            userMap.set(uid, {
                ...existing,
                id: uid,
                email: existing.email || o.email || '非公開',
                displayName: o.organizerName || o.name || existing.displayName || '未設定',
                role: 'ORGANIZER',
                createdAt: existing.createdAt || o.createdAt,
                iconUrl: existing.iconUrl || null
            });
        });

        // ④ 会場の情報を上書き/追加
        venues.forEach(v => {
            const uid = v.userId || v.id;
            const existing = userMap.get(uid) || {};
            userMap.set(uid, {
                ...existing,
                id: uid,
                email: existing.email || v.email || '非公開',
                displayName: v.venueName || existing.displayName || '未設定',
                role: 'VENUE',
                createdAt: existing.createdAt || v.createdAt,
                iconUrl: existing.iconUrl || (v.imageUrls && v.imageUrls.length > 0 ? v.imageUrls[0] : null)
            });
        });

        let finalUsers = Array.from(userMap.values());

        // 4. キーワード検索（合体したデータに対して実行することで、全ロールの名前で検索可能になる）
        if (keyword) {
            finalUsers = finalUsers.filter(u => 
                u.displayName?.toLowerCase().includes(keywordLower) || 
                u.email?.toLowerCase().includes(keywordLower) ||
                u.id?.toLowerCase().includes(keywordLower)
            );
        }

        // 新しい順にソート
        finalUsers.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        return res.json(finalUsers);

    } catch (e) {
        console.error("searchAllUsers API Error:", e);
        return res.status(500).json([]);
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