import html

from schemas import Digest


async def format_digest(digest: Digest) -> Digest:
    items_html = []
    for item in digest.items:
        tags = ", ".join(item.stack_tags) if item.stack_tags else "General"
        items_html.append(
            f"""
            <article>
              <h2><a href="{html.escape(item.url)}">{html.escape(item.title)}</a></h2>
              <p>{html.escape(item.summary)}</p>
              <p><strong>{html.escape(item.category or "Uncategorised")}</strong> · {html.escape(tags)} ·
              relevance {item.relevance_score:.2f} · novelty {item.novelty_score:.2f}</p>
            </article>
            """
        )
    digest.html = f"""
    <!doctype html>
    <html>
      <body style="font-family: Inter, Arial, sans-serif; line-height: 1.5;">
        <h1>{html.escape(digest.title)}</h1>
        <p>{html.escape(digest.intro)}</p>
        {"".join(items_html)}
      </body>
    </html>
    """
    return digest
