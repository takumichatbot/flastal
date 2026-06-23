import prisma from '../config/prisma.js';
import { sendEmail } from '../utils/email.js';
import OpenAI from 'openai';
import { logger } from '../utils/logger.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CHAT_TEMPLATES = [
  { id: 'propose_1', category: '提案・質問', text: 'リボンのメッセージは「...」でどうでしょう？', hasCustomInput: true, placeholder: '例：祝！ご出演' },
  { id: 'propose_2', category: '提案・質問', text: '「...」を追加しませんか？', hasCustomInput: true, placeholder: '例：お花の色紙' },
  { id: 'propose_3', category: '提案・質問', text: 'これについて、皆さんの意見を聞きたいです。' },
  { id: 'propose_4', category: '提案・質問', text: '企画者さん、何か手伝えることはありますか？' },
  { id: 'agree_1',   category: '同意・反応', text: '良いアイデアですね！賛成です。' },
  { id: 'agree_2',   category: '同意・反応', text: 'なるほど、了解です。' },
  { id: 'agree_3',   category: '同意・反応', text: 'ありがとうございます！' },
  { id: 'stamp_1',   category: 'スタンプ',   text: '👍' },
  { id: 'stamp_2',   category: 'スタンプ',   text: '🎉' },
  { id: 'stamp_3',   category: 'スタンプ',   text: '👏' },
  { id: 'stamp_4',   category: 'スタンプ',   text: '🙏' },
];

let MOOD_BOARDS = [];
let OFFICIAL_REACTIONS = {};
let DIGITAL_FLOWERS = [];

export const createAnnouncement = async (req, res) => {
    const { title, content, projectId } = req.body;
    const userId = req.user.id;
    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project || project.plannerId !== userId) return res.status(403).json({ message: '権限がありません' });

        const announcement = await prisma.announcement.create({ data: { title, content, projectId } });
        
        const pledges = await prisma.pledge.findMany({ 
            where: { projectId }, 
            distinct: ['userId'],
            select: { userId: true }
        });

        for (const p of pledges) {
            if (p.userId && p.userId !== userId) {
                await prisma.notification.create({ 
                    data: { recipientId: p.userId, type: 'NEW_ANNOUNCEMENT', message: `新しい活動報告: ${title}`, projectId } 
                }).catch(err => logger.error('Notification Error', { context: 'projectActionController', error: err.message }));
            }
        }
        res.status(201).json(announcement);
    } catch (e) { 
        res.status(500).json({ message: '活動報告の作成に失敗しました' }); 
    }
};

export const addExpense = async (req, res) => {
    const { itemName, amount, projectId } = req.body;
    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project || project.plannerId !== req.user.id) return res.status(403).json({ message: '権限がありません' });
        const expense = await prisma.expense.create({ data: { itemName, amount: parseInt(amount), projectId } });
        res.status(201).json(expense);
    } catch (e) { res.status(500).json({ message: '経費登録に失敗しました' }); }
};

export const deleteExpense = async (req, res) => {
    const { expenseId } = req.params;
    try {
        const expense = await prisma.expense.findUnique({ where: { id: expenseId }, include: { project: true } });
        if (!expense || expense.project.plannerId !== req.user.id) return res.status(403).json({ message: '権限がありません' });
        await prisma.expense.delete({ where: { id: expenseId } });
        res.status(204).send();
    } catch (e) { res.status(500).json({ message: '削除に失敗しました' }); }
};

export const addTask = async (req, res) => {
    const { title, projectId, assignedUserId } = req.body;
    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project || project.plannerId !== req.user.id) return res.status(403).json({ message: '権限がありません' });

        const task = await prisma.$transaction(async (tx) => {
            const newTask = await tx.task.create({ data: { title, projectId, assignedUserId } });
            if (assignedUserId && assignedUserId !== req.user.id) {
                await tx.notification.create({
                    data: { recipientId: assignedUserId, type: 'TASK_ASSIGNED', message: `新しいタスク: ${title}`, projectId }
                });
            }
            return newTask;
        });

        res.status(201).json(task);
    } catch (e) { res.status(500).json({ message: 'タスク追加に失敗しました' }); }
};

