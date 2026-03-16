"""FastAPI application entry point."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from api.training import router as training_router
from api.agents import router as agents_router
from api.trackers import router as trackers_router
from api.mcp_router import mcp as mcp_instance
from services import cron_service


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup & shutdown hooks."""
    print(f"[START] {settings.APP_NAME} v{settings.APP_VERSION} starting...")
    await cron_service.start_cron_jobs()
    yield
    print("[STOP] Shutting down...")
    cron_service.stop_cron_jobs()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI Trading Model Training API – FastAPI backend for FinAI Trade",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(training_router)
app.include_router(agents_router)
app.include_router(trackers_router)

# --- MCP Protocol Mount ---
app.mount("/mcp", mcp_instance.sse_app())


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    """Simple health check endpoint."""
    return {"status": "ok", "version": settings.APP_VERSION}
