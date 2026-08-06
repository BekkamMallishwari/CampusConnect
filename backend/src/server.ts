/// <reference path="./types/passport.d.ts" />
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

const envCandidates = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
];

const envPath = envCandidates.find((candidate) => fs.existsSync(candidate));
if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket, DisconnectReason } from 'socket.io';
import { socketAuth } from './middleware/socketAuthMiddleware';
import { AuthSocket } from './types/socket';
import ChatModel from './models/Chat';
import MessageModel from './models/Message';
import connectDB from '../config/db';
import { setSocketServer, markUserOnline, markUserOffline, emitPresence, emitToUser, emitToChat } from './services/socketHub';

import authRoutes from './routes/authRoutes';
import lostItemRoutes from './routes/lostItemRoutes';
import foundItemRoutes from './routes/foundItemRoutes';
import matchRoutes from './routes/matchRoutes';
import notificationRoutes from './routes/notificationRoutes';
import chatRoutes from './routes/chatRoutes';
import rewardRoutes from './routes/rewardRoutes';
import paymentRoutes from './routes/paymentRoutes';
import adminRoutes from './routes/adminRoutes';
import lostFoundRoutes from './routes/lostFoundRoutes';
import testEmailRoutes from './routes/testEmailRoutes';
import aiRoutes from './routes/aiRoutes';
import communityRoutes from './routes/communityRoutes';
import passport from 'passport';
import './config/passport';

const app = express();
const httpServer = createServer(app);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const isLocalDevOrigin = (origin: string) => {
  try {
    const url = new URL(origin);
    return (
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.hostname === '::1'
    );
  } catch {
    return false;
  }
};

// Socket.IO setup for real-time chat
const io = new SocketIOServer(httpServer, {
  cors: { origin: allowedOrigins, credentials: true },
});
setSocketServer(io);

// ── JWT authentication middleware ────────────────────────────────────────────
// Runs once per connection attempt. Rejects unauthenticated sockets before
// any event handler can fire.
io.use(socketAuth);

