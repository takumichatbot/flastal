import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import cors from 'cors';
import Stripe from 'stripe';
import multer from 'multer';
import cloudinary from './config/cloudinary.js';

// --- 定数定義 ---
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
const NG_WORDS = [
  'LINE', 'ライン', 'ID', 'カカオ', 'kakao', '電話番号', 'メアド', 'メール',
  'http', 'https', '.com', '.jp', '.net', '.org',
  '銀行', '口座', '振込', '現金', '個人', '直接',
  '死ね', '殺す', 'バカ', 'アホ',
];

// --- 初期設定 ---
const upload = multer({ storage: multer.memoryStorage() });
const app = express();
const httpServer = createServer(app);

// CORS設定
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PATCH", "DELETE"],
};

const io = new Server(httpServer, {
  cors: corsOptions
});

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// --- Expressミドルウェア設定 ---
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.sendStatus(400);
  }
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const userId = session.client_reference_id;
      const pointsPurchased = parseInt(session.metadata.points) || session.amount_total;
      try {
        const purchaser = await prisma.user.findUnique({ where: { id: userId } });
        if (purchaser) {
          await prisma.$transaction(async (tx) => {
            await tx.user.update({ where: { id: userId }, data: { points: { increment: pointsPurchased } } });
            if (!purchaser.hasMadeFirstPurchase && purchaser.referredById) {
              await tx.user.update({ where: { id: purchaser.referredById }, data: { points: { increment: 500 } } });
              await tx.user.update({ where: { id: userId }, data: { hasMadeFirstPurchase: true } });
              console.log(`Referral bonus of 500 points awarded to user ${purchaser.referredById}.`);
            }
          });
          console.log(`User ${userId} successfully purchased ${pointsPurchased} points.`);
        }
      } catch(error) {
        console.error(`Failed to process purchase for user ${userId}:`, error);
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  res.status(200).json({ received: true });
});

app.use(cors(corsOptions)); 
app.use(express.json());

// --- APIエンドポイント ---
app.get('/', (req, res) => {
  res.send('FLASTAL APIサーバーへようこそ！');
});

// ★★★ ユーザー登録API (メール重複チェック機能付き) ★★★
app.post('/api/users/register', async (req, res) => {
  try {
    const { email, password, handleName, referralCode } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      email,
      handleName,
      password: hashedPassword,
    };
    if (referralCode && referralCode.trim() !== '') {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referralCode.trim() },
      });
      if (referrer) {
        userData.referredById = referrer.id;
      }
    }
    const newUser = await prisma.user.create({
      data: userData,
    });
    // ★ パスワード情報は返さないようにする
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ message: 'ユーザー登録が完了しました。', user: userWithoutPassword });
  } catch (error) {
    // ★★★ ここからが修正箇所です ★★★
    // もし、エラーが「重複エラー(P2002)」だったら...
    if (error.code === 'P2002') {
      // 親切なメッセージを返す
      return res.status(409).json({ message: 'このメールアドレスは既に使用されています。' });
    }
    // その他の予期せぬエラー
    console.error('ユーザー登録エラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました。' });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({
      where: { email },
    })
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません。' })
    }
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'パスワードが間違っています。' })
    }
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({
      message: 'ログインに成功しました。',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'サーバーエラーが発生しました。' })
  }
});

app.get('/api/users/:userId/created-projects', async (req, res) => {
  const { userId } = req.params;
  try {
    const projects = await prisma.project.findMany({
      where: { plannerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        offer: true,
        review: true,
      }
    });
    res.status(200).json(projects);
  } catch (error) {
    console.error('「作成した企画」の取得でエラーが発生しました:', error);
    res.status(500).json({ message: '作成した企画の取得中にエラーが発生しました。' });
  }
});

app.get('/api/users/:userId/pledged-projects', async (req, res) => {
  const { userId } = req.params;
  try {
    const pledges = await prisma.pledge.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        project: true,
      }
    });
    res.status(200).json(pledges);
  } catch (error) {
    console.error('「支援した企画」の取得でエラーが発生しました:', error);
    res.status(500).json({ message: '支援した企画の取得中にエラーが発生しました。' });
  }
});

