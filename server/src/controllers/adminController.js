import prisma from '../config/prisma.js';
import { sendEmail } from '../utils/email.js';

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
// ★ 修正: 全テーブルをマージするロジック（status も取得）
// ==========================================
export const searchAllUsers = async (req, res) => {
    try {
        const keyword = req.query.keyword || '';
        const keywordLower = keyword.toLowerCase();

        const [users, florists, organizers, venues] = await Promise.all([
            prisma.user.findMany({ 
                include: { illustratorProfile: true },
                orderBy: { createdAt: 'desc' } 
            }).catch(() => []),
            prisma.florist.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []),
            prisma.organizer.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []),
            prisma.venue.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => [])
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
                status: u.status || 'ACTIVE', // ★ 追加: ステータス
                createdAt: u.createdAt,
                iconUrl: u.iconUrl || null
            });
        });

        // ② お花屋さん
        florists.forEach(f => {
            finalUsers.push({ id: f.id, email: f.email || '非公開', displayName: f.platformName || f.shopName || f.contactName || '未設定', role: 'FLORIST', status: f.status || 'PENDING', createdAt: f.createdAt, iconUrl: f.iconUrl || null });
        });

        // ③ 主催者
        organizers.forEach(o => {
            finalUsers.push({ id: o.id, email: o.email || '非公開', displayName: o.name || '未設定', role: 'ORGANIZER', status: o.status || 'PENDING', createdAt: o.createdAt, iconUrl: null });
        });

        // ④ 会場
        venues.forEach(v => {
            finalUsers.push({ id: v.id, email: v.email || '非公開', displayName: v.venueName || '未設定', role: 'VENUE', status: v.status || 'PENDING', createdAt: v.createdAt, iconUrl: v.imageUrls && v.imageUrls.length > 0 ? v.imageUrls[0] : null });
        });

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
// ★ 新規追加: アカウントの非表示(BAN) / 復旧の切り替え
// ==========================================
export const toggleUserStatus = async (req, res) => {
    const { userId } = req.params;
    const { role, status } = req.body; // 例: status = 'SUSPENDED' または 'APPROVED' / 'ACTIVE'

    try {
        let updated;
        if (role === 'FLORIST') {
            updated = await prisma.florist.update({ where: { id: userId }, data: { status } });
        } else if (role === 'VENUE') {
            updated = await prisma.venue.update({ where: { id: userId }, data: { status } });
        } else if (role === 'ORGANIZER') {
            updated = await prisma.organizer.update({ where: { id: userId }, data: { status } });
        } else {
            // USER または ILLUSTRATOR または ADMIN
            if (userId === req.user.id) {
                return res.status(400).json({ message: '自身のアカウントのステータスは変更できません。' });
            }
            updated = await prisma.user.update({ where: { id: userId }, data: { status } });
        }
        res.status(200).json({ message: `ステータスを ${status} に更新しました。`, data: updated });
    } catch (error) {
        console.error('Toggle User Status Error:', error);
        res.status(500).json({ message: 'ステータスの更新に失敗しました。' });
    }
};

