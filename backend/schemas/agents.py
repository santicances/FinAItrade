from __future__ import annotations
from typing import Any, Optional
from pydantic import BaseModel, Field

# ─── Foundation types ────────────────────────────────────────────────────────
class DataSource(BaseModel):
    name: str
    type: str # "csv", "api", "database", "model"
    description: str
    connected: bool
    details: dict[str, Any]

class PromptConfig(BaseModel):
    system_prompt: str
    input_variables: list[str]
    chain_type: str
    llm_provider: str
    temperature: float

class FlowNode(BaseModel):
    id: str
    label: str
    type: str # "input", "process", "decision", "output", "tool"
    x: float
    y: float

class FlowEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str = ""
    animated: bool = False

class AgentFlowDiagram(BaseModel):
    nodes: list[FlowNode]
    edges: list[FlowEdge]

# ─── Agents (New Schema "Agent") ─────────────────────────────────────────────
class AgentBase(BaseModel):
    name: str
    userId: str = "default-user"
    type: str = "spot" # spot, futures
    operationType: str = "market" # market, limit
    status: str = "paused" # active, paused, training
    model: str = "GPT-4"
    modelId: str = "gpt-4"
    asset: str = "BTC"
    assetId: str = "bitcoin"
    assetType: str = "crypto"
    prompt: Optional[str] = None
    sources: str = "" # Stringified source list or JSON
    tvSymbol: str = "BINANCE:BTCUSDT"
    provider: str = "BINANCE"
    timeframe: str = "60"
    candleCount: int = 50
    predictionsCount: int = 0
    lastPredictionAt: Optional[str] = None

class AgentCreate(AgentBase):
    pass

class AgentInDB(AgentBase):
    id: str
    createdAt: str
    updatedAt: str
    # Keep compatibility with existing UI logic if possible
    # or expose these for the transformer
    
    @property
    def trading_pair(self) -> str:
        return self.asset
    
    @property
    def architecture(self) -> str:
        return self.model

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    prompt: Optional[str] = None
    operationType: Optional[str] = None
    timeframe: Optional[str] = None

class AgentUpdateRequest(BaseModel):
    # This is what the frontend sends
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[list[str]] = None
    prompt: Optional[PromptConfig] = None

# ─── API Compatibility (Frontend) ──────────────────────────────────────────────
class AgentListItem(BaseModel):
    id: str
    name: str
    emoji: str = "🤖"
    architecture: str
    status: str
    fitness: float | None = 0.0
    direction_accuracy: float | None = 0.0
    score: str | None = "0"
    generation: int | None = 1
    optimizer: str | None = "adam"
    tags: list[str]

class AgentConfig(AgentListItem):
    description: str
    epochs: int | None = None
    learning_rate: float | None = None
    batch_size: int | None = None
    layer_sizes: list[int] | None = None
    model_path: str | None = None
    data_sources: list[DataSource] = Field(default_factory=list)
    prompt_config: Optional[PromptConfig] = None # Renamed to avoid confusion with string prompt in DB
    flow_diagram: AgentFlowDiagram | None = None
    created_at: str | None
    updated_at: str | None
    trading_pair: str | None = None
    timeframe: str | None = None
    history_length: int | None = None
    available_models: list[Any] = Field(default_factory=list)
# ─── Models (New Schema "Model") ─────────────────────────────────────────────
class ModelInDB(BaseModel):
    id: str
    agentId: Optional[str] = None
    name: str
    architecture: str
    accuracy: float = 0
    fitness: float = 0
    generation: int = 1
    modelPath: Optional[str] = None
    optimizer: str = "adam"
    score: float = 0
    createdAt: str
    updatedAt: str
