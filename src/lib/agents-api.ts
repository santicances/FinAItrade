// Agent API service - communicates with the FastAPI /api/agents endpoints

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

export interface DataSource {
  name: string;
  type: "csv" | "api" | "database" | "model";
  description: string;
  connected: boolean;
  details: Record<string, unknown>;
}

export interface PromptConfig {
  system_prompt: string;
  input_variables: string[];
  chain_type: string;
  llm_provider: string;
  temperature: number;
}

export interface FlowNode {
  id: string;
  label: string;
  type: "input" | "process" | "decision" | "output" | "tool";
  x: number;
  y: number;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  animated: boolean;
}

export interface AgentFlowDiagram {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface AgentListItem {
  id: string;
  name: string;
  emoji: string;
  architecture: string;
  status: string;
  fitness: number | null;
  direction_accuracy: number | null;
  score: string | null;
  generation: number | null;
  optimizer: string | null;
  tags: string[];
}

export interface AgentConfig extends AgentListItem {
  description: string;
  epochs: number | null;
  learning_rate: number | null;
  batch_size: number | null;
  layer_sizes: number[] | null;
  model_path: string | null;
  data_sources: DataSource[];
  prompt: PromptConfig | null;
  flow_diagram: AgentFlowDiagram | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AgentUpdateRequest {
  name?: string;
  description?: string;
  status?: string;
  tags?: string[];
  prompt?: PromptConfig;
}

// ─── API calls ───────────────────────────────────────────────────────────────

export const agentsApi = {
  list: () => apiFetch<AgentListItem[]>("/api/agents/"),
  get: (id: string) => apiFetch<AgentConfig>(`/api/agents/${id}`),
  update: (id: string, data: AgentUpdateRequest) =>
    apiFetch<AgentConfig>(`/api/agents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
