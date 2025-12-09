import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import { Document, NodeIO } from '@gltf-transform/core';
import cors from 'cors';
import Stripe from 'stripe';
import multer from 'multer';
import cloudinary from './config/cloudinary.js';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import OpenAI from 'openai';
import webpush from 'web-push';

// ★ VAPIDキーの設定 (ステップ1で生成したキーを .env から読み込む想定)
// ※ 開発中は直接文字列を貼っても動きますが、本番では必ず環境変数にしてください
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, 
  privateKey: process.env.VAPID_PRIVATE_KEY
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    'mailto:info@flastal.com', // 管理者のメアド（ダミーでOK）
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

// --- 定数定義 ---
const CHAT_TEMPLATES = [
  { id: 'propose_1', category: '提案・質問', text: 'リボンのメッセージは「...」でどうでしょう？', hasCustomInput: true, placeholder: '例：祝！ご出演' },
  { id: 'propose_2', category: '提案・質問', text: '「...」を追加しませんか？', hasCustomInput: true, placeholder: '例：お花の色紙' },
  { id: 'propose_3', category: '提案・質問', text: 'これについて、皆さんの意見を聞きたいです。' },
  { id: 'propose_4', category: '提案・質問', text: '企画者さん、何か手伝えることはありますか？' },
  { id: 'agree_1',   category: '同意・反応', text: '良いアイデアですね！賛成です。' },
  { id: 'agree_2',   category: '同意・反応', text: 'なるほど、了解です。' },
  { id: 'agree_3',   category: '同意・反応', text: 'ありがとうございます！' },
  { id: 'stamp_1',   category: 'スタンプ',   text: '👍' },
  { id: 'stamp_2',   category: 'スタンプ',   text: '🎉' },
  { id: 'stamp_3',   category: 'スタンプ',   text: '👏' },
  { id: 'stamp_4',   category: 'スタンプ',   text: '🙏' },
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
  process.env.FRONTEND_URL, // 環境変数が空だとここが undefined になるので注意
  'https://www.flastal.com',
  'https://flastal.com',
  'https://flastal-frontend.onrender.com' // ★念のためこれも追加しておくと安全です
].filter(Boolean);

const corsOptions = {
  // 配列を直接渡すことで、corsライブラリが自動的に判定してくれます
  origin: allowedOrigins, 
  credentials: true, // クッキーや認証ヘッダーを通すために必要
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"], // OPTIONSも明示
};

const io = new Server(httpServer, {
  cors: corsOptions,
  allowEIO3: true,        // ★追加
  transports: ['polling'] // ★追加
});

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

// ★★★ JWT認証ミドルウェア (デバッグ強化版) ★★★
const authenticateToken = (req, res, next, requiredRole = null) => {
  const authHeader = req.headers['authorization'];
  
  // ★ "Bearer " の後ろを取り出す処理を厳密にする
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log(`[AuthDebug] No token provided. Header: ${authHeader}`);
    return res.status(401).json({ message: '認証トークンが必要です。' });
  }

  // ★ トークンが "null" や "undefined" という文字列になっていないかチェック
  if (token === 'null' || token === 'undefined') {
    console.log(`[AuthDebug] Invalid token string: ${token}`);
    return res.status(401).json({ message: '無効なトークンです。再ログインしてください。' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log(`[AuthDebug] Verification failed: ${err.message}. Token: ${token.substring(0, 10)}...`);
      return res.status(403).json({ message: 'トークンが無効または期限切れです。' });
    }

    req.user = user;

    if (requiredRole && user.role !== requiredRole) {
      return res.status(403).json({ message: 'この操作を実行する権限がありません。' });
    }

    next();
  });
};

// ★★★ 管理者権限チェック用ミドルウェア ★★★
const requireAdmin = (req, res, next) => {
  authenticateToken(req, res, next, 'ADMIN');
};

// ★ 企画者かどうかを確認するヘルパーミドルウェア (企画作成者/Planner専用APIで使用)
const isPlanner = (req, res, next) => {
  // req.project が既に設定されていることを前提とする
  if (!req.project) {
    return res.status(404).json({ message: '企画が見つかりません。' });
  }
  if (req.user.id !== req.project.plannerId) {
    return res.status(403).json({ message: '権限がありません。あなたは企画者ではありません。' });
  }
  next();
};

// ★★★ メール送信ヘルパー関数 ★★★
async function sendEmail(to, subject, htmlContent) {
  if (!to) return;
  try {
    const { data, error } = await resend.emails.send({
      // ★ 本番環境では認証済みドメイン（例: noreply@flastal.com）に変更してください
      from: 'FLASTAL <onboarding@resend.dev>', 
      to: [to],
      subject: subject,
      html: htmlContent,
    });
    if (error) {
      console.error('Email send error:', error);
    } else {
      console.log(`Email sent to ${to}: ${subject}`);
    }
  } catch (err) {
    console.error('Email send exception:', err);
  }
}

const LEVEL_CONFIG = {
    'Bronze': 10000, // 10,000ptでブロンズ
    'Silver': 50000, // 50,000ptでシルバー
    'Gold': 100000,  // 100,000ptでゴールド
};

async function checkUserLevelAndBadges(tx, userId) {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) return;

    // 1. レベルアップチェック
    let newLevel = user.supportLevel;
    let levelChanged = false;

    // 現在のレベルより上のレベルをチェック
    for (const [levelName, threshold] of Object.entries(LEVEL_CONFIG)) {
        if (user.totalPledgedAmount >= threshold && 
            (user.supportLevel === null || LEVEL_CONFIG[user.supportLevel] < threshold)
        ) {
            newLevel = levelName;
            levelChanged = true;
        }
    }

    if (levelChanged) {
        await tx.user.update({
            where: { id: userId },
            data: { supportLevel: newLevel },
        });
        // 💡 ユーザーに通知 (例: 'SILVER' にランクアップしました)
        // await createNotification(userId, 'LEVEL_UP', `おめでとうございます！あなたは${newLevel}ランクに昇格しました！`);
    }

    // 2. バッジチェック (ここでは省略しますが、同様に Badge テーブルをチェックします)
    // 企画支援回数、メッセージ投稿回数などをトリガーにする
}

// ★★★ 通知作成ヘルパー関数 ★★★
async function createNotification(recipientId, type, message, projectId = null, linkUrl = null) {
  if (!recipientId) return; // 受信者がいない場合はスキップ

  try {
    const newNotification = await prisma.notification.create({
      data: {
        recipientId,
        type,
        message,
        projectId,
        linkUrl,
        // isReadはデフォルトでfalse
      },
    });
    // ★ Socket.IOでリアルタイム通知をブロードキャスト (実装は後ほど)
    // io.to(recipientId).emit('newNotification', newNotification);
    return newNotification;
  } catch (error) {
    console.error(`Failed to create notification for user ${recipientId}:`, error);
  }
}

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

// ★★★ ユーザー登録API (メール重複チェック機能・ウェルカムメール付き) ★★★
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

    // ★★★ 【追加】ウェルカムメール送信 ★★★
    const emailContent = `
      <div style="font-family: sans-serif; color: #333;">
        <h2>FLASTALへようこそ！</h2>
        <p>${handleName} 様</p>
        <p>会員登録ありがとうございます。これからFLASTALで素敵な推し活ライフをお楽しみください！</p>
        <p><a href="${process.env.FRONTEND_URL}/login">ログインはこちら</a></p>
      </div>
    `;
    // エラーが出ても登録自体は成功させるため、awaitのエラーハンドリングは内部で行うか、ここでのエラーは無視して進める
    await sendEmail(email, '【FLASTAL】会員登録完了のお知らせ', emailContent);

    res.status(201).json({ message: 'ユーザー登録が完了しました。', user: userWithoutPassword });

  } catch (error) { // ★ ここでエラーが出ていました。直前の } が必要です
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
    
    // ★ トークンに iconUrl を含める
    const tokenPayload = {
      id: user.id,
      email: user.email,
      handleName: user.handleName,
      role: user.role, 
      iconUrl: user.iconUrl, // ★ この行を追加
      referralCode: user.referralCode,
      sub: user.id
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'ログインに成功しました。',
      token: token 
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
        // ★★★ ここを変更：offerの中にある chatRoom と florist を取得する
        offer: {
          include: {
            chatRoom: true, // ★ これが必要です
            florist: true
          }
        },
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

// ★★★ 企画作成API (JWT対応・メール通知付き) ★★★
app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const { 
      title, description, targetAmount, 
      deliveryAddress, deliveryDateTime, 
      imageUrl, 
      // ★★★ 追加: 複数画像を受け取る
      designImageUrls,
      designDetails, size, flowerTypes,
      visibility, 
      venueId,
      eventId,
      projectType, 
      password
    } = req.body;

    const plannerId = req.user.id;

    const deliveryDate = new Date(deliveryDateTime);
    if (isNaN(deliveryDate.getTime())) {
      return res.status(400).json({ message: '有効な納品希望日時を入力してください。' });
    }
    const amount = parseInt(targetAmount, 10);
    if (isNaN(amount)) {
        return res.status(400).json({ message: '目標金額は数値で入力してください。' });
    }
    
    let finalDeliveryAddress = deliveryAddress;

    // venueId があれば、その会場の住所を使用する
    if (venueId) {
        const venue = await prisma.venue.findUnique({ where: { id: venueId } });
        if (!venue) {
            return res.status(400).json({ message: '無効な会場IDが指定されました。' });
        }
        // 会場が指定された場合、納品先住所を会場の公式住所で上書き
        finalDeliveryAddress = venue.address || deliveryAddress; 
    }

    const newProject = await prisma.project.create({
      data: {
        title,
        description,
        targetAmount: amount,
        deliveryAddress: finalDeliveryAddress,
        deliveryDateTime: deliveryDate,
        plannerId,
        imageUrl,
        // ★★★ 追加: データベースに保存 (配列がない場合は空配列)
        designImageUrls: designImageUrls || [],
        
        designDetails,
        size,
        flowerTypes,
        projectType: projectType || 'PUBLIC',
        password: password || null,
        visibility: visibility || 'PUBLIC',
        venueId: venueId || null,
        eventId: eventId || null,
      },
    });
    
    // ★★★ 【追加】申請受付メール送信 ★★★
    const emailContent = `
      <p>${req.user.handleName} 様</p>
      <p>企画「${title}」の申請を受け付けました。</p>
      <p>運営事務局にて内容を確認いたします。審査結果が出るまで今しばらくお待ちください。</p>
    `;
    await sendEmail(req.user.email, '【FLASTAL】企画申請を受け付けました', emailContent);

    res.status(201).json({ project: newProject, message: '企画の作成申請が完了しました。運営による審査をお待ちください。' });

  } catch (error) { // ★ ここでエラーが出ていました。直前の } が必要です
    console.error('企画作成エラー:', error);
    res.status(500).json({ message: '企画の作成中にエラーが発生しました。' });
  }
});

// ★★★ 全ての企画を取得するAPI (検索機能・セキュリティ修正付き) ★★★
app.get('/api/projects', async (req, res) => {
  try {
    const { keyword, prefecture } = req.query; 

    const whereClause = {
      status: 'FUNDRAISING', 
      NOT: { status: 'CANCELED' },
      // ★★★ 追加: 公開設定が PUBLIC のものだけを表示
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
          select: {
            handleName: true,
            iconUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(projects);
  } catch (error) {
    console.error('企画一覧取得エラー:', error);
    res.status(500).json({ message: '企画の取得中にエラーが発生しました。' });
  }
});

// こちらも 'FUNDRAISING' (募集中) の企画のみを取得
app.get('/api/projects/featured', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { 
        status: 'FUNDRAISING', // ★ '募集中' の企画のみ
        visibility: 'PUBLIC',
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


// ==========================================
// ★★★【新規】2DパネルAR生成API (Node.js版) ★★★
// ==========================================
app.post('/api/ar/create-panel', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '画像ファイルがありません。' });
    }

    // 1. 画像情報を取得 (縦横比計算のため)
    const image = sharp(req.file.buffer);
    const metadata = await image.metadata();
    
    // 基準サイズ設定: 高さを1.8m (180cm) に固定し、幅を比率で計算
    const targetHeight = 1.8; 
    const aspectRatio = metadata.width / metadata.height;
    const targetWidth = targetHeight * aspectRatio;

    // 2. GLTF(GLB) ドキュメントを作成
    const doc = new Document();
    const buffer = doc.createBuffer();

    // 3. 画像をテクスチャとして設定
    // (PNG/JPEGのバッファをそのまま埋め込みます)
    const texture = doc.createTexture('base')
      .setMimeType(req.file.mimetype)
      .setImage(req.file.buffer);

    // 4. マテリアル(質感)を作成
    const material = doc.createMaterial('panelMat')
      .setBaseColorTexture(texture)
      .setAlphaMode('BLEND') // 透過画像(PNG)なら背景が透けるように設定
      .setDoubleSided(true)  // 裏側からも見えるようにする
      .setMetallicFactor(0)  // 金属光沢なし
      .setRoughnessFactor(1); // マットな質感

    // 5. 板ポリゴン(メッシュ)の頂点データを作成
    // 中心を原点(0,0,0)とし、Y軸を高さとする板を作ります
    const halfW = targetWidth / 2;
    // Y=0を底辺にする (床に置くため)
    const yBottom = 0;
    const yTop = targetHeight;

    // 頂点座標 (左下, 右下, 左上, 右上)
    const vertices = new Float32Array([
      -halfW, yBottom, 0,  // 左下
       halfW, yBottom, 0,  // 右下
      -halfW, yTop,    0,  // 左上
       halfW, yTop,    0,  // 右上
    ]);

    // UV座標 (テクスチャの貼り付け位置)
    // GLTFのUV原点は左上
    const uvs = new Float32Array([
      0, 1, // 左下
      1, 1, // 右下
      0, 0, // 左上
      1, 0  // 右上
    ]);

    // インデックス (三角形をつなぐ順序: 0-1-2, 2-1-3)
    const indices = new Uint16Array([
      0, 1, 2,
      2, 1, 3
    ]);

    // 6. メッシュとプリミティブの構築
    const positionAccessor = doc.createAccessor()
      .setArray(vertices)
      .setType('VEC3')
      .setBuffer(buffer);
      
    const uvAccessor = doc.createAccessor()
      .setArray(uvs)
      .setType('VEC2')
      .setBuffer(buffer);

    const indexAccessor = doc.createAccessor()
      .setArray(indices)
      .setType('SCALAR')
      .setBuffer(buffer);

    const primitive = doc.createPrimitive()
      .setMaterial(material)
      .setIndices(indexAccessor)
      .setAttribute('POSITION', positionAccessor)
      .setAttribute('TEXCOORD_0', uvAccessor);

    const mesh = doc.createMesh('panelMesh')
      .addPrimitive(primitive);

    const node = doc.createNode('panelNode')
      .setMesh(mesh);

    const scene = doc.createScene('scene')
      .addChild(node);

    // 7. バイナリ(GLB)として書き出し
    const io = new NodeIO(doc);
    const glbBuffer = await io.writeBinary(doc);

    // 8. クライアントにファイルを返す
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Content-Disposition', 'attachment; filename="flower-stand-panel.glb"');
    res.send(Buffer.from(glbBuffer));

  } catch (error) {
    console.error("ARパネル生成エラー:", error);
    res.status(500).json({ message: 'ARデータの生成に失敗しました。' });
  }
});