app.get('/api/chat/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        offer: {
          include: {
            project: {
              include: {
                planner: true,
                quotation: {
                  include: {
                    items: true,
                  }
                }
              }
            },
            florist: true,
          }
        }
      }
    });
    if (!chatRoom) {
      return res.status(404).json({ message: 'チャットルームが見つかりません。' });
    }
    res.status(200).json(chatRoom);
  } catch (error) {
    console.error("チャット情報取得エラー:", error);
    res.status(500).json({ message: 'チャット情報の取得中にエラーが発生しました。' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { 
      title, description, targetAmount, 
      deliveryAddress, deliveryDateTime, plannerId, 
      imageUrl, designDetails, size, flowerTypes,
      visibility
    } = req.body;

    const deliveryDate = new Date(deliveryDateTime);
    if (isNaN(deliveryDate.getTime())) {
      return res.status(400).json({ message: '有効な納品希望日時を入力してください。' });
    }
    const amount = parseInt(targetAmount, 10);
    if (isNaN(amount)) {
        return res.status(400).json({ message: '目標金額は数値で入力してください。' });
    }
    const newProject = await prisma.project.create({
      data: {
        title,
        description,
        targetAmount: amount,
        deliveryAddress,
        deliveryDateTime: deliveryDate,
        plannerId,
        imageUrl,
        designDetails,
        size,
        flowerTypes,
        visibility,
      },
    });
    res.status(201).json(newProject);
  } catch (error) {
    console.error('企画作成エラー:', error);
    res.status(500).json({ message: '企画の作成中にエラーが発生しました。' });
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        visibility: 'PUBLIC',
        isVisible: true,
      },
      include: {
        planner: true,
        pledges: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      }
    });
    res.status(200).json(projects);
  } catch (error) {
    console.error('企画取得エラー:', error);
    res.status(500).json({ message: '企画の取得中にエラーが発生しました。' });
  }
});

app.get('/api/projects/featured', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { status: 'FUNDRAISING',
               visibility: 'PUBLIC',
               isVisible: true,
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: { planner: true },
    });
    res.status(200).json(projects);
  } catch (error) {
    console.error('注目の企画取得エラー:', error);
    res.status(500).json({ message: '企画の取得中にエラーが発生しました。' });
  }
});

// ★★★ 単一の企画を取得するAPI (最終完成版) ★★★
app.get('/api/projects/:id', async (req, res) => {
  const { id } = req.params; 

  try {
    const project = await prisma.project.findUnique({
      where: {
        id: id,
      },
      // ★★★ ここが修正箇所です ★★★
      // projectに紐づく、全ての関連情報を取得するようにします
      include: {
        planner: true,
        pledges: {
          orderBy: { createdAt: 'desc' },
          include: { user: true }
        },
        announcements: {
          orderBy: { createdAt: 'desc' }
        },
        expenses: {
          orderBy: { createdAt: 'asc' }
        },
        tasks: {
          orderBy: { createdAt: 'asc' }
        },
        poll: {
          include: {
            options: {
              include: {
                votes: true
              }
            },
            votes: {
              select: {
                userId: true
              }
            }
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
    console.error('企画取得エラー:', error);
    res.status(500).json({ message: '企画の取得中にエラーが発生しました。' });
  }
});

app.post('/api/pledges', async (req, res) => {
  const { projectId, userId, amount, comment } = req.body;
  const pledgeAmount = parseInt(amount, 10);
  if (isNaN(pledgeAmount) || pledgeAmount <= 0) {
    return res.status(400).json({ message: '支援額は正の数で入力してください。' });
  }
  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      const project = await tx.project.findUnique({ where: { id: projectId } });
      if (!user) throw new Error('ユーザーが見つかりません。');
      if (!project) throw new Error('企画が見つかりません。');
      if (project.status !== 'FUNDRAISING') throw new Error('この企画は現在募集中ではありません。');
      if (user.points < pledgeAmount) throw new Error('ポイントが不足しています。');
      await tx.user.update({
        where: { id: userId },
        data: { points: { decrement: pledgeAmount } },
      });
      const newPledge = await tx.pledge.create({
        data: { 
          amount: pledgeAmount, 
          projectId, 
          userId, 
          comment 
        },
      });
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: { collectedAmount: { increment: pledgeAmount } },
      });
      if (updatedProject.collectedAmount >= updatedProject.targetAmount) {
        await tx.project.update({
          where: { id: projectId },
          data: { status: 'SUCCESSFUL' },
        });
        console.log(`Project ${projectId} has successfully reached its funding goal!`);
      }
      return { newPledge };
    });
    res.status(201).json(result);
  } catch (error) {
    console.error('支援処理エラー:', error);
    res.status(400).json({ message: error.message || '支援処理中にエラーが発生しました。' });
  }
});

app.post('/api/quotations', async (req, res) => {
  const { projectId, items, floristId } = req.body;
  try {
    const offer = await prisma.offer.findFirst({
      where: { projectId, floristId, status: 'ACCEPTED' },
    });
    if (!offer) {
      return res.status(403).json({ message: '権限がありません。' });
    }
    const totalAmount = items.reduce((sum, item) => sum + parseInt(item.amount, 10), 0);
    const newQuotation = await prisma.quotation.create({
      data: {
        projectId,
        totalAmount,
        items: {
          create: items.map(item => ({
            itemName: item.itemName,
            amount: parseInt(item.amount, 10),
          })),
        },
      },
      include: { items: true },
    });
    res.status(201).json(newQuotation);
  } catch (error) {
    console.error("見積書作成APIエラー:", error);
    res.status(500).json({ message: '見積書の作成中にエラーが発生しました。' });
  }
});

