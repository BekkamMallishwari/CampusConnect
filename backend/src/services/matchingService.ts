import { ILostItem } from '../models/LostItem';
import { IFoundItem } from '../models/FoundItem';

interface MatchScore {
  total: number;
  breakdown: {
    category: number;
    brand: number;
    color: number;
    itemName: number;
    description: number;
  };
}

const tokenize = (text: string): Set<string> => {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((t) => t.length > 2),
  );
};

const jaccardSimilarity = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 && b.size === 0) return 0;
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return intersection.size / union.size;
};

const substringMatch = (a?: string, b?: string): boolean => {
  if (!a || !b) return false;
  const al = a.toLowerCase().trim();
  const bl = b.toLowerCase().trim();
  return al.includes(bl) || bl.includes(al);
};

export const calculateMatchScore = (lostItem: ILostItem, foundItem: IFoundItem): MatchScore => {
  let categoryScore = 0;
  let brandScore = 0;
  let colorScore = 0;
  let itemNameScore = 0;
  let descriptionScore = 0;

  // Category: 25%
  if (lostItem.category && foundItem.category) {
    if (lostItem.category.toLowerCase() === foundItem.category.toLowerCase()) {
      categoryScore = 25;
    }
  }

  // Brand: 15%
  if (lostItem.brand && foundItem.description) {
    if (substringMatch(lostItem.brand, foundItem.description) || substringMatch(lostItem.brand, foundItem.itemName)) {
      brandScore = 15;
    }
  }

  // Color: 15%
  if (lostItem.color && foundItem.description) {
    if (substringMatch(lostItem.color, foundItem.description) || substringMatch(lostItem.color, foundItem.itemName)) {
      colorScore = 15;
    }
  }

  // Item Name: 20%
  const lostNameTokens = tokenize(lostItem.itemName);
  const foundNameTokens = tokenize(foundItem.itemName);
  const nameSimilarity = jaccardSimilarity(lostNameTokens, foundNameTokens);
  itemNameScore = Math.round(nameSimilarity * 20);

  // Description: 25% (increased from 15, absorb image placeholder)
  const lostDescTokens = tokenize(lostItem.description);
  const foundDescTokens = tokenize(foundItem.description);
  const descSimilarity = jaccardSimilarity(lostDescTokens, foundDescTokens);
  descriptionScore = Math.round(descSimilarity * 25);

  const total = Math.min(100, categoryScore + brandScore + colorScore + itemNameScore + descriptionScore);

  return {
    total,
    breakdown: {
      category: categoryScore,
      brand: brandScore,
      color: colorScore,
      itemName: itemNameScore,
      description: descriptionScore,
    },
  };
};

export const MATCH_THRESHOLD = 40; // items with >=40% are considered a possible match

import MatchModel from '../models/Match';
import LostItemModel from '../models/LostItem';
import FoundItemModel from '../models/FoundItem';
import RewardModel from '../models/Reward';
import NotificationModel from '../models/Notification';
import UserModel from '../models/User';
import { emitToUser } from './socketHub';
import { sendMatchNotificationEmail } from './emailService';