// ★★★ 単一の企画を取得するAPI (最終修正版 v3: 支援コースとタスク担当者対応) ★★★
app.get('/api/projects/:id', async (req, res) => {
  const { id } = req.params; 

  try {
    const project = await prisma.project.findUnique({
      where: {
        id: id,
      },
      include: {
        // ★ パスワードなど機密情報を除外するため select を使用
        planner: {
          select: {
            id: true,
            handleName: true,
            iconUrl: true
          }
        },
        venue: { 
          select: { 
            id: true, 
            venueName: true, 
            address: true, 
            // regulations: true, // ← 古いフィールド（もし不要なら削除でもOK）
            
            // ★ 新しいフィールドを追加
            isStandAllowed: true,
            standRegulation: true,
            isBowlAllowed: true,
            bowlRegulation: true,
            retrievalRequired: true,
            accessInfo: true
          } 
        },
        // ↓↓↓ 【新規追加】支援コースを取得
        pledgeTiers: {
          orderBy: { amount: 'asc' }
        },
        // ↑↑↑ 新規追加 ↑↑↑
        pledges: {
          orderBy: { createdAt: 'desc' },
          // 支援者の情報を限定して取得
          include: { 
            user: { 
              select: { 
                id: true, 
                handleName: true, 
                iconUrl: true // ★ アイコンURLも取得
              } 
            }
             
          } 
        },
        announcements: {
          orderBy: { createdAt: 'desc' }
        },
        expenses: {
          orderBy: { createdAt: 'asc' }
        },
        tasks: {
          orderBy: { createdAt: 'asc' },
          // ↓↓↓ 【新規追加】タスク担当者を取得
          include: {
            assignedUser: {
              select: {
                id: true,
                handleName: true
              }
            }
          }
          // ↑↑↑ 新規追加 ↑↑↑
        },
        activePoll: { 
          include: {
            votes: { 
              select: { 
                userId: true,
                optionIndex: true 
              }
            } 
          }
        },
        messages: { 
           orderBy: { createdAt: 'asc' },
           include: { user: { select: { id: true, handleName: true } } }
        },
        offer: { 
            include: { 
               florist: { select: { id: true, platformName: true } },
               chatRoom: true // ★★★ ここを追加！これがないとチャットIDが取れません ★★★
             }
        },
        quotation: { 
            include: { items: true }
        },
        review: { 
          // レビュー投稿者の情報を限定して取得
          include: { 
            user: { 
              select: { 
                id: true, 
                handleName: true, 
                iconUrl: true 
              } 
            },
            likes: true // いいね情報も取得
          }
        },
        groupChatMessages: { 
            orderBy: { createdAt: 'asc' },
            include: { user: { select: { id: true, handleName: true } } }
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

  // ★★★【新規】管理者向けAPI(1): 審査待ちの企画一覧を取得 ★★★
app.get('/api/admin/projects/pending', requireAdmin, async (req, res) => {
  // ここに管理者認証のロジックを追加するのが望ましい
  try {
    const pendingProjects = await prisma.project.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: { planner: { select: { handleName: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.status(200).json(pendingProjects);
  } catch (error) {
    console.error("審査待ち企画の取得エラー:", error);
    res.status(500).json({ message: '審査待ち企画の取得中にエラーが発生しました。' });
  }
});

// ★★★【新規】ファンのプロフィール更新API ★★★
app.patch('/api/users/profile', authenticateToken, async (req, res) => { // ★ authenticateToken を追加
  // const { userId, handleName, iconUrl } = req.body; // ❌ userId は削除
  const { handleName, iconUrl } = req.body;
  const userId = req.user.id; // ✅ トークンから userId を取得

  if (!userId) {
    return res.status(400).json({ message: 'ユーザーIDが必要です。' }); // (ここは保険として残す)
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        handleName: handleName,
        iconUrl: iconUrl,
      },
    });

    // パスワードなど機密情報を除外
    const { password, ...userWithoutPassword } = updatedUser;

    // ★ 更新されたユーザー情報で新しいトークンを発行する
    const tokenPayload = {
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      handleName: userWithoutPassword.handleName,
      role: userWithoutPassword.role, 
      iconUrl: userWithoutPassword.iconUrl, // ★ 更新された iconUrl
      referralCode: userWithoutPassword.referralCode,
      sub: userWithoutPassword.id
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // ★ 新しいトークンを返す
    res.status(200).json({ 
      message: 'プロフィールを更新しました。',
      token: token // 新しいトークンを渡す
    });

  } catch (error) {
    console.error("ユーザープロフィール更新エラー:", error);
    res.status(500).json({ message: 'プロフィールの更新に失敗しました。' });
  }
});

// ★★★【新規】通知一覧を取得するAPI ★★★
app.get('/api/notifications', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20, // 最新20件のみ取得
      include: {
        project: { select: { title: true } } // 企画名を表示用として取得
      }
    });
    res.status(200).json(notifications);
  } catch (error) {
    console.error("通知一覧取得エラー:", error);
    res.status(500).json({ message: '通知の取得中にエラーが発生しました。' });
  }
});

// ★★★【新規】通知を既読にするAPI ★★★
app.patch('/api/notifications/:notificationId/read', authenticateToken, async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.id;
  try {
    const updatedNotification = await prisma.notification.updateMany({
      where: { 
        id: notificationId,
        recipientId: userId, // 自分の通知のみ更新可能
        isRead: false
      },
      data: { isRead: true }
    });
    
    // 更新されたレコード数が 1 であれば成功
    if (updatedNotification.count === 1) {
      res.status(200).json({ message: '通知を既読にしました。' });
    } else {
      // 既読フラグが立っているか、通知が存在しない
      res.status(200).json({ message: '通知は既に既読です。' }); 
    }
  } catch (error) {
    console.error("通知既読更新エラー:", error);
    res.status(500).json({ message: '既読状態の更新中にエラーが発生しました。' });
  }
});

app.patch('/api/admin/projects/:projectId/status', requireAdmin, async (req, res) => {
  const { projectId } = req.params;
  const { status } = req.body;

  if (status !== 'FUNDRAISING' && status !== 'REJECTED') {
    return res.status(400).json({ message: '無効なステータスです。' });
  }
  
  try {
    // 企画者情報を一緒に取得する
    const project = await prisma.project.findUnique({ 
      where: { id: projectId },
      include: { planner: true } 
    });

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { status: status },
    });

    // ★★★ 【追加】審査結果メール送信 ★★★
    if (status === 'FUNDRAISING') {
      // 承認時
      await createNotification(
        project.plannerId,
        'PROJECT_APPROVED',
        '企画が承認され、公開されました！',
        projectId,
        `/projects/${projectId}`
      );
      
      const emailContent = `
        <p>${project.planner.handleName} 様</p>
        <p>おめでとうございます！企画「${project.title}」が承認され、公開されました。</p>
        <p>以下のURLをシェアして、支援を募りましょう！</p>
        <p><a href="${process.env.FRONTEND_URL}/projects/${projectId}">${process.env.FRONTEND_URL}/projects/${projectId}</a></p>
      `;
      await sendEmail(project.planner.email, '【FLASTAL】企画が公開されました！', emailContent);

    } else if (status === 'REJECTED') {
      // 却下時
      await createNotification(
        project.plannerId,
        'PROJECT_REJECTED',
        '企画が承認されませんでした。詳細をご確認ください。',
        projectId,
        `/mypage`
      );

      const emailContent = `
        <p>${project.planner.handleName} 様</p>
        <p>残念ながら、企画「${project.title}」は承認されませんでした。</p>
        <p>企画内容を見直し、再度申請をご検討ください。</p>
      `;
      await sendEmail(project.planner.email, '【FLASTAL】企画審査結果のお知らせ', emailContent);
    }

    res.status(200).json(updatedProject);
  } catch (error) {
    console.error("企画ステータスの更新エラー:", error);
    res.status(500).json({ message: 'ステータスの更新に失敗しました。' });
  }
});

// ★★★ 支援API (通知機能とJWT認証を組み込み) ★★★
app.post('/api/pledges', authenticateToken, async (req, res) => {
  // 以前はリクエストボディから取得していた userId を、JWTトークンから取得
  const userId = req.user.id; 
  // リクエストボディから取得するデータ
  const { projectId, amount, comment, tierId } = req.body; 

  let pledgeAmount = parseInt(amount, 10);

  // 1. 支援コースIDが指定されていれば、その金額を使用
  if (tierId) {
    const tier = await prisma.pledgeTier.findUnique({ where: { id: tierId } });
    if (!tier) return res.status(404).json({ message: '支援コースが見つかりません。' });
    pledgeAmount = tier.amount;
  }
  
  if (isNaN(pledgeAmount) || pledgeAmount <= 0) {
    return res.status(400).json({ message: '支援額は正の数で入力してください。' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 事前チェック
      const user = await tx.user.findUnique({ where: { id: userId } });
      const project = await tx.project.findUnique({ where: { id: projectId } });
      if (!user) throw new Error('ユーザーが見つかりません。');
      if (!project) throw new Error('企画が見つかりません。');
      if (project.status !== 'FUNDRAISING') throw new Error('この企画は現在募集中ではありません。');
      if (user.points < pledgeAmount) throw new Error('ポイントが不足しています。');
      
      // ユーザーポイント減算
      await tx.user.update({
          where: { id: userId },
          data: { 
              points: { decrement: pledgeAmount },
              // ★★★ 【追加】総支援額の更新 ★★★
              totalPledgedAmount: { increment: pledgeAmount } 
          },
      });
      
      // 支援作成
      const newPledge = await tx.pledge.create({
        data: { 
          amount: pledgeAmount, 
          projectId, 
          userId, 
          comment,
          pledgeTierId: tierId || null,
        },
      });
      
      // 企画ポイント加算
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: { collectedAmount: { increment: pledgeAmount } },
      });

      // ★★★ 【追加】1. 支援者へのお礼メール（決済控え） ★★★
      const supporterEmailContent = `
        <p>${user.handleName} 様</p>
        <p>企画「${project.title}」への支援ありがとうございます。</p>
        <p><strong>支援額: ${pledgeAmount.toLocaleString()} pt</strong></p>
        <p>企画の成功を楽しみにお待ちください！</p>
      `;
      // トランザクション内なのでawaitしない方がパフォーマンスが良いが、簡略化のためここで呼ぶ
      // (本来はイベントキューに入れるのがベスト)
      sendEmail(user.email, '【FLASTAL】支援受付完了のお知らせ', supporterEmailContent);
      
      // ↓↓↓ 【通知追加】企画者に新しい支援があったことを通知 ↓↓↓
      await createNotification(
        updatedProject.plannerId,
        'NEW_PLEDGE',
        `${req.user.handleName}さんから${pledgeAmount.toLocaleString()}ptの支援がありました！`,
        projectId,
        `/projects/${projectId}` 
      );
      // ↑↑↑ 通知追加 ↑↑↑


      // 目標達成チェック
      if (updatedProject.collectedAmount >= updatedProject.targetAmount && project.status !== 'SUCCESSFUL') {
        // ステータスをSUCCESSFULに更新
        await tx.project.update({
          where: { id: projectId },
          data: { status: 'SUCCESSFUL' },
        });

        // A. 企画者へのお祝いメール
        const successEmailPlanner = `
          <p>${project.planner.handleName} 様</p>
          <p>おめでとうございます！企画「${project.title}」が目標金額を達成しました！</p>
          <p>現在のご支援総額: ${updatedProject.collectedAmount.toLocaleString()} pt</p>
        `;
        sendEmail(project.planner.email, '【FLASTAL】目標金額達成のお祝い', successEmailPlanner);
        
        // B. 支援者全員への通知（※人数が多い場合はバックグラウンド処理にすべき箇所）
        // ここでは簡易的に全支援者を取得してループ送信する例
        const allPledges = await tx.pledge.findMany({ 
            where: { projectId }, 
            include: { user: true },
            distinct: ['userId'] // 重複ユーザーを除外
        });
        
        for (const p of allPledges) {
            sendEmail(p.user.email, `【FLASTAL】支援した企画が目標を達成しました！`, 
                `<p>あなたが支援した「${project.title}」が目標金額を達成しました！開催決定です！</p>`);
        }
      }

      await checkUserLevelAndBadges(tx, userId);
      return { newPledge };
    });
    res.status(201).json(result);
  } catch (error) {
    console.error('支援処理エラー:', error);
    res.status(400).json({ message: error.message || '支援処理中にエラーが発生しました。' });
  }
});

// ★★★【新規】ユーザーによる会場簡易登録API ★★★
app.post('/api/venues/add', authenticateToken, async (req, res) => {
  try {
    const { venueName, address, regulations } = req.body;

    // バリデーション
    if (!venueName) {
      return res.status(400).json({ message: '会場名は必須です。' });
    }

    // 重複チェック (同じ名前の会場がないか簡易チェック)
    const existingVenue = await prisma.venue.findFirst({
      where: { venueName: venueName }
    });
    if (existingVenue) {
      return res.status(409).json({ message: 'その会場名は既に登録されています。リストから選択してください。' });
    }

    // ダミーデータの生成 (ユーザー登録の場合は管理用メアドなどがないため)
    // ※本来は「申請中」ステータスにするのが理想ですが、今回は即時登録します
    const randomId = Math.random().toString(36).slice(-8);
    
    const newVenue = await prisma.venue.create({
      data: {
        venueName,
        address,
        // 簡易登録ではレギュレーションをテキストフィールドにまとめて保存
        // (管理者が後で詳細な isStandAllowed などを整備する運用想定)
        accessInfo: regulations, 
        
        // 必須フィールドのダミー埋め
        email: `temp_${randomId}@flastal.user-submitted`,
        password: await bcrypt.hash('temp_password', 10),
        
        // デフォルトは「確認中」の意味を込めて全てTrue（またはFalse）にしておく
        isStandAllowed: true, 
        isBowlAllowed: true,
        retrievalRequired: true
      }
    });

    res.status(201).json(newVenue);
  } catch (error) {
    console.error("会場簡易登録エラー:", error);
    res.status(500).json({ message: '会場の登録中にエラーが発生しました。' });
  }
});

