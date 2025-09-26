// server/index.js (全体を置き換え)
import express from 'express';
import { createServer } from 'http'; // httpをインポート
import { Server } from 'socket.io'; // Socket.IOのServerをインポート
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import cors from 'cors';
import Stripe from 'stripe';
import multer from 'multer';
import cloudinary from './config/cloudinary.js';

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

// ★★★ NGワードリストの定義 (新規追加) ★★★
const NG_WORDS = [
  'LINE', 'ライン', 'ID', 'カカオ', 'kakao', '電話番号', 'メアド', 'メール',
  'http', 'https', '.com', '.jp', '.net', '.org',
  '銀行', '口座', '振込', '現金', '個人', '直接',
  '死ね', '殺す', 'バカ', 'アホ', // 簡単な不適切単語
];

const upload = multer({ storage: multer.memoryStorage() });


const app = express();
const httpServer = createServer(app); // Expressアプリからhttpサーバーを作成
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean); // .filter(Boolean)で、環境変数がなくてもエラーにならないようにする

const corsOptions = {
  origin: (origin, callback) => {
    // !originはPostmanなどブラウザ以外からのアクセスを許可するため
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



const PORT = process.env.PORT || 3001;


// ★★★ Stripe Webhook API ★★★
// Stripeからのリクエストの正当性を検証するため、JSONパーサーの前にこのルートを定義します
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

  // イベントタイプに応じて処理を分岐
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const userId = session.client_reference_id;
      const pointsPurchased = parseInt(session.metadata.points) || session.amount_total;

    try {
      // 購入したユーザーの情報を取得
      const purchaser = await prisma.user.findUnique({
        where: { id: userId },
      });

        if (purchaser) {
        // トランザクションを開始して、複数の更新を安全に行う
        await prisma.$transaction(async (tx) => {
          // 1. 購入者にポイントを付与
          await tx.user.update({
            where: { id: userId },
            data: { points: { increment: pointsPurchased } },
          });

          // 2. ★★★ 紹介ボーナスのロジック ★★★
          // もし、この人が初めての購入で、かつ誰かに紹介されていたら...
          if (!purchaser.hasMadeFirstPurchase && purchaser.referredById) {
            // 紹介者に500ポイントを付与
            await tx.user.update({
              where: { id: purchaser.referredById },
              data: { points: { increment: 500 } }, // 500ポイントボーナス
            });
            // 購入者の「初回購入フラグ」をtrueにする (ボーナスの重複付与を防ぐ)
            await tx.user.update({
              where: { id: userId },
              data: { hasMadeFirstPurchase: true },
            });
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


// ★ 2. この行がAPIの定義よりも「前」にあることが非常に重要です
app.use(cors(corsOptions)); 

app.use(express.json());

// サーバーが起動しているか確認するためのテスト用ルート
app.get('/', (req, res) => {
  res.send('FLASTAL APIサーバーへようこそ！');
});

// ★★★ 最初のAPI: ユーザー登録 ★★★
app.post('/api/users/register', async (req, res) => {
  try {
    // 1. リクエストボディから referralCode を受け取るように変更
    const { email, password, handleName, referralCode } = req.body;

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. データベースに保存するデータを準備するオブジェクト
    const userData = {
      email,
      handleName,
      password: hashedPassword,
    };

    // 3. もし紹介コードが入力されていたら、紹介者のIDを探してデータに追加する
    if (referralCode && referralCode.trim() !== '') {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referralCode.trim() },
      });
      // 紹介者が見つかった場合のみ、referredById を設定
      if (referrer) {
        userData.referredById = referrer.id;
        console.log(`New user referred by ${referrer.handleName} (ID: ${referrer.id})`);
      }
    }

    // 4. 準備したデータで新しいユーザーを作成
    const newUser = await prisma.user.create({
      data: userData,
    });

    res.status(201).json({ message: 'ユーザー登録が完了しました。', user: newUser });
  } catch (error) {
    console.error('ユーザー登録エラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました。' });
  }
});

// ★★★ ログインAPI ★★★
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // 1. メールアドレスでユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // ユーザーが見つからない場合
      return res.status(404).json({ message: 'ユーザーが見つかりません。' })
    }

    // 2. パスワードを比較
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      // パスワードが一致しない場合
      return res.status(401).json({ message: 'パスワードが間違っています。' })
    }

    // 3. ログイン成功
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({
      message: 'ログインに成功しました。',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'サーバーエラーが発生しました。' })
  }
})



// ★★★ 特定のユーザーが「作成した」全企画を取得するAPI (修正版) ★★★
app.get('/api/users/:userId/created-projects', async (req, res) => {
  const { userId } = req.params;
  try {
    const projects = await prisma.project.findMany({
      where: { plannerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        offer: true,
        review: true, // この企画に紐づくレビューも取得
      }
    });
    res.status(200).json(projects);
  } catch (error) {
    // ★ エラーをより詳しくログに出力
    console.error('「作成した企画」の取得でエラーが発生しました:', error);
    res.status(500).json({ message: '作成した企画の取得中にエラーが発生しました。' });
  }
});

