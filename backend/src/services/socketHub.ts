import type { Server } from 'socket.io';

let io: Server | null = null;
const onlineUsers = new Set<string>();

export const setSocketServer = (server: Server) => {
  io = server;
};

export const markUserOnline = (userId: string) => {
  onlineUsers.add(userId);
};

export const markUserOffline = (userId: string) => {
  onlineUsers.delete(userId);
};

export const isUserOnline = (userId: string) => onlineUsers.has(userId);

export const emitToUser = (userId: string, event: string, payload: unknown) => {
  io?.to(`user:${userId}`).emit(event, payload);
};

export const emitToChat = (chatId: string, event: string, payload: unknown) => {
  io?.to(`chat:${chatId}`).emit(event, payload);
};

export const emitToConversation = emitToChat;

import ChatModel from '../models/Chat';

export const emitPresence = async (userId: string, status: 'online' | 'offline') => {
  try {
    const chats = await ChatModel.find({ participants: userId, isClosed: false });
    for (const chat of chats) {
      emitToChat(chat._id.toString(), 'presence:update', { userId, status });
    }
  } catch (err) {
    console.error('[Socket] Failed to broadcast user presence update:', err);
  }
};

export const getOnlineUsers = () => Array.from(onlineUsers);