app.patch('/api/quotations/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.findUnique({ where: { id }, include: { project: true } });
      if (!quotation) throw new Error('見積書が見つかりません。');
      if (quotation.project.plannerId !== userId) throw new Error('権限がありません。');
      if (quotation.isApproved) throw new Error('この見積書は既に承認済みです。');
      const project = quotation.project;
      const totalAmount = quotation.totalAmount;
      if (project.collectedAmount < totalAmount) {
        throw new Error('集まったポイントが見積もり金額に足りません。');
      }
      const offer = await tx.offer.findUnique({ where: { projectId: project.id } });
      if (!offer || !offer.floristId) throw new Error('担当のお花屋さんが見つかりません。');
      const commissionAmount = totalAmount - Math.floor(totalAmount * 0.80);
      const netPayout = totalAmount - commissionAmount;
      await tx.florist.update({
        where: { id: offer.floristId },
        data: { balance: { increment: netPayout } },
      });
      await tx.commission.create({
        data: { amount: commissionAmount, projectId: project.id }
      });
      const approvedQuotation = await tx.quotation.update({
        where: { id },
        data: { isApproved: true },
      });
      console.log(`Quotation ${id} approved. Payout of ${netPayout}pt to florist ${offer.floristId}. Commission of ${commissionAmount}pt earned.`);
      return approvedQuotation;
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("見積書承認エラー:", error);
    res.status(400).json({ message: error.message || '処理中にエラーが発生しました。' });
  }
});

app.post('/api/checkout/create-session', async (req, res) => {
    const { userId, amount, points } = req.body;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price_data: { currency: 'jpy', product_data: { name: `${points} ポイント購入` }, unit_amount: amount, }, quantity: 1, }],
            mode: 'payment',
            success_url: `${frontendUrl}/payment/success`,
            cancel_url: `${frontendUrl}/points`,
            client_reference_id: userId,
            metadata: { points },
        });
        res.json({ url: session.url });
    } catch (error) {
        console.error('Stripe session creation error:', error);
        res.status(500).json({ message: '決済セッションの作成に失敗しました。' });
    }
});

app.get('/api/reviews/featured', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        comment: { not: null, not: '', },
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { handleName: true } },
        project: { select: { title: true } },
      },
    });
    res.status(200).json(reviews);
  } catch (error) {
    console.error('注目のレビュー取得エラー:', error);
    res.status(500).json({ message: 'レビューの取得中にエラーが発生しました。' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.status(200).json({ message: '管理者として認証されました。' });
  } else {
    res.status(401).json({ message: 'パスワードが違います。' });
  }
});

app.get('/api/admin/commissions', async (req, res) => {
  try {
    const commissions = await prisma.commission.findMany({
      orderBy: { createdAt: 'desc' },
      include: { project: true, }
    });
    res.status(200).json(commissions);
  } catch (error) {
    res.status(500).json({ message: '手数料の取得中にエラーが発生しました。' });
  }
});

// server/index.js (修正)

app.post('/api/florists/register', async (req, res) => {
  try {
    // ★ platformName を受け取るように変更
    const { email, password, shopName, contactName, platformName } = req.body;

    if (!email || !password || !shopName || !contactName || !platformName) {
      return res.status(400).json({ message: '必須項目が不足しています。' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newFlorist = await prisma.florist.create({
      data: {
        email,
        password: hashedPassword,
        shopName,      // 実店舗名
        platformName,  // 活動名
        contactName,
        // statusはデフォルトでPENDINGになる
      },
    });

    const { password: _, ...floristWithoutPassword } = newFlorist;
    res.status(201).json({ message: 'お花屋さんの登録申請が完了しました。運営による承認をお待ちください。', florist: floristWithoutPassword });

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'このメールアドレスは既に使用されています。' });
    }
    console.error('お花屋さん登録エラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました。' });
  }
});

app.get('/api/florists', async (req, res) => {
  try {
    const florists = await prisma.florist.findMany({
      where: {
        status: 'APPROVED' // ★ 承認済みの花屋のみ
      },
      select: { // ★ 公開して良い情報だけを選択
        id: true,
        platformName: true,
        portfolio: true,
        reviews: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(floristsWithRatings);
  } catch (error) {
    console.error("お花屋さんリスト取得エラー:", error);
    res.status(500).json({ message: 'お花屋さんの取得中にエラーが発生しました。' });
  }
});

app.get('/api/florists/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const florist = await prisma.florist.findUnique({
      where: { id: id },
      include: {
        reviews: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          project: true,
        }
      }
    }
  });
    if (!florist) {
      return res.status(404).json({ message: 'お花屋さんが見つかりません。' });
    }
    const { password, ...floristWithoutPassword } = florist;
    res.status(200).json(floristWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'お花屋さんの取得中にエラーが発生しました。' });
  }
});

app.get('/api/users/:userId/projects', async (req, res) => {
  const { userId } = req.params;
  try {
    const projects = await prisma.project.findMany({
      where: { 
        plannerId: userId,
        offer: null,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: '企画の取得中にエラーが発生しました。' });
  }
});

app.post('/api/offers', async (req, res) => {
  const { projectId, floristId } = req.body;
  try {
    const newOffer = await prisma.offer.create({
      data: {
        projectId,
        floristId,
      }
    });
    res.status(201).json(newOffer);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'この企画は既にオファーに出されています。' });
    }
    res.status(500).json({ message: 'オファーの作成中にエラーが発生しました。' });
  }
});

