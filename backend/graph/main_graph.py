from datetime import datetime

from agents.classifier import classify
from agents.dedup import deduplicate
from agents.fetcher import fetch_items
from agents.filter import score_relevance
from agents.formatter import format_digest
from agents.publisher import publish_digest
from agents.scorer import score_novelty
from agents.summariser import summarise
from agents.writer import write_digest
from config import Settings
from db.store import JsonStore
from schemas import Checkpoint, RunState


class TechPulsePipeline:
    def __init__(self, store: JsonStore, settings: Settings) -> None:
        self.store = store
        self.settings = settings

    async def start(self) -> tuple[RunState, Checkpoint]:
        run = self.store.upsert_run(RunState(stage="discovery"))
        
        # 1. Fetch
        items = await fetch_items()
        
        # 2. Deduplicate
        items = await deduplicate(items)
        
        # 3. Score Relevance
        items = await score_relevance(items)
        
        # Take up to max_items
        run.items = items[: self.settings.max_items]
        
        # 4. Analysis
        run.stage = "analysis"
        self.store.upsert_run(run)
        run.items = await summarise(run.items)
        run.items = await classify(run.items)
        run.items = await score_novelty(run.items, self.store.past_digest_summaries())
        
        # 5. Digest Generation
        run.stage = "digest"
        self.store.upsert_run(run)
        digest = await write_digest(run.id, run.items)
        digest = await format_digest(digest)
        run.digest = digest
        
        # 6. Checkpoint
        checkpoint = self._checkpoint(
            run,
            "final_digest",
            "Approve Final Digest",
            "Review summaries, novelty scores, and select articles to include before publishing.",
        )
        return run, checkpoint

    async def resume(self, checkpoint_id: str, selected_item_ids: list[str] | None = None) -> RunState:
        checkpoint = self.store.get_checkpoint(checkpoint_id)
        if checkpoint is None:
            raise ValueError("Checkpoint not found")
        run = self.store.get_run(checkpoint.run_id)
        if run is None:
            raise ValueError("Run not found")

        # Handle filtering of items if they deselected some
        if selected_item_ids is not None:
            selected = set(selected_item_ids)
            if not selected:
                raise ValueError("Select at least one item to approve")
            run.items = [item for item in run.items if item.id in selected]
            if not run.items:
                raise ValueError("Selected items were not found in this run")
            
            # Regenerate the digest with the filtered items
            digest = await write_digest(run.id, run.items)
            digest = await format_digest(digest)
            run.digest = digest

        checkpoint.approved = True
        checkpoint.approved_at = datetime.utcnow()
        self.store.update_checkpoint(checkpoint)

        if checkpoint.name == "final_digest":
            if run.digest is None:
                raise ValueError("Run has no digest to publish")
            run.stage = "publish"
            run.status = "running"
            self.store.upsert_run(run)
            
            run.digest = await publish_digest(run.digest, self.settings)
            self.store.add_digest(run.digest)
            
            run.status = "completed"
            run.stage = "completed"
            self.store.upsert_run(run)
            return run

        raise ValueError("Unknown checkpoint")

    def _checkpoint(
        self,
        run: RunState,
        name: str,
        title: str,
        description: str,
    ) -> Checkpoint:
        run.status = "waiting_approval"
        run.stage = name
        self.store.upsert_run(run)
        checkpoint = Checkpoint(
            run_id=run.id,
            name=name,
            title=title,
            description=description,
            payload={
                "items": [item.model_dump(mode="json") for item in run.items],
                "digest": run.digest.model_dump(mode="json") if run.digest else None,
            },
        )
        return self.store.add_checkpoint(checkpoint)
