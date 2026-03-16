"""Rutas de API para ver y copiar a los mejores traders en Hyperliquid y Polymarket."""

from __future__ import annotations

from typing import Any
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime

from schemas.trackers import CopierConfig, TrackerDashboardResponse
from services import hyperliquid_service as hl_svc
from services import polymarket_service as pm_svc

router = APIRouter(prefix="/api/trackers", tags=["trackers"])


@router.get("/hyperliquid/dashboard", summary="Obtener el tablero de los top traders en Hyperliquid y sus operaciones en vivo", response_model=TrackerDashboardResponse)
async def hl_dashboard() -> dict[str, Any]:
    traders = hl_svc.get_hl_leaderboard()
    positions = hl_svc.get_hl_positions()
    
    return {
        "traders": traders,
        "active_positions": positions[:1000],  # Aumentamos para que el filtro por trader funcione en el frontend
        "last_update": datetime.now().isoformat()
    }

@router.patch("/hyperliquid/trader/{trader_id}/copier", summary="Actualiza el CopyTrading para un trader Hyperliquid")
async def hl_update_copier(trader_id: str, config: CopierConfig) -> JSONResponse:
    success = hl_svc.update_hl_copier(trader_id, config)
    if not success:
        raise HTTPException(status_code=404, detail=f"Trader {trader_id} no encontrado")
    return JSONResponse({"status": "ok", "message": f"Copy config actualizada para {trader_id}"})


@router.get("/polymarket/dashboard", summary="Obtener el tablero de los top bettors en Polymarket y sus apuestas", response_model=TrackerDashboardResponse)
async def pm_dashboard() -> dict[str, Any]:
    traders = pm_svc.get_pm_leaderboard()
    bets = pm_svc.get_pm_bets()
    
    return {
        "traders": traders,
        "active_positions": bets[:1000],
        "last_update": datetime.now().isoformat()
    }

@router.patch("/polymarket/trader/{trader_id}/copier", summary="Actualiza el CopyTrading para un trader Polymarket")
async def pm_update_copier(trader_id: str, config: CopierConfig) -> JSONResponse:
    success = pm_svc.update_pm_copier(trader_id, config)
    if not success:
        raise HTTPException(status_code=404, detail=f"Trader {trader_id} no encontrado")
    return JSONResponse({"status": "ok", "message": f"Copy config actualizada para {trader_id}"})
