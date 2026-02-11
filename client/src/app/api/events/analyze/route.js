import { NextResponse } from 'next/server';
import openai from '@/config/openai';
import prisma from '@/config/prisma';

export async function POST(req) {
  try {
    const { text } = await req.json();

    if (!text || text.length < 10) {
      return NextResponse.json({ message: '解析するテキストが短すぎます' }, { status: 400 });
    }

    // 1. 登録済みの会場リストを取得 (AIに照合させるため)
    const venues = await prisma.venue.findMany({
      select: { id: true, venueName: true }
    });

    const venueListString = venues.map(v => `ID: "${v.id}", Name: "${v.venueName}"`).join('\n');

    // 2. OpenAIに解析を依頼
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // 可能であれば gpt-4o, なければ gpt-4-turbo or gpt-3.5-turbo
      messages: [
        {
          role: "system",
          content: `
            あなたはイベント情報の解析アシスタントです。
            ユーザーから提供されたイベント概要テキストから、以下の情報を抽出してJSON形式で返してください。
            
            【抽出ルール】
            - title: イベント名
            - eventDate: 開催日 (YYYY-MM-DD形式)
            - venueId: 以下の会場リストの中から、最も名前が一致する会場のIDを選んでください。リストにない場合は null または空文字にしてください。
            - description: イベントの詳細説明
            - genre: ジャンル (IDOL, VTUBER, MUSIC, ANIME, STAGE, OTHER のいずれか)
            - officialWebsite: 公式サイトのURLがあれば
            - twitterUrl: Twitter(X)のURLがあれば

            【会場リスト】
            ${venueListString}
          `
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" }, // JSONモードを強制
      temperature: 0.1, // 揺らぎを抑える
    });

    const result = JSON.parse(completion.choices[0].message.content);

    return NextResponse.json(result);

  } catch (error) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json({ message: '解析に失敗しました' }, { status: 500 });
  }
}