"""Servicio de Background (Cron) para consultar datos en tiempo real de los trackers."""

import asyncio
import logging
from datetime import datetime

from services.hyperliquid_service import fetch_latest_hl_data
from services.polymarket_service import fetch_latest_pm_data

logger = logging.getLogger("trackers_cron")

_is_running = False

async def trackers_cron_loop():
    """Bucle infinito que actualiza los datos de trackers periódicante."""
    global _is_running
    _is_running = True
    logger.info("[INIT] Cron Service iniciado: Consultando Blockchains/APIs...")

    while _is_running:
        try:
            # En la vida real, se hacen peticiones HTTP asíncronas / RPC a la blockchain.
            fetch_latest_hl_data()
            fetch_latest_pm_data()
            
            # Imprimimos de log para ver que el cron funciona
            print(f"[{datetime.now().isoformat()}] [SYNC] Data On-Chain actualizada (Hyperliquid & Polymarket)")
            
        except Exception as e:
            logger.error(f"Error en el Cron Loop de trackers: {e}")
            
        # Esperamos 5 segundos para simular una consulta muy frecuente
        await asyncio.sleep(5)

    logger.info("[STOP] Cron Service detenido.")

async def start_cron_jobs():
    """Inicia los trabajos en segundo plano en el event loop de FastAPI."""
    loop = asyncio.get_event_loop()
    loop.create_task(trackers_cron_loop(), name="cron_trackers")

def stop_cron_jobs():
    """Detiene los trabajos de cron."""
    global _is_running
    _is_running = False
