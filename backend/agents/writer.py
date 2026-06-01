from datetime import datetime

from schemas import Digest, Item


async def write_digest(run_id: str, items: list[Item]) -> Digest:
    title = f"TechPulse Digest - {datetime.utcnow().strftime('%Y-%m-%d')}"
    intro = "This week highlights practical movement across agents, developer tooling, infrastructure, and applied research."
    sections = [f"# {title}", "", intro, ""]
    for index, item in enumerate(items, start=1):
        tags = ", ".join(item.stack_tags) if item.stack_tags else "General"
        sections.extend(
            [
                f"## {index}. {item.title}",
                f"- Source: {item.source}",
                f"- Category: {item.category or 'Uncategorised'}",
                f"- Tags: {tags}",
                f"- Relevance: {item.relevance_score:.2f}",
                f"- Novelty: {item.novelty_score:.2f}",
                f"- Link: {item.url}",
                "",
                item.summary,
                "",
            ]
        )
    markdown = "\n".join(sections).strip() + "\n"
    return Digest(
        run_id=run_id,
        title=title,
        intro=intro,
        markdown=markdown,
        html="",
        items=items,
    )
