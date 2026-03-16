"""Configuración del cliente de Supabase oficial."""
import os
from supabase import create_client, Client
from core.config import settings
import logging

logger = logging.getLogger("supabase")

# Check si las variables de entorno están pero fallbacks a vacío para no romper la app de primeras.
# NOTA: Debes de añadir SUPABASE_URL y SUPABASE_KEY a tu .env
supabase_url: str = getattr(settings, "SUPABASE_URL", os.environ.get("SUPABASE_URL", ""))
supabase_key: str = getattr(settings, "SUPABASE_KEY", os.environ.get("SUPABASE_KEY", ""))

client: Client | None = None

if supabase_url and supabase_key:
    try:
        client = create_client(supabase_url, supabase_key)
        logger.info("[OK] Conectado a Supabase correctamente.")
    except Exception as e:
        logger.error(f"[ERROR] Error al iniciar cliente de Supabase: {e}")
else:
    logger.warning("[WARNING] SUPABASE_URL o SUPABASE_KEY no configurado en entorno. Se usará modo 'mock' in-memory.")

def get_supabase() -> Client | None:
    return client
