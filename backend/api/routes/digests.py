from fastapi import APIRouter, Depends, HTTPException

from api.deps import get_store
from db.store import JsonStore

router = APIRouter(tags=["digests"])


@router.get("/digests")
def list_digests(store: JsonStore = Depends(get_store)) -> dict:
    return {"digests": store.list_digests()}


@router.get("/digests/{digest_id}")
def get_digest(digest_id: str, store: JsonStore = Depends(get_store)) -> dict:
    digest = store.load().digests.get(digest_id)
    if digest is None:
        raise HTTPException(status_code=404, detail="Digest not found")
    return {"digest": digest}