// ★★★ 特定のユーザーが「支援した」全企画を取得するAPI (修正版) ★★★
app.get('/api/users/:userId/pledged-projects', async (req, res) => {
  const { userId } = req.params;
  try {
    const pledges = await prisma.pledge.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        project: true, // 支援記録に紐づく企画の情報も取得
      }
    });
    res.status(200).json(pledges);
  } catch (error) {
    // ★ エラーをより詳しくログに出力
    console.error('「支援した企画」の取得でエラーが発生しました:', error);
    res.status(500).json({ message: '支援した企画の取得中にエラーが発生しました。' });
  }
});

// ★★★ 特定のチャットルームの情報を取得するAPI (最終完成版) ★★★
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
              // ★★★ ここが修正箇所です ★★★
              // projectに紐づく、全ての関連情報を取得するようにします
              include: {
                planner: true,     // 企画者の情報
                quotation: {       // 見積書の情報
                  include: {
                    items: true,   // 見積もりの内訳
                  }
                }
              }
            },
            florist: true, // お花屋さんの情報
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

// ★★★ 企画作成API (ウィザード全項目対応・日付チェック機能付き) ★★★
app.post('/api/projects', async (req, res) => {
  try {
    // 1. bodyから visibility を受け取る
    const { 
      title, description, targetAmount, 
      deliveryAddress, deliveryDateTime, plannerId, 
      imageUrl, designDetails, size, flowerTypes,
      visibility // ★ 追加
    } = req.body;

    // 2. 日付が有効かどうかをチェック
    const deliveryDate = new Date(deliveryDateTime);
    if (isNaN(deliveryDate.getTime())) {
      // isNaN(date.getTime()) は、日付が無効な場合にtrueになります
      return res.status(400).json({ message: '有効な納品希望日時を入力してください。' });
    }

    const amount = parseInt(targetAmount, 10);
    if (isNaN(amount)) {
        return res.status(400).json({ message: '目標金額は数値で入力してください。' });
    }

    // 2. データベースに保存するデータに visibility を追加
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
        visibility, // ★ 追加
      },
    });
    res.status(201).json(newProject);
  } catch (error) {
    console.error('企画作成エラー:', error);
    res.status(500).json({ message: '企画の作成中にエラーが発生しました。' });
  }
});

// ★★★ 全ての企画を取得するAPI ★★★
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      // 企画者(planner)の情報も一緒に取得するように設定
      where: {
        visibility: 'PUBLIC',// ★ この行を追加
        isVisible: true,
      },
      include: {
        planner: true,
        pledges: { // ★pledgesの中身をさらに詳しく指定する
          orderBy: {
            createdAt: 'desc', // 新しい支援が上にくるように並び替え
          },
          include: {
            user: true, // ★これで支援者の情報も一緒に取得できる
          }
        }
      },
      // 新しい企画が上にくるように並び替え
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

// ★★★ 最新の企画をいくつか取得するAPI (重複を削除し、ここに一本化) ★★★
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

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);
  // --- 企画者 ⇔ 花屋チャット用のルーム参加 (既存) ---
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });
  
  // ★★★【新規】参加者グループチャット用のルーム参加 ★★★
  socket.on('joinProjectRoom', (projectId) => {
    socket.join(projectId);
    console.log(`Socket ${socket.id} joined project room ${projectId}`);
  });
  socket.on('sendMessage', async ({ roomId, content, senderType, userId, floristId }) => {
    try {
      const newMessage = await prisma.chatMessage.create({
        data: { content, senderType, userId, floristId, chatRoomId: roomId }
      });
      io.to(roomId).emit('receiveMessage', newMessage);
    } catch (error) {
      console.error('Message saving error:', error);
    }
  });
  
  // ★★★【新規】参加者グループチャット用のメッセージ送信 ★★★
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

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});

// ★★★ 単一の企画を取得するAPI ★★★
app.get('/api/projects/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const project = await prisma.project.findUnique({
      where: {
        id: id,
      },
      // ▼▼▼ ここを修正 ▼▼▼
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
        // 2つ目のincludeの内容をここに統合する
        activePoll: {      // ★ このブロックを追記
          include: {
            votes: true
          }
        },
         
          
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { // 誰が書いたか企画者が見れるように
              select: { handleName: true }
            }
          }
        },
        groupChatMessages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { handleName: true }
            }
          }
        }
      },
      // ▲▲▲ ここまで修正 ▲▲▲
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

