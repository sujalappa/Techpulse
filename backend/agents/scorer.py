import math
from collections import Counter

from schemas import Item


def _tokens(text: str) -> Counter[str]:
    return Counter(token for token in text.lower().split() if len(token) > 3)


def _cosine(left: Counter[str], right: Counter[str]) -> float:
    if not left or not right:
        return 0.0
    common = set(left) & set(right)
    dot = sum(left[token] * right[token] for token in common)
    left_norm = math.sqrt(sum(value * value for value in left.values()))
    right_norm = math.sqrt(sum(value * value for value in right.values()))
    return dot / (left_norm * right_norm) if left_norm and right_norm else 0.0


async def score_novelty(items: list[Item], past_digest_summaries: list[str]) -> list[Item]:
    past_vectors = [_tokens(summary) for summary in past_digest_summaries]
    for item in items:
        vector = _tokens(f"{item.title} {item.summary}")
        max_similarity = max((_cosine(vector, past) for past in past_vectors), default=0.0)
        item.novelty_score = round(max(0.0, 1.0 - max_similarity), 2)
    return sorted(items, key=lambda value: (value.novelty_score, value.relevance_score), reverse=True)
