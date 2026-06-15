import prisma from '../config/prisma.js';
import stripe from '../config/stripe.js';
import { sendDynamicEmail } from '../utils/email.js';
import { createNotification } from '../utils/notification.js';
import { getIO } from '../config/socket.js';

// ==========================================
// ★★★ 1. 取得系 (Public) ★★★
// ==========================================

// 全ての企画を取得 (検索・フィルタ付き)
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
            include: {
                planner: {
                    select: { handleName: true, iconUrl: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(projects);
    } catch (error) {
        console.error('企画一覧取得エラー:', error);
        res.status(500).json({ message: '企画の取得中にエラーが発生しました。' });
    }
};

// 注目の企画を取得
export const getFeaturedProjects = async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            where: {
                status: 'FUNDRAISING',
                visibility: 'PUBLIC',
            },
            take: 4,
            orderBy: { createdAt: 'desc' },
            include: { planner: true },
        });
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: '企画の取得中にエラーが発生しました。' });
    }
};

// 成功企画のテンプレートデータを取得
export const getSuccessfulTemplates = async (req, res) => {
    try {
        const successfulProjects = await prisma.project.findMany({
            where: {
                status: { in: ['SUCCESSFUL', 'COMPLETED'] },
                visibility: 'PUBLIC'
            },
            select: {
                id: true, title: true, targetAmount: true, collectedAmount: true,
                imageUrl: true, designDetails: true, flowerTypes: true, createdAt: true,
                expenses: { select: { itemName: true, amount: true } }
            },
            orderBy: { collectedAmount: 'desc' },
            take: 5
        });

        const templates = successfulProjects.map(p => ({
            id: p.id,
            title: p.title,
            totalPledged: p.collectedAmount,
            totalTarget: p.targetAmount,
            image: p.imageUrl,
            designSummary: p.designDetails ? p.designDetails.substring(0, 50) + '...' : 'N/A',
            expenseSummary: p.expenses.reduce((sum, exp) => sum + exp.amount, 0),
            expenseCount: p.expenses.length
        }));

        res.status(200).json(templates);
    } catch (error) {
        res.status(500).json({ message: 'テンプレートデータの取得に失敗しました。' });
    }
};

// 単一の企画詳細を取得
export const getProjectById = async (req, res) => {
    const { id } = req.params;
    try {
        const project = await prisma.project.findUnique({
            where: { id: id },
            include: {
                planner: {
                    select: { id: true, handleName: true, iconUrl: true }
                },
                venue: {
                    select: {
                        id: true, venueName: true, address: true, accessInfo: true,
                        isStandAllowed: true, standRegulation: true,
                        isBowlAllowed: true, bowlRegulation: true, retrievalRequired: true
                    }
                },
                pledgeTiers: { orderBy: { amount: 'asc' } },
                pledges: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: { select: { id: true, handleName: true, iconUrl: true } }
                    }
                },
                announcements: { orderBy: { createdAt: 'desc' } },
                expenses: { orderBy: { createdAt: 'asc' } },
                tasks: {
                    orderBy: { createdAt: 'asc' },
                    include: { assignedUser: { select: { id: true, handleName: true } } }
                },
                activePoll: {
                    include: { votes: { select: { userId: true, optionIndex: true } } }
                },
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: { user: { select: { id: true, handleName: true } } }
                },
                offers: {
                    include: {
                        florist: { select: { id: true, platformName: true, shopName: true, iconUrl: true } },
                        chatRoom: {
                            include: {
                                messages: {
                                    orderBy: { createdAt: 'asc' },
                                    include: {
                                        user: { select: { id: true, handleName: true, iconUrl: true } },
                                        florist: { select: { id: true, platformName: true, shopName: true, iconUrl: true } }
                                    }
                                }
                            }
                        }
                    }
                },
                quotation: { include: { items: true } },
                review: {
                    include: {
                        user: { select: { id: true, handleName: true, iconUrl: true } },
                        likes: true
                    }
                },
                groupChatMessages: {
                    orderBy: { createdAt: 'asc' },
                    include: { 
                        user: { select: { id: true, handleName: true, iconUrl: true } },
                        florist: { select: { id: true, platformName: true, iconUrl: true } } // ★ この1行を追加！
                    }
                }
            },
        });

        if (project) {
            res.status(200).json(project);
        } else {
            res.status(404).json({ message: '企画が見つかりません。' });
        }
    } catch (error) {
        console.error('企画詳細取得エラー:', error);
        res.status(500).json({ message: '企画の取得中にエラーが発生しました。' });
    }
};

