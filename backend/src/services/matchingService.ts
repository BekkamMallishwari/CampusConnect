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
