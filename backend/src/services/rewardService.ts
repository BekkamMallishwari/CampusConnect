import UserModel from '../models/User';

const BADGES = [
  { name: 'Campus Hero', minPoints: 50 },
  { name: 'Trusted Finder', minPoints: 30 },
  { name: 'Helping Hands', minPoints: 15 },
  { name: 'Top Contributor', minPoints: 5 },
];

export const POINTS = {
  lostReport: 5,
  foundReport: 10,
  returnedItem: 25,
};

export const awardPoints = async (userId: string, points: number) => {
  const user = await UserModel.findById(userId);
  if (!user) return null;

  user.points = (user.points || 0) + points;
  const badges = new Set(user.badges || []);
  for (const badge of BADGES) {
    if (user.points >= badge.minPoints) {
      badges.add(badge.name);
    }
  }
  user.badges = Array.from(badges);
  await user.save();
  return user;
};

export const getLeaderboardQuery = async (limit = 10) => {
  return UserModel.find({ role: 'user' })
    .sort({ points: -1, createdAt: -1 })
    .limit(limit)
    .select('name avatar collegeName points badges');
};

