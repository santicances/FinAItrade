"use client";

import { useCallback, useEffect, useState } from "react";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Zap, 
  Copy, 
  ExternalLink, 
  Globe, 
  Clock,
  LayoutGrid,
  List,
  Info,
  Dices,
  Eye,
  TrendingUp,
  Activity,
  History,
  Trophy,
  Landmark,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { trackersApi, type LeaderboardTrader, type PMBet, CopierConfig } from "@/lib/trackers-api";

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmtPct = (val: number) => `${val > 0 ? "+" : ""}${val.toFixed(2)}%`;
const fmtCur = (val: number, minimumFractionDigits = 2) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits }).format(val);

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-widest ${className}`}>
      {children}
    </span>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function PolymarketPage() {
  const [traders, setTraders] = useState<LeaderboardTrader[]>([]);
  const [bets, setBets] = useState<PMBet[]>([]);
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
      const data = await trackersApi.pmDashboard();
      setTraders(data.traders);
      setBets(data.active_positions);
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
      await trackersApi.pmUpdateCopier(trader.id, config);
      loadData();
    } catch (e) {
      console.error("Failed to update PM copier", e);
    }
  };

  const selectedTrader = traders.find(t => t.id === selectedTraderId);
  const selectedBets = bets.filter(p => p.trader_address === selectedTrader?.address);
  const liveBets = selectedBets.filter(p => p.status === "open");
  const resolvedBets = selectedBets.filter(p => p.status === "resolved");
  
  const currentViewPositions = activeTab === "live" ? liveBets : resolvedBets;

  return (
    <div className="pm-container min-h-screen bg-[#06040d] text-slate-200 selection:bg-purple-500/30 font-sans">
      
      {/* IMPROVEMENT 1: Premium Whale Alert Ticker */}
      <div className="bg-purple-600/10 border-b border-purple-500/20 py-1.5 overflow-hidden whitespace-nowrap">
         <div className="inline-block animate-marquee-slow font-mono text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">
            🚨 WHALE ALERT: Polymarket User '0x82...fed' just bet $250k on [US Presidential Election] • Total Open Interest: $380M • Trending: Elon Musk vs Brazil Case • 
            POLYMARKET VOLUME: 24H $120M (+45%) • TOP MARKET: FED INTEREST RATES • WHALE ALERT: Polymarket User '0x82...fed' just bet $250k on [US Presidential Election] • 
         </div>
      </div>

      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/20 group hover:rotate-6 transition-transform">
            <Landmark className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent uppercase tracking-tight">Whale Predictions</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Predictive Market Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-full bg-slate-950 border border-slate-800">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse outline outline-offset-2 outline-purple-500/20" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Event Sync Active</span>
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
        
        {/* Sidebar Controls */}
        <aside className="xl:col-span-3 space-y-6">
           <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/60 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                 <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Filter className="w-4 h-4 text-purple-400" /> Whales Radar
                 </h2>
                 <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                 </div>
              </div>

              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                 <input 
                   type="text" 
                   placeholder="Search Wallets, IDs, Domains..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-xs font-medium focus:ring-1 focus:ring-purple-500/50 outline-none transition-all placeholder:text-slate-700"
                 />
              </div>

              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Volume Threshold</label>
                    <div className="grid grid-cols-2 gap-2">
                       {[0, 500000, 1000000, 5000000].map(v => (
                         <button 
                           key={v}
                           onClick={() => setMinVolume(v)}
                           className={`py-2 px-1 rounded-xl border text-[9px] font-bold transition-all ${minVolume === v ? 'bg-purple-600/10 border-purple-500/50 text-purple-400 shadow-lg shadow-purple-900/10' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                         >
                           {v === 0 ? 'Any' : `+${(v/1000000).toFixed(1)}M`}
                         </button>
                       ))}
                    </div>
                 </div>

                 <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer group hover:border-purple-500/30 transition-all">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded-lg border-slate-800 bg-slate-900 text-purple-600 focus:ring-purple-500/50" 
                      checked={onlyActive}
                      onChange={(e) => setOnlyActive(e.target.checked)}
                    />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight group-hover:text-slate-200">Active Bets Only</span>
                 </label>
              </div>
           </div>

           {/* Whale List / Ranking */}
           <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center justify-between">
                 PREDICTION WHALES <span className="text-purple-600">[{filteredTraders.length}]</span>
              </h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                 {filteredTraders.map((t, idx) => (
                   <div 
                     key={t.id}
                     onClick={() => setSelectedTraderId(t.id)}
                     className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group ${selectedTraderId === t.id ? 'bg-purple-600/10 border-purple-500/40 shadow-xl' : 'bg-slate-900/20 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/40'}`}
                   >
                     {/* Rank Decor */}
                     <div className="absolute -right-1 -bottom-2 text-5xl font-black text-white/5 italic group-hover:scale-110 transition-transform">{idx + 1}</div>
                     
                     <div className="flex items-center gap-5 relative z-10">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-lg ${selectedTraderId === t.id ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                           #{idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center justify-between mb-1">
                              <span className="font-black text-sm text-slate-200 group-hover:text-purple-400 transition-colors uppercase tracking-tight truncate">{t.name || t.address.substring(0,10)}</span>
                              <span className={`text-[10px] font-mono font-bold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'} bg-black/40 px-2 py-0.5 rounded-full`}>
                                 {t.pnl >= 0 ? '+' : ''}{fmtCur(t.pnl, 0)}
                              </span>
                           </div>
                           <div className="flex items-center gap-3">
                              <Badge className="bg-purple-500/10 border-purple-500/20 text-purple-400">{t.active_trades_count} Bets</Badge>
                              <div className="w-[1px] h-2 bg-slate-800" />
                              <span className="text-[9px] font-bold text-slate-500 uppercase">{fmtCur(t.volume, 0)} Vol</span>
                           </div>
                        </div>
                     </div>
                   </div>
                 ))}
              </div>
           </div>
        </aside>

        {/* Selected Trader Dashboard */}
        <section className="xl:col-span-9 space-y-8">
           {selectedTrader ? (
             <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                
                {/* IMPROVEMENT 4: Premium Amethyst Design Dashboard */}
                <div className="p-10 rounded-[2.5rem] bg-[#0c0a1a] border border-purple-500/20 shadow-2xl relative overflow-hidden group">
                   <div className="absolute -top-24 -right-24 w-[30rem] h-[30rem] bg-purple-600/5 blur-[120px] pointer-events-none rounded-full" />
                   <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                   
                   <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10">
                      <div className="flex items-start gap-8">
                         <div className="w-24 h-24 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center text-5xl shadow-2xl relative overflow-hidden transform group-hover:rotate-2 transition-transform">
                            {selectedTrader.name ? selectedTrader.name[0] : '🐳'}
                            <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-purple-600 to-indigo-600" />
                         </div>
                         <div className="space-y-4">
                            <div className="flex items-center gap-4 flex-wrap">
                               <h2 className="text-3xl font-black text-white tracking-widest">{selectedTrader.name || "UNIDENTIFIED WHALE"}</h2>
                               <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 px-3 py-1">Top Analyst</Badge>
                               {selectedTrader.win_rate > 70 && <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 px-3 py-1"><Trophy className="w-3 h-3 mr-1" /> Super Winner</Badge>}
                            </div>
                            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 bg-slate-950/80 py-2 px-5 rounded-2xl border border-slate-800 w-fit backdrop-blur-md">
                               <ShieldCheck className="w-4 h-4 text-emerald-500" />
                               {selectedTrader.address}
                               <div className="w-[1px] h-3 bg-slate-700 mx-1" />
                               <button className="hover:text-purple-400 transition-colors"><Copy className="w-4 h-4" /></button>
                               <ExternalLink className="w-4 h-4 cursor-pointer hover:text-purple-400 transition-colors" />
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 sm:flex items-center gap-12">
                         <div className="text-center group-hover:scale-105 transition-transform">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">Net Profits</p>
                            <p className={`text-3xl font-black font-mono tracking-tighter ${selectedTrader.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                               {selectedTrader.pnl >= 0 ? '+' : ''}{fmtCur(selectedTrader.pnl, 0)}
                            </p>
                         </div>
                         <div className="hidden sm:block w-[1px] h-14 bg-slate-800" />
                         <div className="text-center group-hover:scale-105 transition-transform delay-75">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">Prediction Accuracy</p>
                            <div className="flex items-center gap-4">
                               <p className="text-3xl font-black font-mono text-white">{selectedTrader.win_rate.toFixed(1)}%</p>
                            </div>
                            <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden shadow-inner">
                               <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 shadow-[0_0_10px_#9f7aea]" style={{ width: `${selectedTrader.win_rate}%` }} />
                            </div>
                         </div>
                         
                         {/* Action */}
                         <div className="col-span-2 sm:col-span-1 sm:pl-8 sm:border-l border-slate-800 pt-4 sm:pt-0">
                            <button 
                              onClick={() => toggleCopier(selectedTrader)}
                              className={`w-full sm:w-auto px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 ${selectedTrader.copier_config.is_copying ? 'bg-rose-500/20 text-rose-400 border-2 border-rose-500/40 hover:bg-rose-500/30' : 'bg-purple-600 text-white shadow-purple-900/40 hover:bg-purple-500 hover:shadow-purple-500/20 border-2 border-purple-400/30'}`}
                            >
                               {selectedTrader.copier_config.is_copying ? <Zap className="w-4 h-4 animate-pulse" /> : <Dices className="w-4 h-4" />}
                               {selectedTrader.copier_config.is_copying ? 'DISCONNECT SYNC' : 'SYNC PREDICTIONS'}
                            </button>
                            {selectedTrader.copier_config.is_copying && (
                               <p className="text-[9px] text-emerald-400 font-black uppercase mt-3 text-center tracking-[0.15em] animate-pulse">Live Synchronization: {selectedTrader.copier_config.copy_ratio}x Power</p>
                            )}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                   
                   {/* Left Stats Rail */}
                   <div className="lg:col-span-4 space-y-6">
                      
                      {/* IMPROVEMENT 2: Sentiment Breakdown */}
                      <Card className="p-8 bg-slate-900/30 border-slate-800/60 overflow-hidden relative">
                         <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="w-12 h-12" /></div>
                         <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Opinion Bio-Profile</h3>
                         <div className="space-y-8">
                            {[
                               { label: 'Risk Tolerance', val: 'Aggressive', color: 'text-rose-500', icon: Zap },
                               { label: 'Market Bias', val: 'Bullish / YES', color: 'text-emerald-500', icon: TrendingUp },
                               { label: 'Niche Focus', val: 'Politics & AI', color: 'text-purple-400', icon: Globe },
                            ].map((s, idx) => (
                              <div key={idx} className="flex flex-col gap-2 group">
                                 <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                       <s.icon className="w-3 h-3" /> {s.label}
                                    </span>
                                 </div>
                                 <div className={`text-sm font-black uppercase tracking-tight ${s.color} group-hover:scale-105 transition-transform origin-left`}>{s.val}</div>
                              </div>
                            ))}
                         </div>
                         <div className="mt-10 pt-8 border-t border-slate-800/60 grid grid-cols-2 gap-4">
                            <div className="text-center">
                               <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Avg Stakes</p>
                               <p className="text-sm font-black text-white">$4.2K</p>
                            </div>
                            <div className="text-center">
                               <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Top Strike</p>
                               <p className="text-sm font-black text-white">$120K</p>
                            </div>
                         </div>
                      </Card>

                      {/* IMPROVEMENT 5: Category Focus */}
                      <Card className="p-8 bg-slate-900/30 border-slate-800/60">
                         <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Focus Distribution</h3>
                         <div className="space-y-5">
                            {[
                              { label: 'Politics', pct: 65, color: '#9f7aea' },
                              { label: 'Crypto Events', pct: 20, color: '#f7931a' },
                              { label: 'Science', pct: 10, color: '#48bb78' },
                              { label: 'Pop Culture', pct: 5, color: '#ec4899' }
                            ].map(a => (
                              <div key={a.label} className="space-y-2">
                                 <div className="flex justify-between text-[10px] items-center font-bold uppercase tracking-tight">
                                    <span className="text-slate-400">{a.label}</span>
                                    <span className="text-white bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">{a.pct}%</span>
                                 </div>
                                 <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                                    <div className="h-full transition-all duration-1000 ease-in-out shadow-[0_0_8px_rgba(159,122,234,0.4)]" style={{ width: `${a.pct}%`, backgroundColor: a.color }} />
                                 </div>
                              </div>
                            ))}
                         </div>
                      </Card>

                      <div className="p-5 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
                         <div className="p-1.5 rounded-lg bg-amber-500/20"><Info className="w-4 h-4 text-amber-500" /></div>
                         <p className="text-[10px] text-amber-200/50 leading-relaxed font-bold uppercase tracking-tight">Alpha Insight: This whale shows 85% predictive accuracy on Political markets over the last 90 days. Follow with confidence.</p>
                      </div>
                   </div>

                   {/* Activity Table Area */}
                   <div className="lg:col-span-8 flex flex-col gap-6">
                      
                      {/* Tabs */}
                      <div className="flex items-center justify-between">
                         <div className="flex bg-slate-950/80 p-2 rounded-[1.5rem] border border-slate-800 w-fit backdrop-blur-md">
                            <button 
                              onClick={() => setActiveTab('live')}
                              className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-3 ${activeTab === 'live' ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/20' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                               <Activity className="w-3.5 h-3.5" /> Active ({liveBets.length})
                            </button>
                            <button 
                              onClick={() => setActiveTab('history')}
                              className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-3 ${activeTab === 'history' ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/20' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                               <History className="w-3.5 h-3.5" /> Resolved ({resolvedBets.length})
                            </button>
                         </div>
                         
                         <div className="hidden sm:flex items-center gap-4 px-6 py-3 rounded-2xl bg-slate-900/20 border border-slate-800">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Rank</span>
                            <span className="text-sm font-black text-purple-400">#42</span>
                         </div>
                      </div>

                      <div className="rounded-[2rem] bg-[#0c0a1a] border border-slate-800/80 overflow-hidden shadow-2xl flex-1 backdrop-blur-3xl">
                         <div className="overflow-x-auto custom-scrollbar">
                           <table className="w-full border-collapse">
                             <thead>
                               <tr className="border-b border-slate-800 bg-slate-900/40">
                                 <th className="py-6 px-8 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Market / Event</th>
                                 <th className="py-6 px-8 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Outcome</th>
                                 <th className="py-6 px-8 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Shares / Avg</th>
                                 <th className="py-6 px-8 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{activeTab === 'live' ? 'Current Prob' : 'Resolution'}</th>
                                 <th className="py-6 px-8 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">PnL / ROI</th>
                                 <th className="py-6 px-8 text-right text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Locked At</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-800/40">
                               {currentViewPositions.map((b, idx) => {
                                 const isYes = b.outcome === "Yes";
                                 const pnlGood = b.pnl >= 0;
                                 return (
                                   <tr key={b.id} className="group hover:bg-purple-600/5 transition-all duration-300 animate-in fade-in slide-in-from-right-4" style={{ animationDelay: `${idx * 40}ms` }}>
                                     <td className="py-6 px-8">
                                        <div className="flex flex-col gap-1.5 max-w-xs xl:max-w-md">
                                           <span className="font-black text-xs text-white leading-tight uppercase tracking-tight group-hover:text-purple-400 transition-colors">{b.market}</span>
                                           <div className="flex items-center gap-3">
                                              <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1"><Eye className="w-2.5 h-2.5" /> Tracked</span>
                                              <span className="text-[9px] font-bold text-purple-500/60 uppercase">Market_ID: {b.id.substring(0,6)}</span>
                                           </div>
                                        </div>
                                     </td>
                                     <td className="py-6 px-8">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black tracking-widest ${isYes ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                                           {isYes ? 'YES' : 'NO'}
                                        </div>
                                     </td>
                                     <td className="py-6 px-8">
                                        <div className="flex flex-col text-[11px] font-black font-mono">
                                           <span className="text-white">{b.shares.toLocaleString()} SH</span>
                                           <span className="text-slate-500 text-[10px]">avg @ {(b.avg_price * 100).toFixed(1)}¢</span>
                                        </div>
                                     </td>
                                     <td className="py-6 px-8">
                                        <div className="flex items-center gap-3">
                                           <span className="text-xs font-black font-mono text-purple-400">{(b.current_price * 100).toFixed(1)}%</span>
                                           <div className="hidden sm:block w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                                              <div className="h-full bg-purple-500" style={{ width: `${b.current_price * 100}%` }} />
                                           </div>
                                        </div>
                                     </td>
                                     <td className="py-6 px-8">
                                        <div className="flex flex-col">
                                           <span className={`text-sm font-black font-mono ${pnlGood ? 'text-emerald-400' : 'text-rose-400'}`}>
                                              {pnlGood ? '+' : ''}{fmtCur(b.pnl)}
                                           </span>
                                           <span className={`text-[10px] font-bold ${pnlGood ? 'text-emerald-500/50' : 'text-rose-500/50'}`}>
                                              {fmtPct(b.roi)}
                                           </span>
                                        </div>
                                     </td>
                                     <td className="py-6 px-8 text-right font-mono text-[10px] text-slate-600 font-bold uppercase">
                                        {new Date(b.timestamp).toLocaleTimeString()}
                                     </td>
                                   </tr>
                                 )
                               })}
                               {currentViewPositions.length === 0 && (
                                 <tr>
                                   <td colSpan={6} className="py-32 text-center">
                                      <Landmark className="w-16 h-16 mx-auto text-slate-800 mb-6 opacity-20" />
                                      <p className="text-xs font-black uppercase text-slate-700 tracking-[0.3em]">Query returned zero active predictions for this sector</p>
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
             <div className="flex flex-col items-center justify-center py-48 bg-slate-900/10 border-2 border-slate-800 border-dashed rounded-[4rem]">
                <div className="relative">
                   <Landmark className="w-24 h-24 text-slate-800 animate-pulse" />
                   <div className="absolute inset-0 bg-purple-500/5 blur-[100px] rounded-full" />
                </div>
                <h2 className="mt-10 text-2xl font-black text-slate-700 uppercase tracking-[0.4em]">Decipher the Prediction</h2>
                <p className="mt-4 text-[10px] text-slate-500 font-black uppercase tracking-widest">Analyzing The Graph indexer data across multiple chains...</p>
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
          animation: marquee 50s linear infinite;
        }
      `}</style>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[2rem] border shadow-2xl backdrop-blur-3xl ${className}`}>
      {children}
    </div>
  );
}
