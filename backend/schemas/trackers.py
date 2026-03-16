"""Pydantic schemas for Hyperliquid and Polymarket trackers."""

from __future__ import annotations
from typing import Literal
from pydantic import BaseModel
from datetime import datetime


# ─── Base Trader ────────────────────────────────────────────────────────────

class CopierConfig(BaseModel):
    is_copying: bool
    max_allocation: float
    copy_ratio: float


class LeaderboardTrader(BaseModel):
    id: str
    address: str
    name: str | None = None
    pnl: float
    roi: float
    win_rate: float
    volume: float
    platform: Literal["hyperliquid", "polymarket"]
    copier_config: CopierConfig
    active_trades_count: int = 0


# ─── Hyperliquid (Perpetuals) ───────────────────────────────────────────────

class HLPosition(BaseModel):
    id: str
    trader_address: str
    coin: str
    side: Literal["Long", "Short"]
    size: float
    entry_price: float
    mark_price: float
    pnl: float
    roi: float
    leverage: float
    status: Literal["open", "closed"]
    timestamp: str


# ─── Polymarket (Binary Options / Betting) ──────────────────────────────────

class PMBet(BaseModel):
    id: str
    trader_address: str
    market: str
    outcome: str
    shares: float
    avg_price: float
    current_price: float
    pnl: float
    roi: float
    status: Literal["open", "resolved"]
    timestamp: str

# ─── API Responses ──────────────────────────────────────────────────────────

class TrackerDashboardResponse(BaseModel):
    traders: list[LeaderboardTrader]
    active_positions: list[HLPosition | PMBet]
    last_update: str
