import prisma from '../config/prisma.js';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * AIによるイベント情報解析
 */
export const aiParseEvent = async (req, res) => {
    const { text, sourceUrl } = req.body;
    const userId = req.user.id;

    if (!text) return res.status(400).json({ message: 'テキストを入力してください' });

    try {
        // AIへの命令をより厳格化（フォーマットを指定して1月1日問題を回避）
        const prompt = `
            以下のテキストからイベント情報を抽出して、必ずJSON形式で出力してください。
            現在の日時: ${new Date().toLocaleString('ja-JP')}
            年が不明な場合は、文脈から判断するか現在の日時を参考にしてください。

            【出力項目】
            - title: イベント名
            - eventDate: ISO8601形式の完全な日時 (例: 2025-12-25T18:00:00)
            - venueName: 会場名（不明な場合は空文字）
            - address: 会場の住所（わかる場合のみ）
            - description: 内容の要約
            - genre: IDOL, VTUBER, MUSIC, ANIME, STAGE, OTHER の中から選択

            テキスト:
            "${text}"
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // または gpt-4
            messages: [{ role: "system", content: "あなたは優秀なイベント情報解析アシスタントです。" }, { role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content);

        // --- 修正の要：日付と会場のバリデーション ---
        
        // 1. 日付が正しく解析できていない（1月1日等）場合のガード
        let finalDate = new Date(result.eventDate);
        if (isNaN(finalDate.getTime()) || (finalDate.getMonth() === 0 && finalDate.getDate() === 1 && !text.includes('1月1日'))) {
            // 解析失敗時は現在時刻をベースにするのではなく、エラーを出すか手動入力を促す
            console.warn('[AI Parse Warning] Date parsing seems incorrect.');
        }

        // 2. 会場名が未定の場合の検索ロジック
        let venueId = null;
        if (result.venueName && result.venueName.trim() !== '') {
            const existingVenue = await prisma.venue.findFirst({
                where: { venueName: { contains: result.venueName, mode: 'insensitive' } }
            });
            if (existingVenue) {
                venueId = existingVenue.id;
            }
        }

        // 3. データベースへの登録
        const newEvent = await prisma.event.create({
            data: {
                title: result.title || '無題のイベント',
                eventDate: finalDate,
                description: result.description,
                venueId: venueId,
                // venueIdがない場合でも、テキストとしての会場名を備考に残す
                regulationNote: venueId ? null : `候補会場: ${result.venueName || '不明'}`,
                genre: result.genre || 'OTHER',
                sourceType: 'AI',
                sourceUrl: sourceUrl,
                creatorId: userId,
                lastEditorId: userId
            },
            include: { venue: true }
        });

        res.status(201).json({ event: newEvent });

    } catch (error) {
        console.error('AI Parse Error:', error);
        res.status(500).json({ message: 'AI解析に失敗しました。内容を簡潔にして再度お試しください。' });
    }
};