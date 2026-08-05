from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ai.config import AI_PORT, HOST, NODE_BACKEND_URL
from ai.schemas import MatchRequest, MatchResponse, MatchResult, MatchScoreBreakdown
from ai.services.text_matching import calculate_text_score
from ai.services.image_matching import calculate_image_similarity
import uvicorn

app = FastAPI(
    title="CampusConnect AI Matching Engine",
    description="Python FastAPI Microservice for Lost & Found item matching using NLP & Computer Vision",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "CampusConnect AI Engine",
        "node_backend": NODE_BACKEND_URL,
        "features": ["Text Semantic Match", "Jaccard Tokenization", "Image Similarity"]
    }

@app.post("/match", response_model=MatchResponse)
def match_items(payload: MatchRequest):
    lost = payload.lostItem.dict()
    matches = []

    for found in payload.foundItems:
        found_dict = found.dict()
        text_scores = calculate_text_score(lost, found_dict)
        img_sim = calculate_image_similarity(lost.get("imageUrl"), found_dict.get("imageUrl"))

        # Combine text (80%) and image (20%) scores
        total_combined = round(text_scores["total"] * 0.8 + img_sim * 0.2, 2)

        confidence = "High" if total_combined >= 75 else ("Medium" if total_combined >= 45 else "Low")

        matches.append(
            MatchResult(
                foundItemId=found.id,
                totalScore=total_combined,
                confidence=confidence,
                breakdown=MatchScoreBreakdown(
                    category=text_scores["category"],
                    brand=text_scores["brand"],
                    color=text_scores["color"],
                    text_semantic=text_scores["text_semantic"],
                    image_similarity=img_sim
                )
            )
        )

    # Sort descending by total match score
    matches.sort(key=lambda x: x.totalScore, reverse=True)

    return MatchResponse(
        lostItemId=payload.lostItem.id,
        topMatches=matches,
        status="success"
    )

if __name__ == "__main__":
    uvicorn.run("ai.main:app", host=HOST, port=AI_PORT, reload=True)
