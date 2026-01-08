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
                organizer: { select: { id: true, name: true } },
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
                organizer: { select: { id: true, name: true } },
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

        const userRole = req.user.role;
        const userId = req.user.id;
        
        // 公式判定: ADMIN, VENUE, ORGANIZER のいずれか
        const officialRoles = ['ADMIN', 'VENUE', 'ORGANIZER'];
        const sourceType = officialRoles.includes(userRole) ? 'OFFICIAL' : 'USER';

        // 初期データオブジェクト
        const eventData = {
            title: name,
            description: description || '',
            eventDate: new Date(eventDate),
            genre: genre || 'OTHER',
            sourceUrl: sourceUrl || '',
            venue: { connect: { id: targetVenueId } },
            sourceType: sourceType
        };

        // --- リレーションの解決 (P2025/ValidationError 対策) ---
        
        if (userRole === 'ORGANIZER') {
            // 主催者としてログインしている場合、Organizerテーブルに接続
            // schema.prisma の Event.organizerId を使用
            eventData.organizer = { connect: { id: userId } };
        } else {
            // それ以外（USER, ADMIN, VENUE）は Userテーブルに接続
            // ※VENUEもUserテーブルにレコードがある前提の設計なら connect を使う
            const userRecord = await prisma.user.findUnique({ where: { id: userId } });
            if (userRecord) {
                eventData.creator = { connect: { id: userId } };
            }
        }

        const event = await prisma.event.create({
            data: eventData
        });

        res.status(201).json(event);
    } catch (e) { 
        console.error('createEvent Critical Error:', e);
        res.status(500).json({ 
            message: 'イベントの作成に失敗しました。',
            detail: e.message 
        }); 
    }
};

// --- イベント更新 ---
export const updateEvent = async (req, res) => { 
    try {
        const { id } = req.params;
        const event = await prisma.event.findUnique({ where: { id } });
        if (!event) return res.status(404).json({ message: 'イベントが見つかりません。' });
        
        // 権限チェック (作成者本人か管理者か主催者本人)
        const isOwner = event.creatorId === req.user.id || event.organizerId === req.user.id || req.user.role === 'ADMIN';
        if (!isOwner) {
            return res.status(403).json({ message: '権限がありません。' });
        }

        const updated = await prisma.event.update({
            where: { id },
            data: {
                title: req.body.title || req.body.eventName,
                description: req.body.description,
                genre: req.body.genre,
                sourceUrl: req.body.sourceUrl,
                eventDate: req.body.eventDate ? new Date(req.body.eventDate) : undefined,
                lastEditor: req.user.role !== 'ORGANIZER' ? { connect: { id: req.user.id } } : undefined
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
        
        const isOwner = event.creatorId === req.user.id || event.organizerId === req.user.id || req.user.role === 'ADMIN';
        if (!isOwner) {
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
                venue: venueId ? { connect: { id: venueId } } : undefined,
                regulationNote: venueId ? null : `候補会場: ${result.venueName || '不明'}`,
                genre: result.genre || 'OTHER',
                sourceType: 'AI',
                sourceUrl: sourceUrl || '',
                creator: { connect: { id: userId } }
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