app.post('/api/florists/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const florist = await prisma.florist.findUnique({
      where: { email },
    });

    if (!florist) { /* ... */ }

    const isPasswordValid = await bcrypt.compare(password, florist.password);

    if (!isPasswordValid) { /* ... */ }

    // ★ レスポンスにステータスが含まれていることを確認
    const { password: _, ...floristWithoutPassword } = florist;
    res.status(200).json({
      message: 'ログインに成功しました。',
      florist: floristWithoutPassword, // ここにstatusが含まれている
    });

  } catch (error) {
    console.error('お花屋さんログインエラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました。' });
  }
});

app.get('/api/florists/:floristId/dashboard', async (req, res) => {
  const { floristId } = req.params;
  try {
    const florist = await prisma.florist.findUnique({
      where: { id: floristId },
    });
    if (!florist) {
      return res.status(404).json({ message: 'お花屋さんが見つかりません。' });
    }
    const offers = await prisma.offer.findMany({
      where: { floristId: floristId },
      include: {
        project: {
          include: {
            planner: true,
          },
        },
        chatRoom: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    const { password, ...floristData } = florist;
    res.status(200).json({ florist: floristData, offers });
  } catch (error) {
    console.error('ダッシュボードデータ取得エラー:', error);
    res.status(500).json({ message: 'データの取得中にエラーが発生しました。' });
  }
});

app.patch('/api/offers/:offerId', async (req, res) => {
  const { offerId } = req.params;
  const { status } = req.body;
  if (status !== 'ACCEPTED' && status !== 'REJECTED') {
    return res.status(400).json({ message: '無効なステータスです。' });
  }
  try {
  const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: { status: status },
      include: {
        project: {
          include: {
            planner: true,
          },
        },
        chatRoom: true,
      },
    });
  if (status === 'ACCEPTED') {
    const existingRoom = await prisma.chatRoom.findFirst({
      where: { offerId: offerId },
    });
    if (!existingRoom) {
      await prisma.chatRoom.create({
        data: {
          offerId: offerId,
        },
      });
    }
  }
    res.status(200).json(updatedOffer);
  } catch (error) {
    console.error('オファー更新エラー:', error);
    res.status(500).json({ message: 'オファーの更新中にエラーが発生しました。' });
  }
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '画像ファイルがありません。' });
    }
    cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
      if (error) {
        throw new Error('Cloudinaryへのアップロードに失敗しました。');
      }
      res.status(200).json({ url: result.secure_url });
    }).end(req.file.buffer);
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    res.status(500).json({ message: error.message || 'アップロード中にエラーが発生しました。' });
  }
});

app.patch('/api/florists/:id', async (req, res) => {
  const { id } = req.params;
  const { shopName, contactName, address, phoneNumber, website, portfolio, laruBotApiKey } = req.body;
  try {
    const updatedFlorist = await prisma.florist.update({
      where: { id: id },
      data: {
        shopName, contactName, address, phoneNumber, website, portfolio,
        laruBotApiKey,
      },
    });
    const { password, ...floristWithoutPassword } = updatedFlorist;
    res.status(200).json(floristWithoutPassword);
  } catch (error) {
    console.error('プロフィール更新エラー:', error);
    res.status(500).json({ message: 'プロフィールの更新中にエラーが発生しました。' });
  }
});

app.post('/api/venues/register', async (req, res) => {
  try {
    const { email, password, venueName } = req.body;
    if (!email || !password || !venueName) {
      return res.status(400).json({ message: '必須項目が不足しています。' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newVenue = await prisma.venue.create({
      data: {
        email,
        password: hashedPassword,
        venueName,
      },
    });
    const { password: _, ...venueWithoutPassword } = newVenue;
    res.status(201).json({ message: '会場の登録が完了しました。', venue: venueWithoutPassword });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'このメールアドレスは既に使用されています。' });
    }
    console.error('会場登録エラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました。' });
  }
});

app.post('/api/venues/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const venue = await prisma.venue.findUnique({
      where: { email },
    });
    if (!venue) {
      return res.status(404).json({ message: '会場が見つかりません。' });
    }
    const isPasswordValid = await bcrypt.compare(password, venue.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'パスワードが間違っています。' });
    }
    const { password: _, ...venueWithoutPassword } = venue;
    res.status(200).json({
      message: 'ログインに成功しました。',
      venue: venueWithoutPassword,
    });
  } catch (error) {
    console.error('会場ログインエラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました。' });
  }
});

app.get('/api/venues/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const venue = await prisma.venue.findUnique({ where: { id } });
    if (!venue) {
      return res.status(404).json({ message: '会場が見つかりません。' });
    }
    const { password, ...venueWithoutPassword } = venue;
    res.status(200).json(venueWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: '会場情報の取得中にエラーが発生しました。' });
  }
});

app.patch('/api/venues/:id', async (req, res) => {
  const { id } = req.params;
  const { venueName, address, regulations } = req.body;
  try {
    const updatedVenue = await prisma.venue.update({
      where: { id },
      data: { venueName, address, regulations },
    });
    const { password, ...venueWithoutPassword } = updatedVenue;
    res.status(200).json(venueWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'プロフィールの更新中にエラーが発生しました。' });
  }
});