// ★★★ 企画に支援するAPI (支払いロジック削除版) ★★★
app.post('/api/pledges', async (req, res) => {
  const { projectId, userId, amount, comment } = req.body;
  const pledgeAmount = parseInt(amount, 10);

  if (isNaN(pledgeAmount) || pledgeAmount <= 0) {
    return res.status(400).json({ message: '支援額は正の数で入力してください。' });
  }

  try {
    // データベーストランザクションを開始：これら全ての処理が成功するか、全て失敗するかのどちらかになります。
    const result = await prisma.$transaction(async (tx) => {
      // 1. 支援するユーザーと、支援される企画の最新情報を同時に取得します
      const user = await tx.user.findUnique({ where: { id: userId } });
      const project = await tx.project.findUnique({ where: { id: projectId } });

      // 2. 支援が可能かどうかのチェック
      if (!user) throw new Error('ユーザーが見つかりません。');
      if (!project) throw new Error('企画が見つかりません。');
      if (project.status !== 'FUNDRAISING') throw new Error('この企画は現在募集中ではありません。');
      if (user.points < pledgeAmount) throw new Error('ポイントが不足しています。');

      // 3. ユーザーのポイントを減らします
      await tx.user.update({
        where: { id: userId },
        data: { points: { decrement: pledgeAmount } },
      });

      // 4. 誰がいくら、どの企画に支援したかの記録を作成します
      const newPledge = await tx.pledge.create({
        data: { 
          amount: pledgeAmount, 
          projectId, 
          userId, 
          comment 
        },
      });

      // 5. 企画の現在集まっている合計金額を更新します
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: { collectedAmount: { increment: pledgeAmount } },
      });

      // 6. ★★★ ここが修正箇所です ★★★
      // もし、今回の支援で目標金額に到達したら...
      if (updatedProject.collectedAmount >= updatedProject.targetAmount) {
        // 企画を「成功」ステータスに更新する「だけ」にします。
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
    // エラーの内容をフロントエンドに分かりやすく伝えます
    res.status(400).json({ message: error.message || '支援処理中にエラーが発生しました。' });
  }
});

// ★★★ 見積書を作成するAPI ★★★
app.post('/api/quotations', async (req, res) => {
  const { projectId, items, floristId } = req.body; // floristIdは権限チェック用
  
  try {
    // 1. このお花屋さんが、本当にこの企画の担当かを確認
    const offer = await prisma.offer.findFirst({
      where: { projectId, floristId, status: 'ACCEPTED' },
    });
    if (!offer) {
      return res.status(403).json({ message: '権限がありません。' });
    }

    // 2. 見積もり合計金額を計算
    const totalAmount = items.reduce((sum, item) => sum + parseInt(item.amount, 10), 0);

    // 3. 見積書と、その内訳をデータベースに作成
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

// ★★★ 見積書を承認し、支払い処理を行うAPI ★★★
app.patch('/api/quotations/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body; // 主催者本人かどうかのチェック用

  try {
    const result = await prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.findUnique({ where: { id }, include: { project: true } });
      if (!quotation) throw new Error('見積書が見つかりません。');
      if (quotation.project.plannerId !== userId) throw new Error('権限がありません。');
      if (quotation.isApproved) throw new Error('この見積書は既に承認済みです。');
      
      const project = quotation.project;
      const totalAmount = quotation.totalAmount;
      
      // 集まったポイントが支払いに足りるかチェック
      if (project.collectedAmount < totalAmount) {
        throw new Error('集まったポイントが見積もり金額に足りません。');
      }

      // お花屋さんを探す
      const offer = await tx.offer.findUnique({ where: { projectId: project.id } });
      if (!offer || !offer.floristId) throw new Error('担当のお花屋さんが見つかりません。');

      // 手数料(20%)と、お花屋さんの取り分(80%)を計算
      const commissionAmount = totalAmount - Math.floor(totalAmount * 0.80);
      const netPayout = totalAmount - commissionAmount;

      // お花屋さんの売上残高に、取り分を加算
      await tx.florist.update({
        where: { id: offer.floristId },
        data: { balance: { increment: netPayout } },
      });

      // 手数料の記録を作成
      await tx.commission.create({
        data: { amount: commissionAmount, projectId: project.id }
      });
      
      // 見積書を「承認済み」に更新
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


// ★★★ Stripe決済セッション作成API ★★★
app.post('/api/checkout/create-session', async (req, res) => {
  const { userId, amount, points } = req.body;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [ { price_data: { currency: 'jpy', product_data: { name: `${points} ポイント購入` }, unit_amount: amount, }, quantity: 1, }, ],
      mode: 'payment',
      success_url: `${frontendUrl}/payment/success`,
      cancel_url: `${frontendUrl}/points`,
      client_reference_id: userId,
      metadata: { points: points },
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    res.status(500).json({ message: '決済セッションの作成に失敗しました。' });
  }
});

// ★★★ ホームページ用の「主催者の声」を取得するAPI ★★★
app.get('/api/reviews/featured', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        // コメントが空でないレビューのみを対象にする
        comment: {
          not: null,
          not: '',
        },
      },
      take: 3, // 最新の3件を取得
      orderBy: { createdAt: 'desc' },
      include: {
        // レビューを書いたユーザーのハンドルネームと、企画のタイトルも一緒に取得
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

// ★★★ 管理者ログインAPI ★★★
// 簡単にするため、パスワードは.envファイルに直接書きます
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.status(200).json({ message: '管理者として認証されました。' });
  } else {
    res.status(401).json({ message: 'パスワードが違います。' });
  }
});

// ★★★ 手数料一覧を取得するAPI ★★★
app.get('/api/admin/commissions', async (req, res) => {
  try {
    const commissions = await prisma.commission.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        project: true, // どの企画からの手数料か分かるように
      }
    });
    res.status(200).json(commissions);
  } catch (error) {
    res.status(500).json({ message: '手数料の取得中にエラーが発生しました。' });
  }
});