// ==========================================
// ★ アカウント強制削除（関連データもすべて道連れにして削除）
// ==========================================
export const deleteUserByAdmin = async (req, res) => {
    const { userId } = req.params;
    const { role } = req.query;

    try {
        await prisma.$transaction(async (tx) => {
            if (role === 'FLORIST') {
                const target = await tx.florist.findUnique({ where: { id: userId } });
                if (!target) throw new Error('お花屋さんのデータが見つかりません。');
                
                // 1. オファーとチャット関連をすべて削除
                const offers = await tx.offer.findMany({ where: { floristId: userId } });
                for (const offer of offers) {
                    const chatRoom = await tx.chatRoom.findFirst({ where: { offerId: offer.id } });
                    if (chatRoom) {
                        const messages = await tx.chatMessage.findMany({ where: { chatRoomId: chatRoom.id } });
                        const msgIds = messages.map(m => m.id);
                        if (msgIds.length > 0) {
                            await tx.chatMessageReport.deleteMany({ where: { messageId: { in: msgIds } } }).catch(()=>{});
                        }
                        await tx.chatMessage.deleteMany({ where: { chatRoomId: chatRoom.id } }).catch(()=>{});
                        await tx.chatRoom.delete({ where: { id: chatRoom.id } }).catch(()=>{});
                    }
                    await tx.offer.delete({ where: { id: offer.id } }).catch(()=>{});
                }

                // 2. アピール投稿関連をすべて削除
                const posts = await tx.floristPost.findMany({ where: { floristId: userId } }).catch(()=>[]);
                if (posts.length > 0) {
                    const postIds = posts.map(p => p.id);
                    await tx.floristPostLike.deleteMany({ where: { floristPostId: { in: postIds } } }).catch(()=>{});
                    await tx.floristPost.deleteMany({ where: { floristId: userId } }).catch(()=>{});
                }

                // 3. その他の紐づきデータも安全に削除
                await tx.floristDeal.deleteMany({ where: { floristId: userId } }).catch(()=>{});
                await tx.payoutRequest.deleteMany({ where: { floristId: userId } }).catch(()=>{});
                await tx.bankAccount.deleteMany({ where: { floristId: userId } }).catch(()=>{});
                await tx.review.deleteMany({ where: { floristId: userId } }).catch(()=>{});
                await tx.adminChatRoom.deleteMany({ where: { userId: userId, userRole: 'FLORIST' } }).catch(()=>{});
                await tx.chatMessage.deleteMany({ where: { floristId: userId } }).catch(()=>{});

                // 最後に本体を削除
                await tx.florist.delete({ where: { id: userId } });
                
            } else if (role === 'VENUE') {
                const target = await tx.venue.findUnique({ where: { id: userId } });
                if (!target) throw new Error('会場のデータが見つかりません。');
                
                await tx.event.deleteMany({ where: { venueId: userId } }).catch(()=>{});
                await tx.venueLogisticsInfo.deleteMany({ where: { venueId: userId } }).catch(()=>{});
                
                await tx.venue.delete({ where: { id: userId } });
                
            } else if (role === 'ORGANIZER') {
                const target = await tx.organizer.findUnique({ where: { id: userId } });
                if (!target) throw new Error('主催者のデータが見つかりません。');
                
                await tx.event.deleteMany({ where: { organizerId: userId } }).catch(()=>{});
                
                await tx.organizer.delete({ where: { id: userId } });
                
            } else {
                // USER または ILLUSTRATOR (両方とも Userテーブル)
                const target = await tx.user.findUnique({ where: { id: userId } });
                if (!target) throw new Error('ユーザーが見つかりません。');
                
                if (target.role === 'ADMIN' && target.id === req.user.id) {
                    throw new Error('自身のアカウントは削除できません。');
                }
                
                // ファン・絵師の関連データ
                await tx.illustratorProfile.deleteMany({ where: { userId: userId } }).catch(()=>{});
                await tx.illustratorApplication.deleteMany({ where: { illustratorId: userId } }).catch(()=>{});
                await tx.illustratorOffer.deleteMany({ where: { illustratorId: userId } }).catch(()=>{});
                await tx.bankAccount.deleteMany({ where: { userId: userId } }).catch(()=>{});
                await tx.payout.deleteMany({ where: { userId: userId } }).catch(()=>{});
                
                await tx.user.delete({ where: { id: userId } });
            }
        });

        res.status(200).json({ message: 'アカウントを強制削除しました。' });
    } catch (error) {
        console.error('Admin User Delete Error:', error);
        if (error.code === 'P2003') {
            return res.status(400).json({ message: '関連データが複雑すぎるため削除できませんでした。手動でのデータ整理が必要です。' });
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

// ==========================================
// ★★★ 予算別参考写真 (BudgetReference) 管理 ★★★
// ==========================================

export const getBudgetReferences = async (req, res) => {
    try {
        const refs = await prisma.budgetReferenceImage.findMany({
            orderBy: { createdAt: 'asc' }
        });
        return res.json(refs);
    } catch (error) {
        console.error('getBudgetReferences Error:', error);
        return res.status(500).json({ message: '取得に失敗しました' });
    }
};

export const upsertBudgetReference = async (req, res) => {
    const { priceRange, label, description, imageUrl, isActive } = req.body;
    try {
        const ref = await prisma.budgetReferenceImage.upsert({
            where: { priceRange },
            update: { label, description, imageUrl, isActive: isActive ?? true },
            create: { priceRange, label, description, imageUrl, isActive: isActive ?? true }
        });
        return res.status(200).json(ref);
    } catch (error) {
        console.error('upsertBudgetReference Error:', error);
        return res.status(500).json({ message: '保存に失敗しました' });
    }
};

export const deleteBudgetReference = async (req, res) => {
    const { priceRange } = req.params;
    try {
        await prisma.budgetReferenceImage.delete({
            where: { priceRange }
        });
        return res.status(204).send();
    } catch (error) {
        console.error('deleteBudgetReference Error:', error);
        return res.status(500).json({ message: '削除に失敗しました' });
    }
};
export const getAnalytics = async (req, res) => {
    try {
        const now = new Date();
        const months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            return { year: d.getFullYear(), month: d.getMonth() + 1, label: `${d.getMonth() + 1}月` };
        });

        const [pledgesByMonth, supportersByMonth, projectsByMonth] = await Promise.all([
            // 月別支援金額合計
            prisma.pledge.groupBy({
                by: ['createdAt'],
                _sum: { amount: true },
                where: {
                    createdAt: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }
                },
            }),
            // 月別ユニーク支援者数
            prisma.pledge.findMany({
                where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } },
                select: { createdAt: true, userId: true },
            }),
            // 月別新規企画数
            prisma.project.groupBy({
                by: ['createdAt'],
                _count: { id: true },
                where: {
                    createdAt: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }
                },
            }),
        ]);

        const toMonthKey = (d) => `${new Date(d).getFullYear()}-${new Date(d).getMonth() + 1}`;

        // 月別集計
        const salesMap = {};
        for (const p of pledgesByMonth) {
            const key = toMonthKey(p.createdAt);
            salesMap[key] = (salesMap[key] || 0) + (p._sum.amount || 0);
        }

        const supporterMap = {};
        for (const p of supportersByMonth) {
            const key = toMonthKey(p.createdAt);
            if (!supporterMap[key]) supporterMap[key] = new Set();
            if (p.userId) supporterMap[key].add(p.userId);
        }

        const projectMap = {};
        for (const p of projectsByMonth) {
            const key = toMonthKey(p.createdAt);
            projectMap[key] = (projectMap[key] || 0) + (p._count.id || 0);
        }

        const salesChart = months.map(m => ({
            label: m.label,
            amount: salesMap[`${m.year}-${m.month}`] || 0,
        }));

        const supportersChart = months.map(m => ({
            label: m.label,
            count: (supporterMap[`${m.year}-${m.month}`] || new Set()).size,
        }));

        const projectsChart = months.map(m => ({
            label: m.label,
            count: projectMap[`${m.year}-${m.month}`] || 0,
        }));

        // 累計統計
        const [totalUsers, totalProjects, totalPledgeSum] = await Promise.all([
            prisma.user.count(),
            prisma.project.count(),
            prisma.pledge.aggregate({ _sum: { amount: true } }),
        ]);

        res.json({
            salesChart,
            supportersChart,
            projectsChart,
            totals: {
                users: totalUsers,
                projects: totalProjects,
                pledgeAmount: totalPledgeSum._sum.amount || 0,
            },
        });
    } catch (error) {
        console.error('getAnalytics Error:', error);
        res.status(500).json({ message: 'アナリティクスの取得に失敗しました' });
    }
};

