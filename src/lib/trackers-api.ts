// API caller for Trackers (Hyperliquid & Polymarket)

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CopierConfig {
  is_copying: boolean;
  max_allocation: number;
  copy_ratio: number;
}

export interface LeaderboardTrader {
  id: string;
  address: string;
  name: string | null;
  pnl: number;
  roi: number;
  win_rate: number;
  volume: number;
  platform: "hyperliquid" | "polymarket";
  copier_config: CopierConfig;
  active_trades_count: number;
}

export interface HLPosition {
  id: string;
  trader_address: string;
  coin: string;
  side: "Long" | "Short";
  size: number;
  entry_price: number;
  mark_price: number;
  pnl: number;
  roi: number;
  leverage: number;
  status: "open" | "closed";
  timestamp: string;
}

export interface PMBet {
  id: string;
  trader_address: string;
  market: string;
  outcome: string;
  shares: number;
  avg_price: number;
  current_price: number;
  pnl: number;
  roi: number;
  status: "open" | "resolved";
  timestamp: string;
}

export interface TrackerDashboardResponse<T> {
  traders: LeaderboardTrader[];
  active_positions: T[];
  last_update: string;
}

// ─── API calls ───────────────────────────────────────────────────────────────

export const trackersApi = {
  hlDashboard: () => apiFetch<TrackerDashboardResponse<HLPosition>>("/api/trackers/hyperliquid/dashboard"),
  hlUpdateCopier: (id: string, config: CopierConfig) =>
    apiFetch<{ status: string; message: string }>(`/api/trackers/hyperliquid/trader/${id}/copier`, {
      method: "PATCH",
      body: JSON.stringify(config),
    }),
  
  pmDashboard: () => apiFetch<TrackerDashboardResponse<PMBet>>("/api/trackers/polymarket/dashboard"),
  pmUpdateCopier: (id: string, config: CopierConfig) =>
    apiFetch<{ status: string; message: string }>(`/api/trackers/polymarket/trader/${id}/copier`, {
      method: "PATCH",
      body: JSON.stringify(config),
    }),
};