app.get('/api/venues', async (req, res) => {
  try {
    const venues = await prisma.venue.findMany({
      select: {
        id: true,
        venueName: true,
        regulations: true,
      },
      orderBy: {
        venueName: 'asc',
      }
    });
    res.status(200).json(venues);
  } catch (error) {
    res.status(500).json({ message: '会場リストの取得中にエラーが発生しました。' });
  }
});

app.post('/api/reviews', async (req, res) => {
  const { rating, comment, projectId, floristId, userId } = req.body;
  try {
    const newReview = await prisma.review.create({
      data: {
        rating: parseInt(rating, 10),
        comment,
        projectId,
        floristId,
        userId,
      },
    });
    res.status(201).json(newReview);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'この企画には既にレビューが投稿されています。' });
    }
    console.error("レビュー投稿APIでエラー:", error);
    res.status(500).json({ message: 'レビューの投稿中にエラーが発生しました。' });
  }
});

app.post('/api/announcements', async (req, res) => {
  const { title, content, projectId, userId } = req.body;
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return res.status(404).json({ message: '企画が見つかりません。' });
    }
    if (project.plannerId !== userId) {
      return res.status(403).json({ message: '権限がありません。あなたはこの企画の主催者ではありません。' });
    }
    const newAnnouncement = await prisma.announcement.create({
      data: {
        title,
        content,
        projectId,
      },
    });
    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error("お知らせ投稿APIでエラー:", error);
    res.status(500).json({ message: 'お知らせの投稿中にエラーが発生しました。' });
  }
});

app.post('/api/payouts', async (req, res) => {
  const { floristId, amount, accountInfo } = req.body;
  const payoutAmount = parseInt(amount, 10);
  const MINIMUM_PAYOUT_AMOUNT = 1000;
  if (isNaN(payoutAmount) || payoutAmount < MINIMUM_PAYOUT_AMOUNT) {
    return res.status(400).json({ message: `出金申請は${MINIMUM_PAYOUT_AMOUNT}ポイントから可能です。` });
  }
  try {
    const result = await prisma.$transaction(async (tx) => {
      const florist = await tx.florist.findUnique({ where: { id: floristId } });
      if (!florist) throw new Error('お花屋さんが見つかりません。');
      if (florist.balance < payoutAmount) throw new Error('売上残高が不足しています。');
      await tx.florist.update({
        where: { id: floristId },
        data: { balance: { decrement: payoutAmount } },
      });
      const newPayoutRequest = await tx.payoutRequest.create({
        data: {
          amount: payoutAmount,
          accountInfo,
          floristId,
        },
      });
      return newPayoutRequest;
    });
    res.status(201).json(result);
  } catch (error) {
    console.error('出金申請エラー:', error);
    res.status(400).json({ message: error.message || '出金申請中にエラーが発生しました。' });
  }
});

app.get('/api/florists/:floristId/payouts', async (req, res) => {
  const { floristId } = req.params;
  try {
    const payoutRequests = await prisma.payoutRequest.findMany({
      where: { floristId },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(payoutRequests);
  } catch (error) {
    res.status(500).json({ message: '出金履歴の取得中にエラーが発生しました。' });
  }
});

app.post('/api/expenses', async (req, res) => {
  const { itemName, amount, projectId, userId } = req.body;
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project || project.plannerId !== userId) {
      return res.status(403).json({ message: '権限がありません。' });
    }
    const newExpense = await prisma.expense.create({
      data: {
        itemName,
        amount: parseInt(amount, 10),
        projectId,
      },
    });
    res.status(201).json(newExpense);
  } catch (error) {
    console.error("支出追加APIでエラー:", error);
    res.status(500).json({ message: '支出の追加中にエラーが発生しました。' });
  }
});

app.delete('/api/expenses/:expenseId', async (req, res) => {
  const { expenseId } = req.params;
  const { userId } = req.body;
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { project: { select: { plannerId: true } } },
    });
    if (!expense) {
      return res.status(404).json({ message: '支出項目が見つかりません。' });
    }
    if (expense.project.plannerId !== userId) {
      return res.status(403).json({ message: '権限がありません。' });
    }
    await prisma.expense.delete({
      where: { id: expenseId },
    });
    res.status(204).send();
  } catch (error) {
    console.error("支出削除APIでエラー:", error);
    res.status(500).json({ message: '支出の削除中にエラーが発生しました。' });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { title, projectId, userId } = req.body;
  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.plannerId !== userId) {
      return res.status(403).json({ message: '権限がありません。' });
    }
    const newTask = await prisma.task.create({
      data: { title, projectId },
    });
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: 'タスクの追加中にエラーが発生しました。' });
  }
});

app.patch('/api/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const { isCompleted, userId } = req.body;
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { plannerId: true } } },
    });
    if (!task || task.project.plannerId !== userId) {
      return res.status(403).json({ message: '権限がありません。' });
    }
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { isCompleted },
    });
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'タスクの更新中にエラーが発生しました。' });
  }
});