// ★★★ 見積書作成API (JWT対応: 担当のお花屋さんのみ) ★★★
app.post('/api/quotations', authenticateToken, async (req, res) => { // ★ authenticateToken 追加
  // const { projectId, items, floristId } = req.body; // ❌ floristId 削除
  const { projectId, items } = req.body;
  const floristId = req.user.id; // ✅ トークンから取得

  if (req.user.role !== 'FLORIST') {
      return res.status(403).json({ message: '権限がありません。' });
  }

  try {
    // 自分が担当している、かつ承諾済みのオファーがあるか確認
    const offer = await prisma.offer.findFirst({
      where: { projectId, floristId, status: 'ACCEPTED' },
    });
    
    if (!offer) {
      return res.status(403).json({ message: 'この企画の見積もりを作成する権限がありません。' });
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
    
    // ↓↓↓ 【通知追加】企画者に見積もり提出を通知 ↓↓↓
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    await createNotification(
        project.plannerId,
        'QUOTATION_RECEIVED',
        `お花屋さんから見積もりが届きました。内容を確認して承認してください。`,
        projectId,
        `/projects/${projectId}/quotation` 
    );

    res.status(201).json(newQuotation);
  } catch (error) {
    console.error("見積書作成APIエラー:", error);
    res.status(500).json({ message: '見積書の作成中にエラーが発生しました。' });
  }
});

app.patch('/api/quotations/:id/approve', authenticateToken, async (req, res) => { // ★ authenticateToken を追加
  const { id } = req.params;
  const userId = req.user.id; // トークンから userId を取得

  try {
    const result = await prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.findUnique({ where: { id }, include: { project: { select: { plannerId: true } } } });
      if (!quotation) throw new Error('見積書が見つかりません。');
      if (quotation.project.plannerId !== userId) throw new Error('権限がありません。');
      if (quotation.isApproved) throw new Error('この見積書は既に承認済みです。');
      
      // プロジェクト情報を再取得して必要な情報（collectedAmountなど）を取得
      const project = await tx.project.findUnique({ where: { id: quotation.projectId } });
      const totalAmount = quotation.totalAmount;
      if (project.collectedAmount < totalAmount) {
        throw new Error('集まったポイントが見積もり金額に足りません。');
      }
      const offer = await tx.offer.findUnique({ where: { projectId: project.id } });
      if (!offer || !offer.floristId) throw new Error('担当のお花屋さんが見つかりません。');
      
      const commissionAmount = totalAmount - Math.floor(totalAmount * 0.80);
      const netPayout = totalAmount - commissionAmount;
      
      // 売上残高の更新とコミッションの作成
      await tx.florist.update({
        where: { id: offer.floristId },
        data: { balance: { increment: netPayout } },
      });
      await tx.commission.create({
        data: { amount: commissionAmount, projectId: project.id }
      });
      
      // 見積もりステータスの更新
      const approvedQuotation = await tx.quotation.update({
        where: { id },
        data: { isApproved: true },
      });
      
      // ↓↓↓ 【通知追加】お花屋さんに通知 ↓↓↓
      await createNotification(
        offer.floristId,
        'QUOTATION_APPROVED',
        `企画「${project.title}」の見積もりが承認されました。制作を開始してください。`,
        project.id,
        `/florists/offers/${offer.id}` // お花屋さんダッシュボードのオファー詳細ページへ
      );
      // ↑↑↑ 通知追加 ↑↑↑

      return approvedQuotation;
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("見積書承認エラー:", error);
    res.status(400).json({ message: error.message || '処理中にエラーが発生しました。' });
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

// ★★★【新規】いいねの追加/削除API ★★★
app.post('/api/reviews/:reviewId/like', async (req, res) => {
  // ★ userId はフロントから送られてくるものとする
  const { reviewId } = req.params;
  const { userId } = req.body; 

  if (!userId) {
    return res.status(401).json({ message: 'ログインユーザーが必要です。' });
  }

  try {
    const existingLike = await prisma.reviewLike.findUnique({
      where: {
        reviewId_userId: {
          reviewId: reviewId,
          userId: userId,
        },
      },
    });

    if (existingLike) {
      // 既にあれば、いいねを削除 (いいね解除)
      await prisma.reviewLike.delete({
        where: { id: existingLike.id },
      });
      return res.status(200).json({ liked: false, message: 'いいねを解除しました。' });
    } else {
      // なければ、いいねを作成 (いいねON)
      const newLike = await prisma.reviewLike.create({
        data: {
          reviewId: reviewId,
          userId: userId,
        },
      });
      return res.status(201).json({ liked: true, message: 'いいねしました！' });
    }
  } catch (error) {
    console.error("いいね処理エラー:", error);
    res.status(500).json({ message: 'いいねの処理中にエラーが発生しました。' });
  }
});

// ★★★ 管理者ログインAPI (トークン発行機能付き) ★★★
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  
  // 環境変数のパスワードと一致するか確認
  if (password === process.env.ADMIN_PASSWORD) {
    // 管理者用トークンを発行
    const token = jwt.sign(
      { 
        role: 'ADMIN', 
        sub: 'admin' // 特定のIDがないため固定値
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({ 
      message: '管理者として認証されました。',
      token: token // ★トークンを返す
    });
  } else {
    res.status(401).json({ message: 'パスワードが違います。' });
  }
});

app.get('/api/admin/commissions', requireAdmin, async (req, res) => {
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
        shopName,      // 実店舗名
        platformName,  // 活動名
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

// ★★★ 会場一覧API (公開用: 企画作成フォームなどで使用) ★★★
app.get('/api/venues', async (req, res) => {
  try {
    const venues = await prisma.venue.findMany({
      select: {
        id: true,
        venueName: true,
        address: true,
        // regulations: true, // ← 古いフィールド（互換性のため残してもOK）
        
        // ★ 新しい詳細フィールドを追加
        isStandAllowed: true,
        standRegulation: true,
        isBowlAllowed: true,
        bowlRegulation: true,
        retrievalRequired: true,
        accessInfo: true
      },
      orderBy: {
        venueName: 'asc',
      }
    });
    res.status(200).json(venues);
  } catch (error) {
    console.error("会場一覧取得エラー:", error);
    res.status(500).json({ message: '会場リストの取得中にエラーが発生しました。' });
  }
});

// ★★★ お花屋さん一覧取得API (829行目あたり) ★★★
app.get('/api/florists', async (req, res) => {
  try {
    const { keyword, prefecture, rush } = req.query; // ★ rushを追加

    const whereClause = {
      status: 'APPROVED',
    };

    if (keyword && keyword.trim() !== '') {
      whereClause.OR = [
        { platformName: { contains: keyword, mode: 'insensitive' } },
        { portfolio: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    
    if (prefecture && prefecture.trim() !== '') {
      whereClause.address = { contains: prefecture };
    }

    // ★★★ 追加: お急ぎ便フィルター ★★★
    if (rush === 'true') {
      whereClause.acceptsRushOrders = true;
    }

    const florists = await prisma.florist.findMany({
      where: whereClause,
      select: {
        id: true,
        platformName: true,
        portfolio: true,
        reviews: true,
        address: true,
        iconUrl: true,
        portfolioImages: true,
        specialties: true,       // (前回追加済み)
        acceptsRushOrders: true, // ★ 追加
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(florists);
  } catch (error) {
    console.error("お花屋さんリスト取得エラー:", error);
    res.status(500).json({ message: 'お花屋さんの取得中にエラーが発生しました。' });
  }
});

// ★★★【新規】企画を編集するAPI (主催者のみ) ★★★
app.patch('/api/projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { 
    title, description, imageUrl, 
    designImageUrls, // ★ 追加
    designDetails, size, flowerTypes 
  } = req.body;
  const userId = req.user.id; // ✅ トークンから取得

  try {
    // 1. 企画を検索
    const project = await prisma.project.findUnique({
      where: { id: id },
    });

    if (!project) {
      return res.status(404).json({ message: '企画が見つかりません。' });
    }

    // 2. 企画者本人でなければ編集できない
    if (project.plannerId !== userId) {
      return res.status(403).json({ message: '権限がありません。' });
    }

    // 3. データを更新
    const updatedProject = await prisma.project.update({
    where: { id: id },
    data: {
      title, description, imageUrl,
      designImageUrls, // ★ 追加
      designDetails, size, flowerTypes,
    },
  });

    res.status(200).json(updatedProject);
  } catch (error) {
    console.error("企画の編集エラー:", error);
    res.status(500).json({ message: '企画の更新中にエラーが発生しました。' });
  }
});

// ★★★ 出金申請履歴の取得API (JWT対応) ★★★
app.get('/api/florists/payouts', authenticateToken, async (req, res) => { // URLから :floristId を削除
    const floristId = req.user.id; // ✅ トークンから取得
    
    if (req.user.role !== 'FLORIST') {
        return res.status(403).json({ message: '権限がありません。' });
    }
  
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


// ★★★ お花屋さんダッシュボードAPI (修正版) ★★★
app.get('/api/florists/dashboard', authenticateToken, async (req, res) => { // :floristId を削除、authenticateTokenを追加
  const floristId = req.user.id; // URLパラメータではなく、トークンから自分のIDを取得

  if (req.user.role !== 'FLORIST') {
      return res.status(403).json({ message: '権限がありません。お花屋さんアカウントでログインしてください。' });
  }

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
            planner: { select: { id: true, handleName: true, iconUrl: true } }, 
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

// ★★★【新規】お花屋さん用スケジュール取得API ★★★
app.get('/api/florists/schedule', authenticateToken, async (req, res) => {
  const floristId = req.user.id; // user.id が floristId と一致する前提

  try {
    // 承諾済み(ACCEPTED)のオファーに紐づく企画を取得
    const offers = await prisma.offer.findMany({
      where: {
        floristId: floristId,
        status: 'ACCEPTED'
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            deliveryDateTime: true, // 納品日時
            deliveryAddress: true,
            venue: { select: { venueName: true } },
            productionStatus: true
          }
        }
      },
      orderBy: {
        project: { deliveryDateTime: 'asc' }
      }
    });

    // カレンダー表示用にデータを整形
    const events = offers.map(offer => ({
      id: offer.project.id,
      title: offer.project.title,
      date: offer.project.deliveryDateTime,
      location: offer.project.venue?.venueName || offer.project.deliveryAddress,
      status: offer.project.productionStatus
    }));

    res.json(events);
  } catch (error) {
    console.error("スケジュール取得エラー:", error);
    res.status(500).json({ message: 'スケジュールの取得に失敗しました' });
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
      orderBy: { createdAt: 'desc' },
      include: { 
        planner: { select: { handleName: true } },
        // ★★★ 管理者もチャットへ飛べるように情報を追加
        offer: {
            include: { chatRoom: true }
        }
      }
    });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: '企画の取得中にエラーが発生しました。' });
  }
});

// ★★★ オファー作成API (JWT対応: 企画者のみ実行可能) ★★★
app.post('/api/offers', authenticateToken, async (req, res) => { // ★ authenticateToken 追加
  const { projectId, floristId } = req.body;
  const plannerId = req.user.id; // ✅ トークンから企画者IDを取得

  try {
    // 1. 企画の所有権確認
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
        return res.status(404).json({ message: '企画が見つかりません。' });
    }
    if (project.plannerId !== plannerId) {
        return res.status(403).json({ message: '権限がありません。この企画の主催者ではありません。' });
    }

    const newOffer = await prisma.offer.create({
      data: {
        projectId,
        floristId,
        // status はデフォルトで 'PENDING'
      }
    });
    res.status(201).json(newOffer);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'このお花屋さんには既にオファーを出しています。' });
    }
    console.error("オファー作成エラー:", error);
    res.status(500).json({ message: 'オファーの作成中にエラーが発生しました。' });
  }
});

// ★★★【新規】オファー可能な企画を取得するAPI ★★★
app.get('/api/users/:userId/offerable-projects', async (req, res) => {
  const { userId } = req.params;
  try {
    const projects = await prisma.project.findMany({
      where: {
        plannerId: userId,
        // 募集中、または目標達成済み
        OR: [
          { status: 'FUNDRAISING' },
          { status: 'SUCCESSFUL' },
        ],
        // まだオファーが作成されていない
        offer: null,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(projects);
  } catch (error) {
    console.error("オファー可能企画の取得エラー:", error);
    res.status(500).json({ message: '企画の取得中にエラーが発生しました。' });
  }
});

// ★★★【新規】目標金額を変更するAPI ★★★
app.patch('/api/projects/:projectId/target-amount', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const { newTargetAmount } = req.body; // ❌ userId 削除
  const userId = req.user.id; // ✅ トークンから取得

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ message: '企画が見つかりません。' });
    }
    // 企画者本人かチェック
    if (project.plannerId !== userId) {
      return res.status(403).json({ message: '権限がありません。' });
    }
    // 新しい目標金額の検証
    const parsedNewAmount = parseInt(newTargetAmount, 10);
    if (isNaN(parsedNewAmount) || parsedNewAmount < project.collectedAmount) {
      return res.status(400).json({ message: `新しい目標金額は、現在集まっている金額（${project.collectedAmount.toLocaleString()} pt）以上に設定する必要があります。` });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        targetAmount: parsedNewAmount,
        status: (project.collectedAmount >= parsedNewAmount) ? 'SUCCESSFUL' : project.status,
      },
    });

    // ↓↓↓ 【通知追加】全ての支援者に目標金額変更を通知 ↓↓↓
    const pledges = await prisma.pledge.findMany({ where: { projectId }, select: { userId: true } });
    const uniqueUserIds = [...new Set(pledges.map(p => p.userId))];

    for (const id of uniqueUserIds) {
      if (id !== userId) { // 企画者自身には通知しない
        await createNotification(
          id,
          'PROJECT_STATUS_UPDATE',
          `企画「${project.title}」の目標金額が${parsedNewAmount.toLocaleString()}ptに変更されました。`,
          projectId,
          `/projects/${projectId}`
        );
      }
    }
    // ↑↑↑ 通知追加 ↑↑↑

    res.status(200).json(updatedProject);
  } catch (error) {
    console.error("目標金額の更新エラー:", error);
    res.status(500).json({ message: '目標金額の更新中にエラーが発生しました。' });
  }
});

// ★★★ お花屋さんログインAPI (トークン発行追加) ★★★
app.post('/api/florists/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const florist = await prisma.florist.findUnique({ where: { email } });

    if (!florist) {
      return res.status(401).json({ message: 'メールアドレスまたはパスワードが違います。' });
    }

    const isPasswordValid = await bcrypt.compare(password, florist.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'メールアドレスまたはパスワードが違います。' });
    }

    // ★ JWTトークンの発行 (role: 'FLORIST' を付与)
    const tokenPayload = {
      id: florist.id,
      email: florist.email,
      role: 'FLORIST', // ★ 役割を明示
      shopName: florist.shopName,
      iconUrl: florist.iconUrl,
      sub: florist.id
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const { password: _, ...floristWithoutPassword } = florist;
    res.status(200).json({
      message: 'ログインに成功しました。',
      token: token, // ★ トークンを返す
      florist: floristWithoutPassword,
    });

  } catch (error) {
    console.error('お花屋さんログインエラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました。' });
  }
});

// ★★★ 会場ログインAPI (トークン発行追加) ★★★
app.post('/api/venues/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const venue = await prisma.venue.findUnique({ where: { email }, });

    if (!venue) {
      return res.status(404).json({ message: '会場が見つかりません。' });
    }
    const isPasswordValid = await bcrypt.compare(password, venue.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'パスワードが間違っています。' });
    }

    // ★ JWTトークンの発行 (role: 'VENUE' を付与)
    const tokenPayload = {
      id: venue.id,
      email: venue.email,
      role: 'VENUE', // ★ 役割を明示
      venueName: venue.venueName,
      sub: venue.id
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const { password: _, ...venueWithoutPassword } = venue;
    res.status(200).json({
      message: 'ログインに成功しました。',
      token: token, // ★ トークンを返す
      venue: venueWithoutPassword,
    });
  } catch (error) {
    console.error('会場ログインエラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました。' });
  }
});

// ★★★ オファーへの回答 (承諾/拒否) API (JWT対応: お花屋さんのみ実行可能) ★★★
app.patch('/api/offers/:offerId', authenticateToken, async (req, res) => { // ★ authenticateToken 追加
  const { offerId } = req.params;
  const { status } = req.body;
  const floristId = req.user.id; // ✅ トークンからお花屋さんIDを取得

  if (req.user.role !== 'FLORIST') {
      return res.status(403).json({ message: 'お花屋さんアカウントでのログインが必要です。' });
  }
  if (status !== 'ACCEPTED' && status !== 'REJECTED') {
    return res.status(400).json({ message: '無効なステータスです。' });
  }

  try {
    // 1. オファーが存在し、かつ自分宛てのオファーか確認
    const offer = await prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) {
        return res.status(404).json({ message: 'オファーが見つかりません。' });
    }
    if (offer.floristId !== floristId) {
        return res.status(403).json({ message: '権限がありません。' });
    }

    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: { status: status },
      include: {
        project: {
          include: { planner: true },
        },
        chatRoom: true,
      },
    });

    // 承諾された場合、チャットルームを作成
    if (status === 'ACCEPTED') {
      const existingRoom = await prisma.chatRoom.findFirst({
        where: { offerId: offerId },
      });
      if (!existingRoom) {
        await prisma.chatRoom.create({
          data: { offerId: offerId },
        });
      }
      // ↓↓↓ 【通知追加】企画者に承諾通知 ↓↓↓
      await createNotification(
        updatedOffer.project.plannerId,
        'OFFER_ACCEPTED',
        `お花屋さんがあなたのオファーを承諾しました！チャットを開始しましょう。`,
        updatedOffer.projectId,
        `/projects/${updatedOffer.projectId}/chat` // チャット画面へのリンク
      );
    } else if (status === 'REJECTED') {
       // ↓↓↓ 【通知追加】拒否通知 ↓↓↓
       await createNotification(
        updatedOffer.project.plannerId,
        'OFFER_REJECTED',
        `残念ながら、お花屋さんがオファーを辞退しました。他のお花屋さんを探してみましょう。`,
        updatedOffer.projectId,
        `/florists` // お花屋さん一覧へ
      );
    }

    res.status(200).json(updatedOffer);
  } catch (error) {
    console.error('オファー更新エラー:', error);
    res.status(500).json({ message: 'オファーの更新中にエラーが発生しました。' });
  }
});

// ★★★ 画像アップロードAPI (認証必須化) ★★★
app.post('/api/upload', authenticateToken, upload.single('image'), async (req, res) => { // ★ authenticateToken 追加
  // req.user.id があるので、必要なら「誰がアップロードしたか」をログに残せます
  try {
    if (!req.file) {
      return res.status(400).json({ message: '画像ファイルがありません。' });
    }
    
    // Cloudinaryへのアップロード処理 (変更なし)
    cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
      if (error) {
        // エラー詳細をログに出す
        console.error('Cloudinary Upload Error:', error);
        return res.status(500).json({ message: '画像のアップロードに失敗しました。' });
      }
      res.status(200).json({ url: result.secure_url });
    }).end(req.file.buffer);

  } catch (error) {
    console.error('画像アップロードエラー:', error);
    res.status(500).json({ message: error.message || 'アップロード中にエラーが発生しました。' });
  }
});

// ★★★ お花屋さんプロフィール更新API (JWT対応) ★★★
app.patch('/api/florists/profile', authenticateToken, async (req, res) => {
  const id = req.user.id;
  
  if (req.user.role !== 'FLORIST') {
     return res.status(403).json({ message: '権限がありません。' });
  }

  const { 
    shopName, platformName, contactName, address, 
    phoneNumber, website, portfolio, laruBotApiKey,
    portfolioImages, businessHours,
    iconUrl,
    specialties,       // (前回追加済み)
    acceptsRushOrders  // ★ 追加
  } = req.body;

  try {
    const updatedFlorist = await prisma.florist.update({
      where: { id: id },
      data: {
        shopName,
        platformName,
        contactName,
        address,
        phoneNumber,
        website,
        portfolio,
        laruBotApiKey,
        portfolioImages, 
        businessHours,
        iconUrl,
        specialties,
        acceptsRushOrders // ★ 追加
      },
    });

    const { password, ...floristWithoutPassword } = updatedFlorist;
    res.status(200).json(floristWithoutPassword);
  } catch (error) {
    console.error('プロフィール更新エラー:', error);
    res.status(500).json({ message: 'プロフィールの更新中にエラーが発生しました。' });
  }
});

