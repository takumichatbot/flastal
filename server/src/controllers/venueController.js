import prisma from '../config/prisma.js';

// ==========================================
// 会場 (Venue)
// ==========================================

// 会場一覧取得
export const getVenues = async (req, res) => {
    try {
        const venues = await prisma.venue.findMany({
            select: {
                id: true, venueName: true, address: true, accessInfo: true,
                isStandAllowed: true, standRegulation: true, 
                isBowlAllowed: true, bowlRegulation: true, retrievalRequired: true
            },
            orderBy: { venueName: 'asc' }
        });
        res.json(venues);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

// 会場詳細取得 (過去の企画含む)
export const getVenueById = async (req, res) => {
    const { id } = req.params;
    try {
        const venue = await prisma.venue.findUnique({
            where: { id },
            include: {
                projects: {
                    where: { status: { in: ['COMPLETED', 'SUCCESSFUL'] }, visibility: 'PUBLIC', imageUrl: { not: null } },
                    select: { id: true, title: true, imageUrl: true, flowerTypes: true, planner: { select: { handleName: true } } },
                    take: 12, orderBy: { deliveryDateTime: 'desc' }
                }
            }
        });
        if (!venue) return res.status(404).json({ message: 'Venue not found' });
        const { password, ...clean } = venue;
        res.json(clean);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

// 簡易登録 (ユーザーによる申請)
export const addVenueByUser = async (req, res) => {
    const { venueName, address, regulations } = req.body;
    try {
        const existing = await prisma.venue.findFirst({ where: { venueName } });
        if (existing) return res.status(409).json({ message: '既に登録されています' });

        const randomId = Math.random().toString(36).slice(-8);
        const newVenue = await prisma.venue.create({
            data: {
                venueName, address, accessInfo: regulations,
                email: `temp_${randomId}@flastal.user-submitted`,
                password: 'temp_password', // ダミー
                isStandAllowed: true, isBowlAllowed: true, retrievalRequired: true
            }
        });
        res.status(201).json(newVenue);
    } catch (error) {
        res.status(500).json({ message: '登録エラー' });
    }
};

// プロフィール更新 (会場管理者)
export const updateVenueProfile = async (req, res) => {
    const id = req.user.id;
    const { venueName, address, regulations } = req.body;
    if (req.user.role !== 'VENUE') return res.status(403).json({ message: '権限なし' });
    try {
        const updated = await prisma.venue.update({
            where: { id },
            data: { venueName, address, regulations }
        });
        const { password, ...clean } = updated;
        res.json(clean);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

// 搬入Wiki投稿
export const postLogisticsInfo = async (req, res) => {
    const { venueId } = req.params;
    const { title, description, imageUrls } = req.body;
    if (req.user.role !== 'FLORIST') return res.status(403).json({ message: '権限なし' });
    try {
        const info = await prisma.venueLogisticsInfo.create({
            data: { venueId, contributorId: req.user.id, title, description, imageUrls: imageUrls || [] }
        });
        res.status(201).json(info);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

// 搬入Wiki情報取得
export const getLogisticsInfo = async (req, res) => {
    const { venueId } = req.params;
    if (req.user.role === 'USER') return res.status(403).json({ message: '権限なし' });
    try {
        const infos = await prisma.venueLogisticsInfo.findMany({
            where: { venueId },
            include: { contributor: { select: { platformName: true, iconUrl: true } } },
            orderBy: [{ isOfficial: 'desc' }, { helpfulCount: 'desc' }]
        });
        res.json(infos);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

// ==========================================
// イベント (Event)
// ==========================================

// イベント一覧取得
export const getEvents = async (req, res) => {
    const { sort, genre, keyword } = req.query;
    try {
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const where = { eventDate: { gte: yesterday }, isBanned: false, status: 'PUBLISHED' };
        
        if (keyword) where.OR = [{ title: { contains: keyword, mode: 'insensitive' } }, { venue: { venueName: { contains: keyword, mode: 'insensitive' } } }];
        
        const events = await prisma.event.findMany({
            where,
            include: { venue: true, organizer: true, _count: { select: { projects: true, interests: true } }, interests: { select: { userId: true } } },
            orderBy: sort === 'popular' ? { interests: { _count: 'desc' } } : { eventDate: 'asc' }
        });
        res.json(events);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

// イベント詳細
export const getEventById = async (req, res) => {
    const { id } = req.params;
    try {
        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                venue: true, organizer: true,
                projects: { where: { visibility: 'PUBLIC' }, include: { planner: true } }
            }
        });
        res.json(event);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

// イベント作成
export const createEvent = async (req, res) => {
    const { title, eventDate, venueId } = req.body;
    const organizerId = req.user.role === 'ORGANIZER' ? req.user.id : null;
    const sourceType = req.user.role === 'ORGANIZER' ? 'ORGANIZER' : 'USER';
    
    try {
        const event = await prisma.event.create({
            data: {
                title, eventDate: new Date(eventDate), venueId, organizerId, sourceType,
                status: req.user.role === 'ORGANIZER' ? 'PUBLISHED' : 'PENDING',
                isStandAllowed: false
            }
        });
        res.status(201).json(event);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

// 興味ありトグル
export const toggleInterest = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const existing = await prisma.eventInterest.findUnique({ where: { userId_eventId: { userId, eventId: id } } });
        if (existing) {
            await prisma.eventInterest.delete({ where: { id: existing.id } });
            res.json({ isInterested: false });
        } else {
            await prisma.eventInterest.create({ data: { userId, eventId: id } });
            res.json({ isInterested: true });
        }
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

// 通報
export const reportEvent = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    try {
        await prisma.eventReport.create({ data: { eventId: id, reporterId: req.user.id, reason } });
        res.status(201).json({ message: '通報しました' });
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

// ==========================================
// 追加分: 編集・削除・その他
// ==========================================

// 主催者のイベント一覧
export const getOrganizerEvents = async (req, res) => {
    if (req.user.role !== 'ORGANIZER') return res.status(403).json({ message: '権限なし' });
    try {
        const events = await prisma.event.findMany({
            where: { organizerId: req.user.id },
            include: { venue: true, _count: { select: { projects: true } } },
            orderBy: { eventDate: 'desc' }
        });
        res.json(events);
    } catch(e) { res.status(500).json({ message: 'エラー' }); }
};

// イベント編集
export const updateEvent = async (req, res) => {
    const { id } = req.params;
    const { title, description, eventDate, venueId, isStandAllowed, regulationNote } = req.body;
    if (req.user.role !== 'ORGANIZER') return res.status(403).json({ message: '権限なし' });
    
    try {
        const event = await prisma.event.findUnique({ where: { id } });
        if (event.organizerId !== req.user.id) return res.status(403).json({ message: '権限なし' });
        
        const updated = await prisma.event.update({
            where: { id },
            data: { title, description, eventDate: eventDate ? new Date(eventDate) : undefined, venueId, isStandAllowed, regulationNote }
        });
        res.json(updated);
    } catch(e) { res.status(500).json({ message: 'エラー' }); }
};

// イベント削除
export const deleteEvent = async (req, res) => {
    const { id } = req.params;
    if (req.user.role !== 'ORGANIZER') return res.status(403).json({ message: '権限なし' });
    try {
        const event = await prisma.event.findUnique({ where: { id } });
        if (event.organizerId !== req.user.id) return res.status(403).json({ message: '権限なし' });
        await prisma.event.delete({ where: { id } });
        res.status(204).send();
    } catch(e) { res.status(500).json({ message: '削除失敗' }); }
};

// 搬入情報の「役に立った」
export const markLogisticsHelpful = async (req, res) => {
    const { infoId } = req.params;
    try {
        const updated = await prisma.venueLogisticsInfo.update({
            where: { id: infoId },
            data: { helpfulCount: { increment: 1 } }
        });
        res.json(updated);
    } catch(e) { res.status(500).json({ message: 'エラー' }); }
};