// ★★★ お花屋さん登録API ★★★
app.post('/api/florists/register', async (req, res) => {
  try {
    const { email, password, shopName, contactName } = req.body;

    if (!email || !password || !shopName || !contactName) {
      return res.status(400).json({ message: '必須項目が不足しています。' });
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    const newFlorist = await prisma.florist.create({
      data: {
        email,
        password: hashedPassword,
        shopName,
        contactName,
      },
    });

    // パスワード情報は返さないようにする
    const { password: _, ...floristWithoutPassword } = newFlorist;
    res.status(201).json({ message: 'お花屋さんの登録が完了しました。', florist: floristWithoutPassword });

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'このメールアドレスは既に使用されています。' });
    }
    console.error('お花屋さん登録エラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました。' });
  }
});

// ★★★ 全てのお花屋さんを取得するAPI (デバッグログ付き) ★★★
app.get('/api/florists', async (req, res) => {
  try {
    console.log("\n--- お花屋さんリスト取得APIが呼び出されました ---");
    const florists = await prisma.florist.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reviews: true, // レビューを一緒に取得
      }
    });

    // ★★★ デバッグログ1: データベースから取得した直後のデータを確認 ★★★
    console.log("【1. データベースからの生データ】:", JSON.stringify(florists, null, 2));

    const floristsWithRatings = florists.map(florist => {
      const { password, ...floristData } = florist;
      if (floristData.reviews && floristData.reviews.length > 0) {
        const totalRating = floristData.reviews.reduce((acc, review) => acc + review.rating, 0);
        floristData.averageRating = totalRating / floristData.reviews.length;
        floristData.reviewCount = floristData.reviews.length;
      } else {
        floristData.averageRating = 0;
        floristData.reviewCount = 0;
      }
      delete floristData.reviews;
      return floristData;
    });
    
    // ★★★ デバッグログ2: フロントエンドに返す直前のデータを確認 ★★★
    console.log("【2. フロントエンドへの加工済みデータ】:", JSON.stringify(floristsWithRatings, null, 2));

    res.status(200).json(floristsWithRatings);
  } catch (error) {
    console.error("お花屋さんリスト取得エラー:", error);
    res.status(500).json({ message: 'お花屋さんの取得中にエラーが発生しました。' });
  }
});

// ★★★ 単一のお花屋さんを取得するAPI ★★★
app.get('/api/florists/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const florist = await prisma.florist.findUnique({
      where: { id: id },
      // ★ レビューの情報も一緒に取得する
      include: {
        reviews: {
        orderBy: { createdAt: 'desc' },
        // レビューを書いたユーザーと、どの企画に対するレビューかの情報も取得
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
    // パスワード情報を削除
    const { password, ...floristWithoutPassword } = florist;
    res.status(200).json(floristWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'お花屋さんの取得中にエラーが発生しました。' });
  }
});

// ★★★ 特定ユーザーの企画を取得するAPI ★★★
app.get('/api/users/:userId/projects', async (req, res) => {
  const { userId } = req.params;
  try {
    const projects = await prisma.project.findMany({
      where: { 
        plannerId: userId,
        offer: null, // まだオファーに出していない企画のみ
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: '企画の取得中にエラーが発生しました。' });
  }
});

// ★★★ オファーを作成するAPI ★★★
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
    if (error.code === 'P2002') { // ユニーク制約違反
      return res.status(409).json({ message: 'この企画は既にオファーに出されています。' });
    }
    res.status(500).json({ message: 'オファーの作成中にエラーが発生しました。' });
  }
});

// ★★★ お花屋さんログインAPI ★★★
app.post('/api/florists/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. メールアドレスでお花屋さんを検索
    const florist = await prisma.florist.findUnique({
      where: { email },
    });

    if (!florist) {
      return res.status(404).json({ message: 'お花屋さんが見つかりません。' });
    }

    // 2. パスワードを比較
    const isPasswordValid = await bcrypt.compare(password, florist.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'パスワードが間違っています。' });
    }

    // 3. ログイン成功 (パスワードは返さない)
    const { password: _, ...floristWithoutPassword } = florist;
    res.status(200).json({
      message: 'ログインに成功しました。',
      florist: floristWithoutPassword,
    });

  } catch (error) {
    console.error('お花屋さんログインエラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました。' });
  }
});

// ★★★ お花屋さんダッシュボード用の総合API ★★★
app.get('/api/florists/:floristId/dashboard', async (req, res) => {
  const { floristId } = req.params;
  try {
    // 1. お花屋さんの基本情報（売上残高など）を取得
    const florist = await prisma.florist.findUnique({
      where: { id: floristId },
    });

    if (!florist) {
      return res.status(404).json({ message: 'お花屋さんが見つかりません。' });
    }

    // 2. このお花屋さん宛のオファーを全て取得
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

    // パスワード情報は削除
    const { password, ...floristData } = florist;

    // 3. 必要な情報をまとめてフロントエンドに返す
    res.status(200).json({ florist: floristData, offers });

  } catch (error) {
    console.error('ダッシュボードデータ取得エラー:', error);
    res.status(500).json({ message: 'データの取得中にエラーが発生しました。' });
  }
});