// デジタルネームボード用データ取得
export const getProjectBoard = async (req, res) => {
    const { id } = req.params;
    try {
        const project = await prisma.project.findUnique({
            where: { id },
            select: {
                title: true, imageUrl: true,
                planner: { select: { handleName: true } },
                pledges: {
                    select: {
                        id: true, amount: true, comment: true,
                        user: { select: { handleName: true, iconUrl: true } }
                    },
                    orderBy: { amount: 'desc' }
                },
                messages: {
                    select: { id: true, cardName: true, content: true }
                }
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

// 企画作成
export const createProject = async (req, res) => {
    try {
        const {
            title, description, targetAmount, deliveryAddress, deliveryDateTime,
            imageUrl, designImageUrls, designDetails, size, flowerTypes,
            visibility, venueId, eventId, projectType, password,
            minContributionAmount, needsIllustrator, illustratorBudget, illustratorRequirements,
            isExpress // ★ 新規追加: フロントから「お急ぎ便かどうか」を受け取る
        } = req.body;

        // 1. バリデーション
        if (!title || String(title).trim() === '') {
            return res.status(400).json({ message: '企画タイトルを入力してください。' });
        }

        const amount = parseInt(targetAmount, 10);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: '目標金額を数値で正しく入力してください。' });
        }

        let deliveryDate = new Date(deliveryDateTime);
        if (isNaN(deliveryDate.getTime())) {
            return res.status(400).json({ message: '有効な納品希望日時を入力してください。' });
        }

        // ★ 新規追加: お急ぎ便かどうかで「募集締切日（deadline）」を自動計算
        // 通常は7日前、お急ぎ便(isExpress=true)の場合は3日前を締切とする
        const expressFlag = Boolean(isExpress); 
        const daysToSubtract = expressFlag ? 3 : 7; 
        
        const deadlineDate = new Date(deliveryDate);
        deadlineDate.setDate(deadlineDate.getDate() - daysToSubtract);

        // 2. Prismaデータ作成
        const projectData = {
            title: String(title).trim(),
            description: description ? String(description) : "",
            targetAmount: amount,
            
            minContributionAmount: minContributionAmount ? parseInt(minContributionAmount, 10) : 1000,
            needsIllustrator: Boolean(needsIllustrator),
            illustratorBudget: illustratorBudget ? parseInt(illustratorBudget, 10) : null,
            illustratorRequirements: illustratorRequirements ? String(illustratorRequirements) : null,

            collectedAmount: 0,
            deliveryAddress: deliveryAddress ? String(deliveryAddress) : "",
            
            // ★ 新規追加: 納品日と締切日、お急ぎ便フラグを保存
            deliveryDateTime: deliveryDate,
            deadline: deadlineDate,
            isExpress: expressFlag,
            
            plannerId: req.user.id,
            imageUrl: imageUrl ? String(imageUrl) : null,
            designDetails: designDetails ? String(designDetails) : "",
            size: size ? String(size) : "",
            flowerTypes: flowerTypes ? String(flowerTypes) : "",
            
            status: 'PENDING_APPROVAL',
            projectType: (projectType === 'PRIVATE' || projectType === 'SOLO') ? projectType : 'PUBLIC',
            visibility: visibility === 'UNLISTED' ? 'UNLISTED' : 'PUBLIC',
            password: (password && password !== "") ? String(password) : null,
            
            venueId: (venueId && String(venueId).trim() !== "") ? venueId : null,
            eventId: (eventId && String(eventId).trim() !== "") ? eventId : null,

            designImageUrls: Array.isArray(designImageUrls) ? designImageUrls : [],
            completionImageUrls: [],
            illustrationPanelUrls: [],
            messagePanelUrls: [],
            sponsorPanelUrls: [],
            preEventPhotoUrls: [],
            
            progressHistory: [],

            cancellationFee: 0,
            materialCost: 0,
            refundStatus: "NONE",
            productionStatus: 'NOT_STARTED'
        };

        const newProject = await prisma.project.create({
            data: projectData,
        });

        sendDynamicEmail(req.user.email, 'PROJECT_SUBMITTED', { plannerName: req.user.handleName || 'さん', projectTitle: title, projectId: newProject.id });

        res.status(201).json({ project: newProject, message: '企画の作成申請が完了しました。' });
    } catch (error) {
        console.error('--- [CRITICAL: PROJECT CREATE ERROR] ---');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        
        res.status(500).json({ 
            message: 'サーバー側のバリデーションエラーです。入力形式や必須項目を確認してください。',
            details: error.message 
        });
    }
};

// 企画編集
export const updateProject = async (req, res) => {
    const { id } = req.params;
    const {
        title, description, imageUrl, designImageUrls,
        designDetails, size, flowerTypes, minContributionAmount
    } = req.body;
    const userId = req.user.id;

    try {
        const project = await prisma.project.findUnique({ where: { id: id } });
        if (!project) return res.status(404).json({ message: '企画が見つかりません。' });
        if (project.plannerId !== userId) return res.status(403).json({ message: '権限がありません。' });

        const updatedProject = await prisma.project.update({
            where: { id: id },
            data: {
                title, description, imageUrl, designImageUrls,
                designDetails, size, flowerTypes,
                minContributionAmount: minContributionAmount ? parseInt(minContributionAmount, 10) : undefined
            },
        });
        res.status(200).json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: '企画の更新中にエラーが発生しました。' });
    }
};

