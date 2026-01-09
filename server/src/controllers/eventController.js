import prisma from '../config/prisma.js';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- イベント一覧取得 ---
export const getEvents = async (req, res) => {
    try {
        const { genre, keyword, sort, illustratorOnly } = req.query;
        
        let where = {};

        // ★追加: イラスト公募中のイベントのみに絞り込む
        if (illustratorOnly === 'true') {
            where.isIllustratorRecruiting = true;
        }

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
                organizer: { select: { id: true, name: true, website: true } },
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
        const { 
            title, eventName, eventDate, venueId, venue, description, 
            genre, sourceUrl, imageUrl, imageUrls, twitterUrl, instagramUrl, officialWebsite,
            announcement, isIllustratorRecruiting, illustratorRequirements
        } = req.body;

        const name = title || eventName;
        const targetVenueId = venueId || venue?.id;

        if (!name || !eventDate || !targetVenueId) {
            return res.status(400).json({ message: '入力内容が不足しています。' });
        }

        const userRole = req.user.role;
        const userId = req.user.id;
        
        const officialRoles = ['ADMIN', 'VENUE', 'ORGANIZER'];
        const sourceType = officialRoles.includes(userRole) ? 'OFFICIAL' : 'USER';

        const finalImageUrls = Array.isArray(imageUrls) ? imageUrls : (imageUrl ? [imageUrl] : []);

        const eventData = {
            title: name,
            description: description || '',
            eventDate: new Date(eventDate),
            genre: genre || 'OTHER',
            sourceUrl: sourceUrl || '',
            imageUrls: finalImageUrls,
            twitterUrl: twitterUrl || '',
            instagramUrl: instagramUrl || '',
            officialWebsite: officialWebsite || '',
            announcement: announcement || '',
            isIllustratorRecruiting: isIllustratorRecruiting || false,
            illustratorRequirements: illustratorRequirements || '',
            venue: { connect: { id: targetVenueId } },
            sourceType: sourceType
        };

        if (userRole === 'ORGANIZER') {
            eventData.organizer = { connect: { id: userId } };
        } else {
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
        const { 
            title, eventName, description, eventDate, venueId, genre, 
            sourceUrl, imageUrl, imageUrls, twitterUrl, instagramUrl, officialWebsite,
            announcement, isIllustratorRecruiting, illustratorRequirements
        } = req.body;

        const event = await prisma.event.findUnique({ where: { id } });
        if (!event) return res.status(404).json({ message: 'イベントが見つかりません。' });
        
        const isOwner = event.creatorId === req.user.id || event.organizerId === req.user.id || req.user.role === 'ADMIN';
        if (!isOwner) {
            return res.status(403).json({ message: '権限がありません。' });
        }

        const officialRoles = ['ADMIN', 'VENUE', 'ORGANIZER'];
        const newSourceType = officialRoles.includes(req.user.role) ? 'OFFICIAL' : event.sourceType;

        const finalImageUrls = Array.isArray(imageUrls) ? imageUrls : (imageUrl ? [imageUrl] : undefined);

        const updated = await prisma.event.update({
            where: { id },
            data: {
                title: title || eventName,
                description: description,
                eventDate: eventDate ? new Date(eventDate) : undefined,
                genre: genre,
                sourceUrl: sourceUrl,
                imageUrls: finalImageUrls,
                twitterUrl: twitterUrl,
                instagramUrl: instagramUrl,
                officialWebsite: officialWebsite,
                announcement: announcement,
                isIllustratorRecruiting: isIllustratorRecruiting,
                illustratorRequirements: illustratorRequirements,
                venue: venueId ? { connect: { id: venueId } } : undefined,
                sourceType: newSourceType,
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
    const { text, sourceUrl, imageUrls } = req.body;
    const userId = req.user.id;

    if (!text) return res.status(400).json({ message: '解析するテキストを入力してください' });

    try {
        const prompt = `
            以下のイベント告知テキストから正確な情報を抽出し、JSON形式で出力してください。
            
            【抽出ルール】
            - title: イベントの正式名称
            - eventDate: ISO8601形式の完全な日時 (例: 2026-05-20T18:00:00)。時間が不明な場合は T00:00:00 とすること。
            - venueName: 会場名。
            - venueAddress: 会場の住所や場所（テキストから推測できる場合）。
            - description: イベント内容の簡潔な要約（300文字以内）。
            - genre: IDOL, VTUBER, MUSIC, ANIME, STAGE, OTHER から最適なものを1つ選択。
            - officialWebsite: 公式サイトURL。
            - twitterUrl: 公式X(Twitter)のURL。
            - instagramUrl: 公式InstagramのURL。

            テキスト:
            "${text}"
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: "あなたはイベント情報のデータ化のプロフェッショナルです。" },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content);

        let finalDate = new Date(result.eventDate);
        if (isNaN(finalDate.getTime())) finalDate = new Date();

        let venueId = null;
        if (result.venueName) {
            let existingVenue = await prisma.venue.findFirst({
                where: { venueName: { contains: result.venueName, mode: 'insensitive' } }
            });

            if (existingVenue) {
                venueId = existingVenue.id;
            } else {
                const newVenue = await prisma.venue.create({
                    data: {
                        venueName: result.venueName,
                        address: result.venueAddress || "住所不明（AI抽出）",
                        email: `auto-${Date.now()}@flastal.com`,
                        password: "temp-password",
                        status: "PENDING"
                    }
                });
                venueId = newVenue.id;
            }
        }

        const newEvent = await prisma.event.create({
            data: {
                title: result.title || '無題のイベント',
                eventDate: finalDate,
                description: result.description || '',
                venue: venueId ? { connect: { id: venueId } } : undefined,
                genre: result.genre || 'OTHER',
                imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
                officialWebsite: result.officialWebsite || '',
                twitterUrl: result.twitterUrl || '',
                instagramUrl: result.instagramUrl || '',
                sourceType: 'AI',
                sourceUrl: sourceUrl || '',
                creator: { connect: { id: userId } },
                announcement: '',
                isIllustratorRecruiting: false,
                illustratorRequirements: ''
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
        res.status(500).json({ message: 'AI解析中にエラーが発生しました。' });
    }
};

export const toggleInterest = async (req, res) => { 
    try {
        res.json({ message: 'ok' }); 
    } catch(e) {
        res.status(500).json({ message: 'エラー' });
    }
};