// ★★★ お花屋さんプロフィール更新API (962行目あたり) ★★★
app.patch('/api/florists/:id', async (req, res) => {
  const { id } = req.params;
  
  // ★ iconUrl を受け取るように追加
  const { 
    shopName, platformName, contactName, address, 
    phoneNumber, website, portfolio, laruBotApiKey,
    portfolioImages, businessHours,
    iconUrl // ★ 追加
  } = req.body;

  try {
    const updatedFlorist = await prisma.florist.update({
      where: { id: id },
      data: {
        shopName,
        platformName,
        contactName,
        address,
        phoneNumber,
        website,
        portfolio,
        laruBotApiKey,
        portfolioImages, 
        businessHours,
        iconUrl, // ★ 追加
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

app.get('/api/venues/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        // ★★★ 追加: この会場で実施された過去の企画を取得 ★★★
        projects: {
          where: {
            status: { in: ['COMPLETED', 'SUCCESSFUL'] }, // 成功・完了したもの
            visibility: 'PUBLIC',
            imageUrl: { not: null } // 画像があるもの
          },
          select: {
            id: true,
            title: true,
            imageUrl: true,
            flowerTypes: true, // お花の種類や色
            planner: { select: { handleName: true } }
          },
          orderBy: { deliveryDateTime: 'desc' },
          take: 12 // 最新12件を表示
        }
      }
    });

    if (!venue) {
      return res.status(404).json({ message: '会場が見つかりません。' });
    }
    const { password, ...venueWithoutPassword } = venue;
    res.status(200).json(venueWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: '会場情報の取得中にエラーが発生しました。' });
  }
});

// ★★★ 会場情報更新API (JWT対応) ★★★
app.patch('/api/venues/profile', authenticateToken, async (req, res) => { // ★ :id を profile に変更
  // const { id } = req.params; 
  const id = req.user.id; // ✅ トークンから取得

  if (req.user.role !== 'VENUE') {
      return res.status(403).json({ message: '権限がありません。' });
  }

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

// ★★★ レビュー投稿API (JWT対応) ★★★
app.post('/api/reviews', authenticateToken, async (req, res) => { // ★ authenticateToken 追加
  // const { comment, projectId, floristId, userId } = req.body; // ❌ userId 削除
  const { comment, projectId, floristId } = req.body;
  const userId = req.user.id; // ✅ トークンから取得

  try {
    const newReview = await prisma.review.create({
      data: {
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

// ★★★ メッセージ（カード用）投稿API (JWT対応) ★★★
app.post('/api/messages', authenticateToken, async (req, res) => { // ★ authenticateToken 追加
  // const { content, cardName, projectId, userId } = req.body; // ❌ userId 削除
  const { content, cardName, projectId } = req.body;
  const userId = req.user.id; // ✅ トークンから取得

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
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'あなたはこの企画に既にメッセージを投稿済みです。' });
    }
    console.error("メッセージ投稿APIでエラー:", error);
    res.status(500).json({ message: 'メッセージの投稿中にエラーが発生しました。' });
  }
});

// ★★★ アンケート作成API (JWT対応) ★★★
app.post('/api/group-chat/polls', authenticateToken, async (req, res) => { // ★ authenticateToken 追加
  // const { projectId, userId, question, options } = req.body; // ❌ userId 削除
  const { projectId, question, options } = req.body;
  const userId = req.user.id; // ✅ トークンから取得

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    // 企画者本人かチェック
    if (!project || project.plannerId !== userId) {
      return res.status(403).json({ message: 'アンケートを作成できるのは企画者のみです。' });
    }
    
    // 既存のアンケートがあれば削除（1企画1アンケートの場合）
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

// ★★★ アンケート投票API (JWT対応) ★★★
app.post('/api/group-chat/polls/vote', authenticateToken, async (req, res) => { // ★ authenticateToken 追加
  // const { pollId, userId, optionIndex } = req.body; // ❌ userId 削除
  const { pollId, optionIndex } = req.body;
  const userId = req.user.id; // ✅ トークンから取得

  try {
    const poll = await prisma.activePoll.findUnique({ where: { id: pollId } });
    if (!poll) return res.status(404).json({ message: 'アンケートが見つかりません。' });
    
    // 支援者かどうかチェック
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

// ★★★ Stripe決済セッション作成API (JWT対応) ★★★
app.post('/api/checkout/create-session', authenticateToken, async (req, res) => { // ★ authenticateToken 追加
    // const { userId, amount, points } = req.body; // ❌ userId 削除
    const { amount, points } = req.body;
    const userId = req.user.id; // ✅ トークンから取得

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ 
                price_data: { 
                    currency: 'jpy', 
                    product_data: { name: `${points} ポイント購入` }, 
                    unit_amount: amount, 
                }, 
                quantity: 1, 
            }],
            mode: 'payment',
            success_url: `${frontendUrl}/payment/success`,
            cancel_url: `${frontendUrl}/points`,
            client_reference_id: userId, // StripeのWebhookで使用するために必須
            metadata: { points },
        });
        res.json({ url: session.url });
    } catch (error) {
        console.error('Stripe session creation error:', error);
        res.status(500).json({ message: '決済セッションの作成に失敗しました。' });
    }
});

// ★★★ 活動報告（お知らせ）投稿API (修正版) ★★★
app.post('/api/announcements', authenticateToken, async (req, res) => {
  const { title, content, projectId } = req.body;
  const userId = req.user.id;

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ message: '企画が見つかりません。' });
    }
    if (project.plannerId !== userId) {
      return res.status(403).json({ message: '権限がありません。あなたはこの企画の主催者ではありません。' });
    }
    
    // お知らせの作成
    const newAnnouncement = await prisma.announcement.create({
      data: {
        title,
        content,
        projectId,
      },
    });

    // ★★★ 【修正】全支援者にメール＆通知送信 ★★★
    // distinctを使って、重複のないユーザーリストを取得
    const pledges = await prisma.pledge.findMany({ 
      where: { projectId }, 
      include: { user: true },
      distinct: ['userId'] 
    });

    for (const pledge of pledges) {
      if (pledge.userId !== userId) {
        // 1. サイト内通知
        await createNotification(
          pledge.userId,
          'NEW_ANNOUNCEMENT',
          `企画「${project.title}」から新しいお知らせが届きました: ${title}`,
          projectId,
          `/projects/${projectId}`
        );
        
        // 2. メール送信
        const emailContent = `
          <p>支援した企画「${project.title}」から新しいお知らせがあります。</p>
          <hr />
          <h3>${title}</h3>
          <p>${content.substring(0, 100)}...</p>
          <hr />
          <a href="${process.env.FRONTEND_URL}/projects/${projectId}">詳細を見る</a>
        `;
        // 非同期で送信（awaitをつけると人数が多い時に遅くなるため、あえて外しています）
        sendEmail(pledge.user.email, `【FLASTAL】新着のお知らせ: ${title}`, emailContent);
      }
    }

    res.status(201).json(newAnnouncement);

  } catch (error) {
    console.error("お知らせ投稿APIでエラー:", error);
    res.status(500).json({ message: 'お知らせの投稿中にエラーが発生しました。' });
  }
});

// ★★★ 出金申請API (JWT対応: お花屋さん本人) ★★★
app.post('/api/payouts', authenticateToken, async (req, res) => { // ★ authenticateToken 追加
  // const { floristId, amount, accountInfo } = req.body; // ❌ floristId 削除
  const { amount, accountInfo } = req.body;
  const floristId = req.user.id; // ✅ トークンから取得

  if (req.user.role !== 'FLORIST') {
      return res.status(403).json({ message: '権限がありません。' });
  }

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

      // 残高を減らす
      await tx.florist.update({
        where: { id: floristId },
        data: { balance: { decrement: payoutAmount } },
      });

      // 申請データ作成
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

app.post('/api/expenses', authenticateToken, async (req, res) => {
  // const { itemName, amount, projectId, userId } = req.body; // ❌ userId 削除
  const { itemName, amount, projectId } = req.body;
  const userId = req.user.id; // ✅ トークンから取得

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

app.delete('/api/expenses/:expenseId', authenticateToken, async (req, res) => {
  const { expenseId } = req.params;
  // const { userId } = req.body; // ❌ userId 削除
  const userId = req.user.id; // ✅ トークンから取得

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

app.post('/api/tasks', authenticateToken, async (req, res) => {
  // const { title, projectId, userId, assignedUserId } = req.body; // ❌ userId 削除
  const { title, projectId, assignedUserId } = req.body;
  const userId = req.user.id; // ✅ トークンから取得

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.plannerId !== userId) {
      return res.status(403).json({ message: '権限がありません。' });
    }
    
    const newTask = await prisma.task.create({
      data: { 
        title, 
        projectId,
        assignedUserId: assignedUserId || null,
      },
    });
    
    // ↓↓↓ 【通知追加】タスクが割り当てられたユーザーに通知 ↓↓↓
    if (assignedUserId && assignedUserId !== userId) {
      await createNotification(
        assignedUserId,
        'TASK_ASSIGNED',
        `企画「${project.title}」でタスク「${title}」があなたに割り当てられました。`,
        projectId,
        `/projects/${projectId}` 
      );
    }
    // ↑↑↑ 通知追加 ↑↑↑
    
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: 'タスクの追加中にエラーが発生しました。' });
  }
});

app.patch('/api/tasks/:taskId', authenticateToken, async (req, res) => {
  const { taskId } = req.params;
  const { isCompleted, assignedUserId } = req.body; // ❌ userId 削除
  const userId = req.user.id; // ✅ トークンから取得
  
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
      data: { 
        isCompleted,
        assignedUserId: assignedUserId, // ★ assignedUserId を更新
      },
    });
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'タスクの更新中にエラーが発生しました。' });
  }
});

// ★★★【新規】企画の支援コース (リターン) 設定API ★★★
app.post('/api/projects/:projectId/tiers', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const { tiers } = req.body; // ❌ userId 削除
  const userId = req.user.id; // ✅ トークンから取得

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.plannerId !== userId) {
      return res.status(403).json({ message: '権限がありません。' });
    }

    if (!Array.isArray(tiers) || tiers.length === 0) {
      return res.status(400).json({ message: '有効な支援コースが設定されていません。' });
    }

    await prisma.$transaction(async (tx) => {
      // 既存のコースを一旦削除 (シンプル化のため)
      await tx.pledgeTier.deleteMany({ where: { projectId } });

      // 新しいコースを作成
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
    console.error("支援コース設定エラー:", error);
    res.status(500).json({ message: '支援コースの設定中にエラーが発生しました。' });
  }
});

