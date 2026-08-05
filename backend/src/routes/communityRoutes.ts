import { Router, Response, NextFunction } from 'express';
import PostModel from '../models/Post';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { upload, uploadBufferToCloudinary } from '../services/cloudinaryService';
import { io } from '../server';

const router = Router();

// GET /api/community/posts — Get all community posts with pagination & category filter
router.get('/posts', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, hashtag, page = 1, limit = 20 } = req.query;
    const filter: any = {};

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (hashtag) {
      filter.hashtags = (hashtag as string).toLowerCase();
    }

    const skip = (Number(page) - 1) * Number(limit);

    const posts = await PostModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('author', 'name email avatar collegeName role')
      .populate('comments.user', 'name avatar');

    const total = await PostModel.countDocuments(filter);

    res.json({
      posts,
      total,
      page: Number(page),
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/community/posts — Create a new post (supports optional image/video file)
router.post('/posts', requireAuth, upload.single('media'), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { content, category = 'General', hashtags } = req.body;
    if (!content || !content.trim()) {
      res.status(400).json({ message: 'Post content cannot be empty' });
      return;
    }

    let mediaUrl: string | undefined;
    let mediaType: 'text' | 'image' | 'video' = 'text';

    if (req.file) {
      const isVideo = req.file.mimetype.startsWith('video/');
      const folder = isVideo ? 'campusconnect/videos' : 'campusconnect/posts';
      mediaUrl = await uploadBufferToCloudinary(req.file.buffer, folder);
      mediaType = isVideo ? 'video' : 'image';
    }

    // Extract hashtags from content or body
    const tagMatches = content.match(/#[\w]+/g) || [];
    const parsedTags = Array.from(new Set(tagMatches.map((tag: string) => tag.substring(1).toLowerCase())));

    const post = await PostModel.create({
      author: req.user!.userId,
      content,
      category,
      mediaType,
      mediaUrl,
      hashtags: parsedTags,
    });

    const populatedPost = await post.populate('author', 'name email avatar collegeName role');

    // Emit socket event for real-time community feed update
    if (io) {
      io.emit('community:new-post', populatedPost);
    }

    res.status(201).json({ message: 'Post created successfully', post: populatedPost });
  } catch (error) {
    next(error);
  }
});

// POST /api/community/posts/:id/like — Toggle Like
router.post('/posts/:id/like', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const post = await PostModel.findById(req.params.id);

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    const hasLiked = post.likes.some((id: any) => id.toString() === userId.toString());

    if (hasLiked) {
      post.likes = post.likes.filter((id: any) => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }

    await post.save();

    if (io) {
      io.emit('community:post-liked', { postId: post._id, likesCount: post.likes.length, likes: post.likes });
    }

    res.json({ message: hasLiked ? 'Unliked post' : 'Liked post', likesCount: post.likes.length, likes: post.likes });
  } catch (error) {
    next(error);
  }
});

// POST /api/community/posts/:id/comment — Add comment
router.post('/posts/:id/comment', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      res.status(400).json({ message: 'Comment text is required' });
      return;
    }

    const post = await PostModel.findById(req.params.id);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    post.comments.push({
      user: req.user!.userId,
      text: text.trim(),
    } as any);

    await post.save();
    const updated = await PostModel.findById(post._id).populate('comments.user', 'name avatar');

    if (io) {
      io.emit('community:post-commented', { postId: post._id, comments: updated?.comments });
    }

    res.json({ message: 'Comment added', comments: updated?.comments });
  } catch (error) {
    next(error);
  }
});

// GET /api/community/trending — Trending topics
router.get('/trending', async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posts = await PostModel.find({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
    const tagCounts: Record<string, number> = {};

    posts.forEach((post) => {
      post.hashtags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const sorted = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    res.json({ trending: sorted });
  } catch (error) {
    next(error);
  }
});

export default router;
