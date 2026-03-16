"""Servicio para interactuar y rastrear Polymarket."""

import random
from datetime import datetime, timedelta
from schemas.trackers import LeaderboardTrader, PMBet, CopierConfig

_pm_traders: list[LeaderboardTrader] = []
_pm_bets: list[PMBet] = []

def init_pm_data():
    global _pm_traders, _pm_bets
    if not _pm_traders:
        # Generate exactly 25 top users
        names = ["ElectionOracle", "Polyzilla", "MacroBettor", "CryptoSage", "TrumpWhale", "MarketMakerX", "DegenApe", "ZetBettor", "PredictorPro", "OracleNode"]
        for i in range(25):
            addr = "0x" + "".join([random.choice("0123456789abcdef") for _ in range(40)])
            name_str = names[i] if i < len(names) else f"Whale_{addr[:6]}"
            _pm_traders.append(
                LeaderboardTrader(
                    id=f"pm_{i+1:02d}", 
                    address=addr,
                    name=name_str, 
                    pnl=random.uniform(50000, 800000), 
                    roi=random.uniform(20.0, 1500.0), 
                    win_rate=random.uniform(55.0, 95.0), 
                    volume=random.uniform(500000, 5000000),
                    platform="polymarket", 
                    copier_config=CopierConfig(is_copying=False, max_allocation=1000, copy_ratio=0.1)
                )
            )

        markets = ["¿Trump ganará 2024?", "¿BTC a 100k este Q4?", "¿Fed Rate Cut en Noviembre?", "¿Elon Musk en Marte antes 2030?", "¿Habrá ETF de SOL en 2025?", "¿OpenAI sacará GPT-5 en Q1?"]
        for t in _pm_traders:
            for _ in range(random.randint(5, 15)):
                market = random.choice(markets)
                outcome = random.choice(["Yes", "No"])
                avg_price = random.uniform(0.1, 0.9)
                curr_price = random.uniform(0.1, 0.9)
                shares = random.randint(100, 50000)
                status = random.choice(["open", "resolved", "resolved"]) # More resolved
                if status == "resolved":
                    curr_price = random.choice([0.0, 1.0])
                
                _pm_bets.append(
                    PMBet(
                        id=f"bet_{random.randint(10000, 99999)}",
                        trader_address=t.address,
                        market=market,
                        outcome=outcome,
                        shares=shares,
                        avg_price=avg_price,
                        current_price=curr_price,
                        pnl=shares * (curr_price - avg_price),
                        roi=((curr_price - avg_price) / avg_price) * 100,
                        status=status,
                        timestamp=(datetime.now() - timedelta(hours=random.randint(1, 400))).isoformat()
                    )
                )
        
        # Sort traders by pnl descending
        _pm_traders.sort(key=lambda x: x.pnl, reverse=True)
        
def fetch_latest_pm_data():
    """Simulates fetching new trades from Polymarket subgraphs / Polygon network."""
    init_pm_data()
    
    # Simulate market probability movements
    for b in _pm_bets:
        if b.status == "open":
            change = random.uniform(-0.05, 0.05)
            b.current_price = max(0.01, min(0.99, b.current_price + change))
            b.pnl = b.shares * (b.current_price - b.avg_price)
            b.roi = ((b.current_price - b.avg_price) / b.avg_price) * 100

            # Randomly resolve markets
            if random.random() < 0.05:
                b.status = "resolved"
                b.current_price = random.choice([0.0, 1.0])
                
    # Randomly add new bet from top bettors
    if random.random() < 0.2:
        t = random.choice(_pm_traders)
        market = "¿BTC a 120k en Enero 2025?"
        outcome = random.choice(["Yes", "No"])
        avg_price = random.uniform(0.2, 0.8)
        shares = random.randint(1000, 20000)

        _pm_bets.append(
            PMBet(
                id=f"bet_{random.randint(1000, 9999)}",
                trader_address=t.address,
                market=market,
                outcome=outcome,
                shares=shares,
                avg_price=avg_price,
                current_price=avg_price,
                pnl=0.0,
                roi=0.0,
                status="open",
                timestamp=datetime.now().isoformat()
            )
        )
        
        # COPY BOT LOGIC
        if t.copier_config.is_copying:
            print(f"[COPY BOT PM] 🎰 Apostando en Polymarket ({market}) - Copiando a {t.name or t.address[:8]}...")


def get_pm_leaderboard():
    init_pm_data()
    # Update active bets count
    for t in _pm_traders:
        t.active_trades_count = len([b for b in _pm_bets if b.trader_address == t.address and b.status == "open"])
    return sorted(_pm_traders, key=lambda x: x.pnl, reverse=True)

def get_pm_bets(address: str = None, status: str = None):
    init_pm_data()
    filtered = _pm_bets
    if address:
        filtered = [p for p in filtered if p.trader_address == address]
    if status:
        filtered = [p for p in filtered if p.status == status]
    return sorted(filtered, key=lambda x: x.timestamp, reverse=True)

def update_pm_copier(trader_id: str, config: CopierConfig):
    for t in _pm_traders:
        if t.id == trader_id:
            t.copier_config = config
            return True
    return False
