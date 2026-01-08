import prisma from '../config/prisma.js';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- イベント一覧取得 ---
export const getEvents = async (req, res) => {
    try {
        const { genre, keyword, sort } = req.query;
        
        let where = {};
        if (genre && genre !== 'ALL') {
            where.genre = genre;
        }
        if (keyword) {
            where.OR = [
                { title: { contains: keyword, mode: 'insensitive' } },
                { description: { contains: keyword, mode: 'insensitive' } },
                { venue: { venueName: { contains: keyword, mode: 'insensitive' } } }
            ];
        }

        let orderBy = { eventDate: 'asc' };
        if (sort === 'newest') orderBy = { createdAt: 'desc' };
        if (sort === 'popular') {
            orderBy = { interests: { _count: 'desc' } };
        }

        const events = await prisma.event.findMany({ 
            where,
            include: { 
                venue: true,
                creator: { select: { id: true, handleName: true, iconUrl: true, role: true } },
                lastEditor: { select: { id: true, handleName: true, iconUrl: true } },
                interests: { select: { userId: true } },
                _count: { select: { interests: true } }
            },
            orderBy: orderBy
        });
        res.json(events || []);
    } catch (e) { 
        console.error('getEvents Error:', e);
        res.status(500).json({ message: 'イベント一覧の取得に失敗しました。' }); 
    }
};

// --- イベント詳細取得 ---
export const getEventById = async (req, res) => {
    try {
        const event = await prisma.event.findUnique({ 
            where: { id: req.params.id }, 
            include: { 
                venue: true,
                creator: { select: { id: true, handleName: true, iconUrl: true, role: true } },
                projects: { include: { planner: { select: { handleName: true, iconUrl: true } } } }
            } 
        });
        if (!event) return res.status(404).json({ message: 'イベントが見つかりません。' });
        res.json(event);
    } catch (e) { 
        console.error('getEventById Error:', e);
        res.status(500).json({ message: 'イベント情報の取得に失敗しました。' }); 
    }
};

// --- 一般ユーザー・主催者・管理者によるイベント登録 ---
export const createEvent = async (req, res) => {
    try {
        const { title, eventName, eventDate, venueId, venue, description, genre, sourceUrl } = req.body;
        const name = title || eventName;
        const targetVenueId = venueId || venue?.id;

        if (!name || !eventDate || !targetVenueId) {
            return res.status(400).json({ message: '入力内容が不足しています。' });
        }

        const officialRoles = ['ADMIN', 'VENUE', 'ORGANIZER'];
        const sourceType = officialRoles.includes(req.user.role) ? 'OFFICIAL' : 'USER';

        // ★ Prisma P2025 エラー対策
        // イベントモデルの creator リレーションが User モデルを指している場合、
        // 主催者(ORGANIZER)も User テーブルにレコードがある必要があります。
        // もし主催者が別テーブル管理なら、connect ではなく creatorId: req.user.id を直接入れるなどの調整が必要です。
        
        const eventData = {
            title: name,
            description: description || '',
            eventDate: new Date(eventDate),
            genre: genre || 'OTHER',
            sourceUrl: sourceUrl || '',
            venue: { connect: { id: targetVenueId } },
            sourceType: sourceType
        };

        // 作成者の接続処理
        // 注意: req.user.id が User テーブルに存在しないと connect で落ちます。
        // 安全のため、まず User が存在するか確認するか、もしくは直接 ID を代入します。
        const userExists = await prisma.user.findUnique({ where: { id: req.user.id } });

        if (userExists) {
            eventData.creator = { connect: { id: req.user.id } };
        } else {
            // Userテーブルにいない（主催者専用垢など）場合は、強制的に紐付けず ID のみ保持するか、
            // またはシステム上の共通管理ユーザーに紐付けるなどの回避策をとります。
            // ここでは ID を直接セットする形を試みます（Schemaによりますが）
            eventData.creatorId = req.user.id; 
        }

        const event = await prisma.event.create({
            data: eventData
        });

        res.status(201).json(event);
    } catch (e) { 
        console.error('createEvent Error:', e);
        // エラー詳細を返してデバッグしやすくする
        res.status(500).json({ 
            message: 'イベントの作成に失敗しました。',
            error: e.code === 'P2025' ? '作成ユーザーの認証レコードが見つかりません。' : e.message 
        }); 
    }
};