app.delete('/api/tasks/:taskId', authenticateToken, async (req, res) => {
  const { taskId } = req.params;
  // const { userId } = req.body; // ❌ userId 削除
  const userId = req.user.id; // ✅ トークンから取得

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

// ★★★ メッセージ（カード用）投稿API (JWT対応) ★★★
app.post('/api/messages', authenticateToken, async (req, res) => { // ★ authenticateToken 追加
  // const { content, cardName, projectId, userId } = req.body; // ❌ userId 削除
  const { content, cardName, projectId } = req.body;
  const userId = req.user.id; // ✅ トークンから取得

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
  } catch (error) {
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

// ★★★ アンケート作成API (JWT対応) ★★★
app.post('/api/group-chat/polls', authenticateToken, async (req, res) => { // ★ authenticateToken 追加
  // const { projectId, userId, question, options } = req.body; // ❌ userId 削除
  const { projectId, question, options } = req.body;
  const userId = req.user.id; // ✅ トークンから取得

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    // 企画者本人かチェック
    if (!project || project.plannerId !== userId) {
      return res.status(403).json({ message: 'アンケートを作成できるのは企画者のみです。' });
    }
    
    // 既存のアンケートがあれば削除（1企画1アンケートの場合）
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

// ★★★ アンケート投票API (JWT対応) ★★★
app.post('/api/group-chat/polls/vote', authenticateToken, async (req, res) => { // ★ authenticateToken 追加
  // const { pollId, userId, optionIndex } = req.body; // ❌ userId 削除
  const { pollId, optionIndex } = req.body;
  const userId = req.user.id; // ✅ トークンから取得

  try {
    const poll = await prisma.activePoll.findUnique({ where: { id: pollId } });
    if (!poll) return res.status(404).json({ message: 'アンケートが見つかりません。' });
    
    // 支援者かどうかチェック
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

// ★★★【新規】グループチャット リアクション操作API ★★★
app.post('/api/group-chat/reactions', authenticateToken, async (req, res) => {
  const { messageId, emoji } = req.body;
  const userId = req.user.id;

  if (!messageId || !emoji) {
    return res.status(400).json({ message: 'メッセージIDと絵文字が必要です。' });
  }

  try {
    // 1. 既存のリアクションを検索
    const existingReaction = await prisma.groupChatMessageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId: messageId,
          userId: userId,
          emoji: emoji,
        },
      },
    });

    if (existingReaction) {
      // 2. 既に存在すれば削除（トグル）
      await prisma.groupChatMessageReaction.delete({
        where: { id: existingReaction.id },
      });
      
      // Socket.IOで削除をブロードキャスト
      io.to(messageId).emit('reactionRemoved', { messageId, userId, emoji }); 
      
      return res.status(200).json({ message: 'リアクションを削除しました。', action: 'removed' });
      
    } else {
      // 3. 存在しなければ作成
      const newReaction = await prisma.groupChatMessageReaction.create({
        data: {
          messageId,
          userId,
          emoji,
        },
      });

      // Socket.IOで追加をブロードキャスト (メッセージIDをルーム名として使用)
      io.to(messageId).emit('reactionAdded', newReaction); 
      
      return res.status(201).json({ message: 'リアクションを追加しました。', action: 'added', reaction: newReaction });
    }
  } catch (error) {
    // P2003 (外部キー制約違反) が出た場合は、メッセージIDかユーザーIDが不正
    console.error("リアクション操作エラー:", error); 
    res.status(500).json({ message: 'リアクションの処理中にエラーが発生しました。' });
  }
});

// ★★★【新規】成功企画のデータテンプレート取得API ★★★
app.get('/api/projects/successful-templates', async (req, res) => {
  try {
    // 過去に完了した、目標を達成した企画の主要データを取得
    const successfulProjects = await prisma.project.findMany({
      where: { 
        status: { in: ['SUCCESSFUL', 'COMPLETED'] },
        visibility: 'PUBLIC'
      },
      select: {
        id: true,
        title: true,
        targetAmount: true,
        collectedAmount: true,
        imageUrl: true,
        designDetails: true,
        flowerTypes: true,
        createdAt: true,
        expenses: {
          select: { itemName: true, amount: true }
        }
      },
      orderBy: { collectedAmount: 'desc' }, // 支援額が高い順
      take: 5 // 上位5件のみ
    });

    // 取得したデータからテンプレートとして役立つ情報を整形
    const templates = successfulProjects.map(p => ({
      id: p.id,
      title: p.title,
      totalPledged: p.collectedAmount,
      totalTarget: p.targetAmount,
      image: p.imageUrl,
      designSummary: p.designDetails ? p.designDetails.substring(0, 50) + '...' : 'N/A',
      // 平均費用や内訳など、企画者にとって参考になる情報に変換
      expenseSummary: p.expenses.reduce((sum, exp) => sum + exp.amount, 0),
      expenseCount: p.expenses.length
    }));
    
    res.status(200).json(templates);
  } catch (error) {
    console.error("成功企画テンプレート取得エラー:", error);
    res.status(500).json({ message: '成功企画データの取得に失敗しました。' });
  }
});

app.get('/api/admin/payouts', requireAdmin, async (req, res) => {
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

app.patch('/api/admin/payouts/:id/complete', requireAdmin, async (req, res) => {
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

app.get('/api/admin/projects', requireAdmin, async (req, res) => {
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

app.get('/api/admin/projects/:projectId/chats', requireAdmin, async (req, res) => {
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

app.get('/api/admin/reports', requireAdmin, async (req, res) => {
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

app.patch('/api/admin/reports/:reportId/review', requireAdmin, async (req, res) => {
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

app.patch('/api/admin/projects/:projectId/visibility', requireAdmin, async (req, res) => {
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
  const { userId, completionImageUrls, completionComment, surplusUsageDescription } = req.body; 

  try {
    // プロジェクト情報と、紐づく支出情報を一緒に取得
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { expenses: true }, 
    });

    if (!project) {
        return res.status(404).json({ message: '企画が見つかりません。' });
    }
    if (project.plannerId !== userId) {
      return res.status(403).json({ message: '権限がありません。あなたはこの企画の主催者ではありません。' });
    }
    if (project.status === 'COMPLETED' || project.status === 'CANCELED') {
        return res.status(400).json({ message: 'この企画は既に完了または中止されています。' });
    }
    if (!Array.isArray(completionImageUrls)) {
        return res.status(400).json({ message: '画像URLの形式が正しくありません。' });
    }

    // 最終残高 (余剰金) を計算
    const totalExpense = project.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const finalBalance = project.collectedAmount - totalExpense;

    // データベースを更新
    const completedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'COMPLETED',
        completionImageUrls: completionImageUrls,
        completionComment: completionComment,
        finalBalance: finalBalance,
        surplusUsageDescription: surplusUsageDescription,
      },
      include: {
          expenses: true,
          planner: { select: { handleName: true } }
      }
    });

    // ★★★ 【追加】全支援者に完了報告メール ★★★
    // 支援者情報を取得（重複なし）
    const pledges = await prisma.pledge.findMany({ 
      where: { projectId }, 
      include: { user: true },
      distinct: ['userId'] 
    });

    for (const pledge of pledges) {
       const emailContent = `
         <p>企画「${project.title}」が完了しました！</p>
         <p>企画者より完了報告と収支報告が投稿されています。</p>
         <p><strong>企画者コメント:</strong><br/>${completionComment}</p>
         <p><a href="${process.env.FRONTEND_URL}/projects/${projectId}">完了報告ページを見る</a></p>
       `;
       // エラーハンドリングなしで送信（非同期）
       sendEmail(pledge.user.email, '【FLASTAL】企画完了のご報告', emailContent);
    }

    res.status(200).json(completedProject);

  } catch (error) {
    console.error("完了報告の投稿エラー:", error);
    res.status(500).json({ message: '完了報告の投稿処理中にエラーが発生しました。' });
  }
});

app.patch('/api/projects/:projectId/cancel', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id; 

  // ★★★ デバッグ用ログ出力 (ここがログに出るか確認してください) ★★★
  console.log(`▼▼▼ Cancel Request Debug ▼▼▼`);
  console.log(`Logged in User ID: ${userId}`);
  console.log(`Target Project ID: ${projectId}`);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: { id: projectId },
        include: { pledges: true }
      });
      
      if (!project) {
        console.log(`Error: Project not found.`);
        throw new Error('企画が見つかりません。');
      }

      // ★★★ 企画者のIDと比較 ★★★
      console.log(`Project Planner ID : ${project.plannerId}`);
      if (project.plannerId !== userId) {
        console.log(`❌ MISMATCH: Logged in user is NOT the planner.`);
        // ここであえて 403 を返すように明示します
        throw new Error('FORBIDDEN_ACCESS'); 
      } else {
        console.log(`✅ MATCH: User is the planner.`);
      }

      if (project.status === 'COMPLETED' || project.status === 'CANCELED') {
        throw new Error('この企画は既に完了または中止されているため、中止できません。');
      }
      
      const uniquePledgerIds = new Set(); 

      for (const pledge of project.pledges) {
        await tx.user.update({
          where: { id: pledge.userId },
          data: { points: { increment: pledge.amount } }
        });
        uniquePledgerIds.add(pledge.userId);
      }
      
      const canceledProject = await tx.project.update({
        where: { id: projectId },
        data: { status: 'CANCELED' },
      });

      for (const id of uniquePledgerIds) {
        if (id !== userId) {
          await createNotification(
            id,
            'PROJECT_STATUS_UPDATE',
            `企画「${project.title}」は中止され、支援額${project.collectedAmount.toLocaleString()}ptが返金されました。`,
            projectId,
            `/projects/${projectId}`
          );

          const userToNotify = await tx.user.findUnique({ where: { id } });
          if (userToNotify) {
             const emailContent = `
               <p>誠に残念ながら、企画「${project.title}」は中止されました。</p>
               <p>これに伴い、支援いただいたポイントは全額返金（ポイント返還）いたしました。</p>
               <p>現在のポイント残高はマイページよりご確認ください。</p>
             `;
             // エラー無視で送信
             sendEmail(userToNotify.email, '【重要】企画中止と返金のお知らせ', emailContent).catch(e => console.error(e));
          }
        }
      }

      return canceledProject;
    }); 

    res.status(200).json({ message: '企画を中止し、すべての支援者にポイントが返金されました。', project: result });

  } catch (error) { 
    console.error("企画の中止処理エラー:", error.message);
    
    // 権限エラーの場合は 403 を返す
    if (error.message === 'FORBIDDEN_ACCESS') {
        return res.status(403).json({ message: '権限がありません。企画者本人ではありません。' });
    }
    
    res.status(400).json({ message: error.message || '企画の中止処理中にエラーが発生しました。' });
  }
});

// ★★★ パスワード再設定リクエストAPI (本物のメール送信機能付き) ★★★
app.post('/api/forgot-password', async (req, res) => {
  const { email, userType } = req.body;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  try {
    let user = null;
    if (userType === 'USER') {
      user = await prisma.user.findUnique({ where: { email } });
    } else if (userType === 'FLORIST') {
      user = await prisma.florist.findUnique({ where: { email } });
    } else if (userType === 'VENUE') {
      user = await prisma.venue.findUnique({ where: { email } });
    }

    // もしユーザーが存在したら、メール送信処理を実行
    if (user) {
      // 1. ユーザーIDと種類を含む、1時間だけ有効なトークンを生成
      const token = jwt.sign(
        { id: user.id, type: userType },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // 2. パスワード再設定ページのURLを作成
      const resetLink = `${frontendUrl}/reset-password/${token}`;

      // 3. Resendを使ってメールを送信
      const { data, error } = await resend.emails.send({
        // 例: 'FLASTAL <noreply@認証したドメイン.com>' のように変更
        from: 'FLASTAL <noreply@flastal.com>',
        to: [email],
        subject: 'FLASTAL パスワード再設定のご案内',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #0ea5e9;">FLASTAL パスワード再設定</h2>
            <p>FLASTALのパスワード再設定リクエストを受け付けました。</p>
            <p>以下のボタンをクリックして、新しいパスワードを設定してください。このリンクは1時間有効です。</p>
            <a href="${resetLink}" style="display: inline-block; margin: 20px 0; padding: 12px 24px; font-size: 16px; color: white; background-color: #0ea5e9; text-decoration: none; border-radius: 8px;">パスワードを再設定する</a>
            <p>もしこのメールに心当たりがない場合は、安全のため、このメールを無視してください。</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #9ca3af;">FLASTAL</p>
          </div>
        `,
      });

      if (error) {
        console.error("メール送信エラー:", error);
        // フロントエンドには一般的なエラーメッセージを返す
        return res.status(500).json({ message: 'メールの送信に失敗しました。時間をおいて再度お試しください。' });
      }

      console.log(`パスワード再設定メールを ${email} に送信しました。`);
    } else {
      // ユーザーが存在しない場合でも、セキュリティのためログには残す
      console.log(`パスワード再設定リクエスト受信（未登録）: ${email} (${userType})。`);
    }
    
    // ユーザーが存在するかどうかに関わらず、常に成功メッセージを返す
    res.status(200).json({ message: 'ご入力いただいたメールアドレスに、パスワード再設定用のリンクを送信しました。' });

  } catch (error) {
    console.error("パスワード再設定リクエストAPIで予期せぬエラー:", error);
    res.status(500).json({ message: '処理中にエラーが発生しました。' });
  }
});

// ★★★【新規】お花屋さんによる見積書の最終確定API ★★★
app.patch('/api/quotations/:id/finalize', async (req, res) => {
  const { id } = req.params;
  const { floristId } = req.body; // 最終確定者がお花屋さん本人か確認

  try {
    const quotation = await prisma.quotation.findUnique({ 
      where: { id }, 
      include: { project: { include: { offer: true } } } 
    });

    if (!quotation) {
      return res.status(404).json({ message: '見積書が見つかりません。' });
    }

    // 権限チェック: 見積書が紐づくオファーの担当お花屋さんか？
    if (quotation.project.offer?.floristId !== floristId) {
      return res.status(403).json({ message: '権限がありません。' });
    }

    // 既に確定済みのチェック (任意だが推奨)
    if (quotation.isFinalized) {
      return res.status(400).json({ message: 'この見積書は既に最終確定されています。' });
    }

    const finalizedQuotation = await prisma.quotation.update({
      where: { id },
      data: { isFinalized: true, finalizedAt: new Date() },
    });

    // 企画者チャットルームに通知を送信 (任意)
    // io.to(quotation.project.id).emit('quotationFinalized', finalizedQuotation);

    res.status(200).json(finalizedQuotation);
  } catch (error) {
    console.error("見積書最終確定エラー:", error);
    res.status(500).json({ message: '見積書の最終確定中にエラーが発生しました。' });
  }
});

// ★★★【新規】お花屋さんによる企画ステータス更新API (制作フェーズ) ★★★
// 企画ステータスに 'PROCESSING', 'READY_FOR_DELIVERY' などを追加する必要があります
app.patch('/api/projects/:projectId/production-status', async (req, res) => {
  const { projectId } = req.params;
  const { floristId, status } = req.body; // status: 'PROCESSING', 'READY_FOR_DELIVERY'

  // ステータスの検証（Prismaのスキーマにこれらのステータスを追加してください）
  if (!['PROCESSING', 'READY_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
    return res.status(400).json({ message: '無効なステータスです。' });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { offer: true }
    });

    if (!project || project.offer?.floristId !== floristId) {
      return res.status(403).json({ message: '権限がありません。' });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { status: status },
    });
    
    // 企画者チャットルームに通知
    // io.to(projectId).emit('productionStatusUpdated', { status: status });

    res.status(200).json(updatedProject);
  } catch (error) {
    console.error("制作ステータス更新エラー:", error);
    res.status(500).json({ message: '制作ステータスの更新中にエラーが発生しました。' });
  }
});

// ★★★【新規】パスワードをリセットするAPI ★★★
app.post('/api/reset-password', async (req, res) => {
  const { token, password } = req.body;

  try {
    // 1. トークンが有効か、秘密の合言葉で検証する
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id, type } = decoded;

    // 2. 新しいパスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. ユーザー種別に応じて、正しいテーブルのパスワードを更新
    if (type === 'USER') {
      await prisma.user.update({ where: { id }, data: { password: hashedPassword } });
    } else if (type === 'FLORIST') {
      await prisma.florist.update({ where: { id }, data: { password: hashedPassword } });
    } else if (type === 'VENUE') {
      await prisma.venue.update({ where: { id }, data: { password: hashedPassword } });
    } else {
      throw new Error('無効なユーザータイプです。');
    }

    res.status(200).json({ message: 'パスワードが正常に更新されました。' });
  } catch (error) {
    console.error("パスワードリセットエラー:", error);
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'このリンクは有効期限が切れています。もう一度やり直してください。' });
    }
    res.status(500).json({ message: 'パスワードの更新中にエラーが発生しました。' });
  }
});

// ★★★【管理者用】審査待ちの花屋さん一覧を取得するAPI ★★★
app.get('/api/admin/florists/pending', requireAdmin, async (req, res) => {
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
app.patch('/api/admin/florists/:floristId/status', requireAdmin, async (req, res) => {
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
// ★★★【新規】管理者用 会場管理API ★★★
// ===================================

// 1. 会場一覧取得 (管理者用: 全フィールド取得)
app.get('/api/admin/venues', requireAdmin, async (req, res) => {
  try {
    const venues = await prisma.venue.findMany({
      orderBy: { venueName: 'asc' },
    });
    res.status(200).json(venues);
  } catch (error) {
    res.status(500).json({ message: '会場データの取得に失敗しました。' });
  }
});

// 2. 会場新規登録 (管理者用)
app.post('/api/admin/venues', requireAdmin, async (req, res) => {
  try {
    const { 
      venueName, address, email, password, 
      isStandAllowed, standRegulation,
      isBowlAllowed, bowlRegulation,
      retrievalRequired, accessInfo,
      // ★ 追加
      websiteUrl, phoneNumber, twitterUrl, instagramUrl
    } = req.body;

    const hash = await bcrypt.hash(password || 'flastal1234', 10);

    const newVenue = await prisma.venue.create({
      data: {
        venueName, address, email, password: hash,
        isStandAllowed: isStandAllowed ?? true,
        standRegulation,
        isBowlAllowed: isBowlAllowed ?? true,
        bowlRegulation,
        retrievalRequired: retrievalRequired ?? true,
        accessInfo,
        // ★ 追加
        websiteUrl, phoneNumber, twitterUrl, instagramUrl
      }
    });
    res.status(201).json(newVenue);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'このメールアドレスは既に使用されています。' });
    }
    console.error("会場登録エラー:", error);
    res.status(500).json({ message: '会場の登録に失敗しました。' });
  }
});

// 3. 会場編集 (管理者用)
app.patch('/api/admin/venues/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  // 必要なフィールドだけ取り出す
  const { 
    venueName, address, email,
    isStandAllowed, standRegulation,
    isBowlAllowed, bowlRegulation,
    retrievalRequired, accessInfo
  } = req.body;

  try {
    const updatedVenue = await prisma.venue.update({
      where: { id },
      data: {
        venueName,
        address,
        email,
        isStandAllowed,
        standRegulation,
        isBowlAllowed,
        bowlRegulation,
        retrievalRequired,
        accessInfo
      }
    });
    res.status(200).json(updatedVenue);
  } catch (error) {
    console.error("会場更新エラー:", error);
    res.status(500).json({ message: '会場情報の更新に失敗しました。' });
  }
});

// 4. 会場削除 (管理者用)
app.delete('/api/admin/venues/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.venue.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    // 既に紐づくプロジェクトがある場合などはエラーになる (外部キー制約)
    console.error("会場削除エラー:", error);
    res.status(500).json({ message: '削除できませんでした。紐づく企画が存在する可能性があります。' });
  }
});


// ===================================
// ★★★【新規】イベント主催者 (Organizer) 用 API ★★★
// ===================================

// 1. 主催者登録
app.post('/api/organizers/register', async (req, res) => {
  try {
    const { email, password, name, website } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: '必須項目が不足しています。' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newOrganizer = await prisma.organizer.create({
      data: { email, password: hashedPassword, name, website }
    });
    
    const { password: _, ...organizerWithoutPassword } = newOrganizer;
    res.status(201).json({ message: '主催者登録が完了しました。', organizer: organizerWithoutPassword });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'このメールアドレスは既に使用されています。' });
    console.error("主催者登録エラー:", error);
    res.status(500).json({ message: '登録処理中にエラーが発生しました。' });
  }
});

// 2. 主催者ログイン
app.post('/api/organizers/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const organizer = await prisma.organizer.findUnique({ where: { email } });
    if (!organizer) return res.status(401).json({ message: 'メールアドレスまたはパスワードが違います。' });

    const isValid = await bcrypt.compare(password, organizer.password);
    if (!isValid) return res.status(401).json({ message: 'パスワードが違います。' });

    // トークン発行 (Role: ORGANIZER)
    const token = jwt.sign(
      { 
        id: organizer.id, 
        email: organizer.email, 
        role: 'ORGANIZER', 
        name: organizer.name, // handleNameの代わりにnameを使用
        handleName: organizer.name, // フロントエンド互換用
        sub: organizer.id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({ message: 'ログイン成功', token });
  } catch (error) {
    res.status(500).json({ message: 'ログイン処理中にエラーが発生しました。' });
  }
});

// 3. イベント作成 (主催者のみ)
app.post('/api/events', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ORGANIZER') return res.status(403).json({ message: '権限がありません。' });
  
  const { title, description, eventDate, venueId, isStandAllowed, regulationNote } = req.body;
  
  try {
    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        eventDate: new Date(eventDate),
        venueId: venueId || null,
        organizerId: req.user.id,
        isStandAllowed: isStandAllowed ?? true,
        regulationNote
      }
    });
    res.status(201).json(newEvent);
  } catch (error) {
    console.error("イベント作成エラー:", error);
    res.status(500).json({ message: 'イベントの作成に失敗しました。' });
  }
});

// 4. 主催者のマイイベント一覧取得
app.get('/api/organizers/events', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ORGANIZER') return res.status(403).json({ message: '権限がありません。' });
  
  try {
    const events = await prisma.event.findMany({
      where: { organizerId: req.user.id },
      include: { 
        venue: true,
        _count: { select: { projects: true } } // 紐づいている企画数も取得
      },
      orderBy: { eventDate: 'desc' }
    });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'イベント一覧の取得に失敗しました。' });
  }
});

// 5. 公開中のイベント一覧取得 (ユーザーが企画作成時に選択するため)
app.get('/api/events', async (req, res) => {
  try {
    // 開催日が今日以降のイベントを取得
    const events = await prisma.event.findMany({
      where: { eventDate: { gte: new Date() } },
      include: { venue: true, organizer: { select: { name: true } } },
      orderBy: { eventDate: 'asc' }
    });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'イベントリストの取得に失敗しました。' });
  }
});


// ★★★ イベント詳細取得API (公開用: 紐づく企画一覧も取得) ★★★
app.get('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        venue: true,
        organizer: { select: { name: true, website: true } },
        projects: {
          where: { visibility: 'PUBLIC', status: { not: 'CANCELED' } }, // キャンセル以外の公開企画を表示
          include: {
            planner: { select: { handleName: true, iconUrl: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ message: 'イベントが見つかりません。' });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error("イベント詳細取得エラー:", error);
    res.status(500).json({ message: 'イベント情報の取得に失敗しました。' });
  }
});


// ==========================================
// ★★★【新規】制作進行管理・指示書API ★★★
// ==========================================

// 1. 制作ステータスの更新 & 画像保存 (企画者・花屋共通)
app.patch('/api/projects/:projectId/production', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;
  const { 
    productionStatus, 
    illustrationPanelUrls, messagePanelUrls, sponsorPanelUrls, 
    preEventPhotoUrls 
  } = req.body;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { offer: true }
    });

    if (!project) return res.status(404).json({ message: '企画が見つかりません' });

    // 権限チェック: 企画者 または 担当花屋 のみ操作可能
    const isPlanner = project.plannerId === userId;
    const isFlorist = project.offer?.floristId === userId;

    if (!isPlanner && !isFlorist) {
      return res.status(403).json({ message: '権限がありません' });
    }

    // データ更新
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        // 送られてきた値があれば更新する (undefinedなら更新しない)
        productionStatus: productionStatus || undefined,
        illustrationPanelUrls: illustrationPanelUrls || undefined,
        messagePanelUrls: messagePanelUrls || undefined,
        sponsorPanelUrls: sponsorPanelUrls || undefined,
        preEventPhotoUrls: preEventPhotoUrls || undefined,
      }
    });

    // 通知ロジック (相手に通知)
    const targetUserId = isPlanner ? project.offer?.floristId : project.plannerId;
    if (targetUserId) {
        let msg = '制作状況が更新されました';
        if (illustrationPanelUrls) msg = 'パネルデータがアップロードされました';
        if (preEventPhotoUrls) msg = 'お花の前日写真が届きました！';
        
        await createNotification(
            targetUserId,
            'PROJECT_STATUS_UPDATE',
            msg,
            projectId,
            `/projects/${projectId}`
        );
    }

    res.status(200).json(updatedProject);
  } catch (error) {
    console.error("制作状況更新エラー:", error);
    res.status(500).json({ message: '更新に失敗しました' });
  }
});

// 2. 指示書データ生成API (花屋用)
// AIを使わずとも、テンプレートリテラルで正確に整形する方が確実で高速です
app.get('/api/projects/:projectId/instruction-sheet', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { 
        venue: true, 
        planner: true 
      }
    });

    if (!project) return res.status(404).json({ message: '企画なし' });

    // データの整形 (nullの場合は空文字にする)
    const d = {
      name: project.planner.handleName || '',
      amount: project.collectedAmount ? `${project.collectedAmount.toLocaleString()}円` : '',
      date: new Date(project.deliveryDateTime).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      place: project.venue ? project.venue.venueName : project.deliveryAddress,
      retrieval: project.venue?.retrievalRequired ? '必須 (時間は会場確認)' : '要確認',
      color: project.flowerTypes || '', // 色味の情報がない場合flowerTypesを充てる
      flowers: project.flowerTypes || '',
      ribbon: 'おまかせ', // 必要ならDBにカラム追加
      tag: 'パネル参照',
      balloon: 'おまかせ',
      decoration: project.designDetails || '',
      size: project.size || (project.venue?.standRegulation || '規定内'),
      design: project.designDetails || '',
    };

    // 指定されたフォーマットでテキスト生成
    const text = `
★名前：${d.name}
★金額：${d.amount}
★日時：${d.date}
★場所：${d.place}
★回収時間：${d.retrieval}
★お花のカラー：${d.color}
★お花の本数・種類など：${d.flowers}
★リボン：${d.ribbon}
★札：${d.tag}
★バルーン：${d.balloon}
★装飾：${d.decoration}
★サイズ規定：${d.size}
★デザイン：${d.design}
`.trim(); // プロント送る はボタンなどのUI側で表現

    res.status(200).json({ text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '指示書作成エラー' });
  }
});


// ★ OpenAI設定 (APIキーがない場合はダミーモードになります)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key', 
});

// ★★★【新規】AI画像生成API ★★★
app.post('/api/ai/generate-image', authenticateToken, async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ message: 'プロンプト（キーワード）が必要です。' });
  }

  try {
    let imageUrl = '';

    // APIキーが設定されている場合のみ、本当に生成する
    if (process.env.OPENAI_API_KEY) {
      console.log(`Generating image for: ${prompt}`);
      
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: `フラワースタンド（スタンド花）のデザイン画。アニメやアイドルのライブイベントに贈るもの。背景は白。詳細: ${prompt}`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });
      
      const tempUrl = response.data[0].url;

      // DALL-EのURLは一時的なので、Cloudinaryにアップロードして永続化する
      const uploadResult = await cloudinary.uploader.upload(tempUrl, {
        folder: 'flastal_ai_generated',
      });
      
      imageUrl = uploadResult.secure_url;

    } else {
      // ダミーモード (APIキーがない場合)
      console.log('OpenAI API Key not found. Using dummy image.');
      // ランダムな花の画像を返す
      imageUrl = `https://source.unsplash.com/featured/?flower,arrangement&${Date.now()}`;
      // または固定画像
      // imageUrl = "https://placehold.co/600x400?text=AI+Generated+Image"; 
    }

    res.status(200).json({ url: imageUrl });

  } catch (error) {
    console.error("AI画像生成エラー:", error);
    res.status(500).json({ message: '画像の生成に失敗しました。時間を置いて再度お試しください。' });
  }
});

// ★★★【新規】AIマッチング (お花屋さんレコメンド) API ★★★
app.post('/api/ai/match-florists', authenticateToken, async (req, res) => {
  const { designDetails, flowerTypes } = req.body;
  
  // 入力が少なすぎる場合は検索できないので全件返すなどの処理でも良いが、今回は空で返す
  if (!designDetails && !flowerTypes) {
    return res.json({ recommendedFlorists: [] });
  }

  // 1. 定義されたタグリスト (フロントエンドと同じもの)
  const STYLE_TAGS = [
    'かわいい/キュート', 'クール/かっこいい', 'おしゃれ/モダン', '和風/和モダン',
    'ゴージャス/豪華', 'パステルカラー', 'ビビッドカラー', 'ニュアンスカラー',
    'バルーン装飾', 'ペーパーフラワー', '布・リボン装飾', 'キャラクター/モチーフ',
    '大型/連結', '卓上/楽屋花'
  ];

  try {
    let targetTags = [];

    // 2. AIを使ってテキストからタグを抽出
    if (process.env.OPENAI_API_KEY) {
      const prompt = `
        以下のフラワースタンドの要望文から、最も適切なスタイルタグを最大3つ選んでください。
        
        要望: "${designDetails} ${flowerTypes}"
        
        選択肢: ${STYLE_TAGS.join(', ')}
        
        出力形式: タグ1, タグ2, タグ3 (カンマ区切り、余計な文字なし)
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // 安価なモデルで十分
        messages: [{ role: "user", content: prompt }],
      });
      
      const aiResult = completion.choices[0].message.content;
      targetTags = aiResult.split(',').map(t => t.trim());
      console.log('AI Extracted Tags:', targetTags);
    } else {
      // APIキーがない場合のダミーロジック (単純なキーワードマッチ)
      targetTags = STYLE_TAGS.filter(tag => 
        (designDetails + flowerTypes).includes(tag.split('/')[0])
      );
    }

    // 3. データベースからタグが一致するお花屋さんを検索
    // (PostgreSQLの配列カラムに対するフィルタリング)
    const florists = await prisma.florist.findMany({
      where: {
        status: 'APPROVED',
        specialties: {
          hasSome: targetTags // どれか1つでもヒットすればOK
        }
      },
      select: {
        id: true,
        platformName: true,
        iconUrl: true,
        portfolioImages: true,
        specialties: true
      },
      take: 4 // 4件まで提案
    });

    res.json({ 
      tags: targetTags,
      recommendedFlorists: florists 
    });

  } catch (error) {
    console.error("マッチングエラー:", error);
    res.status(500).json({ message: 'マッチング処理に失敗しました' });
  }
});


// ==========================================
// ★★★【新規】プッシュ通知関連API ★★★
// ==========================================

// 1. 通知の購読登録 (フロントエンドから呼ばれる)
app.post('/api/push/subscribe', authenticateToken, async (req, res) => {
  const { subscription } = req.body;
  const userId = req.user.id;

  try {
    // 既存の登録があれば更新、なければ作成
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    });
    res.status(201).json({ message: '通知をオンにしました' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ message: '登録に失敗しました' });
  }
});

// 2. 通知送信関数 (他のAPIから呼び出すためのヘルパー)
// ※ これはAPIエンドポイントではなく、内部関数として定義します
async function sendPushNotification(userId, title, body, url = '/') {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });

    const payload = JSON.stringify({ title, body, url });

    const promises = subscriptions.map(sub => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };
      return webpush.sendNotification(pushConfig, payload).catch(err => {
        if (err.statusCode === 410) {
          // 無効になった宛先は削除
          prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(()=>{});
        }
      });
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Push send error:', error);
  }
}

// ★ テスト用: 自分に通知を送るAPI
app.post('/api/push/test', authenticateToken, async (req, res) => {
  await sendPushNotification(req.user.id, 'テスト通知', 'これはFLASTALからのテスト通知です！', '/mypage');
  res.json({ message: '送信しました' });
});


// ★★★【新規】デジタルネームボード用 支援者リスト取得API (公開) ★★★
app.get('/api/projects/:id/board', async (req, res) => {
  const { id } = req.params;
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        title: true,
        imageUrl: true,
        planner: { select: { handleName: true } },
        // 支援者リストを取得
        pledges: {
          select: {
            id: true,
            amount: true,
            comment: true,
            user: {
              select: {
                handleName: true,
                iconUrl: true
              }
            }
          },
          orderBy: { amount: 'desc' } // 金額が高い順に表示
        },
        // メッセージカードの投稿も取得
        messages: {
          select: {
            id: true,
            cardName: true,
            content: true
          }
        }
      }
    });

    if (!project) return res.status(404).json({ message: '企画が見つかりません' });

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'ボードデータの取得に失敗しました' });
  }
});

// ★★★【新規】チャット自動翻訳API ★★★
app.post('/api/translate', authenticateToken, async (req, res) => {
  const { text, targetLang } = req.body;

  if (!text) return res.status(400).json({ message: 'テキストが必要です' });

  try {
    let translatedText = '';

    if (process.env.OPENAI_API_KEY) {
      // 言語判定と翻訳をAIに依頼
      // targetLangが指定されていない場合は、「日本語なら英語、それ以外なら日本語」にする
      const systemPrompt = targetLang 
        ? `Translate the following text to ${targetLang}. Only output the translated text.`
        : `Detect the language of the following text. If it is Japanese, translate it to English. If it is not Japanese, translate it to Japanese. Only output the translated text.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
      });

      translatedText = completion.choices[0].message.content.trim();
    } else {
      // ダミーモード (APIキーがない場合)
      translatedText = "[翻訳] " + text + " (AI Translation Demo)";
    }

    res.json({ translatedText });

  } catch (error) {
    console.error("翻訳エラー:", error);
    res.status(500).json({ message: '翻訳に失敗しました' });
  }
});


// ★★★【新規】ユーザープロフィール更新API ★★★
app.patch('/api/users/profile', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { handleName, bio, favoriteGenres, twitterUrl, instagramUrl, isProfilePublic } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        handleName,
        bio,
        favoriteGenres,
        twitterUrl,
        instagramUrl,
        isProfilePublic
      }
    });
    res.json(updatedUser);
  } catch (error) {
    console.error("プロフィール更新エラー:", error);
    res.status(500).json({ message: 'プロフィールの更新に失敗しました' });
  }
});

// ★★★【新規】公開プロフィール取得API (誰でもアクセス可) ★★★
app.get('/api/users/:id/profile', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        handleName: true,
        iconUrl: true,
        bio: true,
        favoriteGenres: true,
        twitterUrl: true,
        instagramUrl: true,
        isProfilePublic: true,
        // 参加した企画 (公開されているもの、かつ完了or成功したもの)
        pledges: {
          where: {
            project: {
              status: { in: ['SUCCESSFUL', 'COMPLETED'] },
              visibility: 'PUBLIC'
            }
          },
          include: {
            project: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                status: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        // 作成した企画
        createdProjects: {
          where: {
            status: { in: ['SUCCESSFUL', 'COMPLETED', 'FUNDRAISING'] },
            visibility: 'PUBLIC'
          },
          select: {
            id: true,
            title: true,
            imageUrl: true,
            status: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) return res.status(404).json({ message: 'ユーザーが見つかりません' });
    if (!user.isProfilePublic) return res.status(403).json({ message: 'このプロフィールは非公開です' });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'プロフィールの取得に失敗しました' });
  }
});


// ==========================================
// ★★★【新規】ゲスト支援機能 ★★★
// ==========================================

// ゲスト支援API (認証不要)
app.post('/api/guest/pledges', async (req, res) => {
  const { projectId, amount, comment, tierId, guestName, guestEmail, paymentMethodId } = req.body;

  // バリデーション
  if (!guestName || !guestEmail) {
    return res.status(400).json({ message: 'お名前とメールアドレスは必須です。' });
  }
  
  // ※ 本来はここでStripe決済を実行するロジックが入ります。
  // 今回は「ポイント機能」を使わず、直接支援レコードを作成する簡易フローとします。
  // (実運用では、ゲスト支援はStripe Checkoutへリダイレクトさせるのが一般的です)

  let pledgeAmount = parseInt(amount, 10);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. 企画の存在確認
      const project = await tx.project.findUnique({ 
        where: { id: projectId },
        include: { planner: true }
      });
      if (!project) throw new Error('企画が見つかりません。');
      if (project.status !== 'FUNDRAISING') throw new Error('この企画は現在募集中ではありません。');

      // コース確認
      if (tierId) {
        const tier = await tx.pledgeTier.findUnique({ where: { id: tierId } });
        if (!tier) throw new Error('支援コースが見つかりません。');
        pledgeAmount = tier.amount;
      }

      if (isNaN(pledgeAmount) || pledgeAmount <= 0) throw new Error('有効な金額ではありません。');

      // 2. 支援レコード作成 (userIdはnull)
      const newPledge = await tx.pledge.create({
        data: {
          amount: pledgeAmount,
          projectId,
          userId: null, // ゲストなのでnull
          guestName,
          guestEmail,
          comment,
          pledgeTierId: tierId || null,
        },
      });

      // 3. 企画の集計金額更新
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: { collectedAmount: { increment: pledgeAmount } },
      });

      // 4. 通知とメール送信
      
      // ゲスト本人へのお礼メール
      const guestEmailContent = `
        <p>${guestName} 様</p>
        <p>FLASTALをご利用いただきありがとうございます。</p>
        <p>以下の企画へのゲスト支援が完了しました。</p>
        <hr>
        <p><strong>企画:</strong> ${project.title}</p>
        <p><strong>支援額:</strong> ${pledgeAmount.toLocaleString()} 円</p>
        <hr>
        <p>企画の進捗は、以下のページからいつでもご確認いただけます。</p>
        <p><a href="${process.env.FRONTEND_URL}/projects/${projectId}">${process.env.FRONTEND_URL}/projects/${projectId}</a></p>
      `;
      sendEmail(guestEmail, '【FLASTAL】ゲスト支援完了のお知らせ', guestEmailContent);

      // 企画者への通知
      await createNotification(
        project.plannerId,
        'NEW_PLEDGE',
        `ゲストの ${guestName} さんから ${pledgeAmount.toLocaleString()}円 の支援がありました！`,
        projectId,
        `/projects/${projectId}`
      );

      // 目標達成チェック (既存ロジックと同様)
      if (updatedProject.collectedAmount >= updatedProject.targetAmount && project.status !== 'SUCCESSFUL') {
        await tx.project.update({ where: { id: projectId }, data: { status: 'SUCCESSFUL' } });
        // (簡易化のため達成メール通知ロジックは省略しますが、必要ならここに追加)
      }

      return newPledge;
    });

    res.status(201).json({ message: 'ゲスト支援が完了しました！', pledge: result });

  } catch (error) {
    console.error('ゲスト支援エラー:', error);
    res.status(400).json({ message: error.message || '支援処理中にエラーが発生しました。' });
  }
});

