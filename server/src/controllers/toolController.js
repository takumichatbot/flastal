import sharp from 'sharp';
import { Document, NodeIO } from '@gltf-transform/core';
import cloudinary from '../config/cloudinary.js';
import OpenAI from 'openai';
import webpush from 'web-push';
import prisma from '../config/prisma.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ==========================================
// 1. ARパネル生成 (GLB)
// ==========================================
export const createArPanel = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: '画像ファイルがありません。' });

        // 画像情報取得
        const image = sharp(req.file.buffer);
        const metadata = await image.metadata();
        
        // サイズ計算 (高さ1.8m固定)
        const targetHeight = 1.8; 
        const aspectRatio = metadata.width / metadata.height;
        const targetWidth = targetHeight * aspectRatio;

        // GLTF作成
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

        // 頂点データなど
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
// 2. AI画像生成 (DALL-E)
// ==========================================
export const generateAiImage = async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: 'プロンプトが必要です。' });

    try {
        let imageUrl = '';
        if (process.env.OPENAI_API_KEY) {
            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: `フラワースタンドのデザイン画。アニメやアイドルのライブイベント用。詳細: ${prompt}`,
                n: 1,
                size: "1024x1024",
                quality: "standard",
            });
            const tempUrl = response.data[0].url;
            // Cloudinaryへ保存
            const uploadResult = await cloudinary.uploader.upload(tempUrl, { folder: 'flastal_ai_generated' });
            imageUrl = uploadResult.secure_url;
        } else {
            // ダミー
            imageUrl = `https://source.unsplash.com/featured/?flower,arrangement&${Date.now()}`;
        }
        res.status(200).json({ url: imageUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '画像生成エラー' });
    }
};

// ==========================================
// 3. AIによるテキスト解析 (イベント抽出・翻訳・企画文)
// ==========================================

// 自動翻訳
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
        res.status(500).json({ message: '翻訳エラー' });
    }
};

// AI企画文生成
export const generatePlanText = async (req, res) => {
    const { targetName, eventName, tone, extraInfo } = req.body;
    try {
        let title = "", description = "";
        if (process.env.OPENAI_API_KEY) {
            const prompt = `推し: ${targetName}, イベント: ${eventName}, トーン: ${tone}, 補足: ${extraInfo}。JSON形式 {"title": "...", "description": "..."} で出力して。`;
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
            });
            try {
                const parsed = JSON.parse(completion.choices[0].message.content);
                title = parsed.title;
                description = parsed.description;
            } catch (e) {
                description = completion.choices[0].message.content;
            }
        }
        res.json({ title, description });
    } catch (error) {
        res.status(500).json({ message: '生成エラー' });
    }
};

// イベント情報抽出
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
        res.status(500).json({ message: '解析エラー' });
    }
};

// ==========================================
// 4. Push通知 (WebPush)
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
        res.status(500).json({ message: '登録エラー' });
    }
};

export const sendTestPush = async (req, res) => {
    res.json({ message: 'テスト送信機能は未実装です' }); 
};

// 画像アップロード用 (汎用)
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
        let targetTags = ['かわいい/キュート']; // ダミー初期値
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
    } catch(e) { res.status(500).json({ message: '解析エラー' }); }
};