import prisma from '../config/prisma.js';

// --- 会場一覧取得 ---
export const getVenues = async (req, res) => {
    try {
        const isAdminRole = req.user && req.user.role === 'ADMIN';
        const isUrlAdmin = req.originalUrl.includes('/admin');

        const venues = await prisma.venue.findMany({
            where: (isAdminRole && isUrlAdmin) ? {} : { isOfficial: true },
            orderBy: { venueName: 'asc' }
        });
        res.json(venues || []);
    } catch (e) { 
        console.error('getVenues Error:', e);
        res.status(500).json({ message: '会場情報の取得中にエラーが発生しました。' }); 
    }
};

// --- 会場詳細取得 ---
export const getVenueById = async (req, res) => {
    const { id } = req.params;
    if (id === 'admin') return getVenues(req, res);

    try {
        const venue = await prisma.venue.findUnique({
            where: { id },
            include: {
                projects: {
                    where: { status: { in: ['COMPLETED', 'SUCCESSFUL'] }, visibility: 'PUBLIC' },
                    take: 12
                }
            }
        });
        if (!venue) return res.status(404).json({ message: '会場が見つかりません。' });
        
        const { password, ...clean } = venue;
        res.json(clean);
    } catch (e) { 
        console.error('getVenueById Error:', e);
        res.status(500).json({ message: '会場データの取得に失敗しました。' }); 
    }
};

// --- ユーザーによる会場登録 ---
export const addVenueByUser = async (req, res) => {
    const { venueName, address, regulations } = req.body;
    try {
        const randomId = Math.random().toString(36).slice(-8);
        const newVenue = await prisma.venue.create({
            data: {
                venueName, address, accessInfo: regulations,
                email: `temp_${randomId}@flastal.user`,
                password: 'temp_password_not_for_login',
                isOfficial: false,
                isStandAllowed: true, isBowlAllowed: true, retrievalRequired: true,
                addedById: req.user.id 
            }
        });
        res.status(201).json(newVenue);
    } catch (error) { 
        console.error('addVenueByUser Error:', error);
        res.status(500).json({ message: '会場の仮登録に失敗しました。' }); 
    }
};

// --- 会場情報の更新 ---
export const updateVenueProfile = async (req, res) => {
    try {
        const venueId = req.params.id || req.user.id;
        const data = req.body;
        
        const isSelf = req.user.role === 'VENUE' && req.user.id === venueId;
        const isAdmin = req.user.role === 'ADMIN';

        if (!isSelf && !isAdmin) {
            return res.status(403).json({ message: '権限がありません。' });
        }

        const updated = await prisma.venue.update({
            where: { id: venueId },
            data: {
                venueName: data.venueName,
                address: data.address,
                isOfficial: data.isOfficial,
                isStandAllowed: data.isStandAllowed,
                isBowlAllowed: data.isBowlAllowed,
                accessInfo: data.accessInfo,
                retrievalRequired: data.retrievalRequired,
                status: data.status
            }
        });
        res.json(updated);
    } catch (e) { 
        console.error('updateVenueProfile Error:', e);
        res.status(500).json({ message: '会場情報の更新に失敗しました。' }); 
    }
};

// --- 会場の削除 ---
export const deleteVenue = async (req, res) => {
    const { id } = req.params;
    if (req.user.role !== 'ADMIN') return res.status(403).json({ message: '権限がありません。' });
    try {
        await prisma.venue.delete({ where: { id } });
        res.status(204).send();
    } catch (e) { 
        console.error('deleteVenue Error:', e);
        res.status(500).json({ message: '会場の削除に失敗しました。' }); 
    }
};

// --- 物流情報の投稿 ---
export const postLogisticsInfo = async (req, res) => {
    const { venueId } = req.params;
    const { title, description } = req.body;
    try {
        const info = await prisma.venueLogisticsInfo.create({
            data: { venueId, contributorId: req.user.id, title, description }
        });
        res.status(201).json(info);
    } catch (e) { 
        console.error('postLogisticsInfo Error:', e);
        res.status(500).json({ message: '情報の投稿に失敗しました。' }); 
    }
};