app.delete('/api/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const { userId } = req.body;
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { plannerId: true } } },
    });
    if (!task || task.project.plannerId !== userId) {
      return res.status(403).json({ message: '権限がありません。' });
    }
    await prisma.task.delete({ where: { id: taskId } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'タスクの削除中にエラーが発生しました。' });
  }
});

app.post('/api/messages', async (req, res) => {
  const { content, cardName, projectId, userId } = req.body;
  try {
    const pledge = await prisma.pledge.findFirst({
      where: {
        projectId: projectId,
        userId: userId,
      },
    });
    if (!pledge) {
      return res.status(403).json({ message: 'この企画の支援者のみメッセージを投稿できます。' });
    }
    const newMessage = await prisma.message.create({
      data: {
        content,
        cardName,
        projectId,
        userId,
      },
    });
    res.status(201).json(newMessage);
  } catch (error)
  {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'あなたはこの企画に既にメッセージを投稿済みです。' });
    }
    console.error("メッセージ投稿APIでエラー:", error);
    res.status(500).json({ message: 'メッセージの投稿中にエラーが発生しました。' });
  }
});

app.get('/api/chat-templates', (req, res) => {
  res.status(200).json(CHAT_TEMPLATES);
});

app.post('/api/group-chat/polls', async (req, res) => {
  const { projectId, userId, question, options } = req.body;
  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.plannerId !== userId) {
      return res.status(403).json({ message: 'アンケートを作成できるのは企画者のみです。' });
    }
    await prisma.activePoll.deleteMany({ where: { projectId } });
    const newPoll = await prisma.activePoll.create({
      data: { projectId, question, options },
      include: { votes: true }
    });
    res.status(201).json(newPoll);
  } catch (error) {
    console.error("アンケート作成APIエラー:", error);
    res.status(500).json({ message: 'アンケート作成中にエラーが発生しました。' });
  }
});

app.post('/api/group-chat/polls/vote', async (req, res) => {
  const { pollId, userId, optionIndex } = req.body;
  try {
    const poll = await prisma.activePoll.findUnique({ where: { id: pollId } });
    if (!poll) return res.status(404).json({ message: 'アンケートが見つかりません。' });
    const pledge = await prisma.pledge.findFirst({ where: { projectId: poll.projectId, userId } });
    if (!pledge) return res.status(403).json({ message: '投票は企画の支援者のみ可能です。' });
    const vote = await prisma.pollVote.create({
      data: { pollId, userId, optionIndex },
    });
    res.status(201).json(vote);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'このアンケートには既に投票済みです。' });
    }
    console.error("アンケート投票APIエラー:", error);
    res.status(500).json({ message: '投票中にエラーが発生しました。' });
  }
});

app.get('/api/admin/payouts', async (req, res) => {
  try {
    const pendingPayouts = await prisma.payoutRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        florist: {
          select: { shopName: true }
        }
      },
      orderBy: { createdAt: 'asc' },
    });
    res.status(200).json(pendingPayouts);
  } catch (error) {
    console.error("出金申請の取得エラー:", error);
    res.status(500).json({ message: '出金申請の取得中にエラーが発生しました。' });
  }
});

app.patch('/api/admin/payouts/:id/complete', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedPayout = await prisma.payoutRequest.update({
      where: { id: id },
      data: { status: 'COMPLETED' },
    });
    res.status(200).json(updatedPayout);
  } catch (error) {
    console.error("出金処理の更新エラー:", error);
    res.status(500).json({ message: '出金処理の更新中にエラーが発生しました。' });
  }
});

app.get('/api/admin/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: { planner: { select: { handleName: true } } }
    });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: 'プロジェクトの取得に失敗しました。' });
  }
});

app.get('/api/admin/projects/:projectId/chats', async (req, res) => {
  const { projectId } = req.params;
  try {
    const groupChat = prisma.groupChatMessage.findMany({
      where: { projectId },
      include: { user: { select: { handleName: true } } },
      orderBy: { createdAt: 'asc' }
    });
    const floristChat = prisma.chatMessage.findMany({
      where: { chatRoom: { offer: { projectId } } },
      include: {
        user: { select: { handleName: true } },
        florist: { select: { shopName: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
    const [groupChatMessages, floristChatMessages] = await Promise.all([groupChat, floristChat]);
    res.status(200).json({ groupChat: groupChatMessages, floristChat: floristChatMessages });
  } catch (error) {
    res.status(500).json({ message: 'チャット履歴の取得に失敗しました。' });
  }
});

app.delete('/api/admin/group-chat/:messageId', async (req, res) => {
  const { messageId } = req.params;
  try {
    const message = await prisma.groupChatMessage.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).send();
    await prisma.groupChatMessage.delete({ where: { id: messageId } });
    io.to(message.projectId).emit('groupMessageDeleted', { messageId });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'メッセージの削除に失敗しました。' });
  }
});

app.delete('/api/admin/florist-chat/:messageId', async (req, res) => {
  const { messageId } = req.params;
  try {
    const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).send();
    await prisma.chatMessage.delete({ where: { id: messageId } });
    io.to(message.chatRoomId).emit('floristMessageDeleted', { messageId });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'メッセージの削除に失敗しました。' });
  }
});