// 目標金額の変更
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
            data: {
                targetAmount: parsedAmount,
                status: (project.collectedAmount >= parsedAmount) ? 'SUCCESSFUL' : project.status,
            },
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

// 支援コース (Rewards) 設定
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
                    data: {
                        projectId,
                        amount: parseInt(tier.amount, 10),
                        title: tier.title,
                        description: tier.description,
                    }
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


// 企画の中止・キャンセル（業界標準キャンセルポリシー・ポイント還元モデル）
export const cancelProject = async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id;
    const { actualMaterialCost = 0 } = req.body; 

    try {
        const result = await prisma.$transaction(async (tx) => {
            const project = await tx.project.findUnique({
                where: { id: projectId },
                include: { pledges: true, offers: true }
            });

            if (!project) throw new Error('企画が見つかりません。');
            if (project.plannerId !== userId && req.user.role !== 'ADMIN') throw new Error('権限がありません。');
            if (['COMPLETED', 'CANCELED'].includes(project.status)) throw new Error('既に終了またはキャンセルされた企画です。');
            if (!project.deliveryDateTime) throw new Error('お届け日が設定されていないため、キャンセル料の計算ができません。');

            const collectedAmount = project.collectedAmount || 0;
            const deliveryDate = new Date(project.deliveryDateTime);
            const now = new Date();
            
            const diffTime = deliveryDate.getTime() - now.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            let totalCancelFee = 0;
            let refundRatio = 0;

            if (diffDays >= 7) {
                const finalMaterialCost = parseInt(actualMaterialCost, 10) || 0;
                totalCancelFee = Math.min(finalMaterialCost, collectedAmount);
                refundRatio = collectedAmount > 0 ? (collectedAmount - totalCancelFee) / collectedAmount : 0;
                
            } else if (diffDays >= 4 && diffDays <= 5) {
                totalCancelFee = Math.floor(collectedAmount * 0.5);
                refundRatio = 0.5;
                
            } else if (diffDays >= 0 && diffDays <= 3) {
                totalCancelFee = collectedAmount;
                refundRatio = 0;
                
            } else {
                totalCancelFee = collectedAmount;
                refundRatio = 0;
            }

            const totalRefundAmount = collectedAmount - totalCancelFee;

            if (totalRefundAmount > 0 && collectedAmount > 0) {
                for (const pledge of project.pledges) {
                    const refundForPledge = Math.floor(pledge.amount * refundRatio);
                    
                    if (refundForPledge > 0 && pledge.userId) {
                        await tx.user.update({
                            where: { id: pledge.userId },
                            data: { points: { increment: refundForPledge } }
                        });
                        
                        await createNotification(
                            pledge.userId, 
                            'PROJECT_STATUS_UPDATE', 
                            `企画「${project.title}」が中止となりました。規定に基づき、${refundForPledge.toLocaleString()}ptが返還されました。`, 
                            projectId, 
                            `/projects/${projectId}`
                        );
                    }
                }
            }

            const canceledProject = await tx.project.update({
                where: { id: projectId },
                data: {
                    status: 'CANCELED',
                    cancellationDate: now,
                    cancellationFee: totalCancelFee,
                    refundStatus: totalRefundAmount > 0 ? (totalRefundAmount === collectedAmount ? 'FULL' : 'PARTIAL') : 'NONE',
                },
            });
            
             await createNotification(
                project.plannerId, 
                'PROJECT_STATUS_UPDATE', 
                `企画「${project.title}」の中止処理が完了しました。（キャンセル料: ${totalCancelFee}pt）`, 
                projectId, 
                `/projects/${projectId}`
            );

            return { 
                project: canceledProject, 
                totalRefund: totalRefundAmount,
                totalCancelFee: totalCancelFee,
                appliedPolicy: diffDays >= 7 ? '①7日前以前' : (diffDays >= 4 ? '②5-4日前' : '③3日前以降')
            };
        });

        res.status(200).json({ message: '中止処理が完了しました。', result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 企画完了報告 (Complete)
export const completeProject = async (req, res) => {
    const { projectId } = req.params;
    const { userId, completionImageUrls, completionComment, surplusUsageDescription } = req.body;

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { expenses: true },
        });

        if (!project || project.plannerId !== userId) return res.status(403).json({ message: '権限がありません。' });

        const totalExpense = project.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const finalBalance = project.collectedAmount - totalExpense;

        const completedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
                status: 'COMPLETED',
                completionImageUrls,
                completionComment,
                finalBalance,
                surplusUsageDescription,
            },
        });

        const pledges = await prisma.pledge.findMany({ where: { projectId }, distinct: ['userId'], include: { user: true } });
        for (const pledge of pledges) {
            if (pledge.user?.email) {
                sendDynamicEmail(pledge.user.email, 'PROJECT_COMPLETED', { userName: pledge.user.handleName || 'さん', projectTitle: project.title, projectId });
            }
        }

        res.status(200).json(completedProject);
    } catch (error) {
        res.status(500).json({ message: '完了報告中にエラーが発生しました。' });
    }
};

