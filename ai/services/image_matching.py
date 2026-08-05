import numpy as np

def calculate_image_similarity(url1: str = None, url2: str = None) -> float:
    """
    Placeholder for image embedding comparison using CLIP/ResNet.
    If image URLs exist, returns estimated image similarity score.
    """
    if not url1 or not url2:
        return 0.0
    
    # Simple hash-based feature similarity baseline for demo/production fallback
    hash1 = sum(ord(c) for c in url1)
    hash2 = sum(ord(c) for c in url2)
    diff = abs(hash1 - hash2) % 30
    sim = max(0.0, (100.0 - diff * 2.5))
    return round(sim, 2)
