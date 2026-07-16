import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Send, Image as ImageIcon, MessageCircle, Clock, Check, CheckCheck, X } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { chatsApi, type ChatType, type MessageType } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function ChatPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatType[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatType | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://127.0.0.1:5001';

  // Fetch all chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await chatsApi.getAll();
        setChats(res.data.chats);
        if (res.data.chats.length > 0 && !selectedChat) {
          handleChatSelect(res.data.chats[0]);
        }
      } catch (err) {
        toast.error('Failed to load messaging threads.');
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, []);

  // Socket connection
  useEffect(() => {
    socketRef.current = io(socketUrl, { withCredentials: true });

    socketRef.current.on('new-message', (msg: MessageType) => {
      if (selectedChat && msg.chatId === selectedChat._id) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
      
      // Update last message in thread list
      setChats((prevChats) =>
        prevChats.map((c) =>
          c._id === msg.chatId ? { ...c, lastMessage: msg, updatedAt: new Date().toISOString() } : c
        ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [selectedChat, socketUrl]);

  const handleChatSelect = async (chat: ChatType) => {
    if (selectedChat) {
      socketRef.current?.emit('leave-chat', selectedChat._id);
    }
    
    setSelectedChat(chat);
    socketRef.current?.emit('join-chat', chat._id);
    
    try {
      const res = await chatsApi.getMessages(chat._id);
      setMessages(res.data.messages);
      scrollToBottom();
    } catch (err) {
      toast.error('Failed to load message history.');
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || (!inputText.trim() && !selectedImage)) return;

    setSending(true);
    try {
      const textToSend = inputText;
      const imageToSend = selectedImage || undefined;
      
      // Clear inputs immediately for responsiveness
      setInputText('');
      clearImage();

      const res = await chatsApi.sendMessage(selectedChat._id, textToSend, imageToSend);
      
      // Emit message to other clients through socket
      socketRef.current?.emit('send-message', {
        chatId: selectedChat._id,
        message: res.data.message,
      });

      // Update local state if not added by socket
      setMessages((prev) => {
        if (prev.some((m) => m._id === res.data.message._id)) return prev;
        return [...prev, res.data.message];
      });
      scrollToBottom();
    } catch (err) {
      toast.error('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] rounded-3xl border border-slate-900 bg-slate-900/10 overflow-hidden shadow-2xl backdrop-blur-md">
      
      {/* Chats Threads list */}
      <div className="w-80 border-r border-slate-900 flex flex-col bg-slate-950/20">
        <div className="p-5 border-b border-slate-900 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Private Threads</h2>
          <MessageCircle size={18} className="text-slate-500" />
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {chats.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500">
              No verified chats yet.
            </div>
          ) : (
            chats.map((chat) => {
              const counterpart = chat.participants.find((p) => p.id !== user?.id);
              const active = selectedChat?._id === chat._id;
              return (
                <button
                  key={chat._id}
                  onClick={() => handleChatSelect(chat)}
                  className={`w-full text-left rounded-2xl p-4 transition-all duration-200 flex items-center gap-3.5 ${
                    active ? 'bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 text-white border-l-4 border-cyan-500 pl-3' : 'hover:bg-slate-900/40 text-slate-350 border-l-4 border-transparent'
                  }`}
                >
                  {counterpart?.avatar ? (
                    <img src={counterpart.avatar} alt="counterpart" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-950 text-xs font-semibold text-cyan-400 uppercase">
                      {counterpart?.name.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{counterpart?.name}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {chat.lastMessage?.text || (chat.lastMessage?.imageUrl ? 'Sent an attachment' : 'Verified Chat Room')}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Messaging Panel */}
      <div className="flex-1 flex flex-col bg-slate-900/10">
        {selectedChat ? (
          <>
            {/* Header info */}
            {(() => {
              const counterpart = selectedChat.participants.find((p) => p.id !== user?.id);
              return (
                <div className="p-5 border-b border-slate-900 flex items-center justify-between bg-slate-950/30">
                  <div className="flex items-center gap-3">
                    {counterpart?.avatar ? (
                      <img src={counterpart.avatar} alt="counterpart" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-950 text-xs font-semibold text-cyan-400 uppercase">
                        {counterpart?.name.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-white">{counterpart?.name}</h3>
                      <Link to={`/matches/${selectedChat.matchId._id}`} className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300">
                        View Item Handover Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.senderId._id === user?.id;
                return (
                  <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md rounded-2xl px-4.5 py-3 space-y-1.5 ${
                      isMe ? 'bg-gradient-to-tr from-cyan-500/90 to-indigo-500/90 text-slate-950 rounded-br-none shadow-lg' : 'bg-slate-900 text-slate-100 rounded-bl-none border border-slate-850'
                    }`}>
                      {msg.imageUrl && (
                        <img src={msg.imageUrl} alt="attachment" className="rounded-xl max-h-60 object-cover w-full cursor-pointer hover:opacity-90" />
                      )}
                      {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
                      <div className="flex items-center justify-end gap-1.5 text-[9px] opacity-75">
                        <Clock size={9} />
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && (msg.isRead ? <CheckCheck size={11} /> : <Check size={11} />)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Image Preview Box */}
            {imagePreview && (
              <div className="p-4 border-t border-slate-900 bg-slate-950/40 flex items-center justify-between animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <img src={imagePreview} alt="preview" className="h-16 w-16 rounded-xl object-cover border border-slate-800" />
                  <span className="text-xs text-slate-400">Attached image to message</span>
                </div>
                <button onClick={clearImage} className="rounded-full bg-slate-900 p-1.5 text-slate-405 hover:bg-slate-850 hover:text-white">
                  <X size={15} />
                </button>
              </div>
            )}

            {/* Input form */}
            <form onSubmit={handleSendMessage} className="p-5 border-t border-slate-900 bg-slate-950/20 flex items-center gap-3">
              <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-slate-350 transition hover:border-slate-700 hover:text-white"
              >
                <ImageIcon size={18} />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message here..."
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
              />

              <button
                type="submit"
                disabled={sending || (!inputText.trim() && !selectedImage)}
                className="rounded-xl bg-cyan-500 p-3 text-slate-950 hover:bg-cyan-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3">
            <MessageCircle size={36} className="text-slate-700" />
            <p className="text-sm font-semibold">Select a private thread from the list to start messaging</p>
          </div>
        )}
      </div>

    </div>
  );
}