// ==========================================
// ★★★【新規】会場搬入Wiki機能 API ★★★
// ==========================================

// 1. 搬入情報の投稿 (お花屋さんのみ)
app.post('/api/venues/:venueId/logistics', authenticateToken, async (req, res) => {
  const { venueId } = req.params;
  const { title, description, imageUrls } = req.body;
  const floristId = req.user.id;

  if (req.user.role !== 'FLORIST') {
    return res.status(403).json({ message: '情報の投稿はお花屋さんのみ可能です。' });
  }

  try {
    const info = await prisma.venueLogisticsInfo.create({
      data: {
        venueId,
        contributorId: floristId,
        title,
        description,
        imageUrls: imageUrls || []
      }
    });
    res.status(201).json(info);
  } catch (error) {
    console.error("搬入情報投稿エラー:", error);
    res.status(500).json({ message: '投稿に失敗しました。' });
  }
});

// 2. 搬入情報の取得 (お花屋さん・会場・管理者のみ)
app.get('/api/venues/:venueId/logistics', authenticateToken, async (req, res) => {
  const { venueId } = req.params;
  
  // 一般ユーザーには見せない (セキュリティ/業務用情報のため)
  if (req.user.role === 'USER') {
    return res.status(403).json({ message: '権限がありません。' });
  }

  try {
    const infos = await prisma.venueLogisticsInfo.findMany({
      where: { venueId },
      include: {
        contributor: { select: { platformName: true, iconUrl: true } }
      },
      orderBy: [
        { isOfficial: 'desc' }, // 公式情報を先に
        { helpfulCount: 'desc' }, // 役に立った順
        { createdAt: 'desc' }
      ]
    });
    res.json(infos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '情報の取得に失敗しました。' });
  }
});

