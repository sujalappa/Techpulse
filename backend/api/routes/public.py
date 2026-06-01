from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, field_validator
import httpx

from api.deps import get_store
from config import get_settings
from db.store import JsonStore
from schemas import DigestFrequency, Subscriber

router = APIRouter(tags=["public"])


class SubscribeRequest(BaseModel):
    email: str
    name: str | None = None
    topics: list[str] = []
    frequency: DigestFrequency = "weekly"

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if "@" not in value or "." not in value:
            raise ValueError("Enter a valid email address")
        return value.strip().lower()


class LoginRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if "@" not in value or "." not in value:
            raise ValueError("Enter a valid email address")
        return value.strip().lower()


def _public_digest(digest):
    return {
        "id": digest.id,
        "run_id": digest.run_id,
        "title": digest.title,
        "intro": digest.intro,
        "items": digest.items,
        "created_at": digest.created_at,
        "published_targets": digest.published_targets,
    }


@router.get("/public/digests")
def list_public_digests(store: JsonStore = Depends(get_store)) -> dict:
    return {"digests": [_public_digest(digest) for digest in store.list_digests()]}


@router.get("/public/digests/{digest_id}")
def get_public_digest(digest_id: str, store: JsonStore = Depends(get_store)) -> dict:
    digest = store.load().digests.get(digest_id)
    if digest is None:
        raise HTTPException(status_code=404, detail="Digest not found")
    return {"digest": _public_digest(digest)}


@router.post("/public/subscribe")
async def subscribe(
    payload: SubscribeRequest,
    authorization: str | None = Header(default=None),
    store: JsonStore = Depends(get_store)
) -> dict:
    existing = store.find_subscriber_by_email(payload.email)
    if existing:
        token = authorization.removeprefix("Bearer ").strip() if authorization else ""
        session_subscriber = store.get_subscriber_by_token(token) if token else None
        if not session_subscriber or session_subscriber.email.lower() != payload.email.lower():
            raise HTTPException(
                status_code=400,
                detail="You are already subscribed! Please sign in to manage your preferences."
            )

    subscriber = store.upsert_subscriber(
        Subscriber(
            email=payload.email,
            name=payload.name,
            topics=payload.topics,
            frequency=payload.frequency,
        )
    )
    session = store.create_subscriber_session(subscriber.id)
    
    # Send email notification if Resend is configured
    settings = get_settings()
    if settings.resend_api_key:
        async with httpx.AsyncClient(timeout=10) as client:
            topics_str = ", ".join(subscriber.topics) if subscriber.topics else "General"
            name_greet = f" {subscriber.name}" if subscriber.name else ""
            html_content = f"""
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #10b981;">Welcome to TechPulse{name_greet}!</h2>
                <p>Thank you for subscribing to our weekly intelligence digest.</p>
                <p>You have subscribed to updates on the following topics:</p>
                <blockquote style="background: #f4f4f4; padding: 10px 15px; border-left: 4px solid #10b981; margin: 15px 0;">
                  <strong>{topics_str}</strong>
                </blockquote>
                <p>Our autonomous agents crawl research papers, developer blogs, and open-source signals to compile the most relevant updates. Our human editors review and approve them before they reach you.</p>
                <br />
                <p>Best regards,<br />The TechPulse Team</p>
              </body>
            </html>
            """
            try:
                await client.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                    json={
                        "from": settings.from_email,
                        "to": [subscriber.email],
                        "subject": "Welcome to TechPulse!",
                        "html": html_content,
                    },
                )
            except Exception as e:
                # Log or print error but don't fail the subscribe request
                print(f"Error sending subscription confirmation email: {e}")

    return {"subscriber": subscriber, "token": session.token}


@router.post("/public/login")
def login(payload: LoginRequest, store: JsonStore = Depends(get_store)) -> dict:
    subscriber = store.find_subscriber_by_email(payload.email)
    if subscriber is None:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    session = store.create_subscriber_session(subscriber.id)
    return {"subscriber": subscriber, "token": session.token}


@router.get("/public/me")
def me(
    authorization: str | None = Header(default=None),
    store: JsonStore = Depends(get_store),
) -> dict:
    token = authorization.removeprefix("Bearer ").strip() if authorization else ""
    subscriber = store.get_subscriber_by_token(token)
    if subscriber is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"subscriber": subscriber}
