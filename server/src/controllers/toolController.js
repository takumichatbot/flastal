import sharp from 'sharp';
import { Document, NodeIO } from '@gltf-transform/core';
import cloudinary from '../config/cloudinary.js';
import webpush from 'web-push';
import prisma from '../config/prisma.js';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ★ Google AI (Gemini) のインポート
import { GoogleGenerativeAI } from '@google/generative-ai';
// ★ Google Cloud 認証用 (Imagen REST API呼出用) のインポート
import { GoogleAuth } from 'google-auth-library';

// ★ Gemini (テキスト・画像解析用) の初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ★ GCP認証の初期化 (VertexAIパッケージの代わりにこちらを使います)
const gcpAuth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

// AWS S3 Clientの初期化
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: false, 
});

// ==========================================
// 1. AWS S3 署名付きURL発行
// ==========================================
export const getS3UploadUrl = async (req, res) => {
    try {
        const { fileName, fileType } = req.body;

        if (!fileName || !fileType) {
            return res.status(400).json({ message: 'ファイル情報が不足しています。' });
        }

        const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME;
        if (!bucketName) {
            console.error('S3バケット名の環境変数が未設定 (AWS_S3_BUCKET_NAME / AWS_BUCKET_NAME)');
            return res.status(500).json({ message: 'サーバー設定エラー: S3バケット未設定' });
        }

        const extension = fileName.split('.').pop();
        const fileKey = `events/${Date.now()}.${extension}`;

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
            ContentType: fileType,
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

        res.json({
            uploadUrl: signedUrl,
            fileUrl: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`
        });
    } catch (err) {
        console.error("S3署名エラー:", err);
        res.status(500).json({ message: "署名付きURLの生成に失敗しました" });
    }
};

// ==========================================
// 2. ARパネル生成 (GLB)
// ==========================================
export const createArPanel = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: '画像ファイルがありません。' });

        const image = sharp(req.file.buffer);
        const metadata = await image.metadata();
        
        const targetHeight = 1.8; 
        const aspectRatio = metadata.width / metadata.height;
        const targetWidth = targetHeight * aspectRatio;

        const doc = new Document();
        const buffer = doc.createBuffer();
        
        const texture = doc.createTexture('base')
            .setMimeType(req.file.mimetype)
            .setImage(req.file.buffer);

        const material = doc.createMaterial('panelMat')
            .setBaseColorTexture(texture)
            .setAlphaMode('BLEND')
            .setDoubleSided(true)
            .setMetallicFactor(0)
            .setRoughnessFactor(1);

        const halfW = targetWidth / 2;
        const yBottom = 0;
        const yTop = targetHeight;

        const vertices = new Float32Array([
            -halfW, yBottom, 0,  halfW, yBottom, 0,
            -halfW, yTop,    0,  halfW, yTop,    0,
        ]);
        const uvs = new Float32Array([ 0, 1,  1, 1,  0, 0,  1, 0 ]);
        const indices = new Uint16Array([ 0, 1, 2,  2, 1, 3 ]);

        const positionAccessor = doc.createAccessor().setArray(vertices).setType('VEC3').setBuffer(buffer);
        const uvAccessor = doc.createAccessor().setArray(uvs).setType('VEC2').setBuffer(buffer);
        const indexAccessor = doc.createAccessor().setArray(indices).setType('SCALAR').setBuffer(buffer);

        const primitive = doc.createPrimitive()
            .setMaterial(material)
            .setIndices(indexAccessor)
            .setAttribute('POSITION', positionAccessor)
            .setAttribute('TEXCOORD_0', uvAccessor);

        const mesh = doc.createMesh('panelMesh').addPrimitive(primitive);
        const node = doc.createNode('panelNode').setMesh(mesh);
        doc.createScene('scene').addChild(node);

        const io = new NodeIO(doc);
        const glbBuffer = await io.writeBinary(doc);

        res.setHeader('Content-Type', 'model/gltf-binary');
        res.setHeader('Content-Disposition', 'attachment; filename="flower-stand-panel.glb"');
        res.send(Buffer.from(glbBuffer));

    } catch (error) {
        console.error("ARパネル生成エラー:", error);
        res.status(500).json({ message: 'ARデータの生成に失敗しました。' });
    }
};

// ==========================================
// 3. AI画像生成 (Gemini拡張 + Imagen 4 Ultra REST API)
// ==========================================
export const generateAiImage = async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: 'プロンプトが必要です。' });

    try {
        // ★ STEP 1: Geminiによるプロンプト拡張
        const promptEnhancerModel = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: `あなたはアイドルのライブイベント等に贈られる「フラワースタンド（祝花）」専門のプロデザイナーです。
ユーザーから入力された短いキーワードを、画像生成AI（Imagen）が最高品質の画像を出力するための「英語のプロンプト」に変換してください。

【厳守するルール】
1. ユーザーが特に「卓上」「アレンジメント」と指定しない限り、基本は「豪華なフラワースタンド（スタンド花・フラスタ）」を前提とすること。
2. もし「卓上」と指定があれば「Tabletop flower arrangement」とすること。
3. "masterpiece", "highly detailed", "photorealistic", "beautiful lighting", "luxury concert flower stand" などの高品質化キーワードを必ず含めること。
4. 出力は「英語のプロンプト文字列のみ」とすること。挨拶や解説は一切不要。`
        });

        const enhancedResult = await promptEnhancerModel.generateContent(prompt);
        const finalPrompt = enhancedResult.response.text().trim(); 
        
        console.log(`[AI Image] Original: ${prompt} \n-> Enhanced: ${finalPrompt}`);

        // ★ STEP 2: Imagen 4 Ultra へのリクエスト (REST API方式)
        const location = process.env.GOOGLE_CLOUD_LOCATION || 'asia-northeast1';
        
        // 認証情報の自動取得
        const client = await gcpAuth.getClient();
        const projectId = await gcpAuth.getProjectId();
        const accessToken = await client.getAccessToken();

        // API URL の構築
        const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-4.0-ultra-generate-001:predict`;

        const requestBody = {
            instances: [{ prompt: finalPrompt }],
            parameters: {
                sampleCount: 1,
                aspectRatio: "1:1",
            }
        };

        // 直接通信でSDKのエラーを回避！
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(`Imagen API Error: ${JSON.stringify(errData)}`);
        }

        const data = await response.json();

        if (!data.predictions || data.predictions.length === 0) {
            throw new Error('画像の生成結果が空でした。');
        }

        const base64Image = data.predictions[0].bytesBase64Encoded;
        const dataUri = `data:image/png;base64,${base64Image}`;

        const uploadResult = await cloudinary.uploader.upload(dataUri, { 
            folder: 'flastal_ai_generated' 
        });
        
        res.status(200).json({ url: uploadResult.secure_url });

    } catch (error) {
        console.error("Imagen 4 生成エラー:", error);
        res.status(500).json({ 
            message: '画像の生成に失敗しました。', 
            detail: error.message 
        });
    }
};

// ==========================================
// 4. AIによるテキスト解析 (Gemini 2.5 Flash)
// ==========================================

export const translateText = async (req, res) => {
    const { text, targetLang } = req.body;
    if (!text) return res.status(400).json({ message: 'テキストが必要です' });

    try {
        let translatedText = '';
        if (process.env.GEMINI_API_KEY) {
            const systemPrompt = targetLang 
                ? `Translate to ${targetLang}. Only output text.`
                : `Detect language. If JP -> EN, if others -> JP. Only output text.`;
            
            const model = genAI.getGenerativeModel({ 
                model: "gemini-2.5-flash",
                systemInstruction: systemPrompt
            });
            const result = await model.generateContent(text);
            translatedText = result.response.text().trim();
        } else {
            translatedText = "[翻訳] " + text;
        }
        res.json({ translatedText });
    } catch (error) {
        console.error("Gemini 翻訳エラー:", error);
        res.status(500).json({ message: '翻訳エラー' });
    }
};

// 企画説明文生成 (Gemini)
export const generatePlanText = async (req, res) => {
    const { targetName, eventName, tone, extraInfo } = req.body;
    try {
        let title = "", description = "";
        
        if (process.env.GEMINI_API_KEY) {
            const prompt = `推し: ${targetName}, イベント: ${eventName}, トーン: ${tone}, 補足: ${extraInfo}。
支援者が参加したくなるようなフラスタ企画の説明文を作成してください。`;

            const model = genAI.getGenerativeModel({ 
                model: "gemini-2.5-flash",
                generationConfig: { responseMimeType: "application/json" },
                systemInstruction: `必ず以下のJSONスキーマに従って出力してください。\n{"title": "企画タイトル", "description": "企画の詳しい説明文"}`
            });

            const result = await model.generateContent(prompt);
            const parsed = JSON.parse(result.response.text());
            
            title = parsed.title;
            description = parsed.description;
        } else {
            title = `${targetName}様への祝花企画`;
            description = `${eventName}でのご出演を祝して、フラスタを贈る企画です。`;
        }
        res.json({ title, description });
    } catch (error) {
        console.error("Gemini テキスト生成エラー:", error);
        res.status(500).json({ message: 'AIによる文章生成に失敗しました。時間をおいてお試しください。' });
    }
};

// イベント情報解析 (Gemini)
export const parseEventInfo = async (req, res) => {
    const { text, sourceUrl } = req.body;
    try {
        let eventData = { title: 'AI解析イベント', description: '詳細不明', eventDate: new Date().toISOString() };
        
        if (process.env.GEMINI_API_KEY) {
            const prompt = `以下のテキストからイベント情報を抽出してください:\n\n${text}`;
            
            const model = genAI.getGenerativeModel({ 
                model: "gemini-2.5-flash",
                generationConfig: { responseMimeType: "application/json" },
                systemInstruction: `Extract information and strictly output in this JSON format: {"title": "Event Title", "description": "Summary of the event", "eventDate": "ISO 8601 Date string", "venueName": "Name of the venue"}`
            });

            const result = await model.generateContent(prompt);
            eventData = JSON.parse(result.response.text());
        }

        let venueId = null;
        if (eventData.venueName) {
            const venue = await prisma.venue.findFirst({ where: { venueName: { contains: eventData.venueName } } });
            if (venue) venueId = venue.id;
        }

        const newEvent = await prisma.event.create({
            data: {
                title: eventData.title,
                description: eventData.description,
                eventDate: eventData.eventDate ? new Date(eventData.eventDate) : new Date(),
                venueId,
                sourceType: 'AI',
                sourceUrl,
                isStandAllowed: false
            }
        });
        res.status(201).json({ message: '登録しました', event: newEvent });
    } catch (error) {
        console.error("Gemini イベント解析エラー:", error);
        res.status(500).json({ message: '解析エラー' });
    }
};

// 画像からお花屋さん検索 (Gemini Vision)
export const searchFloristByImage = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: '画像なし' });
    const STYLE_TAGS = ['かわいい/キュート', 'クール/かっこいい', 'おしゃれ/モダン', '和風/和モダン', 'ゴージャス/豪華', 'パステルカラー', 'ビビッドカラー', 'バルーン装飾', 'ペーパーフラワー', '大型/連結', '卓上/楽屋花'];
    
    try {
        let targetTags = ['かわいい/キュート']; 
        if (process.env.GEMINI_API_KEY) {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `Select exactly 3 tags from this list that best match the style of the flower arrangement in the image: ${STYLE_TAGS.join(', ')}. Output only the selected tags separated by commas, with no other text.`;
            
            const imagePart = {
                inlineData: {
                    data: req.file.buffer.toString("base64"),
                    mimeType: req.file.mimetype
                }
            };

            const result = await model.generateContent([prompt, imagePart]);
            targetTags = result.response.text().split(',').map(t => t.trim());
        }
        
        const florists = await prisma.florist.findMany({
            where: { status: 'APPROVED', specialties: { hasSome: targetTags } },
            select: { id: true, platformName: true, iconUrl: true, portfolioImages: true, specialties: true, address: true },
            take: 6
        });
        res.json({ analyzedTags: targetTags, florists });
    } catch(e) { 
        console.error("Gemini 画像検索解析エラー:", e);
        res.status(500).json({ message: '解析エラー' }); 
    }
};