export const exportCsv = async (req, res) => {
    const { type } = req.query; // 'pledges' | 'commissions'
    try {
        let rows = [];
        let filename = '';

        if (type === 'pledges') {
            const pledges = await prisma.pledge.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { handleName: true, email: true } },
                    project: { select: { title: true } },
                },
            });
            filename = 'pledges.csv';
            rows = [
                ['支援日', '企画名', '支援者名', 'メール', '金額', 'コメント'],
                ...pledges.map(p => [
                    new Date(p.createdAt).toLocaleDateString('ja-JP'),
                    p.project?.title || '',
                    p.user?.handleName || p.guestName || 'ゲスト',
                    p.user?.email || p.guestEmail || '',
                    p.amount,
                    p.comment || '',
                ]),
            ];
        } else if (type === 'commissions') {
            const commissions = await prisma.commission.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    project: { select: { title: true } },
                    florist: { select: { platformName: true } },
                },
            });
            filename = 'commissions.csv';
            rows = [
                ['日付', '企画名', 'お花屋さん', '手数料金額'],
                ...commissions.map(c => [
                    new Date(c.createdAt).toLocaleDateString('ja-JP'),
                    c.project?.title || '',
                    c.florist?.platformName || '',
                    c.amount,
                ]),
            ];
        } else {
            return res.status(400).json({ message: 'type=pledges または type=commissions を指定してください' });
        }

        const csv = rows.map(row =>
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const bom = '﻿'; // Excel用BOM (Shift-JIS対応)
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(bom + csv);
    } catch (error) {
        console.error('exportCsv Error:', error);
        res.status(500).json({ message: 'CSVエクスポートに失敗しました' });
    }
};

