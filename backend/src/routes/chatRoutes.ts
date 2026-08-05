import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import ChatModel from '../models/Chat';
import MessageModel from '../models/Message';
import LostItemModel from '../models/LostItem';
import FoundItemModel from '../models/FoundItem';
import NotificationModel from '../models/Notification';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { upload, uploadBufferToCloudinary } from '../services/cloudinaryService';
import { emitToUser, emitToChat } from '../services/socketHub';

const router = Router();

const isParticipant = (chat: { participants: unknown[] }, userId: string) =>
  chat.participants.some((p: unknown) => (p as { toString(): string }).toString() === userId);

const buildItemPreview = async (chat: any) => {
  if (chat.kind !== 'conversation' || !chat.itemId || !chat.itemType) {
    return null;
  }

  const item =
    chat.itemType === 'lost'
      ? await LostItemModel.findById(chat.itemId).select('itemName imageUrl images status lostLocation')
      : await FoundItemModel.findById(chat.itemId).select('itemName imageUrl images status foundLocation');

  if (!item) return null;

  return {
    _id: item._id.toString(),
    itemName: item.itemName,
    imageUrl: item.imageUrl || (item.images && item.images[0]) || '',
    status: item.status,
    location: chat.itemType === 'lost' ? item.lostLocation : item.foundLocation,
    itemType: chat.itemType,
  };
};

const getUnreadCount = async (chatId: string, userId: string) =>
  MessageModel.countDocuments({ chatId, senderId: { $ne: userId }, isRead: false });

import { isUserOnline } from '../services/socketHub';

// GET /api/chats — all chats for the user
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const chats = await ChatModel.find({ participants: req.user!.userId })
      .sort({ updatedAt: -1 })
      .populate('participants', 'name email avatar')
      .populate({ path: 'lastMessage', populate: { path: 'senderId', select: 'name avatar' } })
      .populate('matchId');

    const enriched = await Promise.all(
      chats.map(async (chat) => {
        const chatObj = chat.toObject();
        if (chatObj.participants) {
          chatObj.participants = chatObj.participants.map((p: any) => ({
            ...p,
            isOnline: isUserOnline(p._id ? p._id.toString() : p.toString()),
          }));
        }
        return {
          ...chatObj,
          unreadCount: await getUnreadCount(chat._id.toString(), req.user!.userId),
          itemPreview: await buildItemPreview(chat),
        };
      }),
    );

    res.json({ chats: enriched });
  } catch (error) {
    next(error);
  }
});

// POST /api/chats/contact-owner
router.post('/contact-owner', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schema = z.object({
      itemId: z.string().min(1),
      ownerId: z.string().min(1),
      itemType: z.enum(['lost', 'found']),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message || 'Invalid conversation request' });
      return;
    }

    const requesterId = req.user!.userId;
    if (requesterId === parsed.data.ownerId) {
      res.status(400).json({ message: 'You cannot contact yourself.' });
      return;
    }

    const existing = await ChatModel.findOne({
      kind: 'conversation',
      itemId: parsed.data.itemId,
      ownerId: parsed.data.ownerId,
      requesterId,
    })
      .populate('participants', 'name email avatar')
      .populate({ path: 'lastMessage', populate: { path: 'senderId', select: 'name avatar' } });

    if (existing) {
      const payload = {
        ...existing.toObject(),
        unreadCount: await getUnreadCount(existing._id.toString(), requesterId),
        itemPreview: await buildItemPreview(existing),
      };
      res.json({ chat: payload, created: false });
      return;
    }

    const chat = await ChatModel.create({
      kind: 'conversation',
      itemType: parsed.data.itemType,
      itemId: parsed.data.itemId,
      ownerId: parsed.data.ownerId,
      requesterId,
      participants: [parsed.data.ownerId, requesterId],
    });

    const populated = await ChatModel.findById(chat._id)
      .populate('participants', 'name email avatar')
      .populate({ path: 'lastMessage', populate: { path: 'senderId', select: 'name avatar' } });

    await NotificationModel.create({
      userId: parsed.data.ownerId,
      type: 'Item',
      title: 'New contact request',
      message: 'A student wants to start a private conversation about one of your item posts.',
      relatedId: chat._id as any,
      relatedModel: 'Chat',
    });
    emitToUser(parsed.data.ownerId, 'notification:new', {
      title: 'New contact request',
      message: 'A student wants to start a private conversation about one of your item posts.',
      type: 'Item',
      createdAt: new Date().toISOString(),
      isRead: false,
    });
    emitToUser(parsed.data.ownerId, 'chat:updated', {
      chatId: chat._id.toString(),
    });

    res.status(201).json({
      chat: {
        ...(populated?.toObject() ?? chat.toObject()),
        unreadCount: 0,
        itemPreview: await buildItemPreview(chat),
      },
      created: true,
    });
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
    if (!isParticipant(chat, req.user!.userId)) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    await MessageModel.updateMany(
      { chatId: req.params.chatId, senderId: { $ne: req.user!.userId }, isRead: false },
      { isRead: true },
    );
    const messages = await MessageModel.find({ chatId: req.params.chatId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name avatar')
      .populate('receiverId', 'name avatar');
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
      if (!isParticipant(chat, req.user!.userId)) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }
      if (chat.isClosed) {
        res.status(403).json({ message: 'This conversation is read-only because the item has been returned.' });
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

      const receiverId = chat.participants.find(
        (participant: unknown) => (participant as { toString(): string }).toString() !== req.user!.userId,
      )?.toString();

      const message = await MessageModel.create({
        chatId: req.params.chatId,
        conversationId: req.params.chatId,
        itemId: chat.itemId,
        senderId: req.user!.userId,
        receiverId,
        text,
        imageUrl,
      });

      chat.lastMessage = message._id as any;
      chat.updatedAt = new Date();
      await chat.save();

      const populated = await message.populate('senderId', 'name avatar');
      if (receiverId) {
        await NotificationModel.create({
          userId: receiverId,
          type: 'Chat',
          title: 'New message',
          message: text ? text.slice(0, 120) : 'You received an image message.',
          relatedId: chat._id as any,
          relatedModel: 'Chat',
        });
        emitToUser(receiverId, 'notification:new', {
          title: 'New message',
          message: text ? text.slice(0, 120) : 'You received an image message.',
          type: 'Chat',
          createdAt: new Date().toISOString(),
          isRead: false,
        });
      }

      emitToChat(req.params.chatId as string, 'new-message', populated);
      res.status(201).json({ message: populated });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