// ★★★ オファーの状態を更新するAPI (承認/辞退) ★★★
app.patch('/api/offers/:offerId', async (req, res) => {
  const { offerId } = req.params;
  const { status } = req.body; // 'ACCEPTED' または 'REJECTED' を受け取る

  // statusの値が正しいかチェック
  if (status !== 'ACCEPTED' && status !== 'REJECTED') {
    return res.status(400).json({ message: '無効なステータスです。' });
  }

  try {
  const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: { status: status },
      // ★ この include を追加して、関連データも一緒に取得する
      include: {
        project: {
          include: {
            planner: true,
          },
        },
        chatRoom: true,
      },
    });

  // もしステータスが「承認済み」になったら、チャットルームを作成
  if (status === 'ACCEPTED') {
    // 既にチャットルームが存在しないか確認
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

// ★★★ 画像アップロードAPI ★★★
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '画像ファイルがありません。' });
    }

    // メモリ上のバッファからCloudinaryにアップロード
    cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
      if (error) {
        throw new Error('Cloudinaryへのアップロードに失敗しました。');
      }
      // アップロード成功後、安全なURLをフロントエンドに返す
      res.status(200).json({ url: result.secure_url });
    }).end(req.file.buffer);

  } catch (error) {
    console.error('画像アップロードエラー:', error);
    res.status(500).json({ message: error.message || 'アップロード中にエラーが発生しました。' });
  }
});

// ★★★ お花屋さんプロフィール更新API ★★★
app.patch('/api/florists/:id', async (req, res) => {
  const { id } = req.params;
  // ★ laruBotApiKey を受け取る
  const { shopName, contactName, address, phoneNumber, website, portfolio, laruBotApiKey } = req.body;

  try {
    const updatedFlorist = await prisma.florist.update({
      where: { id: id },
      data: {
        shopName, contactName, address, phoneNumber, website, portfolio,
        laruBotApiKey, // ★ データを更新
      },
    });

    // パスワードは返さない
    const { password, ...floristWithoutPassword } = updatedFlorist;
    res.status(200).json(floristWithoutPassword);

  } catch (error) {
    console.error('プロフィール更新エラー:', error);
    res.status(500).json({ message: 'プロフィールの更新中にエラーが発生しました。' });
  }
});

// ★★★ ライブハウス登録API ★★★
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

// ★★★ ライブハウスログインAPI ★★★
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

// ★★★ 単一の会場情報を取得するAPI ★★★
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

// ★★★ 会場プロフィール更新API ★★★
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

// ★★★ 全ての会場情報を取得するAPI ★★★
app.get('/api/venues', async (req, res) => {
  try {
    const venues = await prisma.venue.findMany({
      // パスワードは送らないように、必要な情報だけを選択
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

// ★★★ レビューを投稿するAPI ★★★
app.post('/api/reviews', async (req, res) => {
  const { rating, comment, projectId, floristId, userId } = req.body;

  try {
    // 受け取ったデータで、新しいレビューをデータベースに作成します
    const newReview = await prisma.review.create({
      data: {
        rating: parseInt(rating, 10), // 文字列を数値に変換
        comment,
        projectId,
        floristId,
        userId,
      },
    });
    // 成功したら、作成されたレビューの情報を返します
    res.status(201).json(newReview);
  } catch (error) {
    // もし同じ企画に2回目のレビューを投稿しようとしたら、このエラーを返します
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'この企画には既にレビューが投稿されています。' });
    }
    // その他のエラー
    console.error("レビュー投稿APIでエラー:", error);
    res.status(500).json({ message: 'レビューの投稿中にエラーが発生しました。' });
  }
});

// ★★★ 全てのお花屋さんを取得するAPI (評価情報付き) ★★★
app.get('/api/florists', async (req, res) => {
  try {
    const florists = await prisma.florist.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reviews: true, // ★ 各お花屋さんに紐づくレビューを全て取得
      }
    });

    // ★ 取得したレビューを元に、平均評価とレビュー件数を計算する
    const floristsWithRatings = florists.map(florist => {
      const { password, ...floristData } = florist;
      if (floristData.reviews.length > 0) {
        const totalRating = floristData.reviews.reduce((acc, review) => acc + review.rating, 0);
        floristData.averageRating = totalRating / floristData.reviews.length;
        floristData.reviewCount = floristData.reviews.length;
      } else {
        floristData.averageRating = 0;
        floristData.reviewCount = 0;
      }
      delete floristData.reviews; // フロントエンドにレビューの全データは送らない
      return floristData;
    });

    res.status(200).json(floristsWithRatings);
  } catch (error) {
    console.error("お花屋さんリスト取得エラー:", error);
    res.status(500).json({ message: 'お花屋さんの取得中にエラーが発生しました。' });
  }
});

