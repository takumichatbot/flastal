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

        // ソート順の定義
        let orderBy = {};
        if (sort === 'popular') {
            orderBy = { interests: { _count: 'desc' } };
        } else if (sort === 'newest') {
            orderBy = { createdAt: 'desc' };
        } else {
            orderBy = { eventDate: 'asc' }; // デフォルト：開催日順
        }

        const events = await prisma.event.findMany({ 
            where,
            include: { 
                venue: true,
                creator: { select: { id: true, handleName: true, iconUrl: true } },
                lastEditor: { select: { id: true, handleName: true, iconUrl: true } },
                interests: { select: { userId: true } },
                _count: { select: { interests: true } }
            },
            orderBy: orderBy
        });

        res.json(events || []);
    } catch (e) { 
        console.error('getEvents Critical Error:', e);
        res.status(500).json({ message: 'イベント一覧の取得に失敗しました。', error: e.message }); 
    }
};

// --- イベント詳細取得 ---
export const getEventById = async (req, res) => {
    try {
        const event = await prisma.event.findUnique({ 
            where: { id: req.params.id }, 
            include: { 
                venue: true,
                creator: { select: { id: true, handleName: true, iconUrl: true } },
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

// --- 一般ユーザーによるイベント登録 ---
export const createEvent = async (req, res) => {
    try {
        const { title, eventName, eventDate, venueId, venue, description, genre, sourceUrl } = req.body;
        const name = title || eventName;
        const targetVenueId = venueId || venue?.id;

        if (!name || !eventDate || !targetVenueId) {
            return res.status(400).json({ message: '入力内容が不足しています。' });
        }

        const event = await prisma.event.create({
            data: {
                title: name,
                description: description || '',
                eventDate: new Date(eventDate),
                genre: genre || 'OTHER',
                sourceUrl: sourceUrl || '',
                venue: { connect: { id: targetVenueId } },
                creator: { connect: { id: req.user.id } },
                sourceType: 'USER'
            }
        });
        res.status(201).json(event);
    } catch (e) { 
        console.error('createEvent Error:', e);
        res.status(500).json({ message: 'イベントの作成に失敗しました。' }); 
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

        const updated = await prisma.event.update({
            where: { id },
            data: {
                title: req.body.title || req.body.eventName,
                description: req.body.description,
                genre: req.body.genre,
                sourceUrl: req.body.sourceUrl,
                eventDate: req.body.eventDate ? new Date(req.body.eventDate) : undefined,
                lastEditor: { connect: { id: req.user.id } }
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

// AI解析
export const aiParseEvent = async (req, res) => {
    const { text, sourceUrl } = req.body;
    const userId = req.user.id;
    if (!text) return res.status(400).json({ message: 'テキストを入力してください' });

    try {
        const prompt = `イベント情報をJSON形式で抽出せよ。 title, eventDate(ISO8601), venueName, description, genre(IDOL, VTUBER, MUSIC, ANIME, STAGE, OTHER)。 テキスト: "${text}"`;
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: "優秀なアシスタント" }, { role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });
        const result = JSON.parse(completion.choices[0].message.content);

        let venueId = null;
        if (result.venueName) {
            const v = await prisma.venue.findFirst({ where: { venueName: { contains: result.venueName, mode: 'insensitive' } } });
            if (v) venueId = v.id;
        }

        const newEvent = await prisma.event.create({
            data: {
                title: result.title || '無題',
                eventDate: new Date(result.eventDate),
                description: result.description || '',
                venueId: venueId,
                genre: result.genre || 'OTHER',
                sourceType: 'AI',
                sourceUrl: sourceUrl || '',
                creatorId: userId,
                lastEditorId: userId
            },
            include: { venue: true, _count: { select: { interests: true } } }
        });
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(500).json({ message: 'AI解析失敗' });
    }
};

export const toggleInterest = async (req, res) => { res.json({ message: 'ok' }); };
export const reportEvent = async (req, res) => { res.json({ message: 'ok' }); };