app.post('/api/reports/project', async (req, res) => {
  const { projectId, reporterId, reason, details } = req.body;
  if (!projectId || !reporterId || !reason) {
    return res.status(400).json({ message: '必須項目が不足しています。' });
  }
  try {
    const newReport = await prisma.projectReport.create({
      data: {
        projectId,
        reporterId,
        reason,
        details,
      },
    });
    res.status(201).json({ message: 'ご報告ありがとうございました。運営にて内容を確認いたします。' });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'あなたはこの企画を既に通報済みです。' });
    }
    console.error("企画の通報エラー:", error);
    res.status(500).json({ message: '通報処理中にエラーが発生しました。' });
  }
});

app.get('/api/admin/reports', async (req, res) => {
  try {
    const reports = await prisma.projectReport.findMany({
      where: { status: 'SUBMITTED' },
      include: {
        project: { select: { title: true } },
        reporter: { select: { handleName: true } }
      },
      orderBy: { createdAt: 'asc' },
    });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: '通報リストの取得に失敗しました。' });
  }
});

app.patch('/api/admin/reports/:reportId/review', async (req, res) => {
  const { reportId } = req.params;
  try {
    const updatedReport = await prisma.projectReport.update({
      where: { id: reportId },
      data: { status: 'REVIEWED' },
    });
    res.status(200).json(updatedReport);
  } catch (error) {
    console.error("通報ステータスの更新エラー:", error);
    res.status(500).json({ message: 'ステータスの更新中にエラーが発生しました。' });
  }
});

app.patch('/api/admin/projects/:projectId/visibility', async (req, res) => {
  const { projectId } = req.params;
  const { isVisible } = req.body;
  try {
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { isVisible: isVisible },
    });
    res.status(200).json(updatedProject);
  } catch (error) {
    console.error("企画の公開状態更新エラー:", error);
    res.status(500).json({ message: '企画の公開状態の更新に失敗しました。' });
  }
});

app.patch('/api/projects/:projectId/complete', async (req, res) => {
  const { projectId } = req.params;
  const { userId, completionImageUrls, completionComment } = req.body;
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project || project.plannerId !== userId) {
      return res.status(403).json({ message: '権限がありません。' });
    }
    const completedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'COMPLETED',
        completionImageUrls: completionImageUrls,
        completionComment: completionComment,
      },
    });
    res.status(200).json(completedProject);
  } catch (error) {
    console.error("完了報告の投稿エラー:", error);
    res.status(500).json({ message: '完了報告の投稿中にエラーが発生しました。' });
  }
});

app.patch('/api/projects/:projectId/cancel', async (req, res) => {
  const { projectId } = req.params;
  const { userId } = req.body;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: { id: projectId },
        include: { pledges: true }
      });
      if (!project) throw new Error('企画が見つかりません。');
      if (project.plannerId !== userId) throw new Error('権限がありません。');
      if (project.status === 'COMPLETED' || project.status === 'CANCELED') {
        throw new Error('この企画は既に完了または中止されているため、中止できません。');
      }
      for (const pledge of project.pledges) {
        await tx.user.update({
          where: { id: pledge.userId },
          data: { points: { increment: pledge.amount } }
        });
      }
      const canceledProject = await tx.project.update({
        where: { id: projectId },
        data: { status: 'CANCELED' },
      });
      return canceledProject;
    });
    res.status(200).json({ message: '企画を中止し、すべての支援者にポイントが返金されました。', project: result });
  } catch (error) {
    console.error("企画の中止処理エラー:", error);
    res.status(400).json({ message: error.message || '企画の中止処理中にエラーが発生しました。' });
  }
});

// ★★★ パスワード再設定リクエストAPI ★★★
app.post('/api/forgot-password', async (req, res) => {
  const { email, userType } = req.body; // 'USER', 'FLORIST', 'VENUE'

  try {
    let userExists = false;
    // ユーザー種別に応じて、探すテーブルを切り替える
    if (userType === 'USER') {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) userExists = true;
    } else if (userType === 'FLORIST') {
      const florist = await prisma.florist.findUnique({ where: { email } });
      if (florist) userExists = true;
    } else if (userType === 'VENUE') {
      const venue = await prisma.venue.findUnique({ where: { email } });
      if (venue) userExists = true;
    }

    if (userExists) {
      // 本来はここで、メール送信ライブラリ（Nodemailerなど）を使って
      // パスワード再設定用のトークンを含んだURLを生成し、メールを送信します。
      console.log(`パスワード再設定リクエスト受信: ${email} (${userType})。メール送信をシミュレートします。`);
    } else {
      // セキュリティのため、ユーザーが存在しない場合でも、その事実は伝えない
      console.log(`パスワード再設定リクエスト受信（未登録）: ${email} (${userType})。`);
    }

    // ユーザーが存在するかどうかに関わらず、常に成功メッセージを返すのがセキュリティのベストプラクティスです。
    res.status(200).json({ message: 'ご入力いただいたメールアドレスに、パスワード再設定用のリンクを送信しました。メールが届かない場合は、入力したアドレスに誤りがないかご確認ください。' });

  } catch (error) {
    console.error("パスワード再設定リクエストエラー:", error);
    res.status(500).json({ message: '処理中にエラーが発生しました。' });
  }
});