// --- イベント更新 ---
export const updateEvent = async (req, res) => { 
    try {
        const { id } = req.params;
        const event = await prisma.event.findUnique({ where: { id } });
        if (!event) return res.status(404).json({ message: 'イベントが見つかりません。' });
        
        if (event.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: '権限がありません。' });
        }

        const officialRoles = ['ADMIN', 'VENUE', 'ORGANIZER'];
        const newSourceType = officialRoles.includes(req.user.role) ? 'OFFICIAL' : event.sourceType;

        const updated = await prisma.event.update({
            where: { id },
            data: {
                title: req.body.title || req.body.eventName,
                description: req.body.description,
                genre: req.body.genre,
                sourceUrl: req.body.sourceUrl,
                sourceType: newSourceType,
                eventDate: req.body.eventDate ? new Date(req.body.eventDate) : undefined,
                lastEditorId: req.user.id
            }
        });
        res.json(updated);
    } catch (e) {
        console.error('updateEvent Error:', e);
        res.status(500).json({ message: 'イベントの更新に失敗しました。' });
    }
};

// --- イベント削除 ---
export const deleteEvent = async (req, res) => { 
    try {
        const { id } = req.params;
        const event = await prisma.event.findUnique({ where: { id } });
        if (!event) return res.status(404).json({ message: 'イベントが見つかりません。' });
        
        if (event.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: '削除権限がありません。' });
        }

        await prisma.event.delete({ where: { id } });
        res.status(204).send();
    } catch (e) {
        console.error('deleteEvent Error:', e);
        res.status(500).json({ message: 'イベントの削除に失敗しました。' });
    }
};

/**
 * AIによるイベント情報解析
 */
export const aiParseEvent = async (req, res) => {
    const { text, sourceUrl } = req.body;
    const userId = req.user.id;

    if (!text) return res.status(400).json({ message: 'テキストを入力してください' });

    try {
        const prompt = `
            以下のテキストからイベント情報を抽出して、必ずJSON形式で出力してください。
            現在の日時: ${new Date().toLocaleString('ja-JP')}
            年が不明な場合は、文脈から判断するか現在の日時を参考にしてください。

            【出力項目】
            - title: イベント名
            - eventDate: ISO8601形式の完全な日時 (例: 2025-12-25T18:00:00)
            - venueName: 会場名（不明な場合は空文字）
            - description: 内容の要約
            - genre: IDOL, VTUBER, MUSIC, ANIME, STAGE, OTHER の中から選択

            テキスト:
            "${text}"
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: "あなたは優秀なイベント情報解析アシスタントです。" }, { role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content);

        let finalDate = new Date(result.eventDate);
        if (isNaN(finalDate.getTime())) {
            finalDate = new Date();
        }

        let venueId = null;
        if (result.venueName && result.venueName.trim() !== '') {
            const existingVenue = await prisma.venue.findFirst({
                where: { venueName: { contains: result.venueName, mode: 'insensitive' } }
            });
            if (existingVenue) {
                venueId = existingVenue.id;
            }
        }

        const newEvent = await prisma.event.create({
            data: {
                title: result.title || '無題のイベント',
                eventDate: finalDate,
                description: result.description || '',
                venueId: venueId,
                regulationNote: venueId ? null : `候補会場: ${result.venueName || '不明'}`,
                genre: result.genre || 'OTHER',
                sourceType: 'AI',
                sourceUrl: sourceUrl || '',
                creatorId: userId,
                lastEditorId: userId
            },
            include: { 
                venue: true,
                creator: { select: { id: true, handleName: true, iconUrl: true, role: true } },
                _count: { select: { interests: true } }
            }
        });

        res.status(201).json(newEvent);

    } catch (error) {
        console.error('AI Parse Error:', error);
        res.status(500).json({ message: 'AI解析に失敗しました。' });
    }
};

export const toggleInterest = async (req, res) => { 
    try {
        res.json({ message: 'ok' }); 
    } catch(e) {
        res.status(500).json({ message: 'エラー' });
    }
};