io.on('connection', (rawSocket: Socket) => {
  const socket = rawSocket as AuthSocket;
  const { userId } = socket.user; // guaranteed by socketAuth

  console.log(`[Socket] User connected [userId=${userId}] [socketId=${socket.id}]`);
  socket.join(`user:${userId}`);
  markUserOnline(userId);
  emitPresence(userId, 'online');
  emitToUser(userId, 'presence:me', { userId, status: 'online' });

  // ── join-chat ──────────────────────────────────────────────────────────────
  // Only allow the socket to join a room if the authenticated user is an
  // actual participant in that verified chat (prevents room-snooping).
  socket.on('join-chat', async (chatId: string) => {
    try {
      const chat = await ChatModel.findById(chatId).populate('matchId');
      if (!chat) {
        socket.emit('error', { message: 'Chat not found.' });
        return;
      }
      const isParticipant = chat.participants.some(
        (p: unknown) => (p as { toString(): string }).toString() === userId,
      );
      if (!isParticipant) {
        socket.emit('error', { message: 'Access denied. You are not a participant of this chat.' });
        return;
      }
      socket.join(`chat:${chatId}`);
      console.log(`[Socket] User ${userId} joined chat room ${chatId}`);
    } catch (err) {
      console.error('[Socket] join-chat error:', err);
      socket.emit('error', { message: 'Failed to join chat.' });
    }
  });

  // ── leave-chat ─────────────────────────────────────────────────────────────
  socket.on('leave-chat', (chatId: string) => {
    socket.leave(`chat:${chatId}`);
    console.log(`[Socket] User ${userId} left chat room ${chatId}`);
  });

  // ── send-message ───────────────────────────────────────────────────────────
  // Persists the message to MongoDB, updates Chat.lastMessage, then broadcasts
  // the fully-populated message object to every socket in the room.
  // The senderId always comes from socket.user (server-verified), never the client.
  socket.on('send-message', async (data: { chatId: string; text?: string; imageUrl?: string }) => {
    try {
      const { chatId, text, imageUrl } = data;

      if (!text && !imageUrl) {
        socket.emit('error', { message: 'Message must contain text or an image.' });
        return;
      }

      // 1. Verify the sender is a participant before saving.
      const chat = await ChatModel.findById(chatId);
      if (!chat) {
        socket.emit('error', { message: 'Chat not found.' });
        return;
      }
      const isParticipant = chat.participants.some(
        (p: unknown) => (p as { toString(): string }).toString() === userId,
      );
      if (!isParticipant) {
        socket.emit('error', { message: 'Access denied.' });
        return;
      }

      // 2. Persist to MongoDB.
      const receiverId = chat.participants.find(
        (participant: unknown) => (participant as { toString(): string }).toString() !== userId,
      )?.toString();
      const message = await MessageModel.create({
        chatId,
        conversationId: chatId,
        senderId: userId,
        receiverId,
        text,
        imageUrl,
      });

      // 3. Update the chat's lastMessage pointer.
      chat.lastMessage = message._id as any;
      chat.updatedAt = new Date();
      await chat.save();

      // 4. Populate sender info and broadcast to room.
      const populated = await message.populate('senderId', 'name avatar');
      io.to(`chat:${chatId}`).emit('new-message', populated);
      if (receiverId) {
        emitToUser(receiverId, 'notification:new-message', {
          chatId,
          message: populated,
        });
      }

      console.log(`[Socket] Message saved & broadcast [chatId=${chatId}] [sender=${userId}]`);
    } catch (err) {
      console.error('[Socket] send-message error:', err);
      socket.emit('error', { message: 'Failed to send message.' });
    }
  });

  // ── typing ─────────────────────────────────────────────────────────────────
  // Broadcast the server-verified userId, never whatever the client sends.
  socket.on('typing', (data: { chatId: string }) => {
    socket.to(`chat:${data.chatId}`).emit('user-typing', userId);
  });

  // ── message-read ───────────────────────────────────────────────────────────
  // Mark all unread messages in a chat as read for the current user,
  // then notify the original senders via a per-socket event.
  socket.on('message-read', async (data: { chatId: string }) => {
    try {
      const { chatId } = data;
      // Mark messages not sent by this user as read.
      await MessageModel.updateMany(
        { chatId, senderId: { $ne: userId }, isRead: false },
        { isRead: true },
      );
      // Notify the room so the sender's UI can update the read-receipt tick.
      socket.to(`chat:${chatId}`).emit('messages-read', { chatId, readBy: userId });
    } catch (err) {
      console.error('[Socket] message-read error:', err);
    }
  });

  // ── live-location tracking ──────────────────────────────────────────────────
  socket.on('start-live-location', (data: { chatId: string }) => {
    socket.to(`chat:${data.chatId}`).emit('partner-live-location-started', userId);
  });

  socket.on('update-location', (data: { chatId: string; lat: number; lng: number }) => {
    socket.to(`chat:${data.chatId}`).emit('partner-location-update', {
      userId,
      lat: data.lat,
      lng: data.lng,
    });
  });

  socket.on('stop-live-location', (data: { chatId: string }) => {
    socket.to(`chat:${data.chatId}`).emit('partner-live-location-stopped', userId);
  });

  // ── disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', (reason: DisconnectReason) => {
    console.log(`[Socket] User disconnected [userId=${userId}] [reason=${reason}]`);
    markUserOffline(userId);
    emitPresence(userId, 'offline');
  });
});

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || isLocalDevOrigin(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(passport.initialize());
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/lost-items', lostItemRoutes);
app.use('/api/found-items', foundItemRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/test-email', testEmailRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/community', communityRoutes);

app.get('/', (_req, res) => {
  res.status(200).send('CampusConnect Backend API is running 🚀');
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// 404 handler — must be after all routes
app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json({ message: 'Route not found.' });
});

// Global error handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('API error stack:', err);
  const message = err instanceof Error ? err.message : 'Unexpected server error';
  res.status(500).json({ message: message || 'Something went wrong. Please try again.' });
});

const PORT = Number(process.env.PORT || 5001);

const startServer = async () => {
  try {
    console.log('⏳ Initializing CampusConnect Backend Server...');
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`🚀 CampusConnect Backend API running on port ${PORT}`);
      console.log(`   Health Check : http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Server startup aborted due to MongoDB connection failure:', error);
    process.exit(1);
  }
};

const handleShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Shutting down backend gracefully...`);
  try {
    const mongoose = (await import('mongoose')).default;
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');
    httpServer.close(() => {
      console.log('✅ HTTP server closed. Exiting process.');
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Error during server shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

startServer();

export { io };
