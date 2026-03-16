"""MCP Router for Supabase and Agent management."""

import logging
from typing import Any
from fastapi import APIRouter, Request
from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings
from services import agent_service
from schemas.agents import AgentUpdateRequest

logger = logging.getLogger("mcp_router")

# Create FastMCP instance with custom paths to match USER request
# We will mount this at /mcp in main.py
mcp = FastMCP(
    "Supabase Intelligence",
    instructions="Maneja los agentes y modelos de Trading de la base de datos Supabase.",
    sse_path="/", 
    message_path="/messages",
    transport_security=TransportSecuritySettings(
        enable_dns_rebinding_protection=False,
        allowed_hosts=["*"],
        allowed_origins=["*"]
    )
)

# --- MCP TOOLS ---

@mcp.tool()
async def list_agents() -> str:
    """Obtiene el resumen de todos los agentes activos en el sistema."""
    agents = agent_service.list_agents()
    if not agents:
        return "No hay agentes registrados."
    
    res = "Lista de Agentes:\n"
    for a in agents:
        res += f"- [{a.id}] {a.name} ({a.trading_pair}) - Status: {a.status}\n"
    return res

@mcp.tool()
async def get_agent_details(agent_id: str) -> str:
    """Obtiene la configuración completa de un agente, incluyendo Prompt y Fuentes de datos."""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        return f"Error: Agente con ID {agent_id} no encontrado."
    
    return agent.model_dump_json(indent=2)

@mcp.tool()
async def update_agent_status(agent_id: str, status: str) -> str:
    """Actualiza el estado de un agente (active, inactive, training)."""
    try:
        update_req = AgentUpdateRequest(status=status)
        updated = agent_service.update_agent(agent_id, update_req)
        if updated:
            return f"Estado del agente {agent_id} actualizado a {status}."
        return f"No se pudo encontrar el agente {agent_id}."
    except Exception as e:
        return f"Error al actualizar: {str(e)}"

@mcp.tool()
async def list_trained_models() -> str:
    """Lista todos los modelos entrenados disponibles en la tabla Model."""
    models = agent_service.get_trained_models()
    if not models:
        return "No hay modelos entrenados en la base de datos."
    
    res = "Modelos Entrenados Disponibles:\n"
    for m in models:
        res += f"- [{m.id}] {m.name} ({m.architecture}) - Accuracy: {m.accuracy}% | Fitness: {m.fitness}\n"
    return res

# --- FASTAPI MOUNTING ---
# We use FastMCP's sse_app() to integrate with FastAPI

mcp_router = APIRouter(tags=["mcp"])

@mcp_router.get("/mcp")
async def handle_mcp_sse(request: Request):
    """MCP SSE Endpoint."""
    # FastMCP sse_app handles the SSE connection
    # We mount the entire app in main, but we can also use this router
    pass
