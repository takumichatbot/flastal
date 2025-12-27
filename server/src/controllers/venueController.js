import prisma from '../config/prisma.js';

// --- 会場一覧取得 ---
export const getVenues = async (req, res) => {
    try {
        const isAdminRequest = req.user && req.user.role === 'ADMIN' && req.path.includes('admin');
        const venues = await prisma.venue.findMany({
            where: isAdminRequest ? {} : { isOfficial: true },
            orderBy: { venueName: 'asc' }
        });
        res.json(venues);
    } catch (e) { res.status(500).json({ message: 'エラーが発生しました' }); }
};

// --- 会場詳細取得 ---
export const getVenueById = async (req, res) => {
    const { id } = req.params;
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
        if (!venue) return res.status(404).json({ message: '会場が見つかりません' });
        const { password, ...clean } = venue;
        res.json(clean);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
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
                password: 'temp_password',
                isOfficial: false, // 初期値は未承認
                isStandAllowed: true, isBowlAllowed: true, retrievalRequired: true
            }
        });
        res.status(201).json(newVenue);
    } catch (error) { res.status(500).json({ message: '登録エラー' }); }
};

// --- 会場情報の更新・承認 ---
export const updateVenueProfile = async (req, res) => {
    try {
        const venueId = req.params.id || req.user.id;
        const data = req.body;
        if (req.user.role !== 'ADMIN' && req.user.role !== 'VENUE') {
            return res.status(403).json({ message: '権限がありません' });
        }
        const updated = await prisma.venue.update({
            where: { id: venueId },
            data: {
                venueName: data.venueName,
                address: data.address,
                isOfficial: data.isOfficial,
                isStandAllowed: data.isStandAllowed,
                isBowlAllowed: data.isBowlAllowed
            }
        });
        res.json(updated);
    } catch (e) { res.status(500).json({ message: '更新失敗' }); }
};

// --- 会場の削除 ---
export const deleteVenue = async (req, res) => {
    const { id } = req.params;
    if (req.user.role !== 'ADMIN') return res.status(403).json({ message: '権限なし' });
    try {
        await prisma.venue.delete({ where: { id } });
        res.status(204).send();
    } catch (e) { res.status(500).json({ message: '削除失敗' }); }
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
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

// --- イベント関連 ---
export const getEvents = async (req, res) => {
    try {
        const events = await prisma.event.findMany({ include: { venue: true } });
        res.json(events);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const getEventById = async (req, res) => {
    try {
        const event = await prisma.event.findUnique({ where: { id: req.params.id }, include: { venue: true } });
        res.json(event);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const createEvent = async (req, res) => {
    try {
        const event = await prisma.event.create({ data: { ...req.body, eventDate: new Date(req.body.eventDate) } });
        res.status(201).json(event);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
};

export const toggleInterest = async (req, res) => { res.json({ message: 'ok' }); };
export const reportEvent = async (req, res) => { res.json({ message: 'ok' }); };
export const markLogisticsHelpful = async (req, res) => { res.json({ message: 'ok' }); };
export const getOrganizerEvents = async (req, res) => { res.json([]); };
export const updateEvent = async (req, res) => { res.json({ message: 'ok' }); };
export const deleteEvent = async (req, res) => { res.status(204).send(); };