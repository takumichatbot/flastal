import sharp from 'sharp';
import { Document, NodeIO } from '@gltf-transform/core';
import cloudinary from '../config/cloudinary.js';
import OpenAI from 'openai';
import webpush from 'web-push';
import prisma from '../config/prisma.js';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

        const extension = fileName.split('.').pop();
        const fileKey = `events/${Date.now()}.${extension}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileKey,
            ContentType: fileType,
        });

        // 5分間有効な署名付きURLを生成
        const signedUrl = await getSignedUrl(s3Client, command, { 
            expiresIn: 300,
            unhoistableHeaders: new Set(['content-type']),
        });
        
        res.json({ 
            uploadUrl: signedUrl, 
            fileUrl: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}` 
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
// 3. AI画像生成 (DALL-E)
// ==========================================
export const generateAiImage = async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: 'プロンプトが必要です。' });

    // APIキーがない場合は即座にエラーを返す (Unsplashへのフォールバックは削除)
    if (!process.env.OPENAI_API_KEY) {
        console.error("OpenAI API Key is missing.");
        return res.status(500).json({ message: 'サーバー側のAI設定が不足しています(API Key未設定)' });
    }

    try {
        // 1. OpenAI (DALL-E 3) で画像を生成
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: `フラワースタンドのデザイン画。アニメやアイドルのライブイベント用。詳細: ${prompt}`,
            n: 1,
            size: "1024x1024",
            quality: "standard",
        });

        const tempUrl = response.data[0].url;

        // 2. Cloudinaryへアップロード (生成されたURLは一時的なものなので保存必須)
        // ※ CLOUDINARY_... の環境変数が設定されているか確認してください
        const uploadResult = await cloudinary.uploader.upload(tempUrl, { 
            folder: 'flastal_ai_generated' 
        });
        
        const imageUrl = uploadResult.secure_url;

        res.status(200).json({ url: imageUrl });

    } catch (error) {
        console.error("AI画像生成エラー:", error);
        // エラー内容をフロントエンドに返す
        res.status(500).json({ 
            message: '画像の生成に失敗しました。', 
            detail: error.message 
        });
    }
};

// ==========================================
// 4. AIによるテキスト解析
// ==========================================

export const translateText = async (req, res) => {
    const { text, targetLang } = req.body;
    if (!text) return res.status(400).json({ message: 'テキストが必要です' });

    try {
        let translatedText = '';
        if (process.env.OPENAI_API_KEY) {
            const systemPrompt = targetLang 
                ? `Translate to ${targetLang}. Only output text.`
                : `Detect language. If JP -> EN, if others -> JP. Only output text.`;
            
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: text }],
            });
            translatedText = completion.choices[0].message.content.trim();
        } else {
            translatedText = "[翻訳] " + text;
        }
        res.json({ translatedText });
    } catch (error) {
        console.error("翻訳エラー:", error);
        res.status(500).json({ message: '翻訳エラー' });
    }
};

// 企画説明文生成 (AIアシスタント)
export const generatePlanText = async (req, res) => {
    const { targetName, eventName, tone, extraInfo } = req.body;
    try {
        let title = "", description = "";
        
        if (process.env.OPENAI_API_KEY) {
            const prompt = `推し: ${targetName}, イベント: ${eventName}, トーン: ${tone}, 補足: ${extraInfo}。支援者が参加したくなるようなフラスタ企画の説明文を作成してください。
            必ず以下のJSON形式のみで出力してください。
            {"title": "企画タイトル", "description": "企画の詳しい説明文"}`;

            // 修正箇所：timeoutをcreateの引数内から削除し、第2引数のオプションへ移動
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
            }, {
                timeout: 15000 // 正しい渡し方
            });

            const content = completion.choices[0].message.content;
            try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
                title = parsed.title;
                description = parsed.description;
            } catch (e) {
                title = `${targetName}様へフラスタを贈りましょう！`;
                description = content;
            }
        } else {
            title = `${targetName}様への祝花企画`;
            description = `${eventName}でのご出演を祝して、フラスタを贈る企画です。`;
        }
        res.json({ title, description });
    } catch (error) {
        console.error("AIテキスト生成エラー:", error);
        res.status(500).json({ message: 'AIによる文章生成に失敗しました。時間をおいてお試しください。' });
    }
};

export const parseEventInfo = async (req, res) => {
    const { text, sourceUrl } = req.body;
    try {
        let eventData = { title: 'AI解析イベント', description: '詳細不明', eventDate: new Date().toISOString() };
        
        if (process.env.OPENAI_API_KEY) {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "Extract JSON {title, description, eventDate(ISO), venueName} from text." },
                    { role: "user", content: text }
                ],
                response_format: { type: "json_object" }
            });
            eventData = JSON.parse(completion.choices[0].message.content);
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
        console.error("イベント解析エラー:", error);
        res.status(500).json({ message: '解析エラー' });
    }
};

// ==========================================
// 5. Push通知 (WebPush)
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

// 画像アップロード用 (Cloudinary用)
export const uploadImage = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'ファイルなし' });
    cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
        if (error) return res.status(500).json({ message: 'アップロード失敗' });
        res.status(200).json({ url: result.secure_url });
    }).end(req.file.buffer);
};

// 画像からお花屋さん検索 (GPT-4o Vision)
export const searchFloristByImage = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: '画像なし' });
    const STYLE_TAGS = ['かわいい/キュート', 'クール/かっこいい', 'おしゃれ/モダン', '和風/和モダン', 'ゴージャス/豪華', 'パステルカラー', 'ビビッドカラー', 'バルーン装飾', 'ペーパーフラワー', '大型/連結', '卓上/楽屋花'];
    
    try {
        let targetTags = ['かわいい/キュート']; 
        if (process.env.OPENAI_API_KEY) {
            const base64Image = req.file.buffer.toString('base64');
            const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "user", content: [
                        { type: "text", text: `Select 3 tags from: ${STYLE_TAGS.join(', ')} based on this image. Output comma separated tags only.` },
                        { type: "image_url", image_url: { url: dataUrl } }
                    ]}
                ]
            });
            targetTags = response.choices[0].message.content.split(',').map(t => t.trim());
        }
        
        const florists = await prisma.florist.findMany({
            where: { status: 'APPROVED', specialties: { hasSome: targetTags } },
            select: { id: true, platformName: true, iconUrl: true, portfolioImages: true, specialties: true, address: true },
            take: 6
        });
        res.json({ analyzedTags: targetTags, florists });
    } catch(e) { 
        console.error("画像検索解析エラー:", e);
        res.status(500).json({ message: '解析エラー' }); 
    }
};