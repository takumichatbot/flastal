import prisma from '../config/prisma.js';
import { sendEmail } from '../utils/email.js';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ==========================================
// ★★★ 定数・メモリDB定義 ★★★
// ==========================================
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

// 簡易メモリDB (サーバー再起動で消えます)
let MOOD_BOARDS = [];
let OFFICIAL_REACTIONS = {};
let DIGITAL_FLOWERS = [];

// ==========================================
// ★★★ 1. 企画の基本アクション (タスク・収支・報告) ★★★
// ==========================================

// 活動報告 (Announcements)
export const createAnnouncement = async (req, res) => {
    const { title, content, projectId } = req.body;
    const userId = req.user.id;
    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project || project.plannerId !== userId) return res.status(403).json({ message: '権限なし' });

        const announcement = await prisma.announcement.create({ data: { title, content, projectId } });
        
        // 支援者へ通知
        const pledges = await prisma.pledge.findMany({ where: { projectId }, distinct: ['userId'], include: { user: true } });
        pledges.forEach(p => {
            if(p.userId !== userId && p.user) {
                prisma.notification.create({ data: { recipientId: p.userId, type: 'NEW_ANNOUNCEMENT', message: `お知らせ: ${title}`, projectId } }).catch(()=>{});
            }
        });
        res.status(201).json(announcement);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

