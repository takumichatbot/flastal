// プロフィール更新 / 会場承認 (管理者または会場自身)
export const updateVenueProfile = async (req, res) => {
    try {
        // パラメータにIDがあればそれを使用、なければログインユーザーのID（会場自身）を使用
        const venueId = req.params.id || req.user.id;
        const data = req.body;

        // 権限チェック: 管理者(ADMIN) または その会場自身(VENUE) のみ許可
        if (req.user.role !== 'ADMIN' && req.user.role !== 'VENUE') {
            return res.status(403).json({ message: '権入なし: 管理者権限が必要です' });
        }

        // 更新処理
        const updated = await prisma.venue.update({
            where: { id: venueId },
            data: {
                venueName: data.venueName,
                address: data.address,
                accessInfo: data.regulations || data.accessInfo,
                isOfficial: data.isOfficial, // 承認フラグの更新
                isStandAllowed: data.isStandAllowed,
                standRegulation: data.standRegulation,
                isBowlAllowed: data.isBowlAllowed,
                bowlRegulation: data.bowlRegulation,
                retrievalRequired: data.retrievalRequired
            }
        });

        const { password, ...clean } = updated;
        res.json(clean);
    } catch (e) {
        console.error('Update Venue Error:', e);
        res.status(500).json({ message: '会場情報の更新に失敗しました' });
    }
};

// 会場の削除 (管理者のみ)
export const deleteVenue = async (req, res) => {
    const { id } = req.params;
    if (req.user.role !== 'ADMIN') return res.status(403).json({ message: '権限なし' });
    try {
        await prisma.venue.delete({ where: { id } });
        res.status(204).send();
    } catch (e) { res.status(500).json({ message: '削除失敗' }); }
};