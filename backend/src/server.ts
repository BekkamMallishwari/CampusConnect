import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import connectDB from '../config/db';

import authRoutes from './routes/authRoutes';
import lostItemRoutes from './routes/lostItemRoutes';
import foundItemRoutes from './routes/foundItemRoutes';
import matchRoutes from './routes/matchRoutes';
import notificationRoutes from './routes/notificationRoutes';
import chatRoutes from './routes/chatRoutes';
import rewardRoutes from './routes/rewardRoutes';
import paymentRoutes from './routes/paymentRoutes';
import adminRoutes from './routes/adminRoutes';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Socket.IO setup for real-time chat
const io = new SocketIOServer(httpServer, {
  cors: { origin: allowedOrigins, credentials: true },
});

io.on('connection', (socket) => {
  socket.on('join-chat', (chatId: string) => {
    socket.join(chatId);
  });
  socket.on('leave-chat', (chatId: string) => {
    socket.leave(chatId);
  });
  socket.on('send-message', (data: { chatId: string; message: unknown }) => {
    io.to(data.chatId).emit('new-message', data.message);
  });
  socket.on('typing', (data: { chatId: string; userId: string }) => {
    socket.to(data.chatId).emit('user-typing', data.userId);
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
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'CampusConnect Lost & Found API is running' });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : 'Unexpected server error';
  console.error('API error:', message);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

const PORT = Number(process.env.PORT || 5001);

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`🚀 CampusConnect Lost & Found API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { io };