export const updateTask = async (req, res) => {
    const { taskId } = req.params;
    const { isCompleted, assignedUserId } = req.body;
    try {
        const task = await prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
        if (!task || task.project.plannerId !== req.user.id) return res.status(403).json({ message: '権限がありません' });
        const updated = await prisma.task.update({ where: { id: taskId }, data: { isCompleted, assignedUserId } });
        res.json(updated);
    } catch (e) { res.status(500).json({ message: '更新失敗' }); }
};

export const deleteTask = async (req, res) => {
    const { taskId } = req.params;
    try {
        const task = await prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
        if (!task || task.project.plannerId !== req.user.id) return res.status(403).json({ message: '権限がありません' });
        await prisma.task.delete({ where: { id: taskId } });
        res.status(204).send();
    } catch (e) { res.status(500).json({ message: '削除失敗' }); }
};

export const postMessage = async (req, res) => {
    const { content, cardName, projectId } = req.body;
    try {
        const pledge = await prisma.pledge.findFirst({ where: { projectId, userId: req.user.id } });
        if (!pledge) return res.status(403).json({ message: '支援者の方のみ投稿可能です' });
        const msg = await prisma.message.create({ data: { content, cardName, projectId, userId: req.user.id } });
        res.status(201).json(msg);
    } catch (e) { 
        if(e.code === 'P2002') return res.status(409).json({ message: '既に投稿済みです' });
        res.status(500).json({ message: 'エラーが発生しました' }); 
    }
};

export const createPoll = async (req, res) => {
    const { projectId, question, options } = req.body;
    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project || project.plannerId !== req.user.id) return res.status(403).json({ message: '権限がありません' });
        await prisma.activePoll.deleteMany({ where: { projectId } });
        const poll = await prisma.activePoll.create({ data: { projectId, question, options }, include: { votes: true } });
        res.status(201).json(poll);
    } catch (e) { res.status(500).json({ message: '投票の作成に失敗しました' }); }
};

export const votePoll = async (req, res) => {
    const { pollId, optionIndex } = req.body;
    try {
        const poll = await prisma.activePoll.findUnique({ where: { id: pollId } });
        if (!poll) return res.status(404).json({ message: '投票が見つかりません' });
        const pledge = await prisma.pledge.findFirst({ where: { projectId: poll.projectId, userId: req.user.id } });
        if (!pledge) return res.status(403).json({ message: '支援者のみ投票可能です' });
        const vote = await prisma.pollVote.create({ data: { pollId, userId: req.user.id, optionIndex } });
        res.status(201).json(vote);
    } catch (e) { 
        if(e.code === 'P2002') return res.status(409).json({ message: '既に投票済みです' });
        res.status(500).json({ message: '投票失敗' }); 
    }
};

export const toggleReaction = async (req, res) => {
    const { messageId, emoji } = req.body;
    const userId = req.user.id;
    try {
        const existing = await prisma.groupChatMessageReaction.findUnique({
            where: { messageId_userId_emoji: { messageId, userId, emoji } }
        });
        if (existing) {
            await prisma.groupChatMessageReaction.delete({ where: { id: existing.id } });
            res.json({ action: 'removed' });
        } else {
            const reaction = await prisma.groupChatMessageReaction.create({ data: { messageId, userId, emoji } });
            res.status(201).json({ action: 'added', reaction });
        }
    } catch (e) { res.status(500).json({ message: 'リアクション失敗' }); }
};

export const summarizeChat = async (req, res) => {
    const { projectId } = req.params;
    try {
        const messages = await prisma.groupChatMessage.findMany({
            where: { projectId }, orderBy: { createdAt: 'desc' }, take: 50,
            include: { user: { select: { handleName: true } } }
        });
        if (!messages.length) return res.status(404).json({ message: '履歴が見つかりません' });

        const history = messages.reverse().map(m => `${m.user.handleName}: ${m.content}`).join('\n');
        let summary = 'AI要約が現在利用できません。';

        if (process.env.OPENAI_API_KEY) {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "system", content: "チャットを箇条書きで要約してください。" }, { role: "user", content: history }]
            });
            summary = completion.choices[0].message.content;
        }
        res.json({ summary });
    } catch (e) { res.status(500).json({ message: '要約エラー' }); }
};

export const getChatTemplates = (req, res) => {
    res.json(CHAT_TEMPLATES);
};

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
        if (!room) return res.status(404).json({ message: 'ルームが見つかりません' });
        res.json(room);
    } catch(e) { res.status(500).json({ message: '取得失敗' }); }
};

