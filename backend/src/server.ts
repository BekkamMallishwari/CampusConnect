import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import connectDB from '../config/db';

dotenv.config();

const app = express();
const requestedPort = Number(process.env.PORT || 5000);

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'CampusConnect API is running' });
});

app.get('/', (_req, res) => {
  res.send('CampusConnect backend is online');
});

const startServer = async () => {
  try {
    await connectDB();

    app.listen(requestedPort, () => {
      console.log(`Server running on port ${requestedPort}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
