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
    if (id === 'admin' || id === 'all') return getVenues(req, res);

    try {
        const venue = await prisma.venue.findUnique({
            where: { id: id },
            include: {
                projects: {
                    select: {
                        id: true, title: true, imageUrl: true, flowerTypes: true,
                        planner: { select: { handleName: true, iconUrl: true } }
                    },
                    take: 50
                }
            }
        });
        
        if (!venue) return res.status(404).json({ message: '会場が見つかりません。' });
        const { password, ...cleanVenue } = venue;
        if (!cleanVenue.projects) cleanVenue.projects = [];
        res.json(cleanVenue);
    } catch (e) { 
        console.error('getVenueById Error:', e);
        res.status(500).json({ message: '会場データの取得に失敗しました。' }); 
    }
};

// --- 一般ユーザーによる会場登録 ---
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

// --- 会場情報の更新 (会場本人または管理者) ---
export const updateVenueProfile = async (req, res) => {
    try {
        const venueId = req.params.id || req.user.id;
        const data = req.body;
        const isSelf = req.user.role === 'VENUE' && req.user.id === venueId;
        const isAdmin = req.user.role === 'ADMIN';

        if (!isSelf && !isAdmin) return res.status(403).json({ message: '権限がありません。' });

        const updated = await prisma.venue.update({
            where: { id: venueId },
            data: {
                venueName: data.venueName,
                address: data.address,
                isOfficial: data.isOfficial,
                isStandAllowed: data.isStandAllowed,
                isBowlAllowed: data.isBowlAllowed,
                accessInfo: data.accessInfo,
                standRegulation: data.standRegulation,
                bowlRegulation: data.bowlRegulation,
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

// --- 会場の削除 (管理者のみ) ---
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
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // 会場自身による投稿の場合、Venue.accessInfoを更新する
        if (userRole === 'VENUE') {
            await prisma.venue.update({
                where: { id: venueId },
                data: { accessInfo: `${title}\n${description}` }
            });

            return res.status(201).json({ 
                id: 'official-info',
                title: `【公式】${title}`, 
                description,
                isOfficial: true
            });
        }

        // お花屋さんの場合は通常保存
        const info = await prisma.venueLogisticsInfo.create({
            data: { 
                title, 
                description,
                venue: { connect: { id: venueId } },
                contributor: { connect: { id: userId } }
            }
        });
        res.status(201).json(info);

    } catch (e) { 
        console.error('postLogisticsInfo Critical Error:', e);
        res.status(500).json({ message: '情報の保存中にエラーが発生しました。' }); 
    }
};

// --- 物流情報の取得 ---
export const getLogisticsInfo = async (req, res) => {
    const { venueId } = req.params;
    try {
        const floristInfos = await prisma.venueLogisticsInfo.findMany({
            where: { venueId },
            include: { contributor: { select: { shopName: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const venue = await prisma.venue.findUnique({
            where: { id: venueId },
            select: { accessInfo: true, venueName: true }
        });

        const results = [...floristInfos];
        if (venue?.accessInfo) {
            results.unshift({
                id: 'official',
                title: '【会場公式】搬入・受取ルール',
                description: venue.accessInfo,
                createdAt: new Date(),
                isOfficial: true,
                contributor: { shopName: venue.venueName }
            });
        }
        res.json(results || []);
    } catch (e) {
        console.error('getLogisticsInfo Error:', e);
        res.status(500).json({ message: '物流情報の取得に失敗しました。' });
    }
};

// --- 一般イベント一覧取得 ---
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

// --- 一般ユーザーによるイベント登録 (sourceType: USER 固定) ---
export const createEvent = async (req, res) => {
    try {
        const { title, eventName, eventDate, venueId, venue, description } = req.body;
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
                venue: { connect: { id: targetVenueId } },
                creator: { connect: { id: req.user.id } },
                sourceType: 'USER' // 一般ユーザー投稿として固定
            }
        });
        res.status(201).json(event);
    } catch (e) { 
        console.error('createEvent Error:', e);
        res.status(500).json({ message: 'イベントの作成に失敗しました。' }); 
    }
};

// --- イベント更新 (一般投稿用) ---
export const updateEvent = async (req, res) => { 
    try {
        const { id } = req.params;
        const event = await prisma.event.findUnique({ where: { id } });
        if (!event) return res.status(404).json({ message: 'イベントが見つかりません。' });
        
        // 投稿者本人か管理者のみ更新可能
        if (event.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: '権限がありません。' });
        }

        const updated = await prisma.event.update({
            where: { id },
            data: {
                title: req.body.title || req.body.eventName,
                description: req.body.description,
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

// --- イベント削除 (一般投稿用) ---
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

export const toggleInterest = async (req, res) => { res.json({ message: 'ok' }); };
export const reportEvent = async (req, res) => { res.json({ message: 'ok' }); };
export const markLogisticsHelpful = async (req, res) => { res.json({ message: 'ok' }); };