// ★★★【管理者用】審査待ちの花屋さん一覧を取得するAPI ★★★
app.get('/api/admin/florists/pending', async (req, res) => {
  try {
    const pendingFlorists = await prisma.florist.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
    res.status(200).json(pendingFlorists);
  } catch (error) {
    res.status(500).json({ message: '審査待ちリストの取得に失敗しました。' });
  }
});

// ★★★【管理者用】花屋さんの登録を承認/拒否するAPI ★★★
app.patch('/api/admin/florists/:floristId/status', async (req, res) => {
  const { floristId } = req.params;
  const { status } = req.body; // "APPROVED" or "REJECTED"

  if (status !== 'APPROVED' && status !== 'REJECTED') {
    return res.status(400).json({ message: '無効なステータスです。' });
  }

  try {
    const updatedFlorist = await prisma.florist.update({
      where: { id: floristId },
      data: { status: status },
    });
    res.status(200).json(updatedFlorist);
  } catch (error) {
    res.status(500).json({ message: 'ステータスの更新に失敗しました。' });
  }
});



// ===================================
// ★★★★★   Socket.IOの処理   ★★★★★
// ===================================
io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });
  
  socket.on('joinProjectRoom', (projectId) => {
    socket.join(projectId);
    console.log(`Socket ${socket.id} joined project room ${projectId}`);
  });

  socket.on('sendMessage', async ({ roomId, content, senderType, userId, floristId }) => {
    try {
      if (senderType === 'USER' || senderType === 'FLORIST') {
        const containsNGWord = NG_WORDS.some(word => content.toLowerCase().includes(word.toLowerCase()));
        if (containsNGWord) {
          socket.emit('messageError', '送信できない単語が含まれています。内容を修正してください。');
          return; 
        }
      }
      const newMessage = await prisma.chatMessage.create({
        data: { content, senderType, userId, floristId, chatRoomId: roomId }
      });
      io.to(roomId).emit('receiveMessage', newMessage);

      if (senderType === 'USER') {
        const roomInfo = await prisma.chatRoom.findUnique({
          where: { id: roomId },
          include: { offer: { include: { florist: true } } }
        });
        const targetFlorist = roomInfo?.offer?.florist;
        if (targetFlorist && targetFlorist.laruBotApiKey) {
          const larubotResponse = await fetch('https://larubot.tokyo/api/v1/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${targetFlorist.laruBotApiKey}`
            },
            body: JSON.stringify({ message: content, userId: userId })
          });
          if (larubotResponse.ok) {
            const aiData = await larubotResponse.json();
            const aiContent = aiData.reply || "申し訳ありません、現在AIアシスタントは応答できません。";
            const aiMessage = await prisma.chatMessage.create({
              data: {
                content: aiContent,
                senderType: 'FLORIST',
                isAutoResponse: true,
                floristId: targetFlorist.id,
                chatRoomId: roomId,
              }
            });
            io.to(roomId).emit('receiveMessage', aiMessage);
          } else {
            console.error("LARUbot APIとの通信に失敗しました。");
          }
        }
      }
    } catch (error) {
      console.error('Message processing error:', error);
      socket.emit('messageError', 'メッセージの送信中にエラーが発生しました。');
    }
  });
  
  socket.on('sendGroupChatMessage', async ({ projectId, userId, templateId, content }) => {
    try {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) return;
      const pledge = await prisma.pledge.findFirst({ where: { projectId, userId } });
      const isPlanner = project.plannerId === userId;
      if (!pledge && !isPlanner) return;

      let template = null;
      if (templateId) {
        template = CHAT_TEMPLATES.find(t => t.id === templateId);
        if (!template) return;
      }
      if (content && content.trim() !== '') {
        const containsNGWord = NG_WORDS.some(word => content.toLowerCase().includes(word.toLowerCase()));
        if (containsNGWord) {
          socket.emit('messageError', '送信できない単語が含まれています。');
          return;
        }
      } else if (template && template.hasCustomInput) {
        return;
      } else if (!templateId && (!content || content.trim() === '')) {
        return;
      }

      const newMessage = await prisma.groupChatMessage.create({
        data: {
          projectId,
          userId,
          templateId: templateId || null,
          content: content || null,
        },
        include: { user: { select: { handleName: true } } }
      });

      io.to(projectId).emit('receiveGroupChatMessage', newMessage);
    } catch (error) {
      console.error("Group chat message error:", error);
      socket.emit('messageError', 'メッセージの送信に失敗しました。');
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});


// ===================================
// ★★★★★   Server Start   ★★★★★
// ===================================
const serverPort = process.env.PORT || 3001;
httpServer.listen(serverPort, () => {
  console.log(`サーバーがポート${serverPort}で起動しました。`);
});