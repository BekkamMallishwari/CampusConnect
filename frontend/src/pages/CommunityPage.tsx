import { useEffect, useState } from 'react';
import {
  Heart,
  MessageCircle,
  TrendingUp,
  Send,
  Sparkles,
  Plus,
  X,
  Megaphone,
  Trophy,
  Briefcase,
  Users,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import EmptyState from '../components/ui/EmptyState';
import { communityApi, type PostType } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'All', label: 'All Feeds', icon: Sparkles },
  { id: 'Announcement', label: 'Announcements', icon: Megaphone },
  { id: 'Hackathon', label: 'Hackathons', icon: Trophy },
  { id: 'Placement', label: 'Placements', icon: Briefcase },
  { id: 'Club', label: 'Clubs', icon: Users },
  { id: 'Event', label: 'Events', icon: Calendar },
  { id: 'LostItemAwareness', label: 'Lost Item Alert', icon: AlertTriangle },
];

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [trending, setTrending] = useState<Array<{ tag: string; count: number }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // New Post Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<string>('General');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comment Input State
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  // Fetch initial posts & trending topics
  useEffect(() => {
    const fetchCommunityData = async () => {
      setLoading(true);
      try {
        const [postsRes, trendingRes] = await Promise.all([
          communityApi.getPosts({
            category: selectedCategory !== 'All' ? selectedCategory : undefined,
            hashtag: selectedHashtag || undefined,
          }),
          communityApi.getTrendingHashtags(),
        ]);
        setPosts(postsRes.data.posts || []);
        setTrending(trendingRes.data.trending || []);
      } catch (err) {
        console.error('Failed to load community data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, [selectedCategory, selectedHashtag]);

  // Socket.IO Real-time listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewPost = (newPost: PostType) => {
      setPosts((prev) => [newPost, ...prev]);
    };

    const handlePostLiked = (data: { postId: string; likes: string[] }) => {
      setPosts((prev) =>
        prev.map((p) => (p._id === data.postId ? { ...p, likes: data.likes } : p)),
      );
    };

    const handlePostCommented = (data: { postId: string; comments: any[] }) => {
      setPosts((prev) =>
        prev.map((p) => (p._id === data.postId ? { ...p, comments: data.comments } : p)),
      );
    };

    socket.on('community:new-post', handleNewPost);
    socket.on('community:post-liked', handlePostLiked);
    socket.on('community:post-commented', handlePostCommented);

    return () => {
      socket.off('community:new-post', handleNewPost);
      socket.off('community:post-liked', handlePostLiked);
      socket.off('community:post-commented', handlePostCommented);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) {
      toast.error('Please enter content for your post.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', postContent);
      formData.append('category', postCategory);
      if (selectedFile) {
        formData.append('media', selectedFile);
      }

      await communityApi.createPost(formData);
      toast.success('Post created successfully!');
      setPostContent('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await communityApi.likePost(postId);
    } catch (err: any) {
      toast.error('Failed to like post');
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    try {
      await communityApi.commentPost(postId, text);
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch (err: any) {
      toast.error('Failed to post comment');
    }
  };

  return (
    <PageTransition className="space-y-6 py-2 pb-24">
      {/* 1. Hero Glass Banner */}
      <div className="glass-hero-banner relative p-6 sm:p-8">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-xs" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <Users size={12} /> Campus Community
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
              Campus Feed & Discussions
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>
              Connect with fellow students, discuss lost items, share hackathons, announcements, and campus activities.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="dash-btn-primary shrink-0 py-2.5 px-5 text-xs font-bold shadow-md"
          >
            <Plus size={15} /> Create Post
          </button>
        </div>
      </div>

      {/* Main Grid: Feed + Sidebar */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Left / Middle: Feed Column (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id && !selectedHashtag;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedHashtag(null);
                  }}
                  className={`glass-tab-pill flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold whitespace-nowrap ${
                    isActive ? 'active' : ''
                  }`}
                >
                  <Icon size={13} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {selectedHashtag && (
            <div className="glass-panel flex items-center justify-between p-3" style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Filtering posts tagged with #{selectedHashtag}
              </span>
              <button
                onClick={() => setSelectedHashtag(null)}
                className="text-xs font-bold underline"
                style={{ color: 'var(--dash-text-secondary)' }}
              >
                Clear filter
              </button>
            </div>
          )}

          {/* Posts List */}
          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p className="mt-2 text-xs" style={{ color: 'var(--dash-text-muted)' }}>Loading community feed...</p>
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              title="No posts found"
              description="Be the first student to post an update or announcement!"
            />
          ) : (
            <div className="space-y-5">
              {posts.map((post) => {
                const isLiked = post.likes.includes(user?.id || '');
                return (
                  <article key={post._id} className="glass-panel p-5 sm:p-6 space-y-4">
                    {/* Author Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {post.author?.avatar ? (
                          <img src={post.author.avatar} alt={post.author.name} className="h-10 w-10 rounded-xl object-cover border" style={{ borderColor: 'var(--glass-border)' }} />
                        ) : (
                          <div className="dash-avatar-gradient flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black text-white uppercase shadow-xs">
                            {post.author?.name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div>
                          <p className="text-xs sm:text-sm font-bold" style={{ color: 'var(--dash-text-primary)' }}>{post.author?.name || 'Campus Student'}</p>
                          <p className="text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>
                            {post.author?.collegeName || 'Student'} • {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border" style={{ borderColor: 'var(--glass-border)', color: 'var(--dash-accent)', background: 'rgba(99,102,241,0.08)' }}>
                        {post.category}
                      </span>
                    </div>

                    {/* Content Body */}
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--dash-text-primary)' }}>
                      {post.content}
                    </p>

                    {/* Media */}
                    {post.mediaUrl && (
                      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--glass-border)' }}>
                        {post.mediaType === 'video' ? (
                          <video src={post.mediaUrl} controls className="w-full max-h-[400px] object-cover" />
                        ) : (
                          <img src={post.mediaUrl} alt="Post media" className="w-full max-h-[400px] object-cover" />
                        )}
                      </div>
                    )}

                    {/* Hashtags */}
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.hashtags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => setSelectedHashtag(tag)}
                            className="text-xs font-bold text-indigo-500 hover:underline"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Engagement Action Bar */}
                    <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--glass-border)' }}>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => handleLike(post._id)}
                          className={`flex items-center gap-1.5 text-xs font-bold transition ${
                            isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}
                        >
                          <Heart size={16} className={isLiked ? 'fill-current text-rose-500' : ''} />
                          <span>{post.likes.length}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveCommentPostId(activeCommentPostId === post._id ? null : post._id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                        >
                          <MessageCircle size={16} />
                          <span>{post.comments?.length || 0}</span>
                        </button>
                      </div>
                    </div>

                    {/* Comments Drawer */}
                    {activeCommentPostId === post._id && (
                      <div className="border-t pt-4 space-y-3" style={{ borderColor: 'var(--glass-border)' }}>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {post.comments?.map((comment) => (
                            <div key={comment._id} className="flex items-start gap-2.5 p-2.5 rounded-xl border" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}>
                              <div className="h-6 w-6 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {comment.user?.name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <p className="text-xs font-bold" style={{ color: 'var(--dash-text-primary)' }}>{comment.user?.name || 'User'}</p>
                                <p className="text-xs" style={{ color: 'var(--dash-text-secondary)' }}>{comment.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentInputs[post._id] || ''}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [post._id]: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post._id)}
                            placeholder="Write a comment..."
                            className="glass-input flex-1 px-3 py-2 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleCommentSubmit(post._id)}
                            className="dash-btn-primary p-2 px-3 text-xs font-bold"
                          >
                            <Send size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Trending Topics Sidebar (1 col) */}
        <div className="space-y-5">
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--glass-border)' }}>
              <TrendingUp size={16} className="text-indigo-500" />
              <h3 className="text-sm font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Trending Hashtags</h3>
            </div>

            {trending.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>No trending topics yet.</p>
            ) : (
              <div className="space-y-2">
                {trending.map((t) => (
                  <button
                    key={t.tag}
                    onClick={() => {
                      setSelectedHashtag(t.tag);
                      setSelectedCategory('All');
                    }}
                    className="flex w-full items-center justify-between rounded-xl p-2.5 text-left transition hover:bg-indigo-500/10"
                  >
                    <span className="text-xs font-bold text-indigo-500">#{t.tag}</span>
                    <span className="text-[10.5px] font-bold" style={{ color: 'var(--dash-text-muted)' }}>{t.count} posts</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg overflow-hidden rounded-[22px] shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}>
              <h3 className="text-base font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>Create Community Post</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-xl p-1 text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--dash-text-primary)' }}>Category</label>
                <select
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value)}
                  className="glass-input h-10 w-full px-3 text-xs font-semibold"
                >
                  <option value="General">General</option>
                  <option value="Announcement">Announcement</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Placement">Placement</option>
                  <option value="Club">Club Activity</option>
                  <option value="Event">Campus Event</option>
                  <option value="LostItemAwareness">Lost Item Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--dash-text-primary)' }}>Post Content</label>
                <textarea
                  rows={4}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share news, announce an event, or describe a lost item update... (Use #hashtags to tag topics)"
                  className="glass-input w-full p-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--dash-text-primary)' }}>Attach Media (Optional)</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-500/10 file:text-indigo-600 hover:file:bg-indigo-500/20"
                />
                {previewUrl && (
                  <div className="mt-2 relative rounded-xl overflow-hidden max-h-40 border" style={{ borderColor: 'var(--glass-border)' }}>
                    <img src={previewUrl} alt="preview" className="w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="dash-btn-secondary py-2 px-4 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="dash-btn-primary py-2 px-5 text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting...' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
