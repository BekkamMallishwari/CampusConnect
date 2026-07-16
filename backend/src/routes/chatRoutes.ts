import { Router, Response, NextFunction } from 'express';
import ChatModel from '../models/Chat';
import MessageModel from '../models/Message';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { upload, uploadBufferToCloudinary } from '../services/cloudinaryService';

const router = Router();

// GET /api/chats — all chats for the user
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const chats = await ChatModel.find({ participants: req.user!.userId })
      .sort({ updatedAt: -1 })
      .populate('participants', 'name email avatar')
      .populate({ path: 'lastMessage', populate: { path: 'senderId', select: 'name' } })
      .populate('matchId');
    res.json({ chats });
  } catch (error) {
    next(error);
  }
});

// GET /api/chats/:chatId/messages
router.get('/:chatId/messages', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const chat = await ChatModel.findById(req.params.chatId);
    if (!chat) {
      res.status(404).json({ message: 'Chat not found' });
      return;
    }
    const isParticipant = chat.participants.some((p: unknown) => (p as { toString(): string }).toString() === req.user!.userId);
    if (!isParticipant) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    // Mark messages as read
    await MessageModel.updateMany(
      { chatId: req.params.chatId, senderId: { $ne: req.user!.userId }, isRead: false },
      { isRead: true },
    );
    const messages = await MessageModel.find({ chatId: req.params.chatId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name avatar');
    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

// POST /api/chats/:chatId/messages
router.post(
  '/:chatId/messages',
  requireAuth,
  upload.single('image'),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const chat = await ChatModel.findById(req.params.chatId);
      if (!chat) {
        res.status(404).json({ message: 'Chat not found' });
        return;
      }
      const isParticipant = chat.participants.some((p: unknown) => (p as { toString(): string }).toString() === req.user!.userId);
      if (!isParticipant) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }
      const { text } = req.body;
      let imageUrl: string | undefined;
      if (req.file) {
        imageUrl = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname);
      }
      if (!text && !imageUrl) {
        res.status(400).json({ message: 'Message must contain text or an image' });
        return;
      }
      const message = await MessageModel.create({
        chatId: req.params.chatId,
        senderId: req.user!.userId,
        text,
        imageUrl,
      });
      // Update lastMessage on the chat
      chat.lastMessage = message._id as any;
      chat.updatedAt = new Date();
      await chat.save();
      const populated = await message.populate('senderId', 'name avatar');
      res.status(201).json({ message: populated });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
