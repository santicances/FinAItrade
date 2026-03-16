"""Servicio para interactuar y rastrear Hyperliquid."""

import random
from datetime import datetime, timedelta
from schemas.trackers import LeaderboardTrader, HLPosition, CopierConfig

# Mock database
_hl_traders: list[LeaderboardTrader] = []
_hl_positions: list[HLPosition] = []

def init_hl_data():
    global _hl_traders, _hl_positions
    if not _hl_traders:
        names = ["WhaleSniper", "SatoshiDegen", "AlmedaReserch", "LiquidatorX", "CryptoChad", "AlphaSeeker", "TradeBot99", "MarginKing", "LeverageLord", "GainsGoblin"]
        for i in range(25):
            addr = "0x" + "".join([random.choice("0123456789abcdef") for _ in range(40)])
            name_str = names[i] if i < len(names) else f"0x{addr[2:5]}...{addr[-3:]}"
            _hl_traders.append(
                LeaderboardTrader(
                    id=f"hl_{i+1:02d}", 
                    address=addr,
                    name=name_str, 
                    pnl=random.uniform(10000, 500000), 
                    roi=random.uniform(5.0, 500.0), 
                    win_rate=random.uniform(50.0, 90.0), 
                    volume=random.uniform(1000000, 20000000),
                    platform="hyperliquid", 
                    copier_config=CopierConfig(is_copying=False, max_allocation=5000, copy_ratio=0.5)
                )
            )

        coins = ["BTC", "ETH", "SOL", "WIF", "PEPE", "ENA"]
        for t in _hl_traders:
            for _ in range(random.randint(5, 15)):
                coin = random.choice(coins)
                side = random.choice(["Long", "Short"])
                leverage = random.choice([5, 10, 20, 50])
                entry = random.uniform(10, 60000)
                mark = entry * random.uniform(0.9, 1.1)
                size = random.uniform(0.1, 10.0)
                status = random.choice(["open", "closed", "closed"]) # more closed
                if status == "closed":
                    mark = entry * random.uniform(0.5, 1.5)
                
                pnl = (mark - entry) * size if side == "Long" else (entry - mark) * size
                roi = ((mark - entry) / entry) * leverage * 100 if side == "Long" else ((entry - mark) / entry) * leverage * 100
                
                _hl_positions.append(
                    HLPosition(
                        id=f"pos_{random.randint(10000, 99999)}",
                        trader_address=t.address,
                        coin=coin,
                        side=side,
                        size=size,
                        entry_price=entry,
                        mark_price=mark,
                        pnl=pnl,
                        roi=roi,
                        leverage=leverage,
                        status=status,
                        timestamp=(datetime.now() - timedelta(hours=random.randint(0, 48))).isoformat()
                    )
                )
                
        # Sort desc
        _hl_traders.sort(key=lambda x: x.pnl, reverse=True)
        
        # Generate some initial active and past trades
def fetch_latest_hl_data():
    """Simulates fetching new trades from the blockchain/API and updating limits."""
    init_hl_data()
    
    # Simulate market movement for open positions
    for p in _hl_positions:
        if p.status == "open":
            change = random.uniform(0.98, 1.02)
            p.mark_price *= change
            
            # Simple PnL calc
            if p.side == "Long":
                diff = (p.mark_price - p.entry_price) / p.entry_price
            else:
                diff = (p.entry_price - p.mark_price) / p.entry_price
            
            p.roi = diff * p.leverage * 100
            p.pnl = (p.size * p.entry_price) * (p.roi / 100)

            # Randomly close some
            if random.random() < 0.1:
                p.status = "closed"
                
    # Randomly add new trade from top traders
    if random.random() < 0.3:
        t = random.choice(_hl_traders)
        entry = random.uniform(10, 60000)
        _hl_positions.append(
            HLPosition(
                id=f"pos_{random.randint(1000, 9999)}",
                trader_address=t.address,
                coin=random.choice(["BTC", "ETH", "SOL", "ENA"]),
                side=random.choice(["Long", "Short"]),
                size=random.uniform(0.1, 5.0),
                entry_price=entry,
                mark_price=entry,
                pnl=0.0,
                roi=0.0,
                leverage=random.choice([10, 20]),
                status="open",
                timestamp=datetime.now().isoformat()
            )
        )
        
        # LOGIC FOR COPY TRADING
        if t.copier_config.is_copying:
            print(f"[COPY BOT] Ejecutando órden espejo en Hyperliquid - Copiando a {t.name or t.address[:8]}...")

def get_hl_leaderboard():
    init_hl_data()
    # Update active trades count for each trader
    for t in _hl_traders:
        t.active_trades_count = len([p for p in _hl_positions if p.trader_address == t.address and p.status =="open"])
    return sorted(_hl_traders, key=lambda x: x.pnl, reverse=True)

def get_hl_positions(address: str = None, status: str = None):
    init_hl_data()
    filtered = _hl_positions
    if address:
        filtered = [p for p in filtered if p.trader_address == address]
    if status:
        filtered = [p for p in filtered if p.status == status]
    return sorted(filtered, key=lambda x: x.timestamp, reverse=True)

def update_hl_copier(trader_id: str, config: CopierConfig):
    for t in _hl_traders:
        if t.id == trader_id:
            t.copier_config = config
            return True
    return False