// 制作状況の更新
export const updateProductionDetails = async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id;
    const {
        productionStatus, illustrationPanelUrls, messagePanelUrls,
        sponsorPanelUrls, preEventPhotoUrls
    } = req.body;

    try {
        const project = await prisma.project.findUnique({ where: { id: projectId }, include: { offers: true } });
        if (!project) return res.status(404).json({ message: '企画が見つかりません' });

        const activeOffer = project.offers.find(o => o.status === 'ACCEPTED') || project.offers[0];

        const isPlanner = project.plannerId === userId;
        const isFlorist = activeOffer?.floristId === userId;

        if (!isPlanner && !isFlorist) return res.status(403).json({ message: '権限がありません' });

        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
                productionStatus: productionStatus || undefined,
                illustrationPanelUrls: illustrationPanelUrls || undefined,
                messagePanelUrls: messagePanelUrls || undefined,
                sponsorPanelUrls: sponsorPanelUrls || undefined,
                preEventPhotoUrls: preEventPhotoUrls || undefined,
            }
        });

        const targetUserId = isPlanner ? activeOffer?.floristId : project.plannerId;
        if (targetUserId) {
            await createNotification(targetUserId, 'PROJECT_STATUS_UPDATE', '制作状況が更新されました', projectId, `/projects/${projectId}`);
        }

        res.status(200).json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: '更新に失敗しました' });
    }
};