export const reportChat = async (req, res) => {
    const { messageId } = req.params;
    const { reason, type } = req.body;
    const reporterId = req.user.id;
    try {
        if (type === 'GROUP') {
            await prisma.groupChatMessageReport.create({ data: { messageId, reporterId, reason } });
        } else {
            await prisma.chatMessageReport.create({ data: { messageId, reporterId, reason } });
        }
        res.status(201).json({ message: '報告を受け付けました' });
    } catch (e) { res.status(500).json({ message: '報告失敗' }); }
};

export const createReview = async (req, res) => {
    const { comment, projectId, floristId } = req.body;
    try {
        const review = await prisma.review.create({
            data: { comment, projectId, floristId, userId: req.user.id }
        });
        res.status(201).json(review);
    } catch (e) { 
        if(e.code === 'P2002') return res.status(409).json({ message: 'レビューは1人1回までです' });
        res.status(500).json({ message: '投稿失敗' }); 
    }
};

export const getFeaturedReviews = async (req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            where: { comment: { not: '' } }, take: 3, orderBy: { createdAt: 'desc' },
            include: { user: { select: { handleName: true } }, project: { select: { title: true } } }
        });
        res.json(reviews);
    } catch (e) { res.status(500).json({ message: '取得失敗' }); }
};

export const toggleReviewLike = async (req, res) => {
    const { reviewId } = req.params;
    const userId = req.body.userId;
    if (!userId) return res.status(401).json({ message: 'ログインが必要です' });
    try {
        const existing = await prisma.reviewLike.findUnique({ where: { reviewId_userId: { reviewId, userId } } });
        if (existing) {
            await prisma.reviewLike.delete({ where: { id: existing.id } });
            res.json({ liked: false });
        } else {
            await prisma.reviewLike.create({ data: { reviewId, userId } });
            res.json({ liked: true });
        }
    } catch (e) { res.status(500).json({ message: 'エラー' }); }
};

export const reportProject = async (req, res) => {
    const { projectId, reporterId, reason, details } = req.body;
    try {
        await prisma.projectReport.create({ data: { projectId, reporterId, reason, details } });
        res.status(201).json({ message: '通報を受け付けました' });
    } catch(e) { res.status(500).json({ message: 'エラー' }); }
};

