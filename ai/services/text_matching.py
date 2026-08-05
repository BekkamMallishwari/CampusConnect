import re
from typing import Dict, Any, List

def tokenize(text: str) -> set:
    if not text:
        return set()
    cleaned = re.sub(r'[^a-zA-Z0-9\s]', '', text.lower())
    return set(token for token in cleaned.split() if len(token) > 2)

def jaccard_similarity(set_a: set, set_b: set) -> float:
    if not set_a and not set_b:
        return 0.0
    union = set_a.union(set_b)
    if not union:
        return 0.0
    intersection = set_a.intersection(set_b)
    return len(intersection) / len(union)

def calculate_text_score(lost_item: Dict[str, Any], found_item: Dict[str, Any]) -> Dict[str, float]:
    # Category score (30%)
    cat_score = 0.0
    if lost_item.get("category") and found_item.get("category"):
        if lost_item["category"].strip().lower() == found_item["category"].strip().lower():
            cat_score = 30.0

    # Brand score (15%)
    brand_score = 0.0
    lost_brand = (lost_item.get("brand") or "").strip().lower()
    found_desc = (found_item.get("description") or "").lower() + " " + (found_item.get("itemName") or "").lower()
    if lost_brand and lost_brand in found_desc:
        brand_score = 15.0

    # Color score (15%)
    color_score = 0.0
    lost_color = (lost_item.get("color") or "").strip().lower()
    if lost_color and lost_color in found_desc:
        color_score = 15.0

    # Semantic Text similarity on name + description (40%)
    lost_text = f"{lost_item.get('itemName', '')} {lost_item.get('description', '')}"
    found_text = f"{found_item.get('itemName', '')} {found_item.get('description', '')}"
    
    tokens_lost = tokenize(lost_text)
    tokens_found = tokenize(found_text)
    sim = jaccard_similarity(tokens_lost, tokens_found)
    text_sim_score = round(sim * 40.0, 2)

    total = min(100.0, cat_score + brand_score + color_score + text_sim_score)

    return {
        "category": cat_score,
        "brand": brand_score,
        "color": color_score,
        "text_semantic": text_sim_score,
        "total": round(total, 2)
    }
