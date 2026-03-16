// Training API service - communicates with FastAPI backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_BASE = API_BASE.replace(/^http/, "ws");

export interface TrainingConfig {
  population_size: number;
  generations: number;
  max_epoch_time: number;
}

export interface IndividualResult {
  model_id: string;
  generation: number;
  architecture: string;
  optimizer: string;
  epochs: number;
  layer_sizes: number[];
  lr: number;
  batch_size: number;
  fitness: number;
  direction_accuracy: number;
  sl_avg: number;
  tp_avg: number;
  pe_avg: number;
  model_path: string;
  emoji: string;
}

export interface DatasetInfo {
  rows: number;
  feature_count: number;
  train_size: number;
  test_size: number;
  columns: string[];
}

export interface SavedModel {
  Modelo: string;
  Score: string;
  Accuracy: string;
  Ruta: string;
}

export interface LossEntry {
  Epoch: number;
  MAE: number;
}

export interface TrainingEvent {
  event: string;
  data: unknown;
}

// --------------------------------------------------------------------------
// REST helpers
// --------------------------------------------------------------------------

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

export const trainingApi = {
  getDatasetInfo: () => apiFetch<DatasetInfo>("/api/training/dataset"),
  getStatus: () => apiFetch<{ status: string }>("/api/training/status"),
  startTraining: (config: TrainingConfig) =>
    apiFetch<{ message: string }>("/api/training/start", {
      method: "POST",
      body: JSON.stringify(config),
    }),
  pauseTraining: () =>
    apiFetch<{ message: string; status: string }>("/api/training/pause", { method: "POST" }),
  stopTraining: () =>
    apiFetch<{ message: string }>("/api/training/stop", { method: "POST" }),
  getConfigurations: () => apiFetch<Record<string, unknown>[]>("/api/training/configurations"),
  getSavedModels: () => apiFetch<SavedModel[]>("/api/training/models"),
  getLossHistory: (modelId: string) =>
    apiFetch<LossEntry[]>(`/api/training/loss/${modelId}`),
};

// --------------------------------------------------------------------------
// WebSocket
// --------------------------------------------------------------------------

export function createTrainingWebSocket(
  onEvent: (event: TrainingEvent) => void,
  onClose?: () => void,
): WebSocket {
  const ws = new WebSocket(`${WS_BASE}/api/training/ws`);
  ws.onmessage = (e) => {
    try {
      const event = JSON.parse(e.data) as TrainingEvent;
      if (event.event !== "ping") onEvent(event);
    } catch {
      // ignore parse errors
    }
  };
  ws.onclose = () => onClose?.();
  return ws;
}
