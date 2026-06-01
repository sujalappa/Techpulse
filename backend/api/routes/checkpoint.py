from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from api.deps import get_pipeline, get_store
from db.store import JsonStore
from graph.main_graph import TechPulsePipeline

router = APIRouter(tags=["checkpoints"])


class CheckpointApprovalRequest(BaseModel):
    selected_item_ids: list[str] | None = None


@router.get("/checkpoint/current")
def current_checkpoint(store: JsonStore = Depends(get_store)) -> dict:
    checkpoint = store.latest_open_checkpoint()
    return {"checkpoint": checkpoint}


@router.post("/checkpoint/{checkpoint_id}/approve")
async def approve_checkpoint(
    checkpoint_id: str,
    approval: CheckpointApprovalRequest | None = None,
    pipeline: TechPulsePipeline = Depends(get_pipeline),
) -> dict:
    try:
        run = await pipeline.resume(
            checkpoint_id,
            selected_item_ids=approval.selected_item_ids if approval else None,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"run": run, "checkpoint": pipeline.store.latest_open_checkpoint()}
