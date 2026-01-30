import prisma from '../config/prisma.js';

// 汎用的な投稿保存API
export const createPost = async (req, res) => {
  try {
    const { eventName, senderName, imageUrl, email } = req.body;

    // バリデーション
    if (!eventName || !imageUrl) {
      return res.status(400).json({ message: 'イベント名と画像は必須です。' });
    }

    // ユーザー紐付け（emailがある場合）
    let userId = null;
    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) userId = user.id;
    }

    const newPost = await prisma.post.create({
      data: {
        eventName,
        senderName: senderName || '匿名',
        imageUrl,
        userId: userId // ユーザーIDがあれば紐付け
      },
    });

    res.status(201).json(newPost);
  } catch (error) {
    console.error("Create Post Error:", error);
    res.status(500).json({ message: '投稿の保存に失敗しました。' });
  }
};