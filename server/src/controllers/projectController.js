import prisma from '../config/prisma.js';
import stripe from '../config/stripe.js';
import { sendEmail, sendDynamicEmail } from '../utils/email.js';
import { createNotification } from '../utils/notification.js';

// ==========================================
// ★★★ 1. 取得系 (Public) ★★★
// ==========================================

export const getProjects = async (req, res) => {
    try {
        const { keyword, prefecture } = req.query;
        const whereClause = {
            status: 'FUNDRAISING',
            NOT: { status: 'CANCELED' },
            projectType: 'PUBLIC',
        };
        if (keyword && keyword.trim() !== '') {
            whereClause.OR = [
                { title: { contains: keyword, mode: 'insensitive' } },
                { description: { contains: keyword, mode: 'insensitive' } },
            ];
        }
        if (prefecture && prefecture.trim() !== '') {
            whereClause.deliveryAddress = { contains: prefecture };
        }
        const projects = await prisma.project.findMany({
            where: whereClause,
            include: { planner: { select: { handleName: true, iconUrl: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(projects);
    } catch (error) {
        console.error('企画一覧取得エラー:', error);
        res.status(500).json({ message: '企画の取得中にエラーが発生しました。' });
    }
};

export const getFeaturedProjects = async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            where: { status: 'FUNDRAISING', visibility: 'PUBLIC' },
            take: 4,
            orderBy: { createdAt: 'desc' },
            include: { planner: true },
        });
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: '企画の取得中にエラーが発生しました。' });
    }
};

export const getSuccessfulTemplates = async (req, res) => {
    try {
        const successfulProjects = await prisma.project.findMany({
            where: { status: { in: ['SUCCESSFUL', 'COMPLETED'] }, visibility: 'PUBLIC' },
            select: {
                id: true, title: true, targetAmount: true, collectedAmount: true,
                imageUrl: true, designDetails: true, flowerTypes: true, createdAt: true,
                expenses: { select: { itemName: true, amount: true } }
            },
            orderBy: { collectedAmount: 'desc' },
            take: 5
        });
        const templates = successfulProjects.map(p => ({
            id: p.id, title: p.title, totalPledged: p.collectedAmount, totalTarget: p.targetAmount,
            image: p.imageUrl, designSummary: p.designDetails ? p.designDetails.substring(0, 50) + '...' : 'N/A',
            expenseSummary: p.expenses.reduce((sum, exp) => sum + exp.amount, 0),
            expenseCount: p.expenses.length
        }));
        res.status(200).json(templates);
    } catch (error) {
        res.status(500).json({ message: 'テンプレートデータの取得に失敗しました。' });
    }
};

export const getProjectById = async (req, res) => {
    const { id } = req.params;
    try {
        const project = await prisma.project.findUnique({
            where: { id: id },
            include: {
                planner: { select: { id: true, handleName: true, iconUrl: true } },
                venue: { select: { id: true, venueName: true, address: true, accessInfo: true, isStandAllowed: true, standRegulation: true, isBowlAllowed: true, bowlRegulation: true, retrievalRequired: true } },
                pledgeTiers: { orderBy: { amount: 'asc' } },
                pledges: { orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, handleName: true, iconUrl: true } } } },
                announcements: { orderBy: { createdAt: 'desc' } },
                expenses: { orderBy: { createdAt: 'asc' } },
                tasks: { orderBy: { createdAt: 'asc' }, include: { assignedUser: { select: { id: true, handleName: true } } } },
                activePoll: { include: { votes: { select: { userId: true, optionIndex: true } } } },
                messages: { orderBy: { createdAt: 'asc' }, include: { user: { select: { id: true, handleName: true } } } },
                offer: { include: { florist: { select: { id: true, platformName: true } }, chatRoom: true } },
                quotation: { include: { items: true } },
                review: { include: { user: { select: { id: true, handleName: true, iconUrl: true } }, likes: true } },
                groupChatMessages: { orderBy: { createdAt: 'asc' }, include: { user: { select: { id: true, handleName: true } } } }
            },
        });
        if (project) res.status(200).json(project);
        else res.status(404).json({ message: '企画が見つかりません。' });
    } catch (error) {
        console.error('企画詳細取得エラー:', error);
        res.status(500).json({ message: '企画の取得中にエラーが発生しました。' });
    }
};

