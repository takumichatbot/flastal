import { Server } from 'socket.io';

let io;

// サーバー起動時に一度だけ呼ばれる初期化関数
export const initSocket = (httpServer, options) => {
  io = new Server(httpServer, options);
  return io;
};

// どこからでも io を取得できる関数
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};