// 特注資材費の更新
export const updateMaterialCost = async (req, res) => {
    const { projectId } = req.params;
    const { materialCost, materialDescription } = req.body;
    const floristId = req.user.id;

    if (req.user.role !== 'FLORIST') return res.status(403).json({ message: '権限がありません。' });

    try {
        const project = await prisma.project.findUnique({ where: { id: projectId }, include: { offers: true } });
        const activeOffer = project?.offers.find(o => o.status === 'ACCEPTED') || project?.offers[0];

        if (!project || activeOffer?.floristId !== floristId) return res.status(403).json({ message: '担当ではありません。' });

        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
                materialCost: parseInt(materialCost, 10) || 0,
                materialDescription: materialDescription || null,
            }
        });

        await createNotification(project.plannerId, 'PROJECT_UPDATE', `資材費情報が更新されました。`, projectId, `/projects/${projectId}`);
        res.json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: '更新に失敗しました。' });
    }
};

// 制作ステータス更新 (詳細)
export const updateProductionStatus = async (req, res) => {
    const { projectId } = req.params;
    const { floristId, status } = req.body;

    if (!['PROCESSING', 'READY_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
        return res.status(400).json({ message: '無効なステータスです。' });
    }

    try {
        const project = await prisma.project.findUnique({ where: { id: projectId }, include: { offers: true } });
        const activeOffer = project?.offers.find(o => o.status === 'ACCEPTED') || project?.offers[0];

        if (!project || activeOffer?.floristId !== floristId) return res.status(403).json({ message: '権限がありません。' });

        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: { status: status },
        });
        res.status(200).json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
};

