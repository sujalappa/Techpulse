from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import checkpoint, digests, public, run
from config import get_settings
from scheduler import start_scheduler

settings = get_settings()
app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|.*\.vercel\.app)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(run.router, prefix="/api")
app.include_router(checkpoint.router, prefix="/api")
app.include_router(digests.router, prefix="/api")
app.include_router(public.router, prefix="/api")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
def on_startup() -> None:
    start_scheduler()
