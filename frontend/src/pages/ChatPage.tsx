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
  Search,
  CalendarClock,
  MapPin,
  Archive,
  ExternalLink,
  Crosshair,
} from 'lucide-react';
import { chatsApi, matchesApi, rewardsApi, paymentsApi, type ChatType, type MessageType, type MatchType, type RewardType } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { CAMPUS_LANDMARKS, useUserLocation } from '../hooks/useUserLocation';
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
  const [showShareLocationModal, setShowShareLocationModal] = useState(false);

  // Meeting Location Sharing State
  const [locationShareMode, setLocationShareMode] = useState<'current' | 'preset' | 'custom'>('current');
  const [selectedMeetingSpot, setSelectedMeetingSpot] = useState('Central Library');
  const [customMeetingSpot, setCustomMeetingSpot] = useState('');
  const [meetingNote, setMeetingNote] = useState('');
  const [sendingLocation, setSendingLocation] = useState(false);

  const {
    status: chatGeoStatus,
    errorMessage: chatGeoError,
    locationInfo: chatLocationInfo,
    requestLocation: requestChatLocation,
  } = useUserLocation();

  const handleSendMeetingLocation = async () => {
    if (!selectedChat) return;
    setSendingLocation(true);
    try {
      let locationPayload: { name: string; lat?: number; lng?: number } | undefined;

      if (locationShareMode === 'current') {
        let loc = chatLocationInfo;
        if (!loc) {
          loc = await requestChatLocation();
        }
        locationPayload = {
          name: loc.addressLabel || loc.name,
          lat: loc.coordinates.lat,
          lng: loc.coordinates.lng,
        };
      } else if (locationShareMode === 'preset') {
        const landmark = CAMPUS_LANDMARKS.find((l) => l.name === selectedMeetingSpot);
        locationPayload = {
          name: selectedMeetingSpot,
          lat: landmark ? landmark.coords[0] : undefined,
          lng: landmark ? landmark.coords[1] : undefined,
        };
      } else {
        if (!customMeetingSpot.trim()) {
          toast.error('Please enter a location description.');
          setSendingLocation(false);
          return;
        }
        locationPayload = {
          name: customMeetingSpot.trim(),
        };
      }

      const res = await chatsApi.sendMessage(
        selectedChat._id,
        meetingNote.trim() ? meetingNote.trim() : undefined,
        undefined,
        locationPayload,
      );

      const savedMessage = res.data.message;
      setMessages((prev) => {
        if (prev.some((m) => m._id === savedMessage._id)) return prev;
        return [...prev, savedMessage];
      });
      scrollToBottom();
      setShowShareLocationModal(false);
      setMeetingNote('');
      setCustomMeetingSpot('');
      toast.success('Meeting location shared!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to share meeting location.');
    } finally {
      setSendingLocation(false);
    }
  };

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
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

  const scrollToBottom = useCallback((smooth = true) => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto',
        });
      }
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

      // Keep workflow and header fully visible at top of viewport
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });

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
        scrollToBottom(false);
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
  const activeThread = selectedChat?.participants.find((p) => (p.id ?? (p as any)._id) !== user?.id) || null;

  return (
    <PageTransition className="w-full space-y-6">
      <ConnectionBanner status={connectionStatus} />

      {!selectedChat ? (
        /* When No Chat is Selected (e.g., initial /messages view) */
        <div className="glass-panel rounded-[24px] shadow-lg border p-6 sm:p-8">
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--glass-border)' }}>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>Secure Messages</h2>
                <p className="text-xs text-slate-500 mt-0.5">Select a verified match conversation to start coordinating</p>
              </div>
              <StatusDot status={connectionStatus} />
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--dash-text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations by name or item..."
                className="glass-input w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl"
              />
            </div>

            <div className="space-y-2 pt-2">
              {filteredChats.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[var(--primary)] dark:bg-blue-950/40 mx-auto">
                    <MessageCircle size={28} />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text)]">No conversations yet</h3>
                  <p className="max-w-xs text-xs text-[var(--secondary)] leading-relaxed mx-auto">
                    Verified item matches will allow direct messaging here.
                  </p>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const counterpart = chat.participants.find((p) => (p.id ?? (p as any)._id) !== user?.id);
                  const unread = unreadCounts[chat._id] ?? chat.unreadCount ?? 0;

                  return (
                    <button
                      key={chat._id}
                      onClick={() => handleChatSelect(chat)}
                      className="glass-action-card flex w-full items-center gap-4 p-4 text-left rounded-2xl hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all shadow-xs"
                    >
                      <div className="relative flex-shrink-0">
                        {counterpart?.avatar ? (
                          <img
                            src={counterpart.avatar}
                            alt={counterpart.name}
                            className="h-12 w-12 rounded-2xl object-cover border border-white/70 shadow-xs"
                          />
                        ) : (
                          <div className="dash-avatar-gradient flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-black uppercase text-white shadow-xs">
                            {counterpart?.name.charAt(0) ?? '?'}
                          </div>
                        )}
                        {counterpart?.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-bold" style={{ color: 'var(--dash-text-primary)' }}>{counterpart?.name}</p>
                          <span className="text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>
                            {chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="truncate text-xs mt-1" style={{ color: 'var(--dash-text-secondary)' }}>
                          {chat.isClosed
                            ? 'Archived Chat'
                            : chat.lastMessage?.text || (chat.lastMessage?.imageUrl ? '📎 Attachment' : 'Secure Chat')}
                        </p>
                      </div>

                      {unread > 0 && (
                        <span className="unread-badge shrink-0">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* When A Chat is Selected: Responsive Two-Column Dashboard */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* LEFT COLUMN: SECURE MESSAGES (Larger, prominent chat container)    */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div
            className="lg:col-span-6 xl:col-span-5 flex flex-col glass-panel rounded-[24px] shadow-lg border overflow-hidden h-[780px] min-h-[520px]"
            style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}
          >
            {/* Chat Panel Top Header */}
            <div className="shrink-0 border-b p-4 sm:px-5 sm:py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md" style={{ borderColor: 'var(--glass-border)' }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    {activeThread?.avatar ? (
                      <img
                        src={activeThread.avatar}
                        alt={activeThread.name}
                        className="h-11 w-11 rounded-2xl object-cover border border-slate-200 shadow-xs"
                      />
                    ) : (
                      <div className="dash-avatar-gradient flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black uppercase text-white shadow-xs">
                        {activeThread?.name.charAt(0) ?? '?'}
                      </div>
                    )}
                    {activeThread?.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-extrabold truncate" style={{ color: 'var(--dash-text-primary)' }}>
                        {activeThread?.name || 'Secure Conversation'}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-medium" style={{ color: 'var(--dash-text-secondary)' }}>
                      <span>{activeThread?.isOnline ? 'Online' : 'Offline'}</span>
                      <span>•</span>
                      <StatusDot status={connectionStatus} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/messages"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1E3A8A] hover:bg-slate-50 transition shadow-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                  >
                    Chats
                  </Link>
                </div>
              </div>
            </div>

            {/* Chat Messages Body (Internally scrollable, flexible height) */}
            <div
              ref={messagesContainerRef}
              className="flex-1 min-h-0 space-y-3.5 overflow-y-auto p-4 sm:p-5"
              style={{ background: 'var(--glass-bg-subtle)' }}
            >
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center space-y-2 py-12" style={{ color: 'var(--dash-text-muted)' }}>
                  <MessageCircle size={36} style={{ color: 'var(--dash-accent)' }} />
                  <p className="text-xs font-semibold text-center">Secure chat initialized. Send a message to coordinate handover.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId._id === user?.id;
                  return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 space-y-1.5 shadow-sm sm:max-w-md ${
                          isMe
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-br-xs shadow-md'
                            : 'glass-panel rounded-bl-xs border text-left'
                        }`}
                        style={{
                          color: isMe ? '#ffffff' : 'var(--dash-text-primary)',
                        }}
                      >
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt="attachment"
                            className="rounded-xl max-h-60 object-cover w-full cursor-pointer hover:opacity-90 transition shadow-xs"
                          />
                        )}

                        {/* Shared Meeting Location Bubble */}
                        {msg.location && (
                          <div
                            className={`rounded-xl p-3 border space-y-1.5 ${
                              isMe
                                ? 'bg-white/15 border-white/25 text-white'
                                : 'border-indigo-200/80 bg-indigo-50/80 text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-200'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider opacity-90">
                              <MapPin size={13} className={isMe ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'} />
                              <span>Meeting Handover Spot</span>
                            </div>
                            <p className="text-xs font-bold leading-snug">
                              {msg.location.name}
                            </p>
                            {(msg.location.lat !== undefined && msg.location.lng !== undefined) && (
                              <div className="flex items-center justify-between gap-2 pt-1 border-t border-current/15 text-[10px]">
                                <span className="font-mono opacity-85">
                                  {msg.location.lat.toFixed(4)}°, {msg.location.lng.toFixed(4)}°
                                </span>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${msg.location.lat},${msg.location.lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-1 font-bold underline hover:opacity-100 ${
                                    isMe ? 'text-white' : 'text-indigo-600 dark:text-indigo-300'
                                  }`}
                                >
                                  <span>Maps</span>
                                  <ExternalLink size={10} />
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {msg.text && <p className="text-xs leading-relaxed">{msg.text}</p>}
                        <div className={`flex items-center justify-end gap-1 text-[10px] ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                          <Clock size={9} />
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMe && (msg.isRead ? <CheckCheck size={11} className="text-indigo-200" /> : <Check size={11} />)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {someoneIsTyping && (
                <div className="flex items-center gap-2 justify-start pl-2">
                  <div className="glass-panel flex items-center gap-1 px-3 py-1.5 shadow-xs">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:300ms]" />
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--dash-text-muted)' }}>typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Archived Chat Banner */}
            {isReadOnly && (
              <div className="flex flex-col items-center justify-center gap-2 border-t px-4 py-3 text-center sm:flex-row sm:text-left" style={{ borderColor: 'var(--glass-border)', background: 'rgba(16,185,129,0.08)' }}>
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Archive size={14} />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Item Successfully Returned</p>
                  <p className="text-[10px] text-emerald-600/80">Chat Archived — This conversation is now read-only</p>
                </div>
              </div>
            )}

            {/* Image Preview Strip */}
            {imagePreview && (
              <div className="flex flex-col gap-3 border-t p-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}>
                <div className="flex items-center gap-3">
                  <img src={imagePreview} alt="preview" className="h-12 w-12 rounded-xl object-cover border" style={{ borderColor: 'var(--glass-border)' }} />
                  <span className="text-xs" style={{ color: 'var(--dash-text-secondary)' }}>Attached image preview</span>
                </div>
                <button onClick={clearImage} className="p-1 text-slate-400 hover:text-slate-700">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Message Input Form (Pinned at bottom of left panel) */}
            <form onSubmit={handleSendMessage} className="shrink-0 flex items-center gap-2 border-t p-3 sm:gap-3 sm:p-4" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}>
              <input type="file" ref={imageInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isReadOnly}
                className="footer-contact-icon-btn rounded-xl p-2.5 disabled:opacity-40"
                title="Attach photo"
              >
                <ImageIcon size={16} />
              </button>

              <button
                type="button"
                onClick={() => setShowShareLocationModal(true)}
                disabled={isReadOnly}
                className="footer-contact-icon-btn rounded-xl p-2.5 disabled:opacity-40 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition"
                title="Share Meeting / Handover Location"
              >
                <MapPin size={16} />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder={isReadOnly ? 'Item returned — Chat archived' : 'Type your message...'}
                disabled={isReadOnly}
                className="glass-input min-w-0 flex-1 px-4 py-2.5 text-xs font-medium outline-none transition disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={isReadOnly || sending || (!inputText.trim() && !selectedImage)}
                className="dash-btn-primary p-2.5 px-4 rounded-xl text-white shadow-md transition disabled:opacity-40"
              >
                {isReadOnly ? <Lock size={16} /> : sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* RIGHT COLUMN: MATCH DETAILS & WORKFLOW SECTIONS                     */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col space-y-5">
            {(() => {
              const currentCounterpart = activeThread;
              const currentUserId = String(user?.id || (user as any)?._id || '');
              const lostUserId = String((currentMatch?.lostUserId as any)?._id || (currentMatch?.lostUserId as any)?.id || currentMatch?.lostUserId || '');
              const foundUserId = String((currentMatch?.foundUserId as any)?._id || (currentMatch?.foundUserId as any)?.id || currentMatch?.foundUserId || '');

              const isOwner = Boolean(currentUserId && lostUserId && currentUserId === lostUserId);
              const isFinder = Boolean(currentUserId && foundUserId && currentUserId === foundUserId);
              const meetingConfirmed = currentMatch?.meetingStatus === 'CONFIRMED';
              const meetingPending = currentMatch?.meetingStatus === 'PENDING';
              const verificationVerified = currentMatch?.verificationStatus === 'VERIFIED';
              const rewardAmt = currentMatch?.rewardAmount ?? (currentMatch?.foundItemId as any)?.rewardAmount ?? (currentReward?.requestedAmount ?? 1);
              const paymentCompleted = currentMatch?.paymentStatus === 'PAID' || currentMatch?.rewardPaid || currentMatch?.rewardStatus === 'Paid';
              const canMarkReturned = Boolean((isFinder || !isOwner) && meetingConfirmed && verificationVerified && (paymentCompleted || rewardAmt === 0) && !currentMatch?.completed);

              return (
                <div className="space-y-5">
                  {/* 1. Header Card: Participant Info & Workflow Stepper */}
                  <div className="glass-panel p-5 sm:p-6 rounded-[24px] space-y-4 shadow-lg border" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}>
                    {/* Top Bar: Participant Info & Actions */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative">
                          {currentCounterpart?.avatar ? (
                            <img
                              src={currentCounterpart.avatar}
                              alt={currentCounterpart.name}
                              className="h-11 w-11 rounded-2xl object-cover border border-slate-200 shadow-xs"
                            />
                          ) : (
                            <div className="dash-avatar-gradient flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black uppercase text-white shadow-xs">
                              {currentCounterpart?.name.charAt(0) ?? '?'}
                            </div>
                          )}
                          {currentCounterpart?.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-base font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>{currentCounterpart?.name}</h3>
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
                          <span className="text-xs font-medium" style={{ color: 'var(--dash-text-secondary)' }}>
                            {currentCounterpart?.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        {currentMatch && (
                          <Link
                            to={`/matches/${currentMatch._id}`}
                            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#1E3A8A] hover:bg-slate-50 transition shadow-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                          >
                            Review Match
                          </Link>
                        )}

                        {currentMatch && !currentMatch.completed && (
                          <>
                            <button
                              onClick={() => setShowMeetingScheduler((v) => !v)}
                              className={`inline-flex items-center gap-1 rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-xs ${
                                meetingConfirmed
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'
                              }`}
                            >
                              <CalendarClock size={13} /> {meetingConfirmed ? 'Meeting Confirmed' : 'Schedule Meeting'}
                            </button>

                            <button
                              onClick={() => setShowVerificationModal(true)}
                              className={`inline-flex items-center gap-1 rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-xs ${
                                verificationVerified
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border-blue-200 bg-blue-50 text-[#2563EB] hover:bg-blue-100'
                              }`}
                            >
                              <ShieldCheck size={13} /> {verificationVerified ? 'Verified' : 'Verify Ownership'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Workflow Progress Stepper */}
                    <div className="flex items-center justify-between gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-[#F8FAFC] dark:bg-slate-800/60 dark:border-slate-700/80 px-3 py-3">
                      {[
                        { label: 'Chat', active: true, completed: true },
                        { label: 'Meeting', active: Boolean(meetingPending), completed: Boolean(meetingConfirmed) },
                        { label: 'Verification', active: Boolean(meetingConfirmed && !verificationVerified), completed: Boolean(verificationVerified) },
                        { label: 'Payment', active: Boolean(verificationVerified && !paymentCompleted), completed: Boolean(paymentCompleted) },
                        { label: 'Return', active: Boolean(verificationVerified && paymentCompleted && !currentMatch?.completed), completed: Boolean(currentMatch?.completed) },
                        { label: 'Completed', active: Boolean(currentMatch?.completed), completed: Boolean(currentMatch?.completed) },
                      ].map((step, idx) => {
                        let badgeStyle = 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
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
                              <div className={`h-0.5 flex-1 min-w-3 ${step.completed ? 'bg-[#16A34A]' : 'bg-slate-200 dark:bg-slate-700'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Proposed Meeting Request Banner (If Pending) */}
                  {currentMatch && meetingPending && isFinder && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                          <CalendarClock size={16} /> Proposed Meeting Request
                        </span>
                        <span className="rounded-md bg-amber-200/80 px-2.5 py-1 text-[10px] font-bold text-amber-900">
                          Response Required
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-slate-700 font-medium sm:grid-cols-2">
                        <p className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-amber-600" /> <strong>Location:</strong> {currentMatch.meetingLocation}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Clock size={13} className="text-amber-600" /> <strong>Time:</strong> {currentMatch.meetingTime ? new Date(currentMatch.meetingTime).toLocaleString() : 'TBD'}
                        </p>
                      </div>
                      {currentMatch.meetingCoordinates && (
                        <div className="h-32 w-full rounded-xl overflow-hidden border border-amber-200 mt-2 z-0">
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
                          className="rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                          {respondingMeeting ? 'Saving...' : 'Accept Meeting'}
                        </button>
                        <button
                          disabled={respondingMeeting}
                          onClick={() => handleRespondMeeting('decline')}
                          className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition disabled:opacity-50"
                        >
                          Decline Meeting
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. Meeting Confirmed Banner & Interactive Map */}
                  {currentMatch && meetingConfirmed && (
                    <div className="glass-panel p-5 sm:p-6 rounded-[24px] space-y-4 shadow-lg border border-emerald-200/80 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/50">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-2 text-base">
                          <CheckCircle size={18} className="text-[#16A34A]" /> Meeting Confirmed
                        </span>
                        <span className="rounded-full bg-emerald-200/80 px-3 py-1 text-[11px] font-extrabold text-emerald-900 border border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200">
                          Confirmed ✅
                        </span>
                      </div>

                      {/* Location / Time Details */}
                      <div className="grid grid-cols-1 gap-3 text-slate-700 dark:text-slate-300 font-medium sm:grid-cols-2 text-xs">
                        <div className="flex items-start gap-2 bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                          <MapPin size={15} className="text-[#16A34A] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Location</span>
                            <strong className="text-slate-800 dark:text-slate-100">{currentMatch.meetingLocation || 'Share Current Location'}</strong>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                          <Clock size={15} className="text-[#16A34A] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Scheduled Time</span>
                            <strong className="text-slate-800 dark:text-slate-100">{currentMatch.meetingTime ? new Date(currentMatch.meetingTime).toLocaleString() : '18/8/2026, 3:26:00 PM'}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Navigation & Live Location Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {currentMatch.meetingCoordinates && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${currentMatch.meetingCoordinates.lat},${currentMatch.meetingCoordinates.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                          >
                            <MapPin size={14} /> Navigate to Meeting
                          </a>
                        )}
                        <button
                          onClick={() => setSharingLiveLocation(!sharingLiveLocation)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition ${
                            sharingLiveLocation
                              ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <MapPin size={14} className={sharingLiveLocation ? 'animate-pulse' : ''} />
                          {sharingLiveLocation ? 'Stop Live Location' : 'Share My Live Location'}
                        </button>
                        {partnerSharingLiveLocation && (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-100 px-3 py-2 text-xs font-bold text-blue-800 border border-blue-200 animate-pulse">
                            <MapPin size={13} /> Partner is sharing location
                          </span>
                        )}
                      </div>

                      {/* Interactive Leaflet Map */}
                      {currentMatch.meetingCoordinates && (
                        <div className="h-60 w-full rounded-2xl overflow-hidden border border-emerald-200 mt-2 z-0 relative shadow-inner">
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

                  {/* 4. Reward Offer Section */}
                  {currentMatch && (
                    <RewardNegotiation
                      matchId={currentMatch._id}
                      initialAmount={rewardAmt}
                      rewardStatus={currentMatch.rewardStatus || 'Accepted'}
                      isOwner={isOwner}
                      onUpdate={() => {
                        matchesApi.getById(currentMatch._id).then((res) => setCurrentMatch(res.data.match));
                      }}
                    />
                  )}

                  {/* 5. Reward Payment Section (Role Aware: Owner vs Finder) */}
                  {currentMatch && (
                    <>
                      {!paymentCompleted ? (
                        isOwner ? (
                          <div className="glass-panel p-5 sm:p-6 rounded-[24px] space-y-4 shadow-lg border" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}>
                            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--glass-border)' }}>
                              <div>
                                <h3 className="text-base font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Secure Reward Payment</h3>
                                <p className="text-xs text-slate-500">Escrow protected transaction for verified handover</p>
                              </div>
                              <span className="text-sm font-extrabold text-[#2563EB] bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-xl">₹{rewardAmt}</span>
                            </div>
                            <RewardPayment
                              matchId={currentMatch._id}
                              defaultAmount={rewardAmt}
                              finderName={currentMatch.foundUserId.name}
                              itemName={currentMatch.lostItemId.itemName}
                              paymentStatus={currentMatch.paymentStatus}
                              isOwner={true}
                              onPaymentSuccess={() => {
                                matchesApi.getById(currentMatch._id).then((res) => setCurrentMatch(res.data.match));
                              }}
                            />
                          </div>
                        ) : (
                          <RewardPayment
                            matchId={currentMatch._id}
                            defaultAmount={rewardAmt}
                            finderName={currentMatch.foundUserId.name}
                            itemName={currentMatch.lostItemId.itemName}
                            paymentStatus={currentMatch.paymentStatus}
                            isOwner={false}
                            onPaymentSuccess={() => {
                              matchesApi.getById(currentMatch._id).then((res) => setCurrentMatch(res.data.match));
                            }}
                          />
                        )
                      ) : (
                        <div className="glass-panel p-5 rounded-[24px] border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 text-xs flex flex-wrap gap-3 items-center justify-between text-emerald-900 dark:text-emerald-200 font-semibold shadow-xs">
                          <span className="flex items-center gap-2 text-sm">
                            <CheckCircle size={18} className="text-[#16A34A]" /> Reward Payment Completed{rewardAmt > 0 ? ` (₹${rewardAmt})` : ''}
                            <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 px-2.5 py-0.5 rounded-full font-bold ml-1">PAID</span>
                          </span>
                          {currentMatch.paymentId && (
                            <button
                              onClick={handleDownloadReceipt}
                              disabled={downloadingReceipt}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-200 transition disabled:opacity-50 dark:bg-emerald-900/60 dark:text-emerald-100"
                            >
                              <Archive size={13} /> {downloadingReceipt ? 'Downloading...' : 'Download Receipt'}
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* 6. Return Section (Finder Only Action) */}
                  {currentMatch && !currentMatch.completed && isFinder && (
                    <div className="glass-panel p-5 rounded-[24px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border" style={{ borderColor: 'var(--glass-border)' }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--dash-text-primary)' }}>Item Return Verification</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Confirm item physical return to the verified owner.
                        </p>
                      </div>
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
                        className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-xs transition ${
                          canMarkReturned
                            ? 'bg-[#10B981] hover:bg-emerald-600'
                            : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500'
                        }`}
                      >
                        {canMarkReturned ? 'Mark Item Returned ✅' : 'Mark Item Returned 🔒'}
                      </button>
                    </div>
                  )}

                  {/* 7. Completed Section */}
                  {currentMatch?.completed && (
                    <div className="glass-panel p-5 rounded-[24px] border border-blue-200 bg-blue-50/60 dark:bg-blue-950/20 text-xs flex items-center justify-between text-[#1E3A8A] dark:text-blue-300 shadow-sm">
                      <span className="font-bold text-sm flex items-center gap-2">
                        🎉 Item Returned Successfully! Match coordination is completed.
                      </span>
                      <button
                        onClick={() => setShowRewardRatingModal(true)}
                        className="rounded-xl bg-[#1E3A8A] px-4 py-2 text-xs font-bold text-white hover:bg-[#2563EB] transition shadow-xs"
                      >
                        Rate & Review
                      </button>
                    </div>
                  )}

                  {/* 8. Meeting Scheduler Drawer (if open) */}
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
          </div>
        </div>
      )}

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

      {/* Share Meeting Location Modal */}
      {showShareLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div
            className="glass-panel w-full max-w-md p-5 sm:p-6 rounded-3xl space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
            style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--glass-border)' }}>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
                  <MapPin size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Share Meeting Location</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Coordinate a safe handover point</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShareLocationModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-800/80 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setLocationShareMode('current');
                  if (chatGeoStatus === 'idle') requestChatLocation().catch(() => {});
                }}
                className={`rounded-xl py-2 transition ${
                  locationShareMode === 'current'
                    ? 'bg-white text-purple-700 shadow-xs dark:bg-slate-900 dark:text-purple-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                My Live GPS
              </button>
              <button
                type="button"
                onClick={() => setLocationShareMode('preset')}
                className={`rounded-xl py-2 transition ${
                  locationShareMode === 'preset'
                    ? 'bg-white text-purple-700 shadow-xs dark:bg-slate-900 dark:text-purple-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Campus Spot
              </button>
              <button
                type="button"
                onClick={() => setLocationShareMode('custom')}
                className={`rounded-xl py-2 transition ${
                  locationShareMode === 'custom'
                    ? 'bg-white text-purple-700 shadow-xs dark:bg-slate-900 dark:text-purple-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Custom Spot
              </button>
            </div>

            {/* Tab Contents */}
            {locationShareMode === 'current' && (
              <div className="space-y-3">
                {chatGeoStatus === 'granted' && chatLocationInfo ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        Live Position Ready
                      </span>
                      <button
                        type="button"
                        onClick={() => requestChatLocation().catch(() => {})}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 underline dark:text-emerald-400"
                      >
                        <Crosshair size={11} />
                        <span>Refresh</span>
                      </button>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {chatLocationInfo.addressLabel}
                    </p>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      Lat: {chatLocationInfo.coordinates.lat.toFixed(5)}, Lng: {chatLocationInfo.coordinates.lng.toFixed(5)}
                      {chatLocationInfo.coordinates.accuracy && ` (±${chatLocationInfo.coordinates.accuracy}m)`}
                    </div>
                  </div>
                ) : chatGeoStatus === 'requesting' ? (
                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 text-xs font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Acquiring browser GPS position...</span>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/50 space-y-2 text-center">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {chatGeoError || 'Allow location access in your browser to share your live coordinates with the other person.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => requestChatLocation().catch(() => {})}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-purple-700 transition"
                    >
                      <Crosshair size={13} />
                      <span>Detect My Location</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {locationShareMode === 'preset' && (
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Select Campus Meeting Spot
                </label>
                <select
                  value={selectedMeetingSpot}
                  onChange={(e) => setSelectedMeetingSpot(e.target.value)}
                  className="glass-input h-11 w-full px-3 text-xs sm:text-sm font-semibold"
                >
                  {CAMPUS_LANDMARKS.map((landmark) => (
                    <option key={landmark.name} value={landmark.name}>
                      {landmark.name} ({landmark.category})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {locationShareMode === 'custom' && (
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Custom Handover Location
                </label>
                <input
                  type="text"
                  value={customMeetingSpot}
                  onChange={(e) => setCustomMeetingSpot(e.target.value)}
                  placeholder="e.g. Ground Floor Reception Desk, Outside AB-1 Cafe..."
                  className="glass-input h-11 w-full px-3 text-xs sm:text-sm font-medium"
                />
              </div>
            )}

            {/* Optional Note */}
            <div className="space-y-1.5">
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Additional Note (Optional)
              </label>
              <input
                type="text"
                value={meetingNote}
                onChange={(e) => setMeetingNote(e.target.value)}
                placeholder="e.g. Wearing a blue hoodie, sitting near the entrance..."
                className="glass-input h-10 w-full px-3 text-xs"
              />
            </div>

            {/* Modal Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--glass-border)' }}>
              <button
                type="button"
                onClick={() => setShowShareLocationModal(false)}
                className="dash-btn-secondary px-4 py-2 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendMeetingLocation}
                disabled={sendingLocation || (locationShareMode === 'current' && !chatLocationInfo && chatGeoStatus === 'requesting')}
                className="dash-btn-primary px-4 py-2 text-xs font-bold text-white inline-flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                {sendingLocation ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                <span>Share Location</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