export const getProjectBoard = async (req, res) => {
    const { id } = req.params;
    try {
        const project = await prisma.project.findUnique({
            where: { id },
            select: {
                title: true, imageUrl: true,
                planner: { select: { handleName: true } },
                pledges: { select: { id: true, amount: true, comment: true, user: { select: { handleName: true, iconUrl: true } } }, orderBy: { amount: 'desc' } },
                messages: { select: { id: true, cardName: true, content: true } }
            }
        });
        if (!project) return res.status(404).json({ message: '企画が見つかりません' });
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'ボードデータの取得に失敗しました' });
    }
};

// ==========================================
// ★★★ 2. 作成・更新系 (Planner Auth Required) ★★★
// ==========================================

export const createProject = async (req, res) => {
    try {
        const {
            title, description, targetAmount, deliveryAddress, deliveryDateTime,
            imageUrl, designImageUrls, designDetails, size, flowerTypes,
            visibility, venueId, eventId, projectType, password
        } = req.body;

        const plannerId = req.user.id;

        // 1. 基本バリデーション
        if (!title || String(title).trim() === '') {
            return res.status(400).json({ message: '企画タイトルを入力してください。' });
        }

        const amount = parseInt(targetAmount, 10);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: '目標金額を正しく入力してください。' });
        }

        let deliveryDate = new Date(deliveryDateTime);
        if (isNaN(deliveryDate.getTime())) {
            return res.status(400).json({ message: '納品希望日時を正しく選択してください。' });
        }

        // --- [重要] schema.prisma の定義に厳密に合わせたデータ整形 ---
        const projectData = {
            title: String(title).trim(),
            description: String(description || ""),
            targetAmount: amount,
            deliveryAddress: String(deliveryAddress || ""),
            deliveryDateTime: deliveryDate,
            plannerId: plannerId,
            imageUrl: imageUrl ? String(imageUrl) : null,
            designDetails: designDetails ? String(designDetails) : "",
            size: size ? String(size) : "",
            flowerTypes: flowerTypes ? String(flowerTypes) : "",
            
            // Enum値の正規化 (schema.prismaに定義されている値に合わせる)
            status: 'PENDING_APPROVAL',
            projectType: (projectType === 'PRIVATE' || projectType === 'SOLO') ? projectType : 'PUBLIC',
            visibility: visibility === 'UNLISTED' ? 'UNLISTED' : 'PUBLIC',
            password: password || null,
            
            // リレーション設定
            venueId: venueId || null,
            eventId: eventId || null,

            // schema.prisma で定義されているがデフォルト値がない配列を初期化
            designImageUrls: Array.isArray(designImageUrls) ? designImageUrls : [],
            completionImageUrls: [],
            illustrationPanelUrls: [],
            messagePanelUrls: [],
            sponsorPanelUrls: [],
            preEventPhotoUrls: [],
            progressHistory: []
        };

        // 2. 作成実行
        const newProject = await prisma.project.create({
            data: projectData,
        });

        // 3. 非同期で通知/メール送信
        sendEmail(req.user.email, '【FLASTAL】企画申請を受け付けました',
            `<p>${req.user.handleName} 様</p><p>企画「${title}」の申請を受け付けました。運営による審査完了までお待ちください。</p>`)
            .catch(e => console.error("Email Error:", e));

        res.status(201).json({ project: newProject, message: '企画の作成申請が完了しました。' });
    } catch (error) {
        // Renderのログで「何が原因か」を明確にするためのログ出力
        console.error('--- [PROJECT CREATE ERROR DETAILS] ---');
        console.error('Error Code:', error.code); // Prisma特有のエラーコード
        console.error('Error Meta:', error.meta); // どのフィールドが悪いか
        console.error('Error Message:', error.message);

        res.status(500).json({ 
            message: 'サーバー側のバリデーションエラーです。入力内容またはDBの制約を確認してください。',
            details: error.message 
        });
    }
};

