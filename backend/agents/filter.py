from schemas import Item


TOPIC_WEIGHTS = {
    "agent": 0.26,
    "ai": 0.24,
    "llm": 0.22,
    "open source": 0.18,
    "developer": 0.16,
    "dev": 0.12,
    "infra": 0.14,
    "postgres": 0.1,
    "rust": 0.08,
    "python": 0.08,
    "vector": 0.12,
}


async def score_relevance(items: list[Item]) -> list[Item]:
    scored: list[Item] = []
    for item in items:
        text = f"{item.title} {item.source}".lower()
        score = 0.35 + sum(weight for token, weight in TOPIC_WEIGHTS.items() if token in text)
        item.relevance_score = min(round(score, 2), 1.0)
        scored.append(item)
    return sorted(scored, key=lambda value: value.relevance_score, reverse=True)
