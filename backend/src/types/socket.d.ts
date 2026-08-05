import { Socket as IOSocket } from 'socket.io';

/**
 * An authenticated Socket.IO socket with a verified `user` property
 * attached by socketAuthMiddleware.
 */
export interface AuthSocket extends IOSocket {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}
