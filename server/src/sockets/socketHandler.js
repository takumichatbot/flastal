import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

// --- 定数定義 (元のindex.jsから移植) ---
const CHAT_TEMPLATES = [
  { id: 'propose_1', category: '提案・質問', text: 'リボンのメッセージは「...」でどうでしょう？', hasCustomInput: true, placeholder: '例：祝！ご出演' },
  { id: 'propose_2', category: '提案・質問', text: '「...」を追加しませんか？', hasCustomInput: true, placeholder: '例：お花の色紙' },
  { id: 'propose_3', category: '提案・質問', text: 'これについて、皆さんの意見を聞きたいです。' },
  { id: 'propose_4', category: '提案・質問', text: '企画者さん、何か手伝えることはありますか？' },
  { id: 'agree_1',   category: '同意・反応', text: '良いアイデアですね！賛成です。' },
  { id: 'agree_2',   category: '同意・反応', text: 'なるほど、了解です。' },
  { id: 'agree_3',   category: '同意・反応', text: 'ありがとうございます！' },
  { id: 'stamp_1',   category: 'スタンプ',   text: '👍' },
  { id: 'stamp_2',   category: 'スタンプ',   text: '🎉' },
  { id: 'stamp_3',   category: 'スタンプ',   text: '👏' },
  { id: 'stamp_4',   category: 'スタンプ',   text: '🙏' },
];

const NG_WORDS = [
  'LINE', 'ライン', 'ID', 'カカオ', 'kakao', '電話番号', 'メアド', 'メール',
  'http', 'https', '.com', '.jp', '.net', '.org',
  '銀行', '口座', '振込', '現金', '個人', '直接',
  '死ね', '殺す', 'バカ', 'アホ',
];