export const getWebhookLogs = async (req, res) => {
    const { status, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    try {
        const where = status ? { status } : {};
        const [logs, total] = await Promise.all([
            prisma.webhookLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma.webhookLog.count({ where }),
        ]);
        res.json({ logs, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        console.error('getWebhookLogs Error:', err);
        res.status(500).json({ message: '取得に失敗しました' });
    }
};

export const retryWebhookLog = async (req, res) => {
    const { id } = req.params;
    try {
        const log = await prisma.webhookLog.findUnique({ where: { id } });
        if (!log) return res.status(404).json({ message: '見つかりません' });
        // retryCountをリセットして再試行対象に戻す
        await prisma.webhookLog.update({
            where: { id },
            data: { retryCount: 0, lastRetryAt: null },
        });
        res.json({ message: 'リトライ対象にセットしました' });
    } catch (err) {
        res.status(500).json({ message: '失敗しました' });
    }
};

export const sendBulkEmail = async (req, res) => {
    const { subject, body, targetRole } = req.body;
    if (!subject || !body) return res.status(400).json({ message: 'subject と body は必須です' });

    try {
        const { sendEmail } = await import('../utils/email.js');

        let emails = [];
        if (!targetRole || targetRole === 'USER') {
            const users = await prisma.user.findMany({ select: { email: true }, where: { email: { not: null } } });
            emails = [...emails, ...users.map(u => u.email)];
        }
        if (!targetRole || targetRole === 'FLORIST') {
            const florists = await prisma.florist.findMany({ select: { email: true }, where: { email: { not: null } } });
            emails = [...emails, ...florists.map(f => f.email)];
        }

        const uniqueEmails = [...new Set(emails)];

        // バッチ送信（10件ずつ）
        let sent = 0;
        for (let i = 0; i < uniqueEmails.length; i += 10) {
            const batch = uniqueEmails.slice(i, i + 10);
            await Promise.allSettled(batch.map(email => sendEmail(email, subject, body)));
            sent += batch.length;
        }

        res.json({ message: `${sent}件のメールを送信しました` });
    } catch (error) {
        console.error('sendBulkEmail Error:', error);
        res.status(500).json({ message: '送信に失敗しました' });
    }
};

// ─── ポイント手動調整 ───────────────────────────────────────────
export const adjustUserPoints = async (req, res) => {
    const { userId } = req.params;
    const { delta, reason } = req.body; // delta: +/- 整数
    if (!delta || typeof delta !== 'number') {
        return res.status(400).json({ message: 'delta（整数）は必須です' });
    }
    try {
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { points: { increment: delta } },
            select: { id: true, handleName: true, email: true, points: true },
        });
        console.log(`[Admin] ポイント調整 userId=${userId} delta=${delta} reason=${reason || 'なし'} by adminId=${req.user?.id}`);
        res.json({ user: updated, message: `ポイントを ${delta > 0 ? '+' : ''}${delta} 調整しました` });
    } catch (error) {
        console.error('adjustUserPoints Error:', error);
        res.status(500).json({ message: 'ポイント調整に失敗しました' });
    }
};

// ─── プロジェクト強制キャンセル ──────────────────────────────────
export const forceCloseProject = async (req, res) => {
    const { projectId } = req.params;
    const { reason } = req.body;
    try {
        const project = await prisma.project.update({
            where: { id: projectId },
            data: { status: 'CANCELED' },
            select: { id: true, title: true, plannerId: true, planner: { select: { email: true, handleName: true } } },
        });
        // 企画者に通知
        if (project.planner?.email) {
            const { queueEmail } = await import('../utils/email.js');
            queueEmail(project.planner.email, 'PROJECT_CANCELED', {
                plannerName: project.planner.handleName || 'さん',
                projectTitle: project.title,
                reason: reason || '運営判断によりキャンセルされました',
            });
        }
        res.json({ message: `「${project.title}」を強制キャンセルしました` });
    } catch (error) {
        console.error('forceCloseProject Error:', error);
        res.status(500).json({ message: '強制キャンセルに失敗しました' });
    }
};

// ==========================================
// ★ 不正フラグ一覧
// ==========================================
export const getFraudFlags = async (req, res) => {
    try {
        const flags = await prisma.fraudFlag.findMany({
            where: req.query.reviewed === 'true' ? {} : { reviewed: false },
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                // user/project はリレーションなしなので raw select
            },
        });
        // userId/projectId を名前で補完
        const enriched = await Promise.all(flags.map(async (f) => {
            const [user, project] = await Promise.all([
                prisma.user.findUnique({ where: { id: f.userId }, select: { handleName: true, email: true } }),
                prisma.project.findUnique({ where: { id: f.projectId }, select: { title: true } }),
            ]);
            return { ...f, user, project };
        }));
        res.json(enriched);
    } catch (err) {
        console.error('getFraudFlags:', err);
        res.status(500).json({ message: '取得に失敗しました' });
    }
};

export const reviewFraudFlag = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.fraudFlag.update({ where: { id }, data: { reviewed: true } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: '更新に失敗しました' });
    }
};

export const reviewKyc = async (req, res) => {
    const { userId } = req.params;
    const { kycStatus } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(kycStatus)) {
        return res.status(400).json({ message: '無効なステータスです' });
    }
    try {
        await prisma.user.update({ where: { id: userId }, data: { kycStatus } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: '更新に失敗しました' });
    }
};
