import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Send,
  Image as ImageIcon,
  MessageCircle,
  Clock,
  Check,
  CheckCheck,
  X,
  Lock,
  WifiOff,
  Loader2,
  ShieldCheck,
  CheckCircle,
  Gift,
  Search,
  CalendarClock,
  MapPin,
  Archive,
  CreditCard,
} from 'lucide-react';
import { chatsApi, matchesApi, rewardsApi, paymentsApi, type ChatType, type MessageType, type MatchType, type RewardType } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import {
  connectSocket,
  getSocket,
  onStatusChange,
  type ConnectionStatus,
} from '../lib/socket';
import PageTransition from '../components/PageTransition';
import OwnershipVerificationModal from '../components/OwnershipVerificationModal';
import MarkReturnedModal from '../components/MarkReturnedModal';
import RewardsAndRatingModal from '../components/RewardsAndRatingModal';
import { RewardPayment } from '../components/RewardPayment';
import { RewardNegotiation } from '../components/RewardNegotiation';
import MeetingScheduler from '../components/MeetingScheduler';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});



function ConnectionBanner({ status }: { status: ConnectionStatus }) {
  if (status === 'connected') return null;

  const config: Record<
    Exclude<ConnectionStatus, 'connected'>,
    { icon: React.ReactNode; text: string; className: string }
  > = {
    connecting: {
      icon: <Loader2 size={13} className="animate-spin" />,
      text: 'Connecting to socket server...',
      className: 'bg-blue-50 border-blue-200 text-[#1E3A8A]',
    },
    reconnecting: {
      icon: <Loader2 size={13} className="animate-spin" />,
      text: 'Reconnecting to socket server...',
      className: 'bg-blue-50 border-blue-200 text-[#1E3A8A]',
    },
    disconnected: {
      icon: <WifiOff size={13} />,
      text: 'Disconnected — messages will sync upon reconnection',
      className: 'bg-slate-50 border-slate-200 text-[#64748B]',
    },
  };

  const { icon, text, className } = config[status];
  return (
    <div className={`flex items-center gap-2 px-4 py-1.5 text-[11px] font-semibold border-b ${className}`}>
      {icon}
      <span>{text}</span>
    </div>
  );
}