export default function socketHandler(io) {
  // ===================================
  // ★ 1. Socket.IO用 JWT認証ミドルウェア
  // ===================================
  io.use((socket, next) => {
    const token = socket.handshake.auth.token; // クライアント側は { auth: { token: "Bearer ..." } } で接続

    if (!token) {
      return next(new Error('認証エラー: トークンがありません。'));
    }

    // "Bearer " を除去して検証
    const tokenString = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

    jwt.verify(tokenString, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('認証エラー: トークンが無効です。'));
      }
      // socketオブジェクトにユーザー情報を保存 (id, role, handleName等)
      socket.user = decoded;
      next();
    });
  });

  // ===================================
  // ★ 2. 接続後のイベントハンドラ
  // ===================================
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id} (Role: ${socket.user.role})`);

    // --- ルーム参加 ---
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.user.id} joined room ${roomId}`);
    });

    socket.on('joinProjectRoom', (projectId) => {
      socket.join(projectId);
      console.log(`User ${socket.user.id} joined project room ${projectId}`);
    });

    // --- 1対1チャット (お花屋さん vs ユーザー) ---
    socket.on('sendMessage', async ({ roomId, content, messageType, fileUrl, fileName }) => {
      try {
        const userId = socket.user.id;
        const userRole = socket.user.role;

        // 送信者のタイプとIDをトークンから自動判定
        let senderType = 'USER';
        let floristId = null;
        let pledgedUserId = null;

        if (userRole === 'FLORIST') {
          senderType = 'FLORIST';
          floristId = userId;
        } else {
          senderType = 'USER';
          pledgedUserId = userId;
        }

        // NGワードチェック (テキストメッセージの場合)
        if (messageType === 'TEXT' && content) {
          const containsNGWord = NG_WORDS.some(word => content.toLowerCase().includes(word.toLowerCase()));
          if (containsNGWord) {
            socket.emit('messageError', '送信できない単語が含まれています。内容を修正してください。');
            return;
          }
        }

        // メッセージ保存
        const newMessage = await prisma.chatMessage.create({
          data: {
            chatRoomId: roomId,
            senderType,
            userId: pledgedUserId, // USERの場合のみセット
            floristId: floristId,  // FLORISTの場合のみセット
            messageType: messageType || 'TEXT',
            content: content || null,
            fileUrl: fileUrl || null,
            fileName: fileName || null,
          },
          include: {
            user: { select: { handleName: true } },
            florist: { select: { shopName: true } }
          }
        });

        // ルーム全員に送信
        io.to(roomId).emit('receiveMessage', newMessage);

        // --- AIボット (LARUbot) 連動ロジック (ユーザー発言時のみ) ---
        if (senderType === 'USER') {
          const roomInfo = await prisma.chatRoom.findUnique({
            where: { id: roomId },
            include: { offer: { include: { florist: true } } }
          });
          const targetFlorist = roomInfo?.offer?.florist;

          // お花屋さんがBotキーを設定している場合
          if (targetFlorist && targetFlorist.laruBotApiKey) {
            try {
              // Node.js 18以上であれば fetch はネイティブで使えます
              const larubotResponse = await fetch('https://larubot.tokyo/api/v1/chat', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${targetFlorist.laruBotApiKey}`
                },
                body: JSON.stringify({ message: content, userId: userId })
              });

              if (larubotResponse.ok) {
                const aiData = await larubotResponse.json();
                const aiContent = aiData.reply || "申し訳ありません、現在AIアシスタントは応答できません。";

                const aiMessage = await prisma.chatMessage.create({
                  data: {
                    content: aiContent,
                    senderType: 'FLORIST',
                    isAutoResponse: true,
                    floristId: targetFlorist.id,
                    chatRoomId: roomId,
                  }
                });
                io.to(roomId).emit('receiveMessage', aiMessage);
              }
            } catch (aiError) {
              console.error("LARUbot API Error:", aiError);
            }
          }
        }

      } catch (error) {
        console.error('Message processing error:', error);
        socket.emit('messageError', 'メッセージの送信中にエラーが発生しました。');
      }
    });

    // --- グループチャット (企画ごとの掲示板) ---
    socket.on('sendGroupChatMessage', async ({ projectId, templateId, content, messageType, fileUrl, fileName }) => {
      try {
        const userId = socket.user.id;

        // 権限チェック
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) return;

        const pledge = await prisma.pledge.findFirst({ where: { projectId, userId } });
        const isPlanner = project.plannerId === userId;

        if (!pledge && !isPlanner) {
          socket.emit('messageError', 'このグループチャットに参加する権限がありません。');
          return;
        }

        // NGワードチェック
        if (messageType === 'TEXT' && content && content.trim() !== '') {
          const containsNGWord = NG_WORDS.some(word => content.toLowerCase().includes(word.toLowerCase()));
          if (containsNGWord) {
            socket.emit('messageError', '送信できない単語が含まれています。');
            return;
          }
        }

        // テンプレート使用時のチェック
        if (templateId) {
          const template = CHAT_TEMPLATES.find(t => t.id === templateId);
          if (!template) return;
          if (template.hasCustomInput && (!content || content.trim() === '')) return;
        }

        // 保存
        const newMessage = await prisma.groupChatMessage.create({
          data: {
            projectId,
            userId,
            templateId: templateId || null,
            messageType: messageType || 'TEXT',
            content: content || null,
            fileUrl: fileUrl || null,
            fileName: fileName || null,
          },
          include: {
            user: { select: { handleName: true, iconUrl: true } },
            reactions: true
          }
        });

        io.to(projectId).emit('receiveGroupChatMessage', newMessage);
      } catch (error) {
        console.error("Group chat message error:", error);
        socket.emit('messageError', 'メッセージの送信に失敗しました。');
      }
    });

    // --- 管理者個別チャット ---
    socket.on('sendAdminMessage', async ({ roomId, content }) => {
      const senderId = socket.user.id;
      const senderRole = socket.user.role;

      // 1. 権限チェック (管理者またはチャットルームの相手ユーザーであること)
      if (senderRole !== 'ADMIN' && senderRole !== 'USER' && senderRole !== 'FLORIST') {
        socket.emit('messageError', '権限がありません。');
        return;
      }

      // 2. チャットルーム情報の取得
      const room = await prisma.adminChatRoom.findUnique({ where: { id: roomId } });
      if (!room) {
        socket.emit('messageError', 'チャットルームが見つかりません。');
        return;
      }

      // 3. メッセージ保存
      const newMessage = await prisma.adminChatMessage.create({
        data: {
          chatRoomId: roomId,
          senderId: senderId,
          senderRole: senderRole,
          content: content,
        }
      });

      // 4. ルーム全員に送信
      io.to(roomId).emit('receiveAdminMessage', newMessage);

      // 5. ★★★ LARUbot 連携ロジック (管理者チャット用) ★★★
      // チャット相手がLARUbotキーを持っている場合 (例: FLORISTの場合)
      if (room.userRole === 'FLORIST' && room.userId) {
        const targetFlorist = await prisma.florist.findUnique({
          where: { id: room.userId },
          select: { laruBotApiKey: true }
        });

        if (targetFlorist && targetFlorist.laruBotApiKey) {
          try {
            // LARUbot APIを呼び出す
            const larubotResponse = await fetch('https://larubot.tokyo/api/v1/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${targetFlorist.laruBotApiKey}`
              },
              // 管理者チャットの場合、BotへのコンテキストとしてroomIdなどを渡す
              body: JSON.stringify({ message: content, userId: room.userId })
            });

            if (larubotResponse.ok) {
              const aiData = await larubotResponse.json();
              const aiContent = aiData.reply || "AIアシスタントは応答できません。";

              const aiMessage = await prisma.adminChatMessage.create({
                data: {
                  content: aiContent,
                  senderId: room.userId, // ユーザーに代わってBotが応答
                  senderRole: room.userRole,
                  isAutoResponse: true,
                  chatRoomId: roomId,
                }
              });
              io.to(roomId).emit('receiveAdminMessage', aiMessage);
            }
          } catch (aiError) {
            console.error("LARUbot API Error in Admin Chat:", aiError);
          }
        }
      }
    });

    // --- リアクション機能 (DB直接操作版) ---
    socket.on('handleReaction', async ({ messageId, emoji }) => {
      const userId = socket.user.id;

      if (!messageId || !emoji) return;

      try {
        // メッセージの存在確認とプロジェクトIDの取得
        const message = await prisma.groupChatMessage.findUnique({
          where: { id: messageId },
          select: { projectId: true }
        });

        if (!message) return;

        // 既存リアクションの検索
        const existingReaction = await prisma.groupChatMessageReaction.findUnique({
          where: {
            messageId_userId_emoji: {
              messageId: messageId,
              userId: userId,
              emoji: emoji,
            },
          },
        });

        if (existingReaction) {
          // 既に存在すれば削除 (トグルOFF)
          await prisma.groupChatMessageReaction.delete({
            where: { id: existingReaction.id },
          });

          // 全員に通知
          io.to(message.projectId).emit('reactionRemoved', { messageId, userId, emoji });
        } else {
          // 存在しなければ作成 (トグルON)
          const newReaction = await prisma.groupChatMessageReaction.create({
            data: { messageId, userId, emoji },
            include: { user: { select: { handleName: true } } }
          });

          // 全員に通知
          io.to(message.projectId).emit('reactionAdded', newReaction);
        }

      } catch (error) {
        console.error("Socket Reaction handling error:", error);
        socket.emit('messageError', 'リアクションの操作に失敗しました。');
      }
    });

    // --- 切断 ---
    socket.on('disconnect', () => {
      console.log('user disconnected:', socket.user.id);
    });
  });
}