export const updateProject = async (req, res) => {
    const { id } = req.params;
    const { title, description, imageUrl, designImageUrls, designDetails, size, flowerTypes } = req.body;
    const userId = req.user.id;
    try {
        const project = await prisma.project.findUnique({ where: { id: id } });
        if (!project) return res.status(404).json({ message: '企画が見つかりません。' });
        if (project.plannerId !== userId) return res.status(403).json({ message: '権限がありません。' });
        const updatedProject = await prisma.project.update({
            where: { id: id },
            data: { title, description, imageUrl, designImageUrls, designDetails, size, flowerTypes },
        });
        res.status(200).json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: '企画の更新中にエラーが発生しました。' });
    }
};

export const updateTargetAmount = async (req, res) => {
    const { projectId } = req.params;
    const { newTargetAmount } = req.body;
    const userId = req.user.id;
    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) return res.status(404).json({ message: '企画が見つかりません。' });
        if (project.plannerId !== userId) return res.status(403).json({ message: '権限がありません。' });
        const parsedAmount = parseInt(newTargetAmount, 10);
        if (isNaN(parsedAmount) || parsedAmount < project.collectedAmount) {
            return res.status(400).json({ message: '現在の支援額以上の金額を設定してください。' });
        }
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: { targetAmount: parsedAmount, status: (project.collectedAmount >= parsedAmount) ? 'SUCCESSFUL' : project.status },
        });
        const pledges = await prisma.pledge.findMany({ where: { projectId }, select: { userId: true } });
        const uniqueUserIds = [...new Set(pledges.map(p => p.userId))];
        for (const id of uniqueUserIds) {
            if (id && id !== userId) {
                await createNotification(id, 'PROJECT_STATUS_UPDATE', `企画「${project.title}」の目標金額が変更されました。`, projectId, `/projects/${projectId}`);
            }
        }
        res.status(200).json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
};

export const setPledgeTiers = async (req, res) => {
    const { projectId } = req.params;
    const { tiers } = req.body;
    const userId = req.user.id;
    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project || project.plannerId !== userId) return res.status(403).json({ message: '権限がありません。' });
        if (!Array.isArray(tiers) || tiers.length === 0) return res.status(400).json({ message: 'コースデータが無効です。' });
        await prisma.$transaction(async (tx) => {
            await tx.pledgeTier.deleteMany({ where: { projectId } });
            const newTiers = await Promise.all(tiers.map(tier =>
                tx.pledgeTier.create({
                    data: { projectId, amount: parseInt(tier.amount, 10), title: tier.title, description: tier.description }
                })
            ));
            res.status(201).json(newTiers);
        });
    } catch (error) {
        res.status(500).json({ message: '設定中にエラーが発生しました。' });
    }
};

// ==========================================
// ★★★ 3. 進行・管理系 (Status & Production) ★★★
// ==========================================

