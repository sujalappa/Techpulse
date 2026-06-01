from schemas import Category, Item


def _classify(title: str) -> tuple[Category, list[str]]:
    text = title.lower()
    if any(token in text for token in ["agent", "language model", "llm", "decoding"]):
        return "AI", ["LLM", "Agents"]
    if "postgres" in text or "replication" in text:
        return "Infra", ["PostgreSQL", "Events"]
    if "rust" in text or "python" in text or "packaging" in text:
        return "DevTools", ["Rust", "Python"]
    if "open source" in text or "github" in text:
        return "OSS", ["Open Source"]
    if "arxiv" in text or "research" in text:
        return "Research", ["Research"]
    return "DevTools", ["Developer Tools"]


async def classify(items: list[Item]) -> list[Item]:
    for item in items:
        item.category, item.stack_tags = _classify(item.title)
    return items