// 3. 「役に立った」ボタン
app.patch('/api/logistics/:infoId/helpful', authenticateToken, async (req, res) => {
  const { infoId } = req.params;
  
  if (req.user.role !== 'FLORIST') return res.status(403).send();

  try {
    const updated = await prisma.venueLogisticsInfo.update({
      where: { id: infoId },
      data: { helpfulCount: { increment: 1 } }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'エラーが発生しました' });
  }
});


// ★★★【新規】AI企画文生成API ★★★
app.post('/api/ai/generate-plan', authenticateToken, async (req, res) => {
  const { targetName, eventName, tone, extraInfo } = req.body;

  if (!targetName || !eventName) {
    return res.status(400).json({ message: '推しの名前とイベント名は必須です。' });
  }

  try {
    let title = "";
    let description = "";

    if (process.env.OPENAI_API_KEY) {
      // プロンプトの作成
      const systemPrompt = `
        あなたはアイドルの「フラワースタンド企画」の主催者です。
        以下の情報を元に、ファンが参加したくなるような「企画タイトル」と「企画説明文」を考えてください。
        
        トーン: ${tone || '情熱的・エモい'}
        
        出力は以下のJSON形式のみで行ってください。余計な会話は不要です。
        {
          "title": "30文字以内のキャッチーなタイトル",
          "description": "400文字程度の説明文。ファンへの呼びかけ、企画の想い、参加メリットなどを含める。"
        }
      `;

      const userPrompt = `推しの名前: ${targetName}\nイベント名: ${eventName}\n補足: ${extraInfo || 'なし'}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      });

      const result = completion.choices[0].message.content;
      
      try {
        const parsed = JSON.parse(result);
        title = parsed.title;
        description = parsed.description;
      } catch (e) {
        // JSONパースに失敗した場合のフォールバック
        title = `${targetName}さんへフラスタを贈りませんか？`;
        description = result;
      }

    } else {
      // ダミーモード
      title = `【${targetName}】${eventName}にお花を贈りましょう！`;
      description = `皆さん、こんにちは！\n${eventName}に出演する${targetName}さんに、ファン一同でフラワースタンドを贈りませんか？\n\n${tone === '面白い' ? 'ド派手に目立って笑わせましょう！' : '日頃の感謝を込めて、素敵な思い出を作りましょう。'}\n\nご参加お待ちしております！`;
    }

    res.json({ title, description });

  } catch (error) {
    console.error("AI文章生成エラー:", error);
    res.status(500).json({ message: '文章の生成に失敗しました。' });
  }
});

// ★★★【新規】在庫ロスゼロ（特売情報）機能 ★★★

// 簡易データベース（再起動で消えますが、本番はDBのテーブルにしてください）
let SPECIAL_DEALS = [
  { id: '1', floristId: 'demo-florist', floristName: 'フラワーショップ花子', color: '赤', flower: 'バラ', discount: 20, message: '結婚式キャンセル分の良質な赤バラが大量にあります！' },
  { id: '2', floristId: 'demo-florist-2', floristName: 'FLASTAL本店', color: '青', flower: '染めカーネーション', discount: 15, message: '今週末まで限定！青系フラスタがお得です。' }
];

// 1. 特売情報の登録 (お花屋さん用)
app.post('/api/florists/deals', authenticateToken, (req, res) => {
  if (req.user.role !== 'FLORIST') return res.status(403).json({ message: '権限がありません' });
  
  const { color, flower, discount, message } = req.body;
  const newDeal = {
    id: Date.now().toString(),
    floristId: req.user.id,
    floristName: req.user.shopName || 'お花屋さん',
    color,
    flower,
    discount,
    message
  };
  SPECIAL_DEALS.push(newDeal);
  res.status(201).json(newDeal);
});

// 2. 特売情報の取得 (お花屋さん用)
app.get('/api/florists/deals', authenticateToken, (req, res) => {
  const myDeals = SPECIAL_DEALS.filter(d => d.floristId === req.user.id);
  res.json(myDeals);
});

// 3. マッチング検索 (企画者用)
// キーワード（色や花の名前）が含まれている特売情報を返す
app.get('/api/deals/search', (req, res) => {
  const { keyword } = req.query;
  if (!keyword) return res.json([]);

  const matches = SPECIAL_DEALS.filter(deal => 
    keyword.includes(deal.color) || 
    keyword.includes(deal.flower) ||
    deal.message.includes(keyword)
  );
  res.json(matches);
});


// ==========================================
// ★★★【新規】画像からお花屋さん検索 (GPT-4o Vision) ★★★
// ==========================================
app.post('/api/ai/search-florist-by-image', upload.single('image'), async (req, res) => {
  // 画像がない場合
  if (!req.file) return res.status(400).json({ message: '画像が必要です' });

  // 定義済みのタグリスト (フロントエンドと共通)
  const STYLE_TAGS = [
    'かわいい/キュート', 'クール/かっこいい', 'おしゃれ/モダン', '和風/和モダン',
    'ゴージャス/豪華', 'パステルカラー', 'ビビッドカラー', 'ニュアンスカラー',
    'バルーン装飾', 'ペーパーフラワー', '布・リボン装飾', 'キャラクター/モチーフ',
    '大型/連結', '卓上/楽屋花'
  ];

  try {
    let targetTags = [];

    if (process.env.OPENAI_API_KEY) {
      // 1. 画像をBase64に変換
      const base64Image = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

      // 2. GPT-4o に画像を送ってタグを選んでもらう
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Vision対応モデル
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `このフラワースタンド（スタンド花）の画像を見て、以下のタグリストから最も当てはまる特徴を3つ選んでください。出力はタグのみをカンマ区切りで行ってください。\n\nタグリスト: ${STYLE_TAGS.join(', ')}` },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      });

      const aiResult = response.choices[0].message.content;
      console.log('AI Image Analysis Result:', aiResult);
      
      // 結果を配列に変換
      targetTags = aiResult.split(',').map(t => t.trim());
    } else {
      // ダミーモード
      targetTags = ['かわいい/キュート', 'パステルカラー'];
    }

    // 3. タグにマッチするお花屋さんを検索
    const florists = await prisma.florist.findMany({
      where: {
        status: 'APPROVED',
        specialties: {
          hasSome: targetTags // どれか1つでもヒットすればOK
        }
      },
      select: {
        id: true,
        platformName: true,
        iconUrl: true,
        portfolioImages: true,
        specialties: true,
        address: true
      },
      take: 6
    });

    res.json({ 
      analyzedTags: targetTags,
      florists 
    });

  } catch (error) {
    console.error("画像検索エラー:", error);
    res.status(500).json({ message: '画像の解析に失敗しました' });
  }
});


// ★★★【新規】ムードボード機能 (簡易DB) ★★★
let MOOD_BOARDS = []; // { id, projectId, userId, userName, imageUrl, comment, likes }

// 1. アイテム追加
app.post('/api/projects/:id/moodboard', authenticateToken, (req, res) => {
  const { id } = req.params; // projectId
  const { imageUrl, comment } = req.body;
  
  const newItem = {
    id: Date.now().toString(),
    projectId: id,
    userId: req.user.id,
    userName: req.user.handleName,
    userIcon: req.user.iconUrl,
    imageUrl,
    comment,
    likes: 0,
    likedBy: [] // ユーザーIDの配列
  };
  MOOD_BOARDS.push(newItem);
  res.status(201).json(newItem);
});

// 2. アイテム一覧取得
app.get('/api/projects/:id/moodboard', (req, res) => {
  const { id } = req.params;
  const items = MOOD_BOARDS.filter(item => item.projectId === id);
  res.json(items);
});

// 3. いいね (トグル)
app.patch('/api/moodboard/:itemId/like', authenticateToken, (req, res) => {
  const { itemId } = req.params;
  const item = MOOD_BOARDS.find(i => i.id === itemId);
  
  if (!item) return res.status(404).json({ message: 'アイテムが見つかりません' });

  const userId = req.user.id;
  const alreadyLiked = item.likedBy.includes(userId);

  if (alreadyLiked) {
    item.likedBy = item.likedBy.filter(id => id !== userId);
    item.likes--;
  } else {
    item.likedBy.push(userId);
    item.likes++;
  }
  res.json(item);
});

// 4. 削除
app.delete('/api/moodboard/:itemId', authenticateToken, (req, res) => {
  const { itemId } = req.params;
  const index = MOOD_BOARDS.findIndex(i => i.id === itemId);
  if (index === -1) return res.status(404).json({ message: 'アイテムなし' });
  
  // 投稿者本人かプランナーか花屋のみ削除可能（簡易チェック）
  if (MOOD_BOARDS[index].userId !== req.user.id) {
     // 本来はプロジェクト情報を引いてプランナー権限を確認すべきですが省略
  }
  
  MOOD_BOARDS.splice(index, 1);
  res.status(204).send();
});


// ★★★【新規】推しからのありがとう機能 (簡易DB) ★★★
let OFFICIAL_REACTIONS = {}; // { projectId: { timestamp: Date, comment: String } }

// 1. 推し用: リアクションする (認証不要・誰でも叩けるがURLを知っている人のみ想定)
app.post('/api/projects/:id/official-react', (req, res) => {
  const { id } = req.params;
  // 本来はここで「秘密のトークン」を検証しますが、今回は簡易的にスルーします
  
  OFFICIAL_REACTIONS[id] = {
    timestamp: new Date(),
    comment: "Thank you!!", // 固定または選択式
  };
  
  // 企画者に通知を送る
  // const project = ... (DBから取得して企画者IDを特定)
  // createNotification(plannerId, 'OFFICIAL_REACT', '推しがあなたの企画を見ました！', id, ...);

  res.json({ success: true, message: 'リアクションしました！' });
});

// 2. ステータス確認
app.get('/api/projects/:id/official-status', (req, res) => {
  const { id } = req.params;
  res.json(OFFICIAL_REACTIONS[id] || null);
});


// ★★★【新規】バーチャル・フラスタ機能 (簡易DB) ★★★
let DIGITAL_FLOWERS = []; // { id, projectId, senderName, color, message, style, createdAt }

// 1. デジタルフラスタを贈る
app.post('/api/projects/:id/digital-flowers', (req, res) => {
  const { id } = req.params;
  const { senderName, color, message, style } = req.body;
  
  const newFlower = {
    id: Date.now().toString(),
    projectId: id,
    senderName: senderName || '名無し',
    color: color || 'pink',
    message: message || '',
    style: style || 'basic',
    createdAt: new Date()
  };
  
  DIGITAL_FLOWERS.push(newFlower);
  
  // リアルタイム反映のためにSocket.IOで通知してもOK
  io.to(id).emit('newDigitalFlower', newFlower);

  res.status(201).json(newFlower);
});

// 2. 一覧取得
app.get('/api/projects/:id/digital-flowers', (req, res) => {
  const { id } = req.params;
  const flowers = DIGITAL_FLOWERS.filter(f => f.projectId === id);
  res.json(flowers);
});


// ==========================================
// ★★★【新規】イベント情報のエコシステム ★★★
// ==========================================

// 1. AIによるイベント情報の抽出・登録 (Web/SNSのテキストから)
app.post('/api/events/ai-parse', authenticateToken, async (req, res) => {
  const { text, sourceUrl } = req.body; // text: WebサイトやSNSの本文, sourceUrl: そのURL

  if (!text) return res.status(400).json({ message: '解析するテキスト情報が必要です。' });

  try {
    let eventData = null;

    if (process.env.OPENAI_API_KEY) {
      // GPT-4o等を使って、非構造化テキストからJSONを抽出させる
      const systemPrompt = `
        あなたはイベント情報の抽出AIです。
        ユーザーから提供されたテキスト（SNSの投稿やWebニュース）から、イベント情報を抽出してください。
        
        出力は以下のJSON形式のみで行ってください。余計な会話は不要です。
        日付が不明確な場合は null にしてください。
        {
          "title": "イベント名",
          "description": "イベントの概要（出演者など）",
          "eventDate": "YYYY-MM-DDTHH:mm:ss.sssZ" (ISO 8601形式),
          "venueName": "会場名"
        }
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `以下のテキストからイベント情報を抽出して:\n\n${text}` }
        ],
        response_format: { type: "json_object" } // JSONモードを強制
      });

      const result = completion.choices[0].message.content;
      eventData = JSON.parse(result);
    } else {
      // ダミーデータ
      eventData = {
        title: "【AI解析】サンプルライブ2025",
        description: "AIがテキストから抽出したイベント情報のサンプルです。",
        eventDate: new Date().toISOString(),
        venueName: "日本武道館"
      };
    }

    // 会場名の紐付け（既存のVenueテーブルから検索してIDを割り当てるロジックを入れるとベター）
    // 今回は簡易的にVenueテーブルを名前で検索
    let venueId = null;
    if (eventData.venueName) {
      const venue = await prisma.venue.findFirst({
        where: { venueName: { contains: eventData.venueName } }
      });
      if (venue) venueId = venue.id;
    }

    // イベント作成
    const newEvent = await prisma.event.create({
      data: {
        title: eventData.title,
        description: eventData.description,
        eventDate: new Date(eventData.eventDate),
        venueId: venueId,
        sourceType: 'AI', // ソースはAI
        sourceUrl: sourceUrl || null,
        // AI登録の場合は、とりあえず「スタンド花許可」などはFalse(不明)にしておく
        isStandAllowed: false 
      }
    });

    res.status(201).json({ message: 'AIがイベント情報を解析・登録しました。', event: newEvent });

  } catch (error) {
    console.error("AIイベント解析エラー:", error);
    res.status(500).json({ message: '情報の解析に失敗しました。' });
  }
});

// 2. ユーザーによるイベント手動登録
app.post('/api/events/user-submit', authenticateToken, async (req, res) => {
  const { title, description, eventDate, venueId, sourceUrl } = req.body;

  if (!title || !eventDate) {
    return res.status(400).json({ message: '必須項目が不足しています。' });
  }

  try {
    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        eventDate: new Date(eventDate),
        venueId: venueId || null,
        sourceType: 'USER', // ソースはユーザー
        sourceUrl: sourceUrl,
        isStandAllowed: false // デフォルトは不可（確認待ち）
      }
    });
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ message: 'イベントの登録に失敗しました。' });
  }
});

// 3. イベント一覧取得 (BANされていないもののみ)
// 既存の GET /api/events を修正または新規作成
app.get('/api/events/public', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        eventDate: { gte: new Date() }, // 未来のイベント
        isBanned: false // ★ BANされていないものだけ表示
      },
      include: { 
        venue: true,
        _count: { select: { reports: true } } // 通報数も含める（フロントでの警告表示用などに）
      },
      orderBy: { eventDate: 'asc' }
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: '取得失敗' });
  }
});

// 4. イベントを通報する (ユーザー用)
app.post('/api/events/:eventId/report', authenticateToken, async (req, res) => {
  const { eventId } = req.params;
  const { reason } = req.body;
  const reporterId = req.user.id;

  try {
    await prisma.eventReport.create({
      data: {
        eventId,
        reporterId,
        reason
      }
    });
    
    // 一定数以上通報が溜まったら自動的にフラグを立てるなどのロジックも可
    // const count = await prisma.eventReport.count({ where: { eventId } });
    // if (count > 5) { ... }

    res.status(201).json({ message: '通報を受け付けました。運営が確認します。' });
  } catch (error) {
    res.status(500).json({ message: '通報処理に失敗しました。' });
  }
});

