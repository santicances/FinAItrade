"use client";

import { useCallback, useEffect, useState } from "react";
import { 
  ArrowLeft, 
  Droplet, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter, 
  Zap, 
  Copy, 
  ExternalLink, 
  Globe, 
  BarChart3, 
  Clock,
  ShieldCheck,
  Flame,
  LayoutGrid,
  List,
  ChevronRight,
  Info
} from "lucide-react";
import Link from "next/link";
import { trackersApi, type LeaderboardTrader, type HLPosition, CopierConfig } from "@/lib/trackers-api";

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmtPct = (val: number) => `${val > 0 ? "+" : ""}${val.toFixed(2)}%`;
const fmtCur = (val: number, minimumFractionDigits = 2) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits }).format(val);

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-widest ${className}`}>
      {children}
    </span>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function HyperliquidPage() {
  const [traders, setTraders] = useState<LeaderboardTrader[]>([]);
  const [positions, setPositions] = useState<HLPosition[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [selectedTraderId, setSelectedTraderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"live" | "history">("live");
  const [searchQuery, setSearchQuery] = useState("");

  // Filtering
  const [minVolume, setMinVolume] = useState<number>(0);
  const [onlyActive, setOnlyActive] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const filteredTraders = traders.filter(t => {
    const matchesSearch = t.name?.toLowerCase().includes(searchQuery.toLowerCase()) || t.address.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (minVolume > 0 && t.volume < minVolume) return false;
    if (onlyActive && t.active_trades_count === 0) return false;
    return true;
  });

  const loadData = useCallback(async () => {
    try {
      const data = await trackersApi.hlDashboard();
      setTraders(data.traders);
      setPositions(data.active_positions);
      setLastUpdate(data.last_update);
      
      if (!selectedTraderId && data.traders.length > 0) {
        setSelectedTraderId(data.traders[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedTraderId]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const toggleCopier = async (trader: LeaderboardTrader) => {
    try {
      const config: CopierConfig = {
        ...trader.copier_config,
        is_copying: !trader.copier_config.is_copying
      };
      await trackersApi.hlUpdateCopier(trader.id, config);
      loadData();
    } catch (e) {
      console.error("Failed to update copier", e);
    }
  };

  const selectedTrader = traders.find(t => t.id === selectedTraderId);
  const selectedPositions = positions.filter(p => p.trader_address === selectedTrader?.address);
  const livePositions = selectedPositions.filter(p => p.status === "open");
  const closedPositions = selectedPositions.filter(p => p.status === "closed");
  
  const currentViewPositions = activeTab === "live" ? livePositions : closedPositions;

  return (
    <div className="hl-container min-h-screen bg-[#02060a] text-slate-200 selection:bg-cyan-500/30 font-sans">
      
      {/* IMPROVEMENT 10: Global Stats Ticker */}
      <div className="bg-cyan-600/10 border-b border-cyan-500/20 py-1.5 overflow-hidden whitespace-nowrap">
         <div className="inline-block animate-marquee-slow font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em]">
            🔥 GLOBAL HYPERLIQUID ACTIVITY: 24H VOL $1.2B (+12%) • OPEN INTEREST $450M • ACTIVE WALLETS 8,492 • TOP GAINER: PURR +24% • TOP LOSER: BTC -2.4% • NEXT FUNDING IN 42M • 
            HYPERLIQUID ACTIVITY: 24H VOL $1.2B (+12%) • OPEN INTEREST $450M • ACTIVE WALLETS 8,492 • 
         </div>
      </div>

      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/20 group hover:scale-105 transition-transform">
            <Droplet className="text-white w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-black bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent uppercase tracking-tight">Hyperliquid Alpha</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">On-Chain Whale Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-full bg-slate-950 border border-slate-800">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Blockchain Live</span>
             </div>
             <div className="w-[1px] h-3 bg-slate-800" />
             <span className="text-[10px] font-mono text-slate-500">{lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : "Syncing..."}</span>
          </div>
          
          <nav className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] font-black text-slate-400 hover:text-white hover:bg-slate-800 transition-all uppercase tracking-widest">
              <ArrowLeft className="w-3.5 h-3.5" /> Volver
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-[1700px] mx-auto p-4 md:p-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* IMPROVEMENT 3: Sidebar Controls Case */}
        <aside className="xl:col-span-3 space-y-6">
           <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                 <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Filter className="w-4 h-4 text-cyan-400" /> Filtros Radar
                 </h2>
                 <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-cyan-600 text-white' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                 </div>
              </div>

              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                 <input 
                   type="text" 
                   placeholder="Buscar por Wallet / Alias..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
                 />
              </div>

              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Volumen Mínimo</label>
                    <div className="grid grid-cols-2 gap-2">
                       {[0, 1000000, 5000000, 10000000].map(v => (
                         <button 
                           key={v}
                           onClick={() => setMinVolume(v)}
                           className={`py-2 px-1 rounded-lg border text-[9px] font-bold transition-all ${minVolume === v ? 'bg-cyan-600/10 border-cyan-500/50 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                         >
                           {v === 0 ? 'Sin Filtro' : `+${(v/1000000).toFixed(0)}M`}
                         </button>
                       ))}
                    </div>
                 </div>

                 <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer group hover:border-cyan-500/30 transition-all">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-cyan-600 focus:ring-cyan-500/50" 
                      checked={onlyActive}
                      onChange={(e) => setOnlyActive(e.target.checked)}
                    />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight group-hover:text-slate-200">Solo con posiciones abiertas</span>
                 </label>
              </div>
           </div>

           {/* IMPROVEMENT 1: Ranking Display */}
           <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center justify-between">
                 TOP 25 WALLETS <span className="text-cyan-600">[{filteredTraders.length}]</span>
              </h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                 {filteredTraders.map((t, idx) => (
                   <div 
                     key={t.id}
                     onClick={() => setSelectedTraderId(t.id)}
                     className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${selectedTraderId === t.id ? 'bg-cyan-600/10 border-cyan-500/40 shadow-lg shadow-cyan-900/10' : 'bg-slate-900/20 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/40'}`}
                   >
                     {/* Rank Decor */}
                     <div className="absolute -right-2 -bottom-2 text-4xl font-black text-white/5 italic group-hover:scale-110 transition-transform">{idx + 1}</div>
                     
                     <div className="flex items-center gap-4 relative z-10">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${selectedTraderId === t.id ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                           #{idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center justify-between mb-0.5">
                              <span className="font-bold text-xs truncate group-hover:text-cyan-400 transition-colors">{t.name || t.address.substring(0,8)}</span>
                              <span className={`text-[10px] font-mono font-bold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                 {t.pnl >= 0 ? '▲' : '▼'} {fmtCur(Math.abs(t.pnl), 0)}
                              </span>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                 <Activity className="w-2.5 h-2.5 text-slate-500" />
                                 <span className="text-[9px] font-bold text-slate-400">{t.active_trades_count} POS</span>
                              </div>
                              <div className="w-[1px] h-2 bg-slate-800" />
                              <span className="text-[9px] font-bold text-slate-500 uppercase">{fmtCur(t.volume, 0)} VOL</span>
                           </div>
                        </div>
                     </div>
                   </div>
                 ))}
                 {filteredTraders.length === 0 && (
                   <div className="py-12 text-center bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
                      <Search className="w-8 h-8 mx-auto text-slate-700 mb-3 opacity-20" />
                      <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">No matching whales found</p>
                   </div>
                 )}
              </div>
           </div>
        </aside>

        {/* Right Content */}
        <section className="xl:col-span-9 space-y-8">
           {selectedTrader ? (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* IMPROVEMENT 8: Glassmorphism Dashboard Header */}
                <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/20 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-600/5 blur-[100px] pointer-events-none rounded-full" />
                   
                   <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                      <div className="flex items-start gap-6">
                         <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-4xl shadow-2xl relative overflow-hidden">
                            {selectedTrader.name ? selectedTrader.name[0] : '🐳'}
                            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-cyan-600" />
                         </div>
                         <div className="space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                               <h2 className="text-2xl font-black text-white tracking-tight">{selectedTrader.name || "Anonymous Whale"}</h2>
                               <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">Tier 0 Whale</Badge>
                               {selectedTrader.win_rate > 70 && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Consistency King</Badge>}
                            </div>
                            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 bg-slate-950/50 py-1.5 px-3 rounded-lg border border-slate-800 w-fit">
                               {selectedTrader.address}
                               <button className="hover:text-white"><Copy className="w-3 h-3" /></button>
                               <ExternalLink className="w-3 h-3 cursor-pointer hover:text-white" />
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center gap-10">
                         <div className="text-center">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Net PnL</p>
                            <p className={`text-3xl font-black font-mono ${selectedTrader.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                               {selectedTrader.pnl >= 0 ? '+' : ''}{fmtCur(selectedTrader.pnl, 0)}
                            </p>
                         </div>
                         <div className="w-[1px] h-12 bg-slate-800" />
                         <div className="text-center">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Win Rate</p>
                            <div className="flex items-center gap-3">
                               <p className="text-3xl font-black font-mono text-white">{selectedTrader.win_rate.toFixed(1)}%</p>
                               <div className="w-10 h-1 bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-cyan-600" style={{ width: `${selectedTrader.win_rate}%` }} />
                               </div>
                            </div>
                         </div>
                         
                         {/* IMPROVEMENT 7: Advanced Copy Trade */}
                         <div className="pl-4 border-l border-slate-800">
                            <button 
                              onClick={() => toggleCopier(selectedTrader)}
                              className={`px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 ${selectedTrader.copier_config.is_copying ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30' : 'bg-cyan-600 text-white shadow-cyan-900/30 hover:bg-cyan-500 hover:shadow-cyan-400/20'}`}
                            >
                               {selectedTrader.copier_config.is_copying ? 'Stop Mirror' : 'Mirror Trades'}
                            </button>
                            {selectedTrader.copier_config.is_copying && (
                               <p className="text-[9px] text-emerald-400 font-bold uppercase mt-2 text-center tracking-widest animate-pulse">Running Mirror @ {selectedTrader.copier_config.copy_ratio}x</p>
                            )}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                   
                   {/* IMPROVEMENT 9: Secondary Stats / Sentiment */}
                   <div className="lg:col-span-4 space-y-6">
                      <Card className="p-6 bg-slate-900/40 border-slate-800/60">
                         <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Trade Bio-Metrics</h3>
                         <div className="space-y-6">
                            {[
                               { label: 'Risk Factor', val: (100 - selectedTrader.win_rate).toFixed(0), color: 'bg-rose-500', icon: Flame },
                               { label: 'Profit Factor', val: '2.4', color: 'bg-emerald-500', icon: TrendingUp },
                               { label: 'Avg Leverage', val: '12.5x', color: 'bg-cyan-500', icon: Zap },
                               { label: 'Asset Reach', val: '24 Pairs', color: 'bg-purple-500', icon: Globe }
                            ].map((s, idx) => (
                              <div key={idx} className="flex items-center justify-between group">
                                 <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 group-hover:border-cyan-500/30 transition-colors">
                                       <s.icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</span>
                                 </div>
                                 <span className="text-xs font-black font-mono text-white">{s.val}{s.label === 'Risk Factor' && '%'}</span>
                              </div>
                            ))}
                         </div>
                      </Card>

                      {/* IMPROVEMENT 5: Asset Concentration */}
                      <Card className="p-6 bg-slate-900/40 border-slate-800/60">
                         <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Dominancia de Activos</h3>
                         <div className="space-y-4">
                            {[
                              { asset: 'BTC', pct: 45, color: '#f7931a' },
                              { asset: 'ETH', pct: 30, color: '#627eea' },
                              { asset: 'PURR', pct: 15, color: '#38b2ac' },
                              { asset: 'SOL', pct: 10, color: '#14f195' }
                            ].map(a => (
                              <div key={a.asset} className="space-y-1.5">
                                 <div className="flex justify-between text-[10px] items-end font-bold uppercase">
                                    <span className="text-slate-400">{a.asset}</span>
                                    <span className="text-white">{a.pct}%</span>
                                 </div>
                                 <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                                    <div className="h-full transition-all duration-1000" style={{ width: `${a.pct}%`, backgroundColor: a.color }} />
                                 </div>
                              </div>
                            ))}
                         </div>
                      </Card>

                      <div className="p-4 rounded-xl bg-cyan-600/5 border border-cyan-500/10 flex items-start gap-3">
                         <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                         <p className="text-[10px] text-cyan-200/60 leading-relaxed italic">Las métricas son procesadas directamente desde el Sequencer de Hyperliquid L1 en tiempo real para máxima precisión.</p>
                      </div>
                   </div>

                   {/* Main Activity Area */}
                   <div className="lg:col-span-8 flex flex-col gap-6">
                      
                      {/* Tabs Navigation */}
                      <div className="flex bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800 w-fit">
                         <button 
                           onClick={() => setActiveTab('live')}
                           className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'live' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                         >
                            Live Engine ({livePositions.length})
                         </button>
                         <button 
                           onClick={() => setActiveTab('history')}
                           className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                         >
                            Historical ({closedPositions.length})
                         </button>
                      </div>

                      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex-1">
                         <div className="overflow-x-auto custom-scrollbar">
                           <table className="w-full border-collapse">
                             <thead>
                               <tr className="border-b border-slate-800 bg-slate-900/50">
                                 <th className="py-4 px-6 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Activo</th>
                                 <th className="py-4 px-6 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Side / Leva</th>
                                 <th className="py-4 px-6 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Entry</th>
                                 <th className="py-4 px-6 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">{activeTab === 'live' ? 'Mark' : 'Close'}</th>
                                 <th className="py-4 px-6 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">PnL / ROI</th>
                                 <th className="py-4 px-6 text-right text-[9px] font-black text-slate-500 uppercase tracking-widest">TimeStamp</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-800/50">
                               {currentViewPositions.map((p, idx) => {
                                 const isLong = p.side === "Long";
                                 const pnlGood = p.pnl >= 0;
                                 return (
                                   <tr key={p.id} className="group hover:bg-slate-900/40 transition-colors animate-in fade-in slide-in-from-right duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                     <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                           <div className={`w-2 h-2 rounded-full ${pnlGood ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                                           <span className="font-extrabold text-xs text-white uppercase tracking-tight">{p.coin}</span>
                                        </div>
                                     </td>
                                     <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                           <span className={`text-[10px] font-black px-2 py-0.5 rounded ${isLong ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                              {isLong ? 'LONG' : 'SHORT'}
                                           </span>
                                           <span className="text-[10px] font-mono font-bold text-slate-500">{p.leverage}x</span>
                                        </div>
                                     </td>
                                     <td className="py-4 px-6 font-mono text-[11px] font-bold text-slate-300">{fmtCur(p.entry_price)}</td>
                                     <td className="py-4 px-6 font-mono text-[11px] font-bold text-slate-300">{fmtCur(p.mark_price)}</td>
                                     <td className="py-4 px-6">
                                        <div className="flex flex-col">
                                           <span className={`text-xs font-black font-mono ${pnlGood ? 'text-emerald-400' : 'text-rose-400'}`}>
                                              {pnlGood ? '+' : ''}{fmtCur(p.pnl)}
                                           </span>
                                           <span className={`text-[9px] font-bold ${pnlGood ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                                              {fmtPct(p.roi)}
                                           </span>
                                        </div>
                                     </td>
                                     <td className="py-4 px-6 text-right font-mono text-[9px] text-slate-600 font-bold uppercase">
                                        {new Date(p.timestamp).toLocaleTimeString()}
                                     </td>
                                   </tr>
                                 )
                               })}
                               {currentViewPositions.length === 0 && (
                                 <tr>
                                   <td colSpan={6} className="py-24 text-center">
                                      <Activity className="w-12 h-12 mx-auto text-slate-800 mb-4 opacity-20" />
                                      <p className="text-xs font-black uppercase text-slate-600 tracking-[0.2em]">No transactions data found for this period</p>
                                   </td>
                                 </tr>
                               )}
                             </tbody>
                           </table>
                         </div>
                      </div>
                   </div>
                </div>

             </div>
           ) : (
             <div className="flex flex-col items-center justify-center py-40 bg-slate-900/10 border border-slate-800 border-dashed rounded-[40px]">
                <div className="relative">
                   <Droplet className="w-20 h-20 text-slate-800 animate-bounce" />
                   <div className="absolute inset-0 bg-cyan-500/5 blur-3xl rounded-full" />
                </div>
                <h2 className="mt-8 text-xl font-black text-slate-700 uppercase tracking-[0.3em]">Select a Whale to Decode</h2>
                <p className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sincronizando con los nodos de RPC...</p>
             </div>
           )}
        </section>

      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }

        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee-slow {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border shadow-2xl backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}