// 収支 (Expenses)
export const addExpense = async (req, res) => {
    const { itemName, amount, projectId } = req.body;
    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (project.plannerId !== req.user.id) return res.status(403).json({ message: '権限なし' });
        const expense = await prisma.expense.create({ data: { itemName, amount: parseInt(amount), projectId } });
        res.status(201).json(expense);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const deleteExpense = async (req, res) => {
    const { expenseId } = req.params;
    try {
        const expense = await prisma.expense.findUnique({ where: { id: expenseId }, include: { project: true } });
        if (expense.project.plannerId !== req.user.id) return res.status(403).json({ message: '権限なし' });
        await prisma.expense.delete({ where: { id: expenseId } });
        res.status(204).send();
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

// タスク (Tasks)
export const addTask = async (req, res) => {
    const { title, projectId, assignedUserId } = req.body;
    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (project.plannerId !== req.user.id) return res.status(403).json({ message: '権限なし' });
        const task = await prisma.task.create({ data: { title, projectId, assignedUserId } });
        if (assignedUserId && assignedUserId !== req.user.id) {
            prisma.notification.create({ data: { recipientId: assignedUserId, type: 'TASK_ASSIGNED', message: 'タスクが割り当てられました', projectId } }).catch(()=>{});
        }
        res.status(201).json(task);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const updateTask = async (req, res) => {
    const { taskId } = req.params;
    const { isCompleted, assignedUserId } = req.body;
    try {
        const task = await prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
        if (task.project.plannerId !== req.user.id) return res.status(403).json({ message: '権限なし' });
        const updated = await prisma.task.update({ where: { id: taskId }, data: { isCompleted, assignedUserId } });
        res.json(updated);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const deleteTask = async (req, res) => {
    const { taskId } = req.params;
    try {
        const task = await prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
        if (task.project.plannerId !== req.user.id) return res.status(403).json({ message: '権限なし' });
        await prisma.task.delete({ where: { id: taskId } });
        res.status(204).send();
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

// メッセージカード (Messages)
export const postMessage = async (req, res) => {
    const { content, cardName, projectId } = req.body;
    try {
        const pledge = await prisma.pledge.findFirst({ where: { projectId, userId: req.user.id } });
        if (!pledge) return res.status(403).json({ message: '支援者のみ投稿可能' });
        const msg = await prisma.message.create({ data: { content, cardName, projectId, userId: req.user.id } });
        res.status(201).json(msg);
    } catch (e) { 
        if(e.code === 'P2002') return res.status(409).json({ message: '投稿済みです' });
        res.status(500).json({ message: 'Error' }); 
    }
};

// ==========================================
// ★★★ 2. チャット・コミュニケーション ★★★
// ==========================================

export const createPoll = async (req, res) => {
    const { projectId, question, options } = req.body;
    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (project.plannerId !== req.user.id) return res.status(403).json({ message: '権限なし' });
        await prisma.activePoll.deleteMany({ where: { projectId } });
        const poll = await prisma.activePoll.create({ data: { projectId, question, options }, include: { votes: true } });
        res.status(201).json(poll);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const votePoll = async (req, res) => {
    const { pollId, optionIndex } = req.body;
    try {
        const poll = await prisma.activePoll.findUnique({ where: { id: pollId } });
        const pledge = await prisma.pledge.findFirst({ where: { projectId: poll.projectId, userId: req.user.id } });
        if (!pledge) return res.status(403).json({ message: '支援者のみ' });
        const vote = await prisma.pollVote.create({ data: { pollId, userId: req.user.id, optionIndex } });
        res.status(201).json(vote);
    } catch (e) { 
        if(e.code === 'P2002') return res.status(409).json({ message: '投票済み' });
        res.status(500).json({ message: 'Error' }); 
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
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const summarizeChat = async (req, res) => {
    const { projectId } = req.params;
    try {
        const messages = await prisma.groupChatMessage.findMany({
            where: { projectId }, orderBy: { createdAt: 'desc' }, take: 50,
            include: { user: { select: { handleName: true } } }
        });
        if (!messages.length) return res.status(404).json({ message: '履歴なし' });

        const history = messages.reverse().map(m => `${m.user.handleName}: ${m.content}`).join('\n');
        let summary = '要約不可';

        if (process.env.OPENAI_API_KEY) {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: `次のチャットを要約して(決定事項・デザイン・次アクション):\n${history}` }]
            });
            summary = completion.choices[0].message.content;
        }
        res.json({ summary });
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const getChatTemplates = (req, res) => {
    res.json(CHAT_TEMPLATES);
};

// チャットルーム情報取得 (個別チャット用)
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

// チャット通報 (Chat Reports)
export const reportChat = async (req, res) => {
    const { messageId } = req.params;
    const { reason, type } = req.body; // type: 'GROUP' or 'DIRECT'
    const reporterId = req.user.id;
    try {
        if (type === 'GROUP') {
            await prisma.groupChatMessageReport.create({ data: { messageId, reporterId, reason } });
        } else {
            await prisma.chatMessageReport.create({ data: { messageId, reporterId, reason } });
        }
        res.status(201).json({ message: '通報しました' });
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

// ==========================================
// ★★★ 3. レビュー・通報・ギャラリー ★★★
// ==========================================

export const createReview = async (req, res) => {
    const { comment, projectId, floristId } = req.body;
    try {
        const review = await prisma.review.create({
            data: { comment, projectId, floristId, userId: req.user.id }
        });
        res.status(201).json(review);
    } catch (e) { 
        if(e.code === 'P2002') return res.status(409).json({ message: '投稿済み' });
        res.status(500).json({ message: 'Error' }); 
    }
};

export const getFeaturedReviews = async (req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            where: { comment: { not: '' } }, take: 3, orderBy: { createdAt: 'desc' },
            include: { user: { select: { handleName: true } }, project: { select: { title: true } } }
        });
        res.json(reviews);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const toggleReviewLike = async (req, res) => {
    const { reviewId } = req.params;
    const userId = req.body.userId;
    if (!userId) return res.status(401).json({ message: 'ログインが必要' });
    try {
        const existing = await prisma.reviewLike.findUnique({ where: { reviewId_userId: { reviewId, userId } } });
        if (existing) {
            await prisma.reviewLike.delete({ where: { id: existing.id } });
            res.json({ liked: false });
        } else {
            await prisma.reviewLike.create({ data: { reviewId, userId } });
            res.json({ liked: true });
        }
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

// 企画通報
export const reportProject = async (req, res) => {
    const { projectId, reporterId, reason, details } = req.body;
    try {
        await prisma.projectReport.create({ data: { projectId, reporterId, reason, details } });
        res.status(201).json({ message: '報告しました' });
    } catch(e) { res.status(500).json({ message: 'Error' }); }
};

// ギャラリーフィード取得
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

// ==========================================
// ★★★ 4. その他ツール (ムードボード等) ★★★
// ==========================================

// --- ムードボード ---
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

// --- 推しリアクション ---
export const officialReact = (req, res) => {
    const { id } = req.params;
    OFFICIAL_REACTIONS[id] = { timestamp: new Date(), comment: "Thank you!!" };
    res.json({ success: true });
};
export const getOfficialStatus = (req, res) => {
    res.json(OFFICIAL_REACTIONS[req.params.id] || null);
};

// --- デジタルフラスタ ---
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