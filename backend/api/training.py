"""FastAPI router for training operations."""

from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse

from schemas.training import (
    DatasetInfo,
    SessionStatus,
    TrainingConfig,
    TrainingStatus,
)
from services import training_service as svc

router = APIRouter(prefix="/api/training", tags=["training"])

# Global broadcast queue – events from the training thread land here,
# and ALL connected WebSocket clients receive them.
_global_queue: asyncio.Queue = asyncio.Queue()
_ws_clients: list[WebSocket] = []


# ---------------------------------------------------------------------------
# REST endpoints
# ---------------------------------------------------------------------------

@router.get("/dataset", response_model=DatasetInfo, summary="Get dataset info")
async def get_dataset_info() -> DatasetInfo:
    """Return metadata about the loaded dataset."""
    try:
        info = svc.get_dataset_info()
        if "error" in info:
            raise HTTPException(status_code=404, detail=info["error"])
        return DatasetInfo(**info)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/status", response_model=SessionStatus, summary="Training session status")
async def get_status() -> SessionStatus:
    """Return the current training session status."""
    status = svc.get_status()
    return SessionStatus(status=status)


@router.post("/start", summary="Start a training session")
async def start_training(config: TrainingConfig) -> JSONResponse:
    """Launch a new genetic algorithm training session."""
    status = svc.get_status()
    if status == TrainingStatus.running:
        raise HTTPException(status_code=409, detail="A training session is already running")

    loop = asyncio.get_event_loop()

    # Wire the service to use the global broadcast queue
    svc._session.event_queue = _global_queue
    svc._session.loop = loop

    svc.start_training(
        population_size=config.population_size,
        generations=config.generations,
        max_epoch_time=config.max_epoch_time,
        loop=loop,
        queue=_global_queue,
    )
    return JSONResponse({"message": "Training started", "status": "running"})


@router.post("/pause", summary="Pause / resume training")
async def pause_training() -> JSONResponse:
    """Toggle pause on the running training session."""
    svc.pause_training()
    return JSONResponse({"message": "Toggled pause", "status": svc.get_status().value})


@router.post("/stop", summary="Stop training")
async def stop_training() -> JSONResponse:
    """Gracefully stop the running training session."""
    svc.stop_training()
    return JSONResponse({"message": "Stop requested", "status": "idle"})


@router.get("/configurations", summary="List all saved configurations")
async def get_configurations() -> JSONResponse:
    """Return all entries from configurations.csv."""
    df = svc.load_configurations()
    return JSONResponse(df.fillna("").to_dict(orient="records"))


@router.get("/models", summary="List all saved models")
async def get_saved_models() -> JSONResponse:
    """Return all entries from saved_models.csv."""
    models = svc.load_saved_models()
    return JSONResponse(models)


@router.get("/loss/{model_id}", summary="Loss history for a specific model")
async def get_loss_history(model_id: str) -> JSONResponse:
    """Return per-epoch MAE for the given model ID."""
    history = svc.load_loss_history(model_id)
    if not history:
        raise HTTPException(status_code=404, detail=f"No loss history for model: {model_id}")
    return JSONResponse(history)


# ---------------------------------------------------------------------------
# WebSocket – real-time event streaming (fan-out from global queue)
# ---------------------------------------------------------------------------

async def _broadcast_task() -> None:
    """Background coroutine: reads from the global queue and fans out to all WS clients."""
    while True:
        event = await _global_queue.get()
        dead: list[WebSocket] = []
        for ws in list(_ws_clients):
            try:
                await ws.send_text(json.dumps(event))
            except Exception:
                dead.append(ws)
        for ws in dead:
            if ws in _ws_clients:
                _ws_clients.remove(ws)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """
    WebSocket endpoint that streams training events to the browser.

    Event shape: { "event": string, "data": any }
    """
    await websocket.accept()
    _ws_clients.append(websocket)

    # Make sure the broadcast task is running
    loop = asyncio.get_event_loop()
    # Start broadcaster once (idempotent via task set check)
    tasks = {t.get_name() for t in asyncio.all_tasks()}
    if "training_broadcaster" not in tasks:
        loop.create_task(_broadcast_task(), name="training_broadcaster")

    # Wire the service queue / loop so it's ready even before /start is called
    svc._session.event_queue = _global_queue
    svc._session.loop = loop

    try:
        while True:
            # Keep the connection alive; client can send arbitrary messages
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
            except asyncio.TimeoutError:
                await websocket.send_text(json.dumps({"event": "ping", "data": None}))
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in _ws_clients:
            _ws_clients.remove(websocket)