// ★修正: 企画(Project)とファン投稿(Post)をミックスして取得
export const getGalleryFeed = async (req, res) => {
    try {
        // 1. 完了した企画を取得
        const projects = await prisma.project.findMany({
            where: { status: 'COMPLETED', visibility: 'PUBLIC', completionImageUrls: { isEmpty: false } },
            select: { 
                id: true, 
                title: true, 
                planner: { select: { handleName: true, iconUrl: true } }, 
                completionImageUrls: true, 
                completionComment: true, 
                createdAt: true 
            },
            orderBy: { deliveryDateTime: 'desc' },
            take: 20
        });

        // 2. ファンの投稿を取得 (Postモデル)
        // ※ Postモデルが存在し、公開ステータスなどが適切に設定されている前提
        const fanPosts = await prisma.post.findMany({
            where: { 
                // status: 'PUBLISHED', // もしステータス管理がある場合
                deletedAt: null 
            },
            include: { 
                user: { select: { handleName: true, iconUrl: true } } 
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // 3. データを共通の形式（フィードアイテム）に変換
        const formattedProjects = projects.map(p => ({
            id: p.id,
            type: 'PROJECT', // 識別用
            title: p.title,
            imageUrl: p.completionImageUrls[0], // 1枚目を採用
            user: p.planner,
            comment: p.completionComment,
            date: p.createdAt,
            link: `/projects/${p.id}` // リンク先
        }));

        const formattedPosts = fanPosts.map(p => ({
            id: p.id,
            type: 'FAN_POST', // 識別用
            title: p.eventName || 'イベント記念', // イベント名をタイトル代わりに
            imageUrl: p.imageUrl,
            user: p.user || { handleName: p.senderName || 'ファン' },
            comment: '', // Postにはコメントがない場合が多いので空文字等
            date: p.createdAt,
            link: null // リンク先なし（または画像拡大のみ）
        }));

        // 4. 結合して新しい順にソート
        const feed = [...formattedProjects, ...formattedPosts]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 40); // 合計40件まで表示

        res.json(feed);

    } catch(e) {
        logger.error('ギャラリーの取得に失敗しました', { context: 'projectActionController', error: e.message });
        res.status(500).json({ message: 'ギャラリーの取得に失敗しました' });
    }
};

// ==========================================
// DB版実装 (MoodBoard, OfficialReaction, DigitalFlowers)
// ==========================================

// --- ムードボード ---
export const addToMoodBoard = async (req, res) => {
    const { id } = req.params; // projectId
    const { imageUrl, comment } = req.body;
    try {
        const item = await prisma.moodBoardItem.create({
            data: {
                projectId: id,
                userId: req.user.id,
                imageUrl,
                comment
            },
            include: { user: { select: { handleName: true, iconUrl: true } } }
        });
        // フロントエンドの期待する形式に整形
        res.status(201).json({
            ...item,
            userName: item.user.handleName,
            userIcon: item.user.iconUrl,
            likes: 0,
            likedBy: []
        });
    } catch (error) {
        res.status(500).json({ message: '追加に失敗しました' });
    }
};

export const getMoodBoard = async (req, res) => {
    const { id } = req.params; // projectId
    try {
        const items = await prisma.moodBoardItem.findMany({
            where: { projectId: id },
            include: {
                user: { select: { handleName: true, iconUrl: true } },
                likes: { select: { userId: true } },
                _count: { select: { likes: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // 整形
        const formatted = items.map(item => ({
            id: item.id,
            imageUrl: item.imageUrl,
            comment: item.comment,
            userId: item.userId,
            userName: item.user.handleName,
            userIcon: item.user.iconUrl,
            likes: item._count.likes,
            likedBy: item.likes.map(l => l.userId), // 自分がいいねしたか判定用
            createdAt: item.createdAt
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: '取得に失敗しました' });
    }
};

export const likeMoodBoardItem = async (req, res) => {
    const { itemId } = req.params;
    const userId = req.user.id;
    try {
        const existing = await prisma.moodBoardLike.findUnique({
            where: { moodBoardItemId_userId: { moodBoardItemId: itemId, userId } }
        });

        if (existing) {
            await prisma.moodBoardLike.delete({ where: { id: existing.id } });
        } else {
            await prisma.moodBoardLike.create({ data: { moodBoardItemId: itemId, userId } });
        }

        // 最新の状態を返却
        const item = await prisma.moodBoardItem.findUnique({
            where: { id: itemId },
            include: { likes: { select: { userId: true } }, _count: { select: { likes: true } } }
        });
        
        // 簡易返却 (必要なフィールドのみ)
        res.json({
            id: item.id,
            likes: item._count.likes,
            likedBy: item.likes.map(l => l.userId)
        });
    } catch (error) {
        res.status(500).json({ message: 'いいね処理に失敗しました' });
    }
};

export const deleteMoodBoardItem = async (req, res) => {
    const { itemId } = req.params;
    try {
        const item = await prisma.moodBoardItem.findUnique({ where: { id: itemId } });
        if (!item || item.userId !== req.user.id) {
            return res.status(403).json({ message: '権限がありません' });
        }
        await prisma.moodBoardItem.delete({ where: { id: itemId } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: '削除に失敗しました' });
    }
};

// --- 推しリアクション ---
export const officialReact = async (req, res) => {
    const { id } = req.params; // projectId
    try {
        await prisma.officialReaction.upsert({
            where: { projectId: id },
            update: { createdAt: new Date() }, // 時間更新
            create: { projectId: id, comment: "応援ありがとうございます！" }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'リアクション保存に失敗しました' });
    }
};

export const getOfficialStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const reaction = await prisma.officialReaction.findUnique({ where: { projectId: id } });
        res.json(reaction ? { timestamp: reaction.createdAt, comment: reaction.comment } : null);
    } catch (error) {
        res.status(500).json({ message: '取得に失敗しました' });
    }
};


// --- デジタルフラスタ ---
export const sendDigitalFlower = async (req, res) => {
    const { id } = req.params; // projectId
    const { senderName, color, message } = req.body;
    try {
        const flower = await prisma.digitalFlower.create({
            data: {
                projectId: id,
                senderName,
                color,
                message
            }
        });
        
        // Socket.IOで配信
        try {
            const { getIO } = await import('../config/socket.js');
            const io = getIO();
            io.to(id).emit('newDigitalFlower', flower);
        } catch(e) { logger.warn('Socket emit failed', { context: 'projectActionController', error: e.message }); }

        res.status(201).json(flower);
    } catch (error) {
        res.status(500).json({ message: '送信に失敗しました' });
    }
};

export const getDigitalFlowers = async (req, res) => {
    const { id } = req.params;
    try {
        const flowers = await prisma.digitalFlower.findMany({
            where: { projectId: id },
            orderBy: { createdAt: 'asc' }
        });
        res.json(flowers);
    } catch (error) {
        res.status(500).json({ message: '取得に失敗しました' });
    }
};

export const getMyChats = async (req, res) => {
    const userId = req.user.id;
    try {
        const rooms = await prisma.chatRoom.findMany({
            where: { offer: { project: { plannerId: userId } } },
            include: {
                messages: { orderBy: { createdAt: 'desc' }, take: 1 },
                offer: {
                    include: {
                        project: { select: { id: true, title: true, imageUrl: true } },
                        florist: { select: { id: true, platformName: true, shopName: true, iconUrl: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(rooms);
    } catch (e) {
        res.status(500).json({ message: '取得失敗' });
    }
};

export const sendUserChatMessage = async (req, res) => {
    const { roomId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    try {
        const room = await prisma.chatRoom.findUnique({
            where: { id: roomId },
            include: { offer: { include: { project: true } } }
        });
        if (!room) return res.status(404).json({ message: 'ルームが見つかりません' });
        if (room.offer.project.plannerId !== userId) return res.status(403).json({ message: '権限がありません' });
        const message = await prisma.chatMessage.create({
            data: { content, senderType: 'USER', chatRoomId: roomId, userId }
        });
        res.status(201).json(message);
    } catch (e) {
        res.status(500).json({ message: '送信失敗' });
    }
};
// グループチャットのpagination取得
export const getGroupChatMessages = async (req, res) => {
    const { id: projectId } = req.params;
    const cursor = req.query.cursor; // 最後に取得したメッセージのcreatedAt
    const take = 50;
    try {
        const messages = await prisma.groupChatMessage.findMany({
            where: {
                projectId,
                ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take,
            include: {
                user: { select: { id: true, handleName: true, iconUrl: true } },
                florist: { select: { id: true, platformName: true, iconUrl: true } },
            },
        });
        // 古い順に戻す
        const sorted = messages.reverse();
        const nextCursor = sorted.length === take ? sorted[0].createdAt.toISOString() : null;
        res.json({ messages: sorted, nextCursor });
    } catch (e) {
        res.status(500).json({ message: '取得失敗' });
    }
};

// 応援コメント一覧取得
export const getCheers = async (req, res) => {
    const { projectId } = req.params;
    const cursor = req.query.cursor;
    try {
        const cheers = await prisma.cheer.findMany({
            where: {
                projectId,
                ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { user: { select: { id: true, handleName: true, iconUrl: true } } },
        });
        const nextCursor = cheers.length === 20 ? cheers[cheers.length - 1].createdAt.toISOString() : null;
        res.json({ cheers, nextCursor });
    } catch (e) {
        res.status(500).json({ message: '取得失敗' });
    }
};

// 応援コメント投稿（ログイン不要）
export const postCheer = async (req, res) => {
    const { projectId } = req.params;
    const { message, guestName } = req.body;
    const userId = req.user?.id ?? null;

    if (!message?.trim()) return res.status(400).json({ message: 'メッセージを入力してください' });
    if (!userId && !guestName?.trim()) return res.status(400).json({ message: 'お名前を入力してください' });

    try {
        const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, plannerId: true, title: true } });
        if (!project) return res.status(404).json({ message: '企画が見つかりません' });

        const cheer = await prisma.$transaction(async (tx) => {
            const newCheer = await tx.cheer.create({
                data: { message: message.trim(), projectId, userId, guestName: guestName?.trim() || null },
                include: { user: { select: { id: true, handleName: true, iconUrl: true } } },
            });

            // プランナーへ通知（cheerとセットでアトミックに作成）
            if (project.plannerId) {
                await tx.notification.create({
                    data: {
                        recipientId: project.plannerId,
                        type: 'NEW_ANNOUNCEMENT',
                        message: `応援メッセージが届きました！`,
                        projectId,
                        linkUrl: `/projects/${projectId}`,
                    },
                });
            }

            return newCheer;
        });

        res.status(201).json(cheer);
    } catch (e) {
        res.status(500).json({ message: '投稿に失敗しました' });
    }
};