// --- 物流情報の取得 ---
export const getLogisticsInfo = async (req, res) => {
    const { venueId } = req.params;
    try {
        const info = await prisma.venueLogisticsInfo.findMany({
            where: { venueId },
            include: { contributor: { select: { handleName: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(info || []);
    } catch (e) {
        console.error('getLogisticsInfo Error:', e);
        res.status(500).json({ message: '物流情報の取得に失敗しました。' });
    }
};

// --- イベント一覧取得 ---
export const getEvents = async (req, res) => {
    try {
        const events = await prisma.event.findMany({ 
            include: { 
                venue: true,
                creator: { select: { id: true, handleName: true, iconUrl: true } },
                _count: { select: { interests: true } }
            },
            orderBy: { eventDate: 'asc' }
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
                creator: { select: { id: true, handleName: true, iconUrl: true } }
            } 
        });
        if (!event) return res.status(404).json({ message: 'イベントが見つかりません。' });
        res.json(event);
    } catch (e) { 
        console.error('getEventById Error:', e);
        res.status(500).json({ message: 'イベント情報の取得に失敗しました。' }); 
    }
};

/**
 * ★ 重要修正: 新規イベント作成 ★
 * title と eventName の両方に対応させることでバリデーションエラーを回避します
 */
export const createEvent = async (req, res) => {
    try {
        const body = req.body;
        console.log('[CreateEvent] Received body:', JSON.stringify(body));

        // 会場IDの抽出
        let targetVenueId = body.venueId;
        if (!targetVenueId && body.venue && body.venue.id) {
            targetVenueId = body.venue.id;
        }

        // イベント名の抽出 (title と eventName 両方をサポート)
        const name = body.eventName || body.title;

        // 基本バリデーション
        if (!name || !body.eventDate || !targetVenueId) {
            return res.status(400).json({ message: 'イベント名、日付、会場の選択は必須です。' });
        }

        // 会場存在チェック
        const exists = await prisma.venue.findUnique({ where: { id: targetVenueId } });
        if (!exists) {
            return res.status(400).json({ message: '指定された会場が存在しません。' });
        }

        // イベント作成実行
        // データベースのカラム名が 'title' である場合と 'eventName' である場合の両方に備える
        const event = await prisma.event.create({ 
            data: { 
                title: name,        // DBが title を期待している場合
                eventName: name,    // DBが eventName を期待している場合 (もしあれば)
                description: body.description || '',
                twitterHashtag: body.twitterHashtag || '',
                eventDate: new Date(body.eventDate),
                venueId: targetVenueId,
                creatorId: req.user.id, 
                lastEditorId: req.user.id, 
                sourceType: 'USER'
            } 
        });

        res.status(201).json(event);

    } catch (e) { 
        console.error('createEvent Final Error:', e);
        res.status(500).json({ message: 'イベントの作成中にエラーが発生しました。' }); 
    }
};

// --- イベント更新 ---
export const updateEvent = async (req, res) => { 
    try {
        const { id } = req.params;
        const event = await prisma.event.findUnique({ where: { id } });
        if (!event) return res.status(404).json({ message: 'イベントが見つかりません。' });
        if (req.user.role !== 'ADMIN' && event.creatorId !== req.user.id) {
            return res.status(403).json({ message: '編集権限がありません。' });
        }
        
        const name = req.body.eventName || req.body.title;

        const updated = await prisma.event.update({
            where: { id },
            data: {
                title: name,
                eventName: name,
                description: req.body.description,
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
        if (req.user.role !== 'ADMIN' && event.creatorId !== req.user.id) {
            return res.status(403).json({ message: '削除権限がありません。' });
        }
        await prisma.event.delete({ where: { id } });
        res.status(204).send();
    } catch (e) {
        console.error('deleteEvent Error:', e);
        res.status(500).json({ message: 'イベントの削除に失敗しました。' });
    }
};

export const toggleInterest = async (req, res) => { res.json({ message: 'ok' }); };
export const reportEvent = async (req, res) => { res.json({ message: 'ok' }); };
export const markLogisticsHelpful = async (req, res) => { res.json({ message: 'ok' }); };
export const getOrganizerEvents = async (req, res) => { res.json([]); };