// ==========================================
// 5. Push通知 (WebPush) & クラウドアップロード
// ==========================================
export const subscribePush = async (req, res) => {
    const { subscription } = req.body;
    const userId = req.user.id;
    try {
        await prisma.pushSubscription.upsert({
            where: { endpoint: subscription.endpoint },
            update: { userId, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
            create: { userId, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth }
        });
        res.status(201).json({ message: '通知登録完了' });
    } catch (error) {
        console.error("Push登録エラー:", error);
        res.status(500).json({ message: '登録エラー' });
    }
};

export const sendTestPush = async (req, res) => {
    res.json({ message: 'テスト送信機能は未実装です' });
};

export const registerNativeDeviceToken = async (req, res) => {
    const { token } = req.body;
    const userId = req.user.id;
    if (!token) return res.status(400).json({ message: 'tokenは必須です' });
    try {
        // APNs device token を PushSubscription の endpoint フィールドに保存
        // p256dh / auth は Web Push 専用フィールドのためプレースホルダーを使用
        await prisma.pushSubscription.upsert({
            where: { endpoint: `apns:${token}` },
            update: { userId },
            create: { userId, endpoint: `apns:${token}`, p256dh: 'native', auth: 'native' }
        });
        res.status(201).json({ message: 'デバイストークンを登録しました' });
    } catch (error) {
        console.error('[NativePush] デバイストークン登録エラー:', error);
        res.status(500).json({ message: '登録に失敗しました' });
    }
};

// 画像アップロード用 (Cloudinary用)
export const uploadImage = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'ファイルなし' });
    cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
        if (error) return res.status(500).json({ message: 'アップロード失敗' });
        res.status(200).json({ url: result.secure_url });
    }).end(req.file.buffer);
};