// ★★★ お知らせを投稿するAPI ★★★
app.post('/api/announcements', async (req, res) => {
  const { title, content, projectId, userId } = req.body;

  try {
    // 1. まず、本当にこのユーザーが企画の主催者かを確認する
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ message: '企画が見つかりません。' });
    }
    if (project.plannerId !== userId) {
      return res.status(403).json({ message: '権限がありません。あなたはこの企画の主催者ではありません。' });
    }

    // 2. 確認が取れたら、新しいお知らせをデータベースに作成する
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

// ★★★ 出金申請を作成するAPI (最低額チェック付き) ★★★
app.post('/api/payouts', async (req, res) => {
  const { floristId, amount, accountInfo } = req.body;
  const payoutAmount = parseInt(amount, 10);
  const MINIMUM_PAYOUT_AMOUNT = 1000; // ★ 最低出金額を1,000ポイントに設定

  // ★★★ ここからが新しいチェック機能 ★★★
  if (isNaN(payoutAmount) || payoutAmount < MINIMUM_PAYOUT_AMOUNT) {
    return res.status(400).json({ message: `出金申請は${MINIMUM_PAYOUT_AMOUNT}ポイントから可能です。` });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const florist = await tx.florist.findUnique({ where: { id: floristId } });
      if (!florist) throw new Error('お花屋さんが見つかりません。');
      // ★ 残高チェックもここで行う
      if (florist.balance < payoutAmount) throw new Error('売上残高が不足しています。');

      // 1. お花屋さんの売上残高を減らす
      await tx.florist.update({
        where: { id: floristId },
        data: { balance: { decrement: payoutAmount } },
      });
      // 2. 出金申請の記録を作成する
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

// ★★★ 特定のお花屋さんの出金履歴を取得するAPI ★★★
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

// ★★★ 支出を追加するAPI ★★★
app.post('/api/expenses', async (req, res) => {
  const { itemName, amount, projectId, userId } = req.body;

  try {
    // 1. このユーザーが本当に企画の主催者かを確認
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project || project.plannerId !== userId) {
      return res.status(403).json({ message: '権限がありません。' });
    }

    // 2. 新しい支出をデータベースに作成
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

// ★★★ 支出を削除するAPI ★★★
app.delete('/api/expenses/:expenseId', async (req, res) => {
  const { expenseId } = req.params;
  const { userId } = req.body; // 削除を試みているユーザーのID

  try {
    // 1. 削除したい支出情報を取得し、企画主催者のIDも確認する
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { project: { select: { plannerId: true } } },
    });

    if (!expense) {
      return res.status(404).json({ message: '支出項目が見つかりません。' });
    }
    // 2. このユーザーが本当に企画の主催者かを確認
    if (expense.project.plannerId !== userId) {
      return res.status(403).json({ message: '権限がありません。' });
    }

    // 3. 支出をデータベースから削除
    await prisma.expense.delete({
      where: { id: expenseId },
    });
    res.status(204).send(); // 成功したが、返すコンテンツはない
  } catch (error) {
    console.error("支出削除APIでエラー:", error);
    res.status(500).json({ message: '支出の削除中にエラーが発生しました。' });
  }
});

// ★★★ タスクを追加するAPI ★★★
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

// ★★★ タスクの状態を更新するAPI (完了/未完了の切り替え) ★★★
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

// ★★★ タスクを削除するAPI ★★★
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

// server/index.js (この2つのAPIを追記)

// ★★★ アンケートを作成するAPI ★★★
app.post('/api/polls', async (req, res) => {
  const { question, options, projectId, userId } = req.body;
  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.plannerId !== userId) {
      return res.status(403).json({ message: '権限がありません。' });
    }

    const newPoll = await prisma.poll.create({
      data: {
        question,
        projectId,
        options: {
          create: options.map(optionText => ({ text: optionText })),
        },
      },
    });
    res.status(201).json(newPoll);
  } catch (error) {
    res.status(500).json({ message: 'アンケートの作成中にエラーが発生しました。' });
  }
});

// ★★★ アンケートに投票するAPI ★★★
app.post('/api/polls/vote', async (req, res) => {
  const { pollOptionId, userId } = req.body;
  try {
    const option = await prisma.pollOption.findUnique({ where: { id: pollOptionId } });
    if (!option) {
      return res.status(404).json({ message: '選択肢が見つかりません。' });
    }

    const newVote = await prisma.pollVote.create({
      data: {
        pollId: option.pollId,
        pollOptionId,
        userId,
      },
    });
    res.status(201).json(newVote);
  } catch (error) {
    if (error.code === 'P2002') { // ユニーク制約違反
      return res.status(409).json({ message: 'このアンケートには既に投票済みです。' });
    }
    res.status(500).json({ message: '投票中にエラーが発生しました。' });
  }
});

// ★★★ 寄せ書きメッセージを投稿するAPI ★★★
app.post('/api/messages', async (req, res) => {
  const { content, cardName, projectId, userId } = req.body;

  try {
    // 1. このユーザーが本当にこの企画の支援者かを確認
    const pledge = await prisma.pledge.findFirst({
      where: {
        projectId: projectId,
        userId: userId,
      },
    });

    if (!pledge) {
      return res.status(403).json({ message: 'この企画の支援者のみメッセージを投稿できます。' });
    }

    // 2. 新しいメッセージをデータベースに作成
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
    if (error.code === 'P2002') { // ユニーク制約違反
      return res.status(409).json({ message: 'あなたはこの企画に既にメッセージを投稿済みです。' });
    }
    console.error("メッセージ投稿APIでエラー:", error);
    res.status(500).json({ message: 'メッセージの投稿中にエラーが発生しました。' });
  }
});

// ★★★ 参加者チャットのテンプレート一覧を取得するAPI ★★★
app.get('/api/chat-templates', (req, res) => {
  res.status(200).json(CHAT_TEMPLATES);
});

// ★★★ グループチャット内にアンケートを作成するAPI ★★★
app.post('/api/group-chat/polls', async (req, res) => {
  const { projectId, userId, question, options } = req.body;
  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.plannerId !== userId) {
      return res.status(403).json({ message: 'アンケートを作成できるのは企画者のみです。' });
    }
    // 既存のアンケートがあれば削除して、新しいものに置き換える
    await prisma.activePoll.deleteMany({ where: { projectId } });

    const newPoll = await prisma.activePoll.create({
      data: { projectId, question, options },
      include: { votes: true } // 投票情報も一緒に返す
    });
    res.status(201).json(newPoll);
  } catch (error) {
    console.error("アンケート作成APIエラー:", error);
    res.status(500).json({ message: 'アンケート作成中にエラーが発生しました。' });
  }
});