export async function processMatchPair(lostItem: ILostItem, foundItem: IFoundItem): Promise<void> {
  const lostUserIdStr = (lostItem.postedBy as { toString(): string }).toString();
  const foundUserIdStr = (foundItem.postedBy as { toString(): string }).toString();

  if (lostUserIdStr === foundUserIdStr) return;

  const existing = await MatchModel.findOne({ lostItemId: lostItem._id, foundItemId: foundItem._id });
  if (existing) return;

  const { total } = calculateMatchScore(lostItem, foundItem);
  if (total < MATCH_THRESHOLD) return;

  const match = await MatchModel.create({
    lostUserId: lostItem.postedBy,
    foundUserId: foundItem.postedBy,
    lostItemId: lostItem._id,
    foundItemId: foundItem._id,
    matchPercentage: total,
    rewardAmount: lostItem.rewardAmount || 0,
    rewardStatus: (lostItem.rewardAmount && lostItem.rewardAmount > 0) ? 'Pending' : 'None',
  });

  // Create initial reward offer automatically if the LostItem offered a reward
  let reward = null;
  if (lostItem.rewardAmount && lostItem.rewardAmount > 0) {
    try {
      reward = await RewardModel.create({
        matchId: match._id,
        lostUserId: lostItem.postedBy,
        foundUserId: foundItem.postedBy,
        requestedAmount: lostItem.rewardAmount,
        status: 'Pending',
        history: [
          {
            proposedBy: lostItem.postedBy,
            amount: lostItem.rewardAmount,
            action: 'Proposed',
          },
        ],
      });
    } catch (rewardErr) {
      console.warn('[MatchingService] Reward creation error (continuing match):', rewardErr);
    }
  }

  // Create notifications for both users
  const notifLost = await NotificationModel.create({
    userId: lostItem.postedBy,
    type: 'Match',
    title: 'Possible match found!',
    message: `We found a possible match for your lost "${lostItem.itemName}" — ${total}% confidence.`,
    relatedId: match._id,
    relatedModel: 'Match',
  });

  const notifFound = await NotificationModel.create({
    userId: foundItem.postedBy,
    type: 'Match',
    title: 'Possible owner found!',
    message: `Someone may have lost the "${foundItem.itemName}" you reported — ${total}% confidence.`,
    relatedId: match._id,
    relatedModel: 'Match',
  });

  // Emit socket events to both users
  emitToUser(lostUserIdStr, 'match:new', { matchId: match._id, percentage: total });
  emitToUser(foundUserIdStr, 'match:new', { matchId: match._id, percentage: total });
  emitToUser(lostUserIdStr, 'notification:new', notifLost);
  emitToUser(foundUserIdStr, 'notification:new', notifFound);

  if (reward) {
    emitToUser(foundUserIdStr, 'reward:offered', {
      matchId: match._id,
      rewardId: reward._id,
      amount: reward.requestedAmount,
    });
  }

  // Send email notifications asynchronously
  UserModel.find({ _id: { $in: [lostItem.postedBy, foundItem.postedBy] } })
    .then(([u1, u2]) => {
      const lostUser = (u1?._id?.toString() === lostUserIdStr) ? u1 : u2;
      const foundUser = (u1?._id?.toString() === foundUserIdStr) ? u1 : u2;
      if (lostUser && foundUser) {
        sendMatchNotificationEmail({
          lostUser: { name: lostUser.name, email: lostUser.email },
          foundUser: { name: foundUser.name, email: foundUser.email },
          lostItem: { itemName: lostItem.itemName, description: lostItem.description, images: lostItem.images || [] },
          foundItem: { itemName: foundItem.itemName, description: foundItem.description, images: foundItem.images || [] },
          matchPercentage: total,
          matchId: match._id.toString(),
        }).catch((e) => console.error('[MatchingService] Match notification email failed:', e));
      }
    })
    .catch((e) => console.error('[MatchingService] User lookup for match email failed:', e));
}

export async function triggerMatchingForFoundItem(foundItem: IFoundItem, foundUserId: string): Promise<void> {
  try {
    const activeLostItems = await LostItemModel.find({ isActive: true, status: 'Pending' });
    for (const lostItem of activeLostItems) {
      if (lostItem.postedBy.toString() === foundUserId) continue;
      await processMatchPair(lostItem, foundItem);
    }
  } catch (err) {
    console.error('[MatchingService] triggerMatchingForFoundItem error:', err);
  }
}

export async function triggerMatchingForLostItem(lostItem: ILostItem, lostUserId: string): Promise<void> {
  try {
    const activeFoundItems = await FoundItemModel.find({ isActive: true, status: 'Waiting' });
    for (const foundItem of activeFoundItems) {
      if (foundItem.postedBy.toString() === lostUserId) continue;
      await processMatchPair(lostItem, foundItem);
    }
  } catch (err) {
    console.error('[MatchingService] triggerMatchingForLostItem error:', err);
  }
}