// 汎用ステータス更新 (Florist/Admin)
export const updateProjectStatus = async (req, res) => {
    const { projectId } = req.params;
    const { status } = req.body;
    
    const VALID_STATUSES = [
        'PENDING_APPROVAL', 'FUNDRAISING', 'REJECTED', 'OFFER_ACCEPTED', 
        'DESIGN_FIXED', 'MATERIAL_PREP', 'PRODUCTION_IN_PROGRESS', 
        'READY_FOR_DELIVERY', 'DELIVERED_OR_FINISHED'
    ];

    if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ message: `無効なステータスです: ${status}` });
    }

    try {
        const project = await prisma.project.findUnique({ where: { id: projectId }, include: { offers: true } });
        if (!project) return res.status(404).json({ message: '企画なし' });

        const activeOffer = project.offers.find(o => o.status === 'ACCEPTED') || project.offers[0];
        const isFlorist = activeOffer?.floristId === req.user.id;
        
        if (req.user.role !== 'ADMIN' && !isFlorist) return res.status(403).json({ message: '権限なし' });

        const updated = await prisma.project.update({
            where: { id: projectId },
            data: { status },
        });
        
        await createNotification(
            project.plannerId, 'PROJECT_STATUS_UPDATE', 
            `企画「${project.title}」のステータスが「${status}」に更新されました。`, 
            projectId, `/projects/${projectId}`
        );
        
        const io = getIO();
        let tickerType = 'info';
        let tickerText = '';

        switch (status) {
            case 'PRODUCTION_IN_PROGRESS':
                tickerType = 'production';
                tickerText = `お花屋さんが『${project.title}』の制作を開始しました💐`;
                break;
            case 'DELIVERED_OR_FINISHED': 
            case 'COMPLETED':
                tickerType = 'delivery';
                tickerText = `『${project.title}』のフラスタが設置完了しました📸`;
                break;
        }

        if (tickerText) {
            io.emit('publicTickerUpdate', {
                id: Date.now(),
                type: tickerType,
                text: tickerText,
                href: `/projects/${projectId}`,
                createdAt: new Date()
            });
        }
        
        res.json(updated);
        
    } catch (error) {
        console.error('Status Update Error:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
};

// ==========================================
// ★★★ 4. その他 (Instruction, Board, Posts) ★★★
// ==========================================

export const getInstructionSheet = async (req, res) => {
    const { projectId } = req.params;
    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { venue: true, planner: true }
        });
        if (!project) return res.status(404).json({ message: '企画なし' });

        const d = {
            name: project.planner.handleName || '',
            amount: project.collectedAmount ? `${project.collectedAmount.toLocaleString()}円` : '',
            date: new Date(project.deliveryDateTime).toLocaleDateString('ja-JP'),
            place: project.venue ? project.venue.venueName : project.deliveryAddress,
        };
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
            data: {
                projectId, userId, content,
                postType: postType || 'SUCCESS_STORY',
            },
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
        const posts = await prisma.projectPost.findMany({
            where: { projectId },
            include: { user: { select: { handleName: true, iconUrl: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: '取得失敗' });
    }
};

// ==========================================
// 追加メモリ実装機能 (Mocks/Temporary)
// ==========================================

let MOOD_BOARDS = [];
let OFFICIAL_REACTIONS = {};
let DIGITAL_FLOWERS = [];

export const getChatRoomInfo = async (req, res) => {
    const { roomId } = req.params;
    try {
        const room = await prisma.chatRoom.findUnique({
            where: { id: roomId },
            include: {
                messages: { orderBy: { createdAt: 'asc' } },
                offer: { include: { project: { include: { planner: true, quotation: { include: { items: true } } } }, florist: true } }
            }
        });
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
        const projects = await prisma.project.findMany({
            where: { status: 'COMPLETED', visibility: 'PUBLIC', completionImageUrls: { isEmpty: false } },
            select: { id: true, title: true, planner: { select: { handleName: true, iconUrl: true } }, completionImageUrls: true, completionComment: true, createdAt: true },
            orderBy: { deliveryDateTime: 'desc' },
            take: 20
        });
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


// ==========================================
// ★★★ 5. クリエイター（絵師）連携系 ★★★
// ==========================================

// 絵師の立候補を採用し、仮払いする
export const acceptIllustratorApplication = async (req, res) => {
    const { projectId, applicationId } = req.params;
    const plannerId = req.user.id;

    try {
        // 1. プロジェクトと応募データの取得・検証
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project || project.plannerId !== plannerId) {
            return res.status(403).json({ message: '権限がありません。' });
        }
        if (project.illustratorId) {
            return res.status(400).json({ message: 'すでにクリエイターが決定しています。' });
        }

        const application = await prisma.illustratorApplication.findUnique({ 
            where: { id: applicationId } 
        });
        if (!application || application.projectId !== projectId) {
            return res.status(404).json({ message: '応募データが見つかりません。' });
        }

        // 2. トランザクション処理 (ポイント減算・アサイン・ステータス更新)
        await prisma.$transaction(async (tx) => {
            const planner = await tx.user.findUnique({ where: { id: plannerId } });
            if (planner.points < application.proposedAmount) {
                throw new Error('ポイントが不足しています。');
            }

            await tx.user.update({
                where: { id: plannerId },
                data: { points: { decrement: application.proposedAmount } }
            });

            await tx.illustratorApplication.update({
                where: { id: applicationId },
                data: { status: 'ACCEPTED' }
            });

            await tx.project.update({
                where: { id: projectId },
                data: { 
                    illustratorId: application.illustratorId,
                    illustratorReward: application.proposedAmount
                }
            });

            await tx.illustratorApplication.updateMany({
                where: { projectId: projectId, id: { not: applicationId } },
                data: { status: 'REJECTED' }
            });
        });

        res.status(200).json({ message: '採用と仮払いが完了しました。' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || '採用処理に失敗しました。' });
    }
};

// 納品されたイラストを検収（承認）し、絵師にポイントを支払う
export const acceptIllustrationDelivery = async (req, res) => {
    const { projectId } = req.params;
    const plannerId = req.user.id;

    try {
        const project = await prisma.project.findUnique({ 
            where: { id: projectId },
            include: { illustrator: true, offers: true }
        });

        if (!project || project.plannerId !== plannerId) {
            return res.status(403).json({ message: '権限がありません。' });
        }
        if (!project.illustratorId || !project.illustrationDataUrl) {
            return res.status(400).json({ message: '納品データが存在しません。' });
        }
        if (project.isIllustrationAccepted) {
            return res.status(400).json({ message: 'すでに検収済みです。' });
        }

        await prisma.$transaction(async (tx) => {
            await tx.project.update({
                where: { id: projectId },
                data: { isIllustrationAccepted: true }
            });

            await tx.user.update({
                where: { id: project.illustratorId },
                data: { points: { increment: project.illustratorReward } }
            });
        });

        const activeOffer = project.offers?.find(o => o.status === 'ACCEPTED') || project.offers?.[0];
        if (activeOffer?.floristId) {
             await createNotification(
                activeOffer.floristId, 'PROJECT_STATUS_UPDATE', 
                `企画「${project.title}」のイラストデータが確定・納品されました。`, 
                projectId, `/projects/${projectId}`
             );
        }

        res.status(200).json({ message: '検収が完了し、クリエイターにポイントが支払われました。' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '検収処理に失敗しました。' });
    }
};

// ==========================================
// ★ ロジスティクス・実費管理 (Florist Only)
// ==========================================

export const updateLogisticsStatus = async (req, res) => {
    const { projectId } = req.params;
    const floristId = req.user.id;
    
    const updates = req.body;

    try {
        const project = await prisma.project.findUnique({ 
            where: { id: projectId }, include: { offers: true } 
        });

        const activeOffer = project?.offers.find(o => o.status === 'ACCEPTED');
        if (!project || activeOffer?.floristId !== floristId) {
            return res.status(403).json({ message: 'この案件を更新する権限がありません。' });
        }

        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: updates 
        });

        let itemName = '';
        if ('isPanelReceived' in updates) itemName = '自作パネル';
        if ('isGoodsReceived' in updates) itemName = '持ち込みグッズ';
        if ('isReturnCompleted' in updates) itemName = '返送作業';
        
        if (itemName) {
            const statusStr = Object.values(updates)[0] ? '完了' : '未完了';
            await createNotification(
                project.plannerId, 'PROJECT_STATUS_UPDATE', 
                `お花屋さんが「${itemName}」のステータスを【${statusStr}】に更新しました。`, 
                projectId, `/projects/${projectId}`
            );
        }

        res.json(updatedProject);
    } catch (error) {
        console.error('Logistics Update Error:', error);
        res.status(500).json({ message: 'ステータスの更新に失敗しました。' });
    }
};


// ==========================================
// ★ 管理者専用 (ADMIN Only) 締切日変更
// ==========================================
export const updateProjectDeadlineAdmin = async (req, res) => {
    const { projectId } = req.params;
    const { newDeadline } = req.body;
    const userId = req.user.id;

    // 1. 管理者チェック（絶対に運営しか叩けないようにする）
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'この操作を行う権限がありません。' });
    }

    try {
        const parsedDate = new Date(newDeadline);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ message: '無効な日付形式です。' });
        }

        // 2. 締切日の強制上書き
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: { deadline: parsedDate }
        });

        res.status(200).json({ 
            message: '締切日を強制更新しました。', 
            project: updatedProject 
        });
    } catch (error) {
        console.error('Deadline Update Error:', error);
        res.status(500).json({ message: '締切の更新に失敗しました。' });
    }
};