// ★★★ グループチャット内のアンケートに投票するAPI ★★★
app.post('/api/group-chat/polls/vote', async (req, res) => {
  const { pollId, userId, optionIndex } = req.body;
  try {
    // 投票者が支援者か確認
    const poll = await prisma.activePoll.findUnique({ where: { id: pollId } });
    if (!poll) return res.status(404).json({ message: 'アンケートが見つかりません。' });
    
    const pledge = await prisma.pledge.findFirst({ where: { projectId: poll.projectId, userId } });
    if (!pledge) return res.status(403).json({ message: '投票は企画の支援者のみ可能です。' });

    const vote = await prisma.pollVote.create({
      data: { pollId, userId, optionIndex },
    });
    res.status(201).json(vote);
  } catch (error) {
    if (error.code === 'P2002') { // ユニーク制約違反
      return res.status(409).json({ message: 'このアンケートには既に投票済みです。' });
    }
    console.error("アンケート投票APIエラー:", error);
    res.status(500).json({ message: '投票中にエラーが発生しました。' });
  }
});

// ★★★【管理者用】保留中の出金申請一覧を取得するAPI ★★★
app.get('/api/admin/payouts', async (req, res) => {
  try {
    const pendingPayouts = await prisma.payoutRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        florist: { // どの花屋からの申請か分かるように
          select: { shopName: true }
        }
      },
      orderBy: { createdAt: 'asc' }, // 古い申請から順に表示
    });
    res.status(200).json(pendingPayouts);
  } catch (error) {
    console.error("出金申請の取得エラー:", error);
    res.status(500).json({ message: '出金申請の取得中にエラーが発生しました。' });
  }
});

// ★★★【管理者用】出金申請を「完了」に更新するAPI ★★★
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

// ★★★【管理者用】全プロジェクトリストを取得するAPI ★★★
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

// ★★★【管理者用】特定プロジェクトの全チャットを取得するAPI ★★★
app.get('/api/admin/projects/:projectId/chats', async (req, res) => {
  const { projectId } = req.params;
  try {
    // 参加者グループチャットを取得
    const groupChat = prisma.groupChatMessage.findMany({
      where: { projectId },
      include: { user: { select: { handleName: true } } },
      orderBy: { createdAt: 'asc' }
    });

    // 花屋チャットを取得 (Offer -> ChatRoom を経由)
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

// ★★★【管理者用】参加者チャットのメッセージを削除するAPI ★★★
app.delete('/api/admin/group-chat/:messageId', async (req, res) => {
  const { messageId } = req.params;
  try {
    const message = await prisma.groupChatMessage.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).send();

    await prisma.groupChatMessage.delete({ where: { id: messageId } });

    // 削除したことをリアルタイムでクライアントに通知
    io.to(message.projectId).emit('groupMessageDeleted', { messageId });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'メッセージの削除に失敗しました。' });
  }
});

// ★★★【管理者用】花屋チャットのメッセージを削除するAPI ★★★
app.delete('/api/admin/florist-chat/:messageId', async (req, res) => {
  const { messageId } = req.params;
  try {
    const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).send();

    await prisma.chatMessage.delete({ where: { id: messageId } });

    // 削除したことをリアルタイムでクライアントに通知
    io.to(message.chatRoomId).emit('floristMessageDeleted', { messageId });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'メッセージの削除に失敗しました。' });
  }
});