export const cancelProject = async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id;
    try {
        const result = await prisma.$transaction(async (tx) => {
            const project = await tx.project.findUnique({ where: { id: projectId }, include: { pledges: true, offer: true } });
            if (!project) throw new Error('企画が見つかりません。');
            if (project.plannerId !== userId) throw new Error('権限がありません。');
            if (['COMPLETED', 'CANCELED'].includes(project.status)) throw new Error('既に終了した企画です。');
            const now = new Date();
            const deliveryDate = new Date(project.deliveryDateTime);
            const diffDays = Math.ceil((deliveryDate - now) / (1000 * 60 * 60 * 24));
            let cancelFeeRate = diffDays <= 3 ? 1.0 : (diffDays <= 6 ? 0.5 : 0.0);
            const collectedAmount = project.collectedAmount || 0;
            const baseCancelFee = Math.floor(collectedAmount * cancelFeeRate);
            const materialCost = project.materialCost || 0;
            let totalCancelFee = Math.min(baseCancelFee + materialCost, collectedAmount);
            const totalRefundAmount = collectedAmount - totalCancelFee;
            if (totalRefundAmount > 0 && collectedAmount > 0) {
                const refundRatio = totalRefundAmount / collectedAmount;
                for (const pledge of project.pledges) {
                    const refundForPledge = Math.floor(pledge.amount * refundRatio);
                    if (refundForPledge > 0) {
                        if (pledge.userId) {
                            await tx.user.update({ where: { id: pledge.userId }, data: { points: { increment: refundForPledge } } });
                        } else if (pledge.stripePaymentIntentId) {
                            try { await stripe.refunds.create({ payment_intent: pledge.stripePaymentIntentId, amount: refundForPledge }); } catch (e) { console.error('Stripe Refund Error', e); }
                        }
                    }
                }
            }
            const canceledProject = await tx.project.update({
                where: { id: projectId },
                data: { status: 'CANCELED', cancellationDate: new Date(), cancellationFee: totalCancelFee, refundStatus: totalRefundAmount > 0 ? 'PARTIAL' : 'NONE' },
            });
            return { project: canceledProject, refund: totalRefundAmount };
        });
        res.status(200).json({ message: '企画を中止しました。', result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const completeProject = async (req, res) => {
    const { projectId } = req.params;
    const { userId, completionImageUrls, completionComment, surplusUsageDescription } = req.body;
    try {
        const project = await prisma.project.findUnique({ where: { id: projectId }, include: { expenses: true } });
        if (!project || project.plannerId !== userId) return res.status(403).json({ message: '権限がありません。' });
        const totalExpense = project.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const finalBalance = project.collectedAmount - totalExpense;
        const completedProject = await prisma.project.update({
            where: { id: projectId },
            data: { status: 'COMPLETED', completionImageUrls, completionComment, finalBalance, surplusUsageDescription },
        });
        const pledges = await prisma.pledge.findMany({ where: { projectId }, distinct: ['userId'], include: { user: true } });
        for (const pledge of pledges) {
            if (pledge.user) {
                sendEmail(pledge.user.email, '【FLASTAL】企画完了のご報告', `<p>企画「${project.title}」が完了しました！</p>`);
            }
        }
        res.status(200).json(completedProject);
    } catch (error) {
        res.status(500).json({ message: '完了報告中にエラーが発生しました。' });
    }
};

export const updateProductionDetails = async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id;
    const { productionStatus, illustrationPanelUrls, messagePanelUrls, sponsorPanelUrls, preEventPhotoUrls } = req.body;
    try {
        const project = await prisma.project.findUnique({ where: { id: projectId }, include: { offer: true } });
        if (!project) return res.status(404).json({ message: '企画が見つかりません' });
        const isPlanner = project.plannerId === userId;
        const isFlorist = project.offer?.floristId === userId;
        if (!isPlanner && !isFlorist) return res.status(403).json({ message: '権限がありません' });
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: { productionStatus: productionStatus || undefined, illustrationPanelUrls: illustrationPanelUrls || undefined, messagePanelUrls: messagePanelUrls || undefined, sponsorPanelUrls: sponsorPanelUrls || undefined, preEventPhotoUrls: preEventPhotoUrls || undefined }
        });
        const targetUserId = isPlanner ? project.offer?.floristId : project.plannerId;
        if (targetUserId) {
            await createNotification(targetUserId, 'PROJECT_STATUS_UPDATE', '制作状況が更新されました', projectId, `/projects/${projectId}`);
        }
        res.status(200).json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: '更新に失敗しました' });
    }
};

