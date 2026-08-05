from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ItemPayload(BaseModel):
    id: str
    itemName: str
    category: str
    description: str
    brand: Optional[str] = None
    color: Optional[str] = None
    imageUrl: Optional[str] = None

class MatchRequest(BaseModel):
    lostItem: ItemPayload
    foundItems: List[ItemPayload]

class MatchScoreBreakdown(BaseModel):
    category: float
    brand: float
    color: float
    text_semantic: float
    image_similarity: float

class MatchResult(BaseModel):
    foundItemId: str
    totalScore: float
    confidence: str
    breakdown: MatchScoreBreakdown

class MatchResponse(BaseModel):
    lostItemId: str
    topMatches: List[MatchResult]
    status: str
    provider: str = "CampusConnect PyAI v1.0"