// 5. 【管理者用】通報一覧の確認
app.get('/api/admin/event-reports', requireAdmin, async (req, res) => {
  try {
    const reports = await prisma.eventReport.findMany({
      where: { status: 'PENDING' },
      include: {
        event: true,
        reporter: { select: { handleName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: '取得失敗' });
  }
});

// 6. 【管理者用】イベントをBAN（非表示）にする
app.patch('/api/admin/events/:eventId/ban', requireAdmin, async (req, res) => {
  const { eventId } = req.params;
  const { isBanned } = req.body; // true = BAN, false = 解除

  try {
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { isBanned: isBanned }
    });

    // 関連するレポートも処理済みにする
    if (isBanned) {
      await prisma.eventReport.updateMany({
        where: { eventId: eventId },
        data: { status: 'RESOLVED' }
      });
    }

    res.json({ message: isBanned ? 'イベントをBANしました' : 'BANを解除しました', event: updatedEvent });
  } catch (error) {
    res.status(500).json({ message: '更新失敗' });
  }
});

// 【管理者用】通報を「問題なし」として解決済みにする（BANはしない）
app.patch('/api/admin/event-reports/:reportId/dismiss', requireAdmin, async (req, res) => {
  const { reportId } = req.params;
  try {
    await prisma.eventReport.update({
      where: { id: reportId },
      data: { status: 'RESOLVED' } // 解決済みにする
    });
    res.json({ message: '通報を却下しました（イベントは表示されたままです）' });
  } catch (error) {
    res.status(500).json({ message: '処理に失敗しました' });
  }
});


// ==========================================
// ★★★【新規】チャット通報機能 API ★★★
// ==========================================

// 1. グループチャットの通報
app.post('/api/group-chat/:messageId/report', authenticateToken, async (req, res) => {
  const { messageId } = req.params;
  const { reason } = req.body;
  const reporterId = req.user.id;

  if (!reason) return res.status(400).json({ message: '通報理由を入力してください。' });

  try {
    await prisma.groupChatMessageReport.create({
      data: {
        messageId,
        reporterId,
        reason
      }
    });
    res.status(201).json({ message: '通報しました。運営が確認します。' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '通報に失敗しました。' });
  }
});

// 2. 個別チャットの通報
app.post('/api/chat/:messageId/report', authenticateToken, async (req, res) => {
  const { messageId } = req.params;
  const { reason } = req.body;
  const reporterId = req.user.id; // user.id または florist.id

  if (!reason) return res.status(400).json({ message: '通報理由を入力してください。' });

  try {
    await prisma.chatMessageReport.create({
      data: {
        messageId,
        reporterId,
        reason
      }
    });
    res.status(201).json({ message: '通報しました。運営が確認します。' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '通報に失敗しました。' });
  }
});

// 3. 【管理者用】チャット通報一覧取得
app.get('/api/admin/chat-reports', requireAdmin, async (req, res) => {
  try {
    // グループチャットと個別チャットの通報をまとめて取得
    const groupReports = await prisma.groupChatMessageReport.findMany({
      where: { status: 'PENDING' },
      include: { 
        message: true,
        reporter: { select: { handleName: true } }
      }
    });
    const directReports = await prisma.chatMessageReport.findMany({
      where: { status: 'PENDING' },
      include: { 
        message: true,
        reporter: { select: { handleName: true } }
      }
    });

    // フロントで扱いやすいように整形して結合
    const formatted = [
      ...groupReports.map(r => ({ ...r, type: 'GROUP', content: r.message.content })),
      ...directReports.map(r => ({ ...r, type: 'DIRECT', content: r.message.content }))
    ];

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: '取得失敗' });
  }
});

// A. 成功企画の投稿 API
app.post('/api/projects/:projectId/posts', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    const { content, postType } = req.body;
    const userId = req.user.id;

    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project || project.status !== 'COMPLETED') {
            return res.status(403).json({ message: '完了済みの企画にのみ投稿できます。' });
        }

        // 企画者または支援者であるかを確認
        const isPlanner = project.plannerId === userId;
        const isPledger = await prisma.pledge.findFirst({ where: { projectId, userId } });

        if (!isPlanner && !isPledger) {
            return res.status(403).json({ message: 'この企画の企画者または支援者のみ投稿できます。' });
        }
        
        const newPost = await prisma.projectPost.create({ // ★ ProjectPost モデルを使用
            data: {
                projectId,
                userId,
                content,
                postType: postType || 'SUCCESS_STORY',
            },
        });
        res.status(201).json(newPost);
    } catch (error) {
        console.error("成功企画投稿エラー:", error);
        res.status(500).json({ message: '投稿に失敗しました。' });
    }
});

// B. 投稿一覧取得 API
app.get('/api/projects/:projectId/posts', async (req, res) => {
    const { projectId } = req.params;
    try {
        const posts = await prisma.projectPost.findMany({ // ★ ProjectPost モデルを使用
            where: { projectId },
            include: { 
                user: { select: { handleName: true, iconUrl: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: '投稿の取得に失敗しました。' });
    }
});


// ★★★【新規】成功企画ギャラリー用フィードデータ取得API ★★★
app.get('/api/gallery/feed', async (req, res) => {
    try {
        // 1. 完了した企画（COMPLETED）を取得
        const completedProjects = await prisma.project.findMany({
            where: {
                status: 'COMPLETED',
                visibility: 'PUBLIC', // 公開企画のみ
                completionImageUrls: { hasSome: [] } // 完了写真が1枚以上あるもののみ
            },
            select: {
                id: true,
                title: true,
                planner: { select: { handleName: true, iconUrl: true } },
                completionImageUrls: true,
                completionComment: true,
                createdAt: true,
                // 紐づく成功ストーリー投稿（掲示板）を取得
                successPosts: {
                    select: { id: true, content: true, user: { select: { handleName: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 1 // 最新の投稿のみ
                },
                // いいね/コメント数の集計はフロントで対応するか、別のAPIで取得
            },
            orderBy: { deliveryDateTime: 'desc' }, // 新しいものから表示
            take: 20 // 20件のフィード項目
        });

        res.status(200).json(completedProjects);
    } catch (error) {
        console.error("ギャラリーフィード取得エラー:", error);
        res.status(500).json({ message: 'ギャラリーデータの取得に失敗しました。' });
    }
});


// ★★★【新規】グループチャット要約API ★★★
app.post('/api/group-chat/:projectId/summarize', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id;
    
    // 企画者または支援者であるかを確認 (権限チェック)
    const isPlanner = await prisma.project.count({ where: { id: projectId, plannerId: userId } });
    const isPledger = await prisma.pledge.count({ where: { projectId, userId } });

    if (isPlanner === 0 && isPledger === 0) {
        return res.status(403).json({ message: '要約機能は企画の参加者のみ利用できます。' });
    }

    try {
        // 1. グループチャットの履歴を取得 (最新の50件など、AIのトークン制限に応じて調整)
        const messages = await prisma.groupChatMessage.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            take: 50, // 最新50件に制限
            include: { user: { select: { handleName: true } } }
        });
        
        if (messages.length === 0) {
            return res.status(404).json({ message: '要約するチャット履歴がありません。' });
        }

        // 2. AIに渡すプロンプトを作成
        // 履歴を時間順に戻す
        const chatHistory = messages.reverse().map(msg => 
            `[${msg.user.handleName}] (${msg.createdAt.toLocaleTimeString()}): ${msg.content}`
        ).join('\n');

        const systemPrompt = `
            あなたはフラワースタンド（フラスタ）企画のAIアシスタントです。
            以下のチャット履歴を読み、企画者や支援者にとって最も重要な「決定事項」「デザインの方向性」「次のアクション」の3点に絞って、箇条書きで分かりやすく要約してください。
            
            出力形式は、以下の構造を持つMarkdown形式のみで行ってください。
            ### [要約タイトル]
            * **決定事項**: ...
            * **デザイン**: ...
            * **次のアクション**: ...
        `;

        let summary = '';
        
        // 3. AIによる要約実行
        if (process.env.OPENAI_API_KEY) {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo", // コスト効率の良いモデルを使用
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `【チャット履歴】\n${chatHistory}` }
                ],
            });
            summary = completion.choices[0].message.content.trim();
        } else {
            // ダミーモード
            summary = `### AI要約 (ダミー)
* **決定事項**: 次回ミーティングは水曜日20時。
* **デザイン**: メインカラーは青系、バルーンは追加しない。
* **次のアクション**: 企画者が花屋に見積もりを依頼。`;
        }
        
        // 4. 要約結果をデータベースに保存 (ProjectPostの新しいタイプとして保存することを検討)
        // 今回はシンプルに、要約結果をチャットにメッセージとして投稿する、または一時的に返すことにします。
        
        // シンプルに結果を返す
        res.status(200).json({ summary });

    } catch (error) {
        console.error("AIチャット要約エラー:", error);
        res.status(500).json({ message: 'チャットの要約中にエラーが発生しました。' });
    }
});



// ★★★【新規】管理者向け：チャット通報一覧取得API ★★★
app.get('/api/admin/chat-reports', requireAdmin, async (req, res) => {
    try {
        // グループチャットの通報を取得
        const groupReports = await prisma.groupChatMessageReport.findMany({
            where: { status: 'PENDING' },
            include: { 
                message: { select: { content: true, projectId: true } },
                reporter: { select: { handleName: true } }
            }
        });
        
        // 個別チャットの通報を取得
        const directReports = await prisma.chatMessageReport.findMany({
            where: { status: 'PENDING' },
            include: { 
                message: { select: { content: true } }, // 個別チャットメッセージ
                reporter: { select: { handleName: true } }
            }
        });

        // 結合して、フロントで扱いやすい形式に整形
        const formatted = [
            ...groupReports.map(r => ({ 
                ...r, 
                type: 'GROUP', 
                content: r.message.content,
                projectId: r.message.projectId // どの企画か特定
            })),
            ...directReports.map(r => ({ 
                ...r, 
                type: 'DIRECT', 
                content: r.message.content 
            }))
        ];

        res.status(200).json(formatted);
    } catch (error) {
        console.error("チャット通報リスト取得エラー:", error);
        res.status(500).json({ message: '通報データの取得に失敗しました。' });
    }
});
// ===================================
// ★★★★★   Socket.IOの処理   ★★★★★
// ===================================

// ★ 1. Socket.IO用 JWT認証ミドルウェア
// クライアント接続時にトークンを検証し、ユーザー情報をソケットに紐付けます
io.use((socket, next) => {
  const token = socket.handshake.auth.token; // クライアント側は { auth: { token: "Bearer ..." } } で接続

  if (!token) {
    return next(new Error('認証エラー: トークンがありません。'));
  }

  // "Bearer " を除去して検証
  const tokenString = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

  jwt.verify(tokenString, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('認証エラー: トークンが無効です。'));
    }
    // socketオブジェクトにユーザー情報を保存 (id, role, handleName等)
    socket.user = decoded; 
    next();
  });
});

// ★ 2. 接続後のイベントハンドラ
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.id} (Role: ${socket.user.role})`);

  // --- ルーム参加 ---
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.user.id} joined room ${roomId}`);
  });
  
  socket.on('joinProjectRoom', (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.user.id} joined project room ${projectId}`);
  });

  // --- 1対1チャット (お花屋さん vs ユーザー) ---
  socket.on('sendMessage', async ({ roomId, content, messageType, fileUrl, fileName }) => {
    try {
      const userId = socket.user.id;
      const userRole = socket.user.role;
      
      // 送信者のタイプとIDをトークンから自動判定
      let senderType = 'USER';
      let floristId = null;
      let pledgedUserId = null;

      if (userRole === 'FLORIST') {
          senderType = 'FLORIST';
          floristId = userId;
      } else {
          senderType = 'USER';
          pledgedUserId = userId;
      }

      // NGワードチェック (テキストメッセージの場合)
      if (messageType === 'TEXT' && content) {
          const containsNGWord = NG_WORDS.some(word => content.toLowerCase().includes(word.toLowerCase()));
          if (containsNGWord) {
            socket.emit('messageError', '送信できない単語が含まれています。内容を修正してください。');
            return; 
          }
      }

      // メッセージ保存
      const newMessage = await prisma.chatMessage.create({
        data: { 
          chatRoomId: roomId,
          senderType, 
          userId: pledgedUserId, // USERの場合のみセット
          floristId: floristId,  // FLORISTの場合のみセット
          messageType: messageType || 'TEXT',
          content: content || null,
          fileUrl: fileUrl || null,
          fileName: fileName || null,
        },
        include: {
          user: { select: { handleName: true } },
          florist: { select: { shopName: true } }
        }
      });

      // ルーム全員に送信
      io.to(roomId).emit('receiveMessage', newMessage);

      // --- AIボット (LARUbot) 連動ロジック (ユーザー発言時のみ) ---
      if (senderType === 'USER') {
        const roomInfo = await prisma.chatRoom.findUnique({
          where: { id: roomId },
          include: { offer: { include: { florist: true } } }
        });
        const targetFlorist = roomInfo?.offer?.florist;

        // お花屋さんがBotキーを設定している場合
        if (targetFlorist && targetFlorist.laruBotApiKey) {
          try {
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
            }
          } catch (aiError) {
            console.error("LARUbot API Error:", aiError);
          }
        }
      }

    } catch (error) {
      console.error('Message processing error:', error);
      socket.emit('messageError', 'メッセージの送信中にエラーが発生しました。');
    }
  });

  // --- グループチャット (企画ごとの掲示板) ---
  socket.on('sendGroupChatMessage', async ({ projectId, templateId, content, messageType, fileUrl, fileName }) => {
    try {
      const userId = socket.user.id; // ✅ トークンから取得

      // 権限チェック
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) return;
      
      const pledge = await prisma.pledge.findFirst({ where: { projectId, userId } });
      const isPlanner = project.plannerId === userId;

      if (!pledge && !isPlanner) {
          socket.emit('messageError', 'このグループチャットに参加する権限がありません。');
          return;
      }

      // NGワードチェック
      if (messageType === 'TEXT' && content && content.trim() !== '') {
        const containsNGWord = NG_WORDS.some(word => content.toLowerCase().includes(word.toLowerCase()));
        if (containsNGWord) {
          socket.emit('messageError', '送信できない単語が含まれています。');
          return;
        }
      }

      // テンプレート使用時のチェック
      if (templateId) {
        const template = CHAT_TEMPLATES.find(t => t.id === templateId);
        if (!template) return;
        if (template.hasCustomInput && (!content || content.trim() === '')) return;
      }
      
      // 保存
      const newMessage = await prisma.groupChatMessage.create({
        data: {
          projectId,
          userId,
          templateId: templateId || null,
          messageType: messageType || 'TEXT',
          content: content || null,
          fileUrl: fileUrl || null,
          fileName: fileName || null,
        },
        include: { 
          user: { select: { handleName: true, iconUrl: true } },
          reactions: true 
        } 
      });

      io.to(projectId).emit('receiveGroupChatMessage', newMessage);
    } catch (error) {
      console.error("Group chat message error:", error);
      socket.emit('messageError', 'メッセージの送信に失敗しました。');
    }
  });

  // --- リアクション機能 (DB直接操作版) ---
  socket.on('handleReaction', async ({ messageId, emoji }) => {
    const userId = socket.user.id; // ✅ トークンから取得

    if (!messageId || !emoji) return;

    try {
        // メッセージの存在確認とプロジェクトIDの取得
        const message = await prisma.groupChatMessage.findUnique({ 
            where: { id: messageId },
            select: { projectId: true }
        });
        
        if (!message) return;

        // 既存リアクションの検索
        const existingReaction = await prisma.groupChatMessageReaction.findUnique({
            where: {
                messageId_userId_emoji: {
                    messageId: messageId,
                    userId: userId,
                    emoji: emoji,
                },
            },
        });

        if (existingReaction) {
            // 既に存在すれば削除 (トグルOFF)
            await prisma.groupChatMessageReaction.delete({
                where: { id: existingReaction.id },
            });
            
            // 全員に通知
            io.to(message.projectId).emit('reactionRemoved', { messageId, userId, emoji }); 
        } else {
            // 存在しなければ作成 (トグルON)
            const newReaction = await prisma.groupChatMessageReaction.create({
                data: { messageId, userId, emoji },
                include: { user: { select: { handleName: true } } }
            });
            
            // 全員に通知
            io.to(message.projectId).emit('reactionAdded', newReaction); 
        }

    } catch (error) {
        console.error("Socket Reaction handling error:", error);
        socket.emit('messageError', 'リアクションの操作に失敗しました。');
    }
  });

  // --- 切断 ---
  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.user.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});