// ★★★ 企画を通報するためのAPI ★★★
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
    // 本来はここで運営者にSlackやメールで通知を送るとさらに良い
    res.status(201).json({ message: 'ご報告ありがとうございました。運営にて内容を確認いたします。' });
  } catch (error) {
    if (error.code === 'P2002') { // ユニーク制約違反
      return res.status(409).json({ message: 'あなたはこの企画を既に通報済みです。' });
    }
    console.error("企画の通報エラー:", error);
    res.status(500).json({ message: '通報処理中にエラーが発生しました。' });
  }
});

// ★★★【管理者用】未対応の通報一覧を取得するAPI ★★★
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

// ★★★【管理者用】通報を「対応済み」に更新するAPI ★★★
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

// ★★★【管理者用】企画の公開状態を切り替えるAPI ★★★
app.patch('/api/admin/projects/:projectId/visibility', async (req, res) => {
  const { projectId } = req.params;
  const { isVisible } = req.body; // { isVisible: false } のようなリクエストを想定

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

// ★★★ 企画の完了報告を投稿するAPI ★★★
app.patch('/api/projects/:projectId/complete', async (req, res) => {
  const { projectId } = req.params;
  const { userId, completionImageUrls, completionComment } = req.body;

  try {
    // 1. ユーザーが本当に企画の主催者かを確認
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.plannerId !== userId) {
      return res.status(403).json({ message: '権限がありません。' });
    }

    // 2. 企画情報を更新
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

// ★★★ 企画を中止し、ポイントを返金するAPI ★★★
app.patch('/api/projects/:projectId/cancel', async (req, res) => {
  const { projectId } = req.params;
  const { userId } = req.body; // 実行者が本人か確認するため

  try {
    // データベーストランザクションを開始
    const result = await prisma.$transaction(async (tx) => {
      // 1. 企画情報を取得し、実行者が企画者本人か確認
      const project = await tx.project.findUnique({
        where: { id: projectId },
        include: { pledges: true } // この企画へのすべての支援情報を取得
      });

      if (!project) throw new Error('企画が見つかりません。');
      if (project.plannerId !== userId) throw new Error('権限がありません。');
      if (project.status === 'COMPLETED' || project.status === 'CANCELED') {
        throw new Error('この企画は既に完了または中止されているため、中止できません。');
      }

      // 2. この企画のすべての支援者に対して、ポイントを返金
      for (const pledge of project.pledges) {
        await tx.user.update({
          where: { id: pledge.userId },
          data: { points: { increment: pledge.amount } } // ポイントを増やす (返金)
        });
      }
      
      // 3. すべての返金処理が終わったら、企画のステータスを「CANCELED」に更新
      const canceledProject = await tx.project.update({
        where: { id: projectId },
        data: { status: 'CANCELED' },
      });

      // ここで参加者にお知らせを送るなどの処理も追加できる

      return canceledProject;
    });

    res.status(200).json({ message: '企画を中止し、すべての支援者にポイントが返金されました。', project: result });

  } catch (error) {
    console.error("企画の中止処理エラー:", error);
    res.status(400).json({ message: error.message || '企画の中止処理中にエラーが発生しました。' });
  }
});


// ===================================
// ★★★★★   Socket.IOの処理   ★★★★★
// ===================================
io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  // クライアントがチャットルームに参加するためのイベント
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  

  // クライアントからメッセージが送信されたときのイベント
  socket.on('sendMessage', async ({ roomId, content, senderType, userId, floristId }) => {
    try {
      // ★★★ ここからがNGワードフィルターのロジック ★★★
      // ユーザーまたはお花屋さんからのメッセージのみをチェック (AI応答は除外)
      if (senderType === 'USER' || senderType === 'FLORIST') {
        const containsNGWord = NG_WORDS.some(word => content.toLowerCase().includes(word.toLowerCase()));
        
        if (containsNGWord) {
          // NGワードが含まれていた場合
          console.log(`NG Word detected from ${senderType} ${userId || floristId}. Blocking message.`);
          // 送信者本人にだけエラーイベントを送信
          socket.emit('messageError', '送信できない単語が含まれています。内容を修正してください。');
          return; // ここで処理を中断し、メッセージを保存・送信しない
        }
      }
      // ★★★ NGワードフィルターここまで ★★★

      // フィルターを通過した場合、メッセージをDBに保存
      const newMessage = await prisma.chatMessage.create({
        data: { content, senderType, userId, floristId, chatRoomId: roomId }
      });

      // ルームの全員にメッセージを送信
      io.to(roomId).emit('receiveMessage', newMessage);

      // (AI自動応答のロジックは変更なし)
      if (senderType === 'USER') {
        const roomInfo = await prisma.chatRoom.findUnique({
          where: { id: roomId },
          include: { offer: { include: { florist: true } } }
        });
        const targetFlorist = roomInfo?.offer?.florist;
        if (targetFlorist && targetFlorist.laruBotApiKey) {
          console.log(`LARUbot APIキーが見つかりました。AIに応答を問い合わせます...`);
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
      // エラーが発生した場合も、送信者に通知することができる
      socket.emit('messageError', 'メッセージの送信中にエラーが発生しました。');
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