from fastapi import APIRouter, Depends

from api.deps import get_pipeline, get_store
from db.store import JsonStore
from graph.main_graph import TechPulsePipeline

router = APIRouter(tags=["runs"])


@router.post("/run")
async def create_run(pipeline: TechPulsePipeline = Depends(get_pipeline)) -> dict:
    run, checkpoint = await pipeline.start()
    return {"run": run, "checkpoint": checkpoint}


@router.get("/runs")
def list_runs(store: JsonStore = Depends(get_store)) -> dict:
    return {"runs": store.list_runs()}
