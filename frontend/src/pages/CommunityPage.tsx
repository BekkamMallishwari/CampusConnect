import { useEffect, useState } from 'react';
import {
  Heart,
  MessageCircle,
  TrendingUp,
  Image as ImageIcon,
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
import EmptyState from '../components/EmptyState';
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

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Submit Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) {
      toast.error('Please write something in your post');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', postContent.trim());
      formData.append('category', postCategory);
      if (selectedFile) {
        formData.append('media', selectedFile);
      }

      await communityApi.createPost(formData);
      toast.success('Post published!');
      setIsModalOpen(false);
      setPostContent('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setPostCategory('General');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Like
  const handleLike = async (postId: string) => {
    try {
      const res = await communityApi.likePost(postId);
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, likes: res.data.likes } : p)),
      );
    } catch {
      toast.error('Failed to update like');
    }
  };

  // Submit Comment
  const handleCommentSubmit = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    try {
      const res = await communityApi.commentPost(postId, text);
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, comments: res.data.comments } : p)),
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch {
      toast.error('Failed to post comment');
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8 py-4 pb-16 max-w-[1400px] mx-auto">
        
        {/* Header Banner */}
        <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="h-1 bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400" />
          <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300">
                <Users size={13} /> Campus Community Hub
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Connect, Share & Collaborate
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Engage with announcements, hackathons, placements, club events, and lost item alerts with live real-time updates.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 shrink-0"
            >
              <Plus size={16} /> Create Post
            </button>
          </div>
        </section>


        {/* Main Grid: Feed + Sidebar */}
        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* Left / Middle: Feed Column (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
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
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon size={14} />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {selectedHashtag && (
              <div className="flex items-center justify-between rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  Filtering posts tagged with #{selectedHashtag}
                </span>
                <button
                  onClick={() => setSelectedHashtag(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Clear filter
                </button>
              </div>
            )}

            {/* Posts List */}
            {loading ? (
              <div className="py-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                <p className="mt-2 text-xs text-slate-500">Loading community updates...</p>
              </div>
            ) : posts.length === 0 ? (
              <EmptyState
                title="No posts found"
                description="Be the first student to post an update or announcement!"
              />
            ) : (
              <div className="space-y-6">
                {posts.map((post) => {
                  const isLiked = post.likes.includes(user?.id || '');
                  return (
                    <article key={post._id} className="overflow-hidden rounded-[20px] border border-slate-200 bg-white p-6 shadow-xs space-y-4 dark:border-slate-800 dark:bg-slate-900">
                      
                      {/* Author Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {post.author?.avatar ? (
                            <img src={post.author.avatar} alt={post.author.name} className="h-10 w-10 rounded-xl object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white uppercase">
                              {post.author?.name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{post.author?.name || 'Campus Student'}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {post.author?.collegeName || 'Student'} • {new Date(post.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <span className="rounded-lg bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                          {post.category}
                        </span>
                      </div>

                      {/* Content Body */}
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                        {post.content}
                      </p>

                      {/* Media (Image or Video) */}
                      {post.mediaUrl && (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950/5">
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
                              className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Engagement Action Bar */}
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => handleLike(post._id)}
                            className={`flex items-center gap-1.5 text-xs font-bold transition ${
                              isLiked ? 'text-red-500' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                            }`}
                          >
                            <Heart size={16} className={isLiked ? 'fill-current text-red-500' : ''} />
                            <span>{post.likes.length}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveCommentPostId(activeCommentPostId === post._id ? null : post._id)}
                            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
                          >
                            <MessageCircle size={16} />
                            <span>{post.comments?.length || 0}</span>
                          </button>
                        </div>
                      </div>

                      {/* Comments Drawer */}
                      {activeCommentPostId === post._id && (
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {post.comments?.map((comment) => (
                              <div key={comment._id} className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                                <div className="h-6 w-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {comment.user?.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-900 dark:text-white">{comment.user?.name || 'User'}</p>
                                  <p className="text-xs text-slate-600 dark:text-slate-300">{comment.text}</p>
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
                              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleCommentSubmit(post._id)}
                              className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500"
                            >
                              <Send size={14} />
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

          {/* Right Sidebar: Trending Topics & Campus Guidelines */}
          <div className="space-y-6">
            
            {/* Trending Topics Card */}
            <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white p-5 shadow-xs space-y-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <TrendingUp size={16} className="text-blue-500" /> Trending Hashtags
              </h3>

              {trending.length === 0 ? (
                <p className="text-xs text-slate-500">No trending tags yet.</p>
              ) : (
                <div className="space-y-2">
                  {trending.map((t) => (
                    <button
                      key={t.tag}
                      onClick={() => setSelectedHashtag(t.tag)}
                      className="flex items-center justify-between w-full p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition"
                    >
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">#{t.tag}</span>
                      <span className="text-[10px] font-semibold text-slate-400">{t.count} posts</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Community Rules */}
            <div className="overflow-hidden rounded-[20px] border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 space-y-3 dark:from-slate-800/40 dark:to-slate-800/20 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Community Guidelines
              </h3>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-4">
                <li>Respect fellow university members</li>
                <li>No spam or fake lost item alerts</li>
                <li>Protect student privacy and credentials</li>
              </ul>
            </div>

          </div>
        </div>

        {/* Modal: Create Post */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-[20px] border border-slate-200 bg-white p-6 space-y-4 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Community Post</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white font-medium"
                  >
                    <option value="General">General</option>
                    <option value="Announcement">Announcement</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Placement">Placement</option>
                    <option value="Club">Club</option>
                    <option value="Event">Event</option>
                    <option value="LostItemAwareness">Lost Item Awareness</option>
                  </select>
                </div>

                <div>
                  <textarea
                    rows={4}
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="What's happening on campus? Use #hashtags..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* File Attachment Upload */}
                <div>
                  <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                    <ImageIcon size={14} /> Attach Image / Video
                    <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>

                {previewUrl && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-48">
                    <img src={previewUrl} alt="Upload preview" className="w-full h-48 object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 rounded-full bg-slate-950/70 p-1 text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Publishing...' : 'Publish Post'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </PageTransition>
  );
}
