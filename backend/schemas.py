from datetime import datetime
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field


Category = Literal["AI", "DevTools", "OSS", "Infra", "Research"]
RunStatus = Literal["running", "waiting_approval", "completed", "failed"]
CheckpointName = Literal["topic_filter", "ranked_items", "final_digest"]
DigestFrequency = Literal["weekly"]


class Item(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    url: str
    source: str
    author: str | None = None
    summary: str = ""
    category: Category | None = None
    stack_tags: list[str] = Field(default_factory=list)
    relevance_score: float = 0.0
    novelty_score: float = 0.0
    approved: bool = True


class Digest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    run_id: str
    title: str
    intro: str
    markdown: str
    html: str
    items: list[Item]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    published_targets: list[str] = Field(default_factory=list)


class Checkpoint(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    run_id: str
    name: CheckpointName
    title: str
    description: str
    payload: dict
    approved: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    approved_at: datetime | None = None


class RunState(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    status: RunStatus = "running"
    stage: str = "created"
    items: list[Item] = Field(default_factory=list)
    digest: Digest | None = None
    error: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Subscriber(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    email: str
    name: str | None = None
    topics: list[str] = Field(default_factory=list)
    frequency: DigestFrequency = "weekly"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class SubscriberSession(BaseModel):
    token: str = Field(default_factory=lambda: str(uuid4()))
    subscriber_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AppState(BaseModel):
    runs: dict[str, RunState] = Field(default_factory=dict)
    checkpoints: dict[str, Checkpoint] = Field(default_factory=dict)
    digests: dict[str, Digest] = Field(default_factory=dict)
    subscribers: dict[str, Subscriber] = Field(default_factory=dict)
    subscriber_sessions: dict[str, SubscriberSession] = Field(default_factory=dict)
