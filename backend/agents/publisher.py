from pathlib import Path

import httpx

from config import Settings
from schemas import Digest


async def publish_digest(digest: Digest, settings: Settings) -> Digest:
    settings.digest_dir.mkdir(parents=True, exist_ok=True)
    output_path = settings.digest_dir / f"{digest.id}.md"
    output_path.write_text(digest.markdown, encoding="utf-8")
    digest.published_targets.append(f"markdown:{output_path}")

    async with httpx.AsyncClient(timeout=10) as client:
        if settings.slack_webhook_url:
            await client.post(
                settings.slack_webhook_url,
                json={"text": digest.markdown[:2800]},
            )
            digest.published_targets.append("slack")

        if settings.resend_api_key and settings.to_email:
            await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                json={
                    "from": settings.from_email,
                    "to": [settings.to_email],
                    "subject": digest.title,
                    "html": digest.html,
                },
            )
            digest.published_targets.append("email")

    return digest
