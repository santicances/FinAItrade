"""Rutas FastAPI para Agent y AIModel (Entregado por Supabase / Local Mock)."""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Any
import os
import ccxt
import pandas as pd

from schemas.agents import AgentUpdateRequest, AgentCreate
from services import agent_service as svc

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("/", summary="Listar todos los agentes (con su mejor modelo)")
async def list_agents() -> JSONResponse:
    agents = svc.list_agents()
    return JSONResponse([a.model_dump() for a in agents])


@router.post("/", summary="Crear un nuevo Agente")
async def create_agent(req: AgentCreate) -> JSONResponse:
    ag = svc.create_agent(req)
    return JSONResponse(svc.to_config(ag).model_dump())


@router.get("/{agent_id}", summary="Obtener configuración detallada del agente")
async def get_agent(agent_id: str) -> JSONResponse:
    ag = svc.get_agent(agent_id)
    if not ag:
        raise HTTPException(status_code=404, detail="Agent no encontrado")
    return JSONResponse(ag.model_dump())


@router.patch("/{agent_id}", summary="Actualizar Agent")
async def update_agent(agent_id: str, req: AgentUpdateRequest) -> JSONResponse:
    ag = svc.update_agent(agent_id, req)
    if not ag:
        raise HTTPException(status_code=404, detail="Agent no encontrado")
    return JSONResponse(ag.model_dump())


@router.post("/{agent_id}/download-dataset", summary="Descargar dataset local para el agente")
async def download_agent_dataset(agent_id: str) -> JSONResponse:
    ag = svc.get_agent(agent_id)
    if not ag:
        raise HTTPException(status_code=404, detail="Agent no encontrado")

    symbol = ag.trading_pair
    tf = ag.timeframe
    limit = ag.history_length or 1000

    try:
        exchange = ccxt.binance()
        # Nota: en produccion esto iteraría si limit > 1000, 
        # pero para POC simplificamos a la ccxt request límite si no se paga.
        # Fetching data...
        ohlcv = exchange.fetch_ohlcv(symbol, timeframe=tf, limit=min(limit, 1000))
        df = pd.DataFrame(ohlcv, columns=['datetime','open','high','low','close','volume'])
        df['datetime'] = pd.to_datetime(df['datetime'], unit='ms')
        
        # Save to csv
        save_path = f"backend/{agent_id}_dataset.csv"
        df.to_csv(save_path, index=False)

        return JSONResponse({"status": "ok", "file": save_path, "candles_downloaded": len(df)})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error descargando datos: {e}")