export const updateMaterialCost = async (req, res) => {
    const { projectId } = req.params;
    const { materialCost, materialDescription } = req.body;
    const floristId = req.user.id;
    if (req.user.role !== 'FLORIST') return res.status(403).json({ message: '権限がありません。' });
    try {
        const project = await prisma.project.findUnique({ where: { id: projectId }, include: { offer: true } });
        if (!project || project.offer?.floristId !== floristId) return res.status(403).json({ message: '担当ではありません。' });
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: { materialCost: parseInt(materialCost, 10) || 0, materialDescription: materialDescription || null }
        });
        await createNotification(project.plannerId, 'PROJECT_UPDATE', `資材費情報が更新されました。`, projectId, `/projects/${projectId}`);
        res.json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: '更新に失敗しました。' });
    }
};

export const updateProductionStatus = async (req, res) => {
    const { projectId } = req.params;
    const { floristId, status } = req.body;
    if (!['PROCESSING', 'READY_FOR_DELIVERY', 'DELIVERED'].includes(status)) return res.status(400).json({ message: '無効なステータスです。' });
    try {
        const project = await prisma.project.findUnique({ where: { id: projectId }, include: { offer: true } });
        if (!project || project.offer?.floristId !== floristId) return res.status(403).json({ message: '権限がありません。' });
        const updatedProject = await prisma.project.update({ where: { id: projectId }, data: { status: status } });
        res.status(200).json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
};

export const updateProjectStatus = async (req, res) => {
    const { projectId } = req.params;
    const { status } = req.body;
    const VALID_STATUSES = ['PENDING_APPROVAL', 'FUNDRAISING', 'REJECTED', 'SUCCESSFUL', 'PROCESSING', 'READY_FOR_DELIVERY', 'COMPLETED', 'CANCELED'];
    if (!VALID_STATUSES.includes(status)) return res.status(400).json({ message: `無効なステータスです: ${status}` });
    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) return res.status(404).json({ message: '企画なし' });
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: '権限なし' });
        const updated = await prisma.project.update({ where: { id: projectId }, data: { status } });
        await createNotification(project.plannerId, 'PROJECT_STATUS_UPDATE', `企画のステータスが更新されました。`, projectId, `/projects/${projectId}`);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
};

export const getInstructionSheet = async (req, res) => {
    const { projectId } = req.params;
    try {
        const project = await prisma.project.findUnique({ where: { id: projectId }, include: { venue: true, planner: true } });
        if (!project) return res.status(404).json({ message: '企画なし' });
        const d = { name: project.planner.handleName || '', amount: project.collectedAmount ? `${project.collectedAmount.toLocaleString()}円` : '', date: new Date(project.deliveryDateTime).toLocaleDateString('ja-JP'), place: project.venue ? project.venue.venueName : project.deliveryAddress };
        const text = `【指示書】\n名前: ${d.name}\n日時: ${d.date}\n場所: ${d.place}\n予算: ${d.amount}`;
        res.status(200).json({ text });
    } catch (error) {
        res.status(500).json({ message: '指示書エラー' });
    }
};

export const createProjectPost = async (req, res) => {
    const { projectId } = req.params;
    const { content, postType } = req.body;
    const userId = req.user.id;
    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) return res.status(404).json({ message: '企画なし' });
        const isPlanner = project.plannerId === userId;
        const isPledger = await prisma.pledge.findFirst({ where: { projectId, userId } });
        if (!isPlanner && !isPledger) return res.status(403).json({ message: '権限なし' });
        const newPost = await prisma.projectPost.create({
            data: { projectId, userId, content, postType: postType || 'SUCCESS_STORY' },
            include: { user: { select: { handleName: true, iconUrl: true } } }
        });
        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ message: '投稿失敗' });
    }
};

