import ChatModel from '../models/Chat';
import MessageModel, { IMessage } from '../models/Message';
import NotificationModel from '../models/Notification';
import UserModel from '../models/User';
import { emitToUser, emitToChat } from './socketHub';
import { sendNewMessageEmail } from './emailService';

export interface CreateMessageInput {
  chatId: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  location?: {
    name: string;
    lat?: number;
    lng?: number;
  };
}

export interface CreateMessageResult {
  message: IMessage;
  isDuplicate?: boolean;
}

/**
 * Authoritative message creation pipeline.
 *
 * Sequence:
 *   1. Validate chat existence, participants, and closed status.
 *   2. Validate non-empty payload (text, image, or location).
 *   3. Deduplication check within 1500ms to prevent duplicate db/email/socket events.
 *   4. Save message in MongoDB.
 *   5. Update Chat.lastMessage & Chat.updatedAt.
 *   6. Create Notification in MongoDB for receiver.
 *   7. Emit real-time socket events (new-message, notification:new, notification:new-message, chat:updated).
 *   8. Queue/send exactly one email to receiver asynchronously with isolated error handling.
 */
export async function createAndDispatchMessage(
  input: CreateMessageInput,
): Promise<CreateMessageResult> {
  const { chatId, senderId, text, imageUrl, location } = input;

  if (!text && !imageUrl && !location) {
    throw new Error('Message must contain text, an image, or a location.');
  }

  const chat = await ChatModel.findById(chatId);
  if (!chat) {
    throw new Error('Chat not found.');
  }

  const isParticipant = chat.participants.some(
    (p: unknown) => (p as { toString(): string }).toString() === senderId,
  );
  if (!isParticipant) {
    throw new Error('Access denied. You are not a participant in this conversation.');
  }

  if (chat.isClosed) {
    throw new Error('This conversation is read-only because the item has been returned.');
  }

  // Deduplication guard: Check if identical message was created in the last 1500ms
  const recentThreshold = new Date(Date.now() - 1500);
  const recentDuplicate = await MessageModel.findOne({
    chatId,
    senderId,
    text: text || undefined,
    imageUrl: imageUrl || undefined,
    createdAt: { $gte: recentThreshold },
  }).populate('senderId', 'name avatar');

  if (recentDuplicate) {
    return { message: recentDuplicate, isDuplicate: true };
  }

  const receiverId = chat.participants
    .find((p: unknown) => (p as { toString(): string }).toString() !== senderId)
    ?.toString();

  // 1. Create message in DB
  const message = await MessageModel.create({
    chatId,
    conversationId: chatId,
    itemId: chat.itemId,
    senderId,
    receiverId,
    text,
    imageUrl,
    location,
  });

  // 2. Update Chat document
  chat.lastMessage = message._id as any;
  chat.updatedAt = new Date();
  await chat.save();

  const populated = await message.populate('senderId', 'name avatar');

  // 3. Dispatch to receiver (Notifications, Socket events, and Email)
  if (receiverId) {
    const notifText = text
      ? text.slice(0, 120)
      : location
      ? `📍 Shared a meeting location: ${location.name}`
      : 'You received an image attachment.';

    // Create DB notification
    const notif = await NotificationModel.create({
      userId: receiverId,
      type: 'Chat',
      title: 'New message',
      message: notifText,
      relatedId: chat._id as any,
      relatedModel: 'Chat',
    });

    // Real-time socket events
    emitToUser(receiverId, 'notification:new', notif);
    emitToUser(receiverId, 'notification:new-message', {
      chatId: chat._id.toString(),
      message: populated,
    });
    emitToUser(receiverId, 'chat:updated', { chatId: chat._id.toString() });

    // Asynchronously dispatch exactly one email (isolated, non-blocking)
    Promise.all([
      UserModel.findById(receiverId).select('name email'),
      UserModel.findById(senderId).select('name'),
    ])
      .then(([receiverUser, senderUser]) => {
        if (receiverUser?.email && senderUser?.name) {
          sendNewMessageEmail({
            recipientEmail: receiverUser.email,
            recipientName: receiverUser.name,
            senderName: senderUser.name,
            messagePreview: text || (location ? `Meeting location: ${location.name}` : 'Sent an attachment'),
            chatId: chat._id.toString(),
          }).catch((err) => console.error('[MessageService] sendNewMessageEmail failed:', err));
        }
      })
      .catch((err) => console.error('[MessageService] User lookup for email failed:', err));
  }

  // 4. Emit to Chat room and update sender's chat list
  emitToChat(chatId, 'new-message', populated);
  emitToUser(senderId, 'chat:updated', { chatId: chat._id.toString() });

  return { message: populated, isDuplicate: false };
}
