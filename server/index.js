// server/index.js
import 'dotenv/config';
import { createServer } from 'http';
import { initSocket } from './src/config/socket.js'; 
import app from './src/app.js';
import socketHandler from './src/sockets/socketHandler.js';
import prisma from './src/config/prisma.js';

const PORT = process.env.PORT || 3001;
const httpServer = createServer(app);

// フロントエンドのURLリスト（末尾のスラッシュの有無によるエラーを回避）
const allowedOrigins = [
    'http://localhost:3000',
    'https://www.flastal.com',
    process.env.FRONTEND_URL
].filter(Boolean);

const io = initSocket(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
    },
    allowEIO3: true,
    transports: ['websocket', 'polling'],
});

socketHandler(io);

// サーバー起動
httpServer.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});

// 予期せぬエラーでプロセスを落とさないためのガード
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 終了時にDB接続をクリーンアップ
const gracefulShutdown = async () => {
    console.log('Shutting down gracefully...');
    await prisma.$disconnect();
    httpServer.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);