function StatusDot({ status }: { status: ConnectionStatus }) {
  const dotClass =
    status === 'connected'
      ? 'bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.4)]'
      : status === 'connecting' || status === 'reconnecting'
      ? 'bg-[#F59E0B] animate-pulse'
      : 'bg-slate-400';

  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 rounded-full ${dotClass}`} />
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">{status}</span>
    </div>
  );
}

export default function ChatPage() {
  const { user, token } = useAuth();
  const { id: routeChatId } = useParams();

  const [chats, setChats] = useState<ChatType[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatType | null>(null);
  const [currentMatch, setCurrentMatch] = useState<MatchType | null>(null);
  const [currentReward, setCurrentReward] = useState<RewardType | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Workflow Modals
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showMarkReturnedModal, setShowMarkReturnedModal] = useState(false);
  const [showRewardRatingModal, setShowRewardRatingModal] = useState(false);
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);


  const [showPayRewardSection, setShowPayRewardSection] = useState(false);
  const [respondingMeeting, setRespondingMeeting] = useState(false);
  // Old inline scheduling state removed
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);

  // Live Location State
  const [sharingLiveLocation, setSharingLiveLocation] = useState(false);
  const [myLiveLocation, setMyLiveLocation] = useState<L.LatLng | null>(null);
  const [partnerLiveLocation, setPartnerLiveLocation] = useState<L.LatLng | null>(null);
  const [partnerSharingLiveLocation, setPartnerSharingLiveLocation] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const handleDownloadReceipt = async () => {
    if (!currentMatch?.paymentId) return;
    setDownloadingReceipt(true);
    try {
      const paymentIdStr = typeof currentMatch.paymentId === 'object' ? (currentMatch.paymentId as any)._id : currentMatch.paymentId;
      const res = await paymentsApi.downloadReceipt(paymentIdStr);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt_${paymentIdStr}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error('Failed to download receipt.');
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const handleRespondMeeting = async (action: 'accept' | 'decline') => {
    if (!currentMatch) return;
    setRespondingMeeting(true);
    try {
      const res = await matchesApi.respondMeeting(currentMatch._id, { action });
      setCurrentMatch(res.data.match);
      if (action === 'accept') {
        toast.success('Meeting accepted & confirmed!');
      } else {
        toast.success('Meeting declined.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to respond to meeting');
    } finally {
      setRespondingMeeting(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const selectedChatRef = useRef<ChatType | null>(null);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
    if (!selectedChat) {
      setSharingLiveLocation(false);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (sharingLiveLocation && selectedChat) {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser');
        setSharingLiveLocation(false);
        return;
      }
      getSocket()?.emit('start-live-location', { chatId: selectedChat._id });
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const coords = L.latLng(position.coords.latitude, position.coords.longitude);
          setMyLiveLocation(coords);
          getSocket()?.emit('update-location', {
            chatId: selectedChat._id,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          toast.error('Location error: ' + error.message);
        },
        { enableHighAccuracy: true }
      );
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (selectedChat) {
        getSocket()?.emit('stop-live-location', { chatId: selectedChat._id });
      }
      setMyLiveLocation(null);
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [sharingLiveLocation, selectedChat]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  }, []);

  const handleChatSelect = useCallback(
    async (chat: ChatType) => {
      const socket = getSocket();

      if (selectedChatRef.current) {
        socket?.emit('leave-chat', selectedChatRef.current._id);
      }

      setSelectedChat(chat);
      socket?.emit('join-chat', chat._id);

      setUnreadCounts((prev) => ({ ...prev, [chat._id]: 0 }));
      socket?.emit('message-read', { chatId: chat._id });
      setChats((prev) => prev.map((c) => (c._id === chat._id ? { ...c, unreadCount: 0 } : c)));

      // Fetch linked match details if match chat
      const matchObj = typeof chat.matchId === 'object' ? (chat.matchId as MatchType) : null;
      if (matchObj) {
        try {
          const matchRes = await matchesApi.getById(matchObj._id);
          setCurrentMatch(matchRes.data.match);
          try {
            const rewRes = await rewardsApi.getByMatchId(matchObj._id);
            setCurrentReward(rewRes.data.reward);
          } catch {
            setCurrentReward(null);
          }
        } catch {
          setCurrentMatch(matchObj);
          setCurrentReward(null);
        }
      } else {
        setCurrentMatch(null);
        setCurrentReward(null);
      }

      try {
        const res = await chatsApi.getMessages(chat._id);
        setMessages(res.data.messages);
        scrollToBottom();
      } catch {
        toast.error('Failed to load message history.');
      }
    },
    [scrollToBottom]
  );

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token);
    const unsubStatus = onStatusChange(setConnectionStatus);

    socket.on('new-message', (msg: MessageType) => {
      const currentChat = selectedChatRef.current;

      if (currentChat && msg.chatId === currentChat._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
        socket.emit('message-read', { chatId: currentChat._id });
      } else {
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.chatId]: (prev[msg.chatId] ?? 0) + 1,
        }));
      }

      setChats((prev) =>
        prev
          .map((c) =>
            c._id === msg.chatId
              ? {
                  ...c,
                  lastMessage: msg,
                  updatedAt: new Date().toISOString(),
                  unreadCount: c._id === currentChat?._id ? 0 : (c.unreadCount ?? 0) + 1,
                }
              : c
          )
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );
    });

    socket.on('partner-live-location-started', () => {
      setPartnerSharingLiveLocation(true);
    });

    socket.on('partner-location-update', (data: { lat: number; lng: number }) => {
      setPartnerLiveLocation(L.latLng(data.lat, data.lng));
    });

    socket.on('partner-live-location-stopped', () => {
      setPartnerSharingLiveLocation(false);
      setPartnerLiveLocation(null);
    });

    socket.on('user-typing', (senderId: string) => {
      setTypingUsers((prev) => ({ ...prev, [senderId]: true }));
      if (typingTimers.current[senderId]) clearTimeout(typingTimers.current[senderId]);
      typingTimers.current[senderId] = setTimeout(() => {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[senderId];
          return next;
        });
      }, 2500);
    });

    socket.on('messages-read', ({ chatId }: { chatId: string; readBy: string }) => {
      const currentChat = selectedChatRef.current;
      if (currentChat?._id === chatId) {
        setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      }
    });

    socket.on('match:completed', () => {
      toast.success('🎉 Item marked returned! Conversation archived.');
      if (selectedChatRef.current) {
        handleChatSelect(selectedChatRef.current);
      }
    });

    socket.on('presence:update', ({ userId, status }: { userId: string; status: 'online' | 'offline' }) => {
      const isOnline = status === 'online';
      setChats((prev) =>
        prev.map((c) => {
          if (c.participants.some((p) => (p.id ?? (p as any)._id) === userId)) {
            return {
              ...c,
              participants: c.participants.map((p) =>
                (p.id ?? (p as any)._id) === userId ? { ...p, isOnline } : p
              ),
            };
          }
          return c;
        })
      );
      setSelectedChat((prev) => {
        if (!prev) return null;
        if (prev.participants.some((p) => (p.id ?? (p as any)._id) === userId)) {
          return {
            ...prev,
            participants: prev.participants.map((p) =>
              (p.id ?? (p as any)._id) === userId ? { ...p, isOnline } : p
            ),
          };
        }
        return prev;
      });
    });

    socket.on('match:updated', async (data: { matchId?: string }) => {
      if (currentMatch && (data.matchId === currentMatch._id || !data.matchId)) {
        try {
          const matchRes = await matchesApi.getById(currentMatch._id);
          setCurrentMatch(matchRes.data.match);
        } catch {}
      }
    });

    socket.on('reward:updated', async () => {
      if (currentMatch) {
        try {
          const rewRes = await rewardsApi.getByMatchId(currentMatch._id);
          setCurrentReward(rewRes.data.reward);
        } catch {}
      }
    });

    return () => {
      unsubStatus();
      socket.off('new-message');
      socket.off('user-typing');
      socket.off('messages-read');
      socket.off('match:completed');
      socket.off('match:updated');
      socket.off('reward:updated');
      socket.off('reward:updated');
      socket.off('presence:update');
      socket.off('partner-live-location-started');
      socket.off('partner-location-update');
      socket.off('partner-live-location-stopped');
    };
  }, [token, handleChatSelect, scrollToBottom, currentMatch]);

  useEffect(() => {
    let isMounted = true;
    const fetchChats = async () => {
      try {
        const res = await chatsApi.getAll();
        if (!isMounted) return;
        const chatList = res.data.chats || [];
        setChats(chatList);
        const targetChat =
          (routeChatId &&
            chatList.find(
              (chat) =>
                chat._id === routeChatId ||
                (typeof chat.matchId === 'object' && chat.matchId?._id === routeChatId) ||
                (typeof chat.matchId === 'string' && chat.matchId === routeChatId)
            )) ||
          chatList[0] ||
          null;
        if (targetChat) {
          handleChatSelect(targetChat);
        }
      } catch {
        toast.error('Failed to load messaging threads.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchChats();
    return () => {
      isMounted = false;
    };
  }, [routeChatId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (selectedChat) {
      getSocket()?.emit('typing', { chatId: selectedChat._id });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || (!inputText.trim() && !selectedImage)) return;

    setSending(true);
    const textToSend = inputText.trim();
    const imageToSend = selectedImage ?? undefined;

    setInputText('');
    clearImage();

    try {
      const res = await chatsApi.sendMessage(selectedChat._id, textToSend, imageToSend);
      const savedMessage = res.data.message;

      setMessages((prev) => {
        if (prev.some((m) => m._id === savedMessage._id)) return prev;
        return [...prev, savedMessage];
      });
      scrollToBottom();
    } catch {
      toast.error('Failed to send message.');
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const filteredChats = chats.filter((c) => {
    const counterpart = c.participants.find((p) => (p.id ?? (p as any)._id) !== user?.id);
    const nameMatch = counterpart?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const itemMatch = c.itemPreview?.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    return !searchQuery || nameMatch || itemMatch;
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1E3A8A] border-t-transparent" />
      </div>
    );
  }

  const typingUserIds = Object.keys(typingUsers);
  const someoneIsTyping =
    selectedChat !== null &&
    typingUserIds.some((uid) => {
      const counterpart = selectedChat.participants.find((p) => (p.id ?? (p as any)._id) !== user?.id);
      return (counterpart?.id ?? (counterpart as any)?._id) === uid;
    });

  const isReadOnly = Boolean(selectedChat?.isClosed || currentMatch?.completed);

  return (
    <PageTransition className="flex h-[calc(100vh-140px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Left Sidebar: Threads & Search */}
      <div className="flex w-80 flex-col border-r border-slate-200 bg-[#F8FAFC]">
        <div className="space-y-3 border-b border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight text-[#0F172A]">Secure Messages</h2>
            <StatusDot status={connectionStatus} />
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs outline-none focus:border-[#3B82F6] transition"
            />
          </div>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {filteredChats.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <MessageCircle size={28} className="mx-auto mb-2 text-[var(--primary)] opacity-60" />
              <p className="text-xs font-bold text-[var(--text)]">No conversations yet</p>
              <p className="mt-1 text-[11px] text-[var(--secondary)] leading-relaxed">
                Verified item matches will allow messaging.
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const counterpart = chat.participants.find((p) => (p.id ?? (p as any)._id) !== user?.id);
              const active = selectedChat?._id === chat._id;
              const unread = unreadCounts[chat._id] ?? chat.unreadCount ?? 0;

              return (
                <button
                  key={chat._id}
                  onClick={() => handleChatSelect(chat)}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all ${
                    active
                      ? 'bg-white text-[#0F172A] font-semibold shadow-xs ring-1 ring-slate-200'
                      : 'text-[#64748B] hover:bg-white hover:text-[#0F172A]'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {counterpart?.avatar ? (
                      <img
                        src={counterpart.avatar}
                        alt={counterpart.name}
                        className="h-9 w-9 rounded-lg object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E3A8A] text-xs font-bold uppercase text-white">
                        {counterpart?.name.charAt(0) ?? '?'}
                      </div>
                    )}
                    {counterpart?.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-xs font-bold">{counterpart?.name}</p>
                      <span className="text-[10px] text-slate-400">
                        {chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-[#64748B] mt-0.5">
                      {chat.isClosed
                        ? 'Archived Chat'
                        : chat.lastMessage?.text || (chat.lastMessage?.imageUrl ? '📎 Attachment' : 'Secure Chat')}
                    </p>
                  </div>

                  {unread > 0 && !active && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2563EB] px-1 text-[9px] font-black text-white">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Main Panel */}
      <div className="flex flex-1 flex-col bg-white">
        <ConnectionBanner status={connectionStatus} />

        {selectedChat ? (
          <>
            {/* Header with Stepper & Workflow Controls */}
            {(() => {
              const currentCounterpart = selectedChat.participants.find((p) => (p.id ?? (p as any)._id) !== user?.id);
              const isOwner = currentMatch?.lostUserId._id === user?.id;
              const isFinder = currentMatch?.foundUserId._id === user?.id;
              const meetingConfirmed = currentMatch?.meetingStatus === 'CONFIRMED';
              const meetingPending = currentMatch?.meetingStatus === 'PENDING';
              const verificationVerified = currentMatch?.verificationStatus === 'VERIFIED';
              // Use the accepted reward amount from DB — never fall back to a hardcoded value
              const rewardAmt = currentMatch?.rewardAmount ?? (currentMatch?.foundItemId as any)?.rewardAmount ?? 0;
              const paymentCompleted = currentMatch?.paymentStatus === 'PAID' || currentMatch?.rewardPaid || currentMatch?.rewardStatus === 'Paid';
              // Pay button only shows after reward is explicitly Accepted AND rewardAmt > 0
              const rewardAccepted = currentMatch?.rewardStatus === 'Accepted' || currentMatch?.rewardStatus === 'Paid';
              const canPayReward = Boolean(
                isOwner &&
                verificationVerified &&
                !paymentCompleted &&
                rewardAmt > 0 &&
                rewardAccepted
              );
              // If there's no reward requested at all (rewardAmt === 0 and no reward doc), skip payment
              const canMarkReturned = Boolean(isFinder && meetingConfirmed && verificationVerified && (paymentCompleted || rewardAmt === 0) && !currentMatch?.completed);

              return (
                <div className="border-b border-slate-200 bg-white p-4 space-y-3">
                  {/* Top Bar: Participant Info & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {currentCounterpart?.avatar ? (
                          <img
                            src={currentCounterpart.avatar}
                            alt={currentCounterpart.name}
                            className="h-10 w-10 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E3A8A] text-sm font-bold text-white">
                            {currentCounterpart?.name.charAt(0) ?? '?'}
                          </div>
                        )}
                        {currentCounterpart?.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#0F172A]">{currentCounterpart?.name}</h3>
                          {verificationVerified && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-[#10B981]">
                              <ShieldCheck size={12} /> Verified
                            </span>
                          )}
                          {currentMatch?.completed && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-[#64748B]">
                              Returned
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#64748B]">
                          {currentCounterpart?.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {currentMatch && (
                        <Link
                          to={`/matches/${currentMatch._id}`}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1E3A8A] hover:bg-slate-50 transition"
                        >
                          Review Match
                        </Link>
                      )}

                      {currentMatch && !currentMatch.completed && (
                        <>
                          <button
                            onClick={() => setShowMeetingScheduler((v) => !v)}
                            className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                              meetingConfirmed
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'
                            }`}
                          >
                            <CalendarClock size={13} /> {meetingConfirmed ? 'Meeting Confirmed' : 'Schedule Meeting'}
                          </button>

                          <button
                            onClick={() => setShowVerificationModal(true)}
                            className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                              verificationVerified
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-blue-200 bg-blue-50 text-[#2563EB] hover:bg-blue-100'
                            }`}
                          >
                            <ShieldCheck size={13} /> {verificationVerified ? 'Verified' : 'Verify Ownership'}
                          </button>

                          {/* Pay Reward Button for Owner — only after reward is Accepted */}
                          {canPayReward && (
                            <button
                              onClick={() => setShowPayRewardSection((v) => !v)}
                              className="inline-flex items-center gap-1 rounded-xl bg-[#2563EB] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
                            >
                              <CreditCard size={13} /> Pay Reward{rewardAmt > 0 ? ` (₹${rewardAmt})` : ''}
                            </button>
                          )}

                          {/* Reward Negotiation Button */}
                          {currentReward && ['Pending', 'Negotiating'].includes(currentReward.status) && (
                            <button
                              onClick={() => setShowPayRewardSection((v) => !v)}
                              className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-600 transition"
                            >
                              <Gift size={13} /> Reward Offer: ₹{currentReward.requestedAmount}
                            </button>
                          )}

                          {/* Mark Returned - Finder only, enabled when meeting confirmed + verified + (paid OR no reward) */}
                          {isFinder && (
                            <button
                              disabled={!canMarkReturned}
                              onClick={() => {
                                if (!meetingConfirmed) {
                                  toast.error('Meeting must be confirmed by finder first.');
                                  return;
                                }
                                if (!verificationVerified) {
                                  toast.error('Ownership must be verified first before marking returned.');
                                  return;
                                }
                                if (rewardAmt > 0 && !paymentCompleted) {
                                  toast.error('Owner reward payment must be completed first.');
                                  return;
                                }
                                setShowMarkReturnedModal(true);
                              }}
                              className={`inline-flex items-center gap-1 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition ${
                                canMarkReturned
                                  ? 'bg-[#10B981] hover:bg-emerald-600'
                                  : 'bg-slate-300 cursor-not-allowed'
                              }`}
                              title={
                                !meetingConfirmed
                                  ? 'Confirm meeting first'
                                  : !verificationVerified
                                  ? 'Verify ownership first'
                                  : rewardAmt > 0 && !paymentCompleted
                                  ? 'Wait for owner reward payment'
                                  : 'Mark item as returned'
                              }
                            >
                              {canMarkReturned ? 'Mark Item Returned ✅' : 'Mark Item Returned 🔒'}
                            </button>
                          )}
                        </>
                      )}

                      {currentMatch && currentMatch.completed && (
                        <button
                          onClick={() => setShowRewardRatingModal(true)}
                          className="inline-flex items-center gap-1 rounded-xl bg-[#1E3A8A] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#2563EB] transition"
                        >
                          <Gift size={13} /> Rate & Review
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ─── Workflow Stepper Header ───────────────────────────────── */}
                  <div className="flex items-center justify-between gap-1 overflow-x-auto py-2.5 px-2 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
                    {[
                      { label: 'Chat', active: true, completed: true },
                      { label: 'Meeting', active: Boolean(meetingPending), completed: Boolean(meetingConfirmed) },
                      { label: 'Verification', active: Boolean(meetingConfirmed && !verificationVerified), completed: Boolean(verificationVerified) },
                      { label: 'Payment', active: Boolean(verificationVerified && !paymentCompleted), completed: Boolean(paymentCompleted) },
                      { label: 'Return', active: Boolean(verificationVerified && paymentCompleted && !currentMatch?.completed), completed: Boolean(currentMatch?.completed) },
                      { label: 'Completed', active: Boolean(currentMatch?.completed), completed: Boolean(currentMatch?.completed) },
                    ].map((step, idx) => {
                      let badgeStyle = 'bg-slate-200 text-slate-500';
                      let textStyle = 'text-slate-400 font-medium';
                      if (step.completed) {
                        badgeStyle = 'bg-[#16A34A] text-white font-bold';
                        textStyle = 'text-[#16A34A] font-bold';
                      } else if (step.active) {
                        badgeStyle = 'bg-[#2563EB] text-white font-bold animate-pulse';
                        textStyle = 'text-[#2563EB] font-bold';
                      }

                      return (
                        <div key={idx} className="flex items-center gap-1.5 flex-1 min-w-max">
                          <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${badgeStyle}`}>
                            {step.completed ? '✓' : idx + 1}
                          </div>
                          <span className={`text-[11px] ${textStyle}`}>{step.label}</span>
                          {idx < 5 && (
                            <div className={`h-0.5 flex-1 min-w-3 ${step.completed ? 'bg-[#16A34A]' : 'bg-slate-200'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* ─── Meeting Request Banner (Finder Action Required) ─────── */}
                  {currentMatch && meetingPending && isFinder && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 flex items-center gap-1.5">
                          <CalendarClock size={15} /> Proposed Meeting Request
                        </span>
                        <span className="rounded-md bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                          Response Required
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-700 font-medium">
                        <p className="flex items-center gap-1">
                          <MapPin size={13} className="text-amber-600" /> <strong>Location:</strong> {currentMatch.meetingLocation}
                        </p>
                        <p className="flex items-center gap-1">
                          <Clock size={13} className="text-amber-600" /> <strong>Time:</strong> {currentMatch.meetingTime ? new Date(currentMatch.meetingTime).toLocaleString() : 'TBD'}
                        </p>
                      </div>
                      {currentMatch.meetingCoordinates && (
                        <div className="h-24 w-full rounded-lg overflow-hidden border border-amber-200 mt-2 z-0">
                          <MapContainer center={[currentMatch.meetingCoordinates.lat, currentMatch.meetingCoordinates.lng]} zoom={15} className="h-full w-full" zoomControl={false} dragging={false} scrollWheelZoom={false}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[currentMatch.meetingCoordinates.lat, currentMatch.meetingCoordinates.lng]} icon={customIcon} />
                          </MapContainer>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          disabled={respondingMeeting}
                          onClick={() => handleRespondMeeting('accept')}
                          className="rounded-lg bg-[#16A34A] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                          {respondingMeeting ? 'Saving...' : 'Accept Meeting'}
                        </button>
                        <button
                          disabled={respondingMeeting}
                          onClick={() => handleRespondMeeting('decline')}
                          className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition disabled:opacity-50"
                        >
                          Decline Meeting
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ─── Meeting Confirmed Banner (Read Only) ─────────────────── */}
                  {currentMatch && meetingConfirmed && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle size={15} className="text-[#16A34A]" /> Meeting Confirmed
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-900 border border-emerald-300">
                            Confirmed ✅
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-700 pt-0.5 font-medium">
                        <p className="flex items-center gap-1">
                          <MapPin size={12} className="text-[#16A34A]" /> <strong>Location:</strong> {currentMatch.meetingLocation}
                        </p>
                        <p className="flex items-center gap-1">
                          <Clock size={12} className="text-[#16A34A]" /> <strong>Time:</strong> {currentMatch.meetingTime ? new Date(currentMatch.meetingTime).toLocaleString() : 'TBD'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {currentMatch.meetingCoordinates && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${currentMatch.meetingCoordinates.lat},${currentMatch.meetingCoordinates.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                          >
                            <MapPin size={13} /> Navigate to Meeting
                          </a>
                        )}
                        <button
                          onClick={() => setSharingLiveLocation(!sharingLiveLocation)}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold shadow-sm transition ${
                            sharingLiveLocation
                              ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <MapPin size={13} className={sharingLiveLocation ? 'animate-pulse' : ''} />
                          {sharingLiveLocation ? 'Stop Live Location' : 'Share My Live Location'}
                        </button>
                        {partnerSharingLiveLocation && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-2 py-1.5 text-[10px] font-bold text-blue-800 border border-blue-200 animate-pulse">
                            <MapPin size={11} /> Partner is sharing location
                          </span>
                        )}
                      </div>
                      {currentMatch.meetingCoordinates && (
                        <div className="h-48 w-full rounded-lg overflow-hidden border border-emerald-200 mt-2 z-0 relative">
                          <MapContainer 
                            center={myLiveLocation || [currentMatch.meetingCoordinates.lat, currentMatch.meetingCoordinates.lng]} 
                            zoom={16} 
                            className="h-full w-full"
                          >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[currentMatch.meetingCoordinates.lat, currentMatch.meetingCoordinates.lng]} icon={customIcon} />
                            
                            {myLiveLocation && (
                              <Marker 
                                position={myLiveLocation} 
                                icon={new L.Icon({
                                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                  iconSize: [25, 41], iconAnchor: [12, 41]
                                })} 
                              />
                            )}
                            
                            {partnerLiveLocation && (
                              <Marker 
                                position={partnerLiveLocation} 
                                icon={new L.Icon({
                                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
                                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                  iconSize: [25, 41], iconAnchor: [12, 41]
                                })} 
                              />
                            )}
                          </MapContainer>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─── Unified Reward Payment Card ──────────────────────────── */}
                  {currentMatch && verificationVerified && rewardAmt > 0 && rewardAccepted && !paymentCompleted && showPayRewardSection && (
                    <div className="mt-4">
                      <RewardPayment
                        matchId={currentMatch._id}
                        defaultAmount={rewardAmt}
                        finderName={currentMatch.foundUserId.name}
                        itemName={currentMatch.lostItemId.itemName}
                        paymentStatus={currentMatch.paymentStatus}
                        isOwner={isOwner}
                        onPaymentSuccess={() => {
                          matchesApi.getById(currentMatch._id).then((res) => setCurrentMatch(res.data.match));
                        }}
                      />
                    </div>
                  )}

                  {/* ─── Reward Negotiation Section ──────────────────────────── */}
                  {currentMatch && currentMatch.rewardStatus !== 'Paid' && (
                    <div className="mt-4">
                      <RewardNegotiation
                        matchId={currentMatch._id}
                        initialAmount={currentMatch.rewardAmount || 0}
                        rewardStatus={currentMatch.rewardStatus}
                        isOwner={isOwner}
                        onUpdate={() => {
                          matchesApi.getById(currentMatch._id).then((res) => setCurrentMatch(res.data.match));
                        }}
                      />
                    </div>
                  )}

                  {/* ─── Payment Completed Banner ────────────────────────────── */}
                  {currentMatch && paymentCompleted && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs flex flex-wrap gap-2 items-center justify-between text-emerald-900 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle size={15} className="text-[#16A34A]" /> Reward Payment Completed{rewardAmt > 0 ? ` (₹${rewardAmt})` : ''}
                        <span className="text-[10px] bg-emerald-200 px-2 py-0.5 rounded-md font-bold ml-1">PAID</span>
                      </span>
                      {currentMatch.paymentId && (
                        <button
                          onClick={handleDownloadReceipt}
                          disabled={downloadingReceipt}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-1.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-200 transition disabled:opacity-50"
                        >
                          <Archive size={12} /> {downloadingReceipt ? 'Downloading...' : 'Download Receipt'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* ─── Item Returned Banner ─────────────────────────────────── */}
                  {currentMatch?.completed && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs flex items-center justify-between text-[#1E3A8A]">
                      <span className="font-bold flex items-center gap-1.5">
                        🎉 Item Returned Successfully! Chat is archived.
                      </span>
                      <button
                        onClick={() => setShowRewardRatingModal(true)}
                        className="rounded-lg bg-[#1E3A8A] px-3 py-1 text-xs font-bold text-white hover:bg-[#2563EB] transition"
                      >
                        Rate & Review
                      </button>
                    </div>
                  )}

                  {/* ─── Meeting Scheduler Drawer ─────────────────────────────── */}
                  {showMeetingScheduler && currentMatch && !currentMatch.completed && (
                    <MeetingScheduler
                      matchId={currentMatch._id}
                      onClose={() => setShowMeetingScheduler(false)}
                      onSuccess={(updatedMatch) => setCurrentMatch(updatedMatch)}
                    />
                  )}
                </div>
              );
            })()}

            {/* Messages Body */}
            <div className="flex-1 space-y-4 overflow-y-auto bg-[#F8FAFC] p-6">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center space-y-2 text-[#64748B]">
                  <MessageCircle size={32} className="text-[#3B82F6]" />
                  <p className="text-xs font-semibold">Secure chat created. Send a message to coordinate handover.</p>
                </div>
              )}

              {messages.map((msg) => {
                const isMe = msg.senderId._id === user?.id;
                return (
                  <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-md rounded-2xl px-4 py-3 space-y-1.5 shadow-xs ${
                        isMe
                          ? 'bg-[#1E3A8A] text-white font-medium rounded-br-none'
                          : 'bg-white text-[#0F172A] rounded-bl-none border border-slate-200'
                      }`}
                    >
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="attachment"
                          className="rounded-lg max-h-60 object-cover w-full cursor-pointer hover:opacity-90 transition"
                        />
                      )}
                      {msg.text && <p className="text-xs leading-relaxed">{msg.text}</p>}
                      <div className={`flex items-center justify-end gap-1 text-[10px] ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                        <Clock size={9} />
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isMe && (msg.isRead ? <CheckCheck size={11} className="text-blue-300" /> : <Check size={11} />)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {someoneIsTyping && (
                <div className="flex items-center gap-2 justify-start pl-2">
                  <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#2563EB] [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#2563EB] [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#2563EB] [animation-delay:300ms]" />
                  </div>
                  <span className="text-[10px] text-[#64748B]">typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Archived Chat Banner */}
            {isReadOnly && (
              <div className="flex items-center justify-center gap-3 border-t border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <Archive size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-800">Item Successfully Returned</p>
                  <p className="text-[10px] text-emerald-600">Chat Archived — This conversation is now read-only</p>
                </div>
              </div>
            )}

            {/* Image Preview Strip */}
            {imagePreview && (

              <div className="flex items-center justify-between border-t border-slate-200 bg-white p-3">
                <div className="flex items-center gap-3">
                  <img src={imagePreview} alt="preview" className="h-12 w-12 rounded-lg object-cover border border-slate-200" />
                  <span className="text-xs text-[#64748B]">Attached image preview</span>
                </div>
                <button onClick={clearImage} className="p-1 text-slate-400 hover:text-slate-700">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-3 border-t border-slate-200 bg-white p-4">
              <input type="file" ref={imageInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isReadOnly}
                className="rounded-xl border border-slate-200 p-3 text-[#64748B] hover:bg-slate-50 disabled:opacity-40"
              >
                <ImageIcon size={16} />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder={isReadOnly ? 'Item returned — Chat archived' : 'Type your message...'}
                disabled={isReadOnly}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#3B82F6] transition disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={isReadOnly || sending || (!inputText.trim() && !selectedImage)}
                className="rounded-xl bg-[#1E3A8A] p-3 text-white shadow-xs hover:bg-[#2563EB] transition disabled:opacity-40"
              >
                {isReadOnly ? <Lock size={16} /> : sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>

            {/* Workflow Modals */}
            {showVerificationModal && currentMatch && user && (
              <OwnershipVerificationModal
                match={currentMatch}
                currentUserId={user.id}
                onClose={() => setShowVerificationModal(false)}
                onSuccess={() => {
                  if (selectedChat) handleChatSelect(selectedChat);
                }}
              />
            )}

            {showMarkReturnedModal && currentMatch && (
              <MarkReturnedModal
                match={currentMatch}
                onClose={() => setShowMarkReturnedModal(false)}
                onSuccess={() => {
                  if (selectedChat) handleChatSelect(selectedChat);
                  setShowRewardRatingModal(true);
                }}
              />
            )}

            {showRewardRatingModal && currentMatch && user && (
              <RewardsAndRatingModal
                match={currentMatch}
                currentUserId={user.id}
                onClose={() => setShowRewardRatingModal(false)}
                onSuccess={() => {
                  if (selectedChat) handleChatSelect(selectedChat);
                }}
              />
            )}
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center space-y-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[var(--primary)] dark:bg-blue-950/40 mb-2">
              <MessageCircle size={28} />
            </div>
            <h3 className="text-sm font-bold text-[var(--text)]">No conversations yet</h3>
            <p className="max-w-xs text-xs text-[var(--secondary)] leading-relaxed">
              Verified item matches will allow messaging.
            </p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
