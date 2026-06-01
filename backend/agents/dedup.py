from schemas import Item


def _fingerprint(item: Item) -> str:
    return "".join(ch.lower() for ch in f"{item.title}:{item.url}" if ch.isalnum())


async def deduplicate(items: list[Item]) -> list[Item]:
    seen: set[str] = set()
    unique: list[Item] = []
    for item in items:
        key = _fingerprint(item)
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)
    return unique
