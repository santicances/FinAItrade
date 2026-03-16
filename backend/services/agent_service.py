"""Agent configuration service with Supabase."""

import uuid
from datetime import datetime
from pydantic import ValidationError

from core.supabase_client import get_supabase
from schemas.agents import (
    AgentInDB, AgentCreate, AgentUpdate, 
    AgentListItem, AgentConfig, AgentUpdateRequest, PromptConfig, DataSource, AgentFlowDiagram, FlowNode, FlowEdge,
    ModelInDB
)

# Mock in-memory fallback
_mock_agents: list[AgentInDB] = []

def _mock_defaults():
    if not _mock_agents:
        ag = AgentInDB(
            id=str(uuid.uuid4()),
            name="BTC Swing Trader",
            userId="mock-user",
            type="spot",
            operationType="market",
            status="active",
            model="Transformer",
            modelId="t-1",
            asset="BTC",
            assetId="bitcoin",
            assetType="crypto",
            tvSymbol="BINANCE:BTCUSDT",
            provider="BINANCE",
            timeframe="60",
            createdAt=datetime.now().isoformat(),
            updatedAt=datetime.now().isoformat()
        )
        _mock_agents.append(ag)


def get_all_agents() -> list[AgentInDB]:
    sb = get_supabase()
    if sb:
        # Use double quotes for case-sensitive table name "Agent"
        response = sb.table("Agent").select("*").execute()
        agents_data = response.data
        
        parsed_agents = []
        for ag_data in agents_data:
            try:
                parsed_agents.append(AgentInDB(**ag_data))
            except Exception as e:
                print(f"Error parsing agent: {e}")
        return parsed_agents
    else:
        _mock_defaults()
        return _mock_agents


def to_list_item(ag: AgentInDB) -> AgentListItem:
    return AgentListItem(
        id=ag.id,
        name=ag.name,
        emoji="🤖", # Fixed for now or derived
        architecture=ag.model,
        status=ag.status,
        fitness=0.0,
        direction_accuracy=0.0,
        score="0",
        generation=1,
        optimizer="adam",
        tags=[ag.asset, ag.provider, ag.timeframe]
    )


def to_config(ag: AgentInDB) -> AgentConfig:
    return AgentConfig(
        id=ag.id,
        name=ag.name,
        emoji="🤖",
        architecture=ag.model,
        status=ag.status,
        fitness=0.0,
        direction_accuracy=0.0,
        score="0",
        generation=1,
        optimizer="adam",
        tags=[ag.asset, ag.provider],
        description=f"Agent operando en {ag.tvSymbol}",
        epochs=None,
        learning_rate=None,
        batch_size=None,
        layer_sizes=None,
        model_path=None,
        data_sources=[],
        prompt_config=None,
        flow_diagram=None,
        created_at=ag.createdAt,
        updated_at=ag.updatedAt,
        trading_pair=ag.asset,
        timeframe=ag.timeframe,
        history_length=ag.candleCount,
        available_models=[]
    )


def create_agent(req: AgentCreate) -> AgentInDB:
    new_id = str(uuid.uuid4())
    ag = AgentInDB(
        id=new_id,
        **req.model_dump(),
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat()
    )
    
    sb = get_supabase()
    if sb:
        # Save to real db
        data = ag.model_dump() 
        try:
            sb.table("Agent").insert(data).execute()
        except Exception as e:
            print(f"Error insert database: {e}")
    else:
        _mock_agents.append(ag)
        
    return ag


def list_agents() -> list[AgentListItem]:
    agents = get_all_agents()
    return [to_list_item(ag) for ag in agents]


def get_agent(agent_id: str) -> AgentConfig | None:
    for ag in get_all_agents():
        if ag.id == agent_id:
            return to_config(ag)
    return None


def update_agent(agent_id: str, req: AgentUpdateRequest) -> AgentConfig | None:
    sb = get_supabase()
    
    if sb:
        # Convert request to Agent DB schema if necessary
        # For now, simplistic mapping
        patch = {}
        if req.name: patch["name"] = req.name
        if req.status: patch["status"] = req.status
        # if req.prompt: patch["prompt"] = req.prompt.system_prompt 
        
        if patch:
            sb.table("Agent").update(patch).eq("id", agent_id).execute()
        return get_agent(agent_id)
    else:
        for ag in _mock_agents:
            if ag.id == agent_id:
                if req.name: ag.name = req.name
                if req.status: ag.status = req.status
                return to_config(ag)
    return None
def get_trained_models(agent_id: str | None = None) -> list[ModelInDB]:
    sb = get_supabase()
    if not sb:
        return []
        
    query = sb.table("Model").select("*")
    if agent_id:
        query = query.eq("agentId", agent_id)
        
    response = query.execute()
    return [ModelInDB(**m) for m in response.data]
