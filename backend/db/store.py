from datetime import datetime
from pathlib import Path

from schemas import AppState, Checkpoint, Digest, RunState, Subscriber, SubscriberSession


class JsonStore:
    def __init__(self, state_file: Path) -> None:
        self.state_file = state_file
        self.state_file.parent.mkdir(parents=True, exist_ok=True)

    def load(self) -> AppState:
        if not self.state_file.exists():
            return AppState()
        return AppState.model_validate_json(self.state_file.read_text(encoding="utf-8"))

    def save(self, state: AppState) -> None:
        self.state_file.write_text(
            state.model_dump_json(indent=2),
            encoding="utf-8",
        )

    def upsert_run(self, run: RunState) -> RunState:
        state = self.load()
        run.updated_at = datetime.utcnow()
        state.runs[run.id] = run
        self.save(state)
        return run

    def add_checkpoint(self, checkpoint: Checkpoint) -> Checkpoint:
        state = self.load()
        state.checkpoints[checkpoint.id] = checkpoint
        self.save(state)
        return checkpoint

    def update_checkpoint(self, checkpoint: Checkpoint) -> Checkpoint:
        state = self.load()
        state.checkpoints[checkpoint.id] = checkpoint
        self.save(state)
        return checkpoint

    def add_digest(self, digest: Digest) -> Digest:
        state = self.load()
        state.digests[digest.id] = digest
        self.save(state)
        return digest

    def upsert_subscriber(self, subscriber: Subscriber) -> Subscriber:
        state = self.load()
        existing = next(
            (item for item in state.subscribers.values() if item.email.lower() == subscriber.email.lower()),
            None,
        )
        if existing:
            existing.name = subscriber.name or existing.name
            existing.topics = subscriber.topics
            existing.frequency = subscriber.frequency
            existing.is_active = True
            existing.updated_at = datetime.utcnow()
            state.subscribers[existing.id] = existing
            self.save(state)
            return existing
        subscriber.updated_at = datetime.utcnow()
        state.subscribers[subscriber.id] = subscriber
        self.save(state)
        return subscriber

    def find_subscriber_by_email(self, email: str) -> Subscriber | None:
        state = self.load()
        return next(
            (item for item in state.subscribers.values() if item.email.lower() == email.lower()),
            None,
        )

    def create_subscriber_session(self, subscriber_id: str) -> SubscriberSession:
        state = self.load()
        session = SubscriberSession(subscriber_id=subscriber_id)
        state.subscriber_sessions[session.token] = session
        self.save(state)
        return session

    def get_subscriber_by_token(self, token: str) -> Subscriber | None:
        state = self.load()
        session = state.subscriber_sessions.get(token)
        if session is None:
            return None
        return state.subscribers.get(session.subscriber_id)

    def latest_open_checkpoint(self) -> Checkpoint | None:
        state = self.load()
        pending = [cp for cp in state.checkpoints.values() if not cp.approved]
        pending.sort(key=lambda cp: cp.created_at, reverse=True)
        return pending[0] if pending else None

    def get_run(self, run_id: str) -> RunState | None:
        return self.load().runs.get(run_id)

    def get_checkpoint(self, checkpoint_id: str) -> Checkpoint | None:
        return self.load().checkpoints.get(checkpoint_id)

    def list_runs(self) -> list[RunState]:
        runs = list(self.load().runs.values())
        return sorted(runs, key=lambda run: run.created_at, reverse=True)

    def list_digests(self) -> list[Digest]:
        digests = list(self.load().digests.values())
        return sorted(digests, key=lambda digest: digest.created_at, reverse=True)

    def past_digest_summaries(self, limit: int = 4) -> list[str]:
        return [
            digest.markdown
            for digest in self.list_digests()[:limit]
        ]


class StateStore(JsonStore):
    pass