export const getProjectPosts = async (req, res) => {
    const { projectId } = req.params;
    try {
        const posts = await prisma.projectPost.findMany({ where: { projectId }, include: { user: { select: { handleName: true, iconUrl: true } } }, orderBy: { createdAt: 'desc' } });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: '取得失敗' });
    }
};

// --- In-memory mocks ---
let MOOD_BOARDS = [];
let OFFICIAL_REACTIONS = {};
let DIGITAL_FLOWERS = [];

export const getChatRoomInfo = async (req, res) => {
    const { roomId } = req.params;
    try {
        const room = await prisma.chatRoom.findUnique({ where: { id: roomId }, include: { messages: { orderBy: { createdAt: 'asc' } }, offer: { include: { project: { include: { planner: true, quotation: { include: { items: true } } } }, florist: true } } } });
        if (!room) return res.status(404).json({ message: 'Room not found' });
        res.json(room);
    } catch(e) { res.status(500).json({ message: 'Error' }); }
};

export const reportProject = async (req, res) => {
    const { projectId, reporterId, reason, details } = req.body;
    try {
        await prisma.projectReport.create({ data: { projectId, reporterId, reason, details } });
        res.status(201).json({ message: '報告しました' });
    } catch(e) { res.status(500).json({ message: 'Error' }); }
};

export const getGalleryFeed = async (req, res) => {
    try {
        const projects = await prisma.project.findMany({ where: { status: 'COMPLETED', visibility: 'PUBLIC', completionImageUrls: { isEmpty: false } }, select: { id: true, title: true, planner: { select: { handleName: true, iconUrl: true } }, completionImageUrls: true, completionComment: true, createdAt: true }, orderBy: { deliveryDateTime: 'desc' }, take: 20 });
        res.json(projects);
    } catch(e) { res.status(500).json({ message: 'Error' }); }
};

export const addToMoodBoard = (req, res) => {
    const { id } = req.params;
    const { imageUrl, comment } = req.body;
    const item = { id: Date.now().toString(), projectId: id, userId: req.user.id, userName: req.user.handleName, userIcon: req.user.iconUrl, imageUrl, comment, likes: 0, likedBy: [] };
    MOOD_BOARDS.push(item);
    res.status(201).json(item);
};
export const getMoodBoard = (req, res) => {
    res.json(MOOD_BOARDS.filter(i => i.projectId === req.params.id));
};
export const likeMoodBoardItem = (req, res) => {
    const { itemId } = req.params;
    const item = MOOD_BOARDS.find(i => i.id === itemId);
    if(!item) return res.status(404).send();
    const idx = item.likedBy.indexOf(req.user.id);
    if(idx === -1) { item.likedBy.push(req.user.id); item.likes++; }
    else { item.likedBy.splice(idx, 1); item.likes--; }
    res.json(item);
};
export const deleteMoodBoardItem = (req, res) => {
    const { itemId } = req.params;
    const idx = MOOD_BOARDS.findIndex(i => i.id === itemId);
    if(idx !== -1) MOOD_BOARDS.splice(idx, 1);
    res.status(204).send();
};
export const officialReact = (req, res) => {
    const { id } = req.params;
    OFFICIAL_REACTIONS[id] = { timestamp: new Date(), comment: "Thank you!!" };
    res.json({ success: true });
};
export const getOfficialStatus = (req, res) => {
    res.json(OFFICIAL_REACTIONS[req.params.id] || null);
};
export const sendDigitalFlower = (req, res) => {
    const { id } = req.params;
    const { senderName, color, message, style } = req.body;
    const flower = { id: Date.now().toString(), projectId: id, senderName, color, message, style, createdAt: new Date() };
    DIGITAL_FLOWERS.push(flower);
    res.status(201).json(flower);
};
export const getDigitalFlowers = (req, res) => {
    res.json(DIGITAL_FLOWERS.filter(f => f.projectId === req.params.id));
};