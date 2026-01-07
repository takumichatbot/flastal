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

// --- 会場詳細取得 (重要: ダッシュボード対応・データ補完版) ---
export const getVenueById = async (req, res) => {
    const { id } = req.params;
    
    // adminやキーワードの回避
    if (id === 'admin' || id === 'all' || id === 'list') return getVenues(req, res);

    try {
        console.log(`[getVenueById] Requesting data for ID: ${id}`);

        const venue = await prisma.venue.findUnique({
            where: { id: id },
            include: {
                // ダッシュボード表示に必要な実績リストを確実に含める
                projects: {
                    select: {
                        id: true,
                        title: true,
                        imageUrl: true,
                        flowerTypes: true,
                        status: true,
                        planner: {
                            select: {
                                handleName: true,
                                iconUrl: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        });
        
        if (!venue) {
            console.warn(`[getVenueById] Venue not found: ${id}`);
            return res.status(404).json({ message: '会場が見つかりません。' });
        }
        
        // セキュリティのためパスワードを除外
        const { password, ...cleanVenue } = venue;

        // projectsが未定義の場合のフロントエンドクラッシュ防止
        if (!cleanVenue.projects) {
            cleanVenue.projects = [];
        }

        console.log(`[getVenueById] Returning ${cleanVenue.projects.length} projects for ${cleanVenue.venueName}`);
        res.json(cleanVenue);

    } catch (e) { 
        console.error('getVenueById Critical Error:', e);
        res.status(500).json({ message: '会場情報の読み込み中にサーバーエラーが発生しました。' }); 
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
            include: { contributor: { select: { shopName: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(info || []);
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
                projects: {
                    include: { planner: { select: { handleName: true, iconUrl: true } } }
                }
            } 
        });
        if (!event) return res.status(404).json({ message: 'イベントが見つかりません。' });
        res.json(event);
    } catch (e) { 
        console.error('getEventById Error:', e);
        res.status(500).json({ message: 'イベント情報の取得に失敗しました。' }); 
    }
};

// --- 新規イベント作成 ---
export const createEvent = async (req, res) => {
    try {
        const body = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        const name = body.title || body.eventName;
        const targetVenueId = body.venueId || (body.venue ? body.venue.id : null);

        if (!name || !body.eventDate || !targetVenueId) {
            return res.status(400).json({ message: '入力内容が不足しています。' });
        }

        const createData = {
            title: name,
            description: body.description || '',
            eventDate: new Date(body.eventDate),
            venueId: targetVenueId,
            sourceType: userRole === 'ADMIN' ? 'OFFICIAL' : 'USER'
        };

        if (userRole === 'ORGANIZER') {
            createData.organizerId = userId;
        } else {
            createData.creatorId = userId;
            createData.lastEditorId = userId;
        }

        const event = await prisma.event.create({ data: createData });
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
        
        const name = req.body.title || req.body.eventName;
        const updateData = {
            title: name,
            description: req.body.description || '',
            eventDate: req.body.eventDate ? new Date(req.body.eventDate) : undefined,
        };

        if (req.user.role !== 'ORGANIZER') {
            updateData.lastEditorId = req.user.id;
        }

        const updated = await prisma.event.update({
            where: { id: id },
            data: updateData
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
        
        const isOwner = event.organizerId === req.user.id || event.creatorId === req.user.id;
        if (req.user.role !== 'ADMIN' && !isOwner) {
            return res.status(403).json({ message: '削除権限がありません。' });
        }

        await prisma.event.delete({ where: { id } });
        res.status(204).send();
    } catch (e) {
        console.error('deleteEvent Error:', e);
        res.status(500).json({ message: 'イベントの削除に失敗しました。' });
    }
};

// --- 主催者が管理中のイベント一覧を取得 ---
export const getOrganizerEvents = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let whereCondition = {};
        if (userRole === 'ORGANIZER') {
            whereCondition = { organizerId: userId };
        } else if (userRole === 'ADMIN') {
            whereCondition = {};
        } else {
            whereCondition = { creatorId: userId };
        }

        const events = await prisma.event.findMany({
            where: whereCondition,
            include: {
                venue: { select: { venueName: true } },
                _count: { select: { projects: true } }
            },
            orderBy: { eventDate: 'desc' }
        });

        res.json(events || []);
    } catch (e) {
        console.error('getOrganizerEvents Error:', e);
        res.status(500).json({ message: '管理イベントの取得に失敗しました。' });
    }
};

export const toggleInterest = async (req, res) => { res.json({ message: 'ok' }); };
export const reportEvent = async (req, res) => { res.json({ message: 'ok' }); };
export const markLogisticsHelpful = async (req, res) => { res.json({ message: 'ok' }); };