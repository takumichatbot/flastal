export const createProject = async (req, res) => {
    try {
        const {
            title, description, targetAmount, deliveryAddress, deliveryDateTime,
            imageUrl, designImageUrls, designDetails, size, flowerTypes,
            visibility, venueId, eventId, projectType, password
        } = req.body;

        console.log("--- [DEBUG: RECEIVED BODY] ---", req.body);

        const plannerId = req.user?.id;
        if (!plannerId) {
            return res.status(401).json({ message: '認証情報がありません。' });
        }

        // --- バリデーション強化 ---
        const errors = [];
        if (!title) errors.push("タイトルがありません");
        if (!deliveryAddress) errors.push("配送先住所がありません");
        if (!deliveryDateTime) errors.push("納品希望日時がありません");
        if (!targetAmount) errors.push("目標金額がありません");

        if (errors.length > 0) {
            return res.status(400).json({ message: '入力項目が不足しています。', details: errors });
        }

        // 金額の数値化
        const amount = parseInt(targetAmount, 10);
        
        // 日付の変換
        const deliveryDate = new Date(deliveryDateTime);
        if (isNaN(deliveryDate.getTime())) {
            return res.status(400).json({ message: '日時の形式が正しくありません。' });
        }

        const projectData = {
            title: String(title),
            description: description ? String(description) : "",
            targetAmount: amount,
            collectedAmount: 0,
            deliveryAddress: String(deliveryAddress), // schema.prismaで必須のため
            deliveryDateTime: deliveryDate,
            plannerId: plannerId,
            imageUrl: imageUrl || null,
            designDetails: designDetails || "",
            size: size || "",
            flowerTypes: flowerTypes || "",
            status: 'PENDING_APPROVAL',
            projectType: projectType || 'PUBLIC',
            visibility: visibility || 'PUBLIC',
            password: password || null,
            venueId: venueId || null,
            eventId: eventId || null,
            // 必須の配列フィールド
            designImageUrls: Array.isArray(designImageUrls) ? designImageUrls : [],
            completionImageUrls: [],
            illustrationPanelUrls: [],
            messagePanelUrls: [],
            sponsorPanelUrls: [],
            preEventPhotoUrls: [],
            progressHistory: []
        };

        const newProject = await prisma.project.create({
            data: projectData,
        });

        res.status(201).json({ project: newProject, message: '企画の作成申請が完了しました。' });

    } catch (error) {
        console.error('--- [PRISMA ERROR] ---');
        console.error(error); // ここで詳細なエラー内容（P2002など）が出るはずです
        res.status(500).json({ 
            message: 'サーバー側のバリデーションエラーです。',
            error: error.message,
            code: error.code // Prismaのエラーコードをフロントに返す
        });
    }
};