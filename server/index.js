// server/index.js
import 'dotenv/config';
import { createServer } from 'http';
import { initSocket } from './src/config/socket.js'; // ★ここ重要
import app from './src/app.js';
import socketHandler from './src/sockets/socketHandler.js';

const PORT = process.env.PORT || 3001;
const httpServer = createServer(app);

const io = initSocket(httpServer, {
    cors: {
        origin: [ 'http://localhost:3000', process.env.FRONTEND_URL, 'https://www.flastal.com' ],
        credentials: true,
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
    },
    allowEIO3: true,
    transports: ['websocket', 'polling'],
});

socketHandler(io);

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});