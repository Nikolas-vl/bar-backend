import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../../utils/jwt';
import { logger } from '../../utils/logger';

export type SocketRole = 'USER' | 'ADMIN';

interface AuthenticatedSocket extends Socket {
  userId: number;
  role: SocketRole;
}

let io: SocketServer;

export const initSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(','),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = verifyAccessToken(token) as { userId: number; role: SocketRole };
      (socket as AuthenticatedSocket).userId = payload.userId;
      (socket as AuthenticatedSocket).role = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const s = socket as AuthenticatedSocket;
    logger.info({ userId: s.userId, role: s.role }, 'Socket connected');
    s.join(`user:${s.userId}`);
    if (s.role === 'ADMIN') {
      s.join('room:admin');
    }

    s.on('disconnect', () => {
      logger.info({ userId: s.userId }, 'Socket disconnected');
    });
  });

  return io;
};

export const getIO = (): SocketServer => {
  if (!io) throw new Error('Socket.io not initialised — call initSocket() first');
  return io;
};
