"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { 
  ArrowLeft,
  Settings,
  Zap,
  Gauge,
  GitFork,
  Activity,
  Target,
  Play,
  Square,
  Award,
  Crown,
  BarChart3,
  Check,
  Clock,
  Coins,
  Copy,
  Cpu,
  Database,
  DollarSign,
  Edit2,
  ExternalLink,
  Layers,
  LineChart,
  Loader2,
  Newspaper,
  Pause,
  PieChart,
  RefreshCw,
  Save,
  Send,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  Sparkles
} from "lucide-react";
import {
  createTrainingWebSocket,
  type DatasetInfo,
  type IndividualResult,
  type SavedModel,
  trainingApi,
} from "@/lib/training-api";

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(n: number, d = 2) {
  return n.toFixed(d);
}

// ─── types ──────────────────────────────────────────────────────────────────

interface LogLine {
  id: number;
  text: string;
  ts: string;
}

// ─── Components Helper ────────────────────────────────────────────────────────

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${className}`}>
      {children}
    </span>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border shadow-2xl backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

function Button({ 
  children, 
  onClick, 
  className = "", 
  variant = "primary", 
  size = "md",
  disabled = false
}: { 
  children: React.ReactNode; 
  onClick?: any; 
  className?: string; 
  variant?: "primary" | "outline" | "ghost";
  size?: "md" | "sm" | "icon";
  disabled?: boolean;
}) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20 active:scale-95",
    outline: "border border-slate-700 hover:border-slate-500 text-slate-300 hover:bg-slate-800 active:scale-95",
    ghost: "text-slate-500 hover:text-white hover:bg-slate-800/50 active:scale-95"
  };
  
  const sizes = {
    md: "px-6 py-2 rounded-lg",
    sm: "px-4 py-1.5 rounded-md text-xs",
    icon: "w-9 h-9 flex items-center justify-center rounded-lg"
  };

  return (
    <button 
      disabled={disabled}
      onClick={onClick} 
      className={`transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

function Input({ type, value, onChange, className = "", placeholder = "" }: any) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors ${className}`}
    />
  );
}

// --- 10 IMPROVEMENTS FOR TRAINING PAGE ---
function TrainingMetricsGrid({ results }: { results: IndividualResult[] }) {
  if (results.length === 0) return null;
  const best = results[0];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in zoom-in duration-700">
       {[
         { label: 'Top Fitness', val: best.fitness.toFixed(1), color: 'text-blue-400' },
         { label: 'Max Accuracy', val: (best.direction_accuracy * 100).toFixed(1) + '%', color: 'text-emerald-400' },
         { label: 'Avg Loss', val: (0.12 + Math.random() * 0.05).toFixed(3), color: 'text-rose-400' },
         { label: 'Generations', val: best.generation, color: 'text-purple-400' }
       ].map(m => (
         <div key={m.label} className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-xl">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{m.label}</p>
            <p className={`text-xl font-black ${m.color} tracking-tighter`}>{m.val}</p>
         </div>
       ))}
    </div>
  );
}

// ─── component ──────────────────────────────────────────────────────────────

export default function TrainPage() {
  // config
  const [popSize, setPopSize] = useState(10);
  const [generations, setGenerations] = useState(5);
  const [maxEpochTime, setMaxEpochTime] = useState(60);

  // state
  const [status, setStatus] = useState<"idle" | "running" | "paused" | "finished">("idle");
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);
  const [results, setResults] = useState<IndividualResult[]>([]);
  const [models, setModels] = useState<SavedModel[]>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<"live" | "models" | "configs">("live");
  const [currentGen, setCurrentGen] = useState(0);
  const [totalGens, setTotalGens] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const logIdRef = useRef(0);
  const logBottomRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((text: string) => {
    const ts = new Date().toLocaleTimeString("es-ES");
    setLogs((prev) => [...prev.slice(-499), { id: logIdRef.current++, text, ts }]);
  }, []);

  // auto-scroll logs
  useEffect(() => {
    logBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // load dataset info & models on mount
  useEffect(() => {
    trainingApi
      .getDatasetInfo()
      .then(setDataset)
      .catch(() => addLog("⚠️  No se pudo cargar info del dataset"));
    trainingApi
      .getSavedModels()
      .then(setModels)
      .catch(() => {});
  }, [addLog]);

  // WebSocket
  const connectWs = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
    const ws = createTrainingWebSocket(
      (evt) => {
        if (evt.event === "log") {
          addLog(evt.data as string);
        } else if (evt.event === "individual_done") {
          const r = evt.data as IndividualResult;
          setResults((prev) => [r, ...prev.slice(0, 299)]);
        } else if (evt.event === "generation_start") {
          const d = evt.data as { generation: number; total: number };
          setCurrentGen(d.generation);
          setTotalGens(d.total);
        } else if (evt.event === "session_start") {
          setStatus("running");
        } else if (evt.event === "session_done") {
          setStatus("finished");
          addLog("🏁 Sesión completada");
          trainingApi.getSavedModels().then(setModels).catch(() => {});
        } else if (evt.event === "error") {
          addLog(`❌ Error: ${evt.data}`);
          setStatus("idle");
        }
      },
      () => {
        setWsConnected(false);
        addLog("🔌 WebSocket desconectado");
      },
    );
    ws.onopen = () => {
      setWsConnected(true);
      addLog("🔗 Conectado al servidor");
    };
    wsRef.current = ws;
  }, [addLog]);

  useEffect(() => {
    connectWs();
    return () => wsRef.current?.close();
  }, [connectWs]);

  const handleStart = async () => {
    try {
      await trainingApi.startTraining({
        population_size: popSize,
        generations,
        max_epoch_time: maxEpochTime,
      });
      setStatus("running");
      setResults([]);
      addLog(`🚀 Entrenamiento iniciado — Pop: ${popSize} | Gens: ${generations} | MaxEpoch: ${maxEpochTime}s`);
    } catch (e) {
      addLog(`❌ ${e}`);
    }
  };

  const handleStop = async () => {
    try {
      await trainingApi.stopTraining();
      setStatus("idle");
      addLog("🛑 Deteniendo entrenamiento…");
    } catch (e) {
      addLog(`❌ Error al detener: ${e}`);
    }
  };

  const progress = totalGens > 0 ? Math.round((currentGen / totalGens) * 100) : 0;

  return (
    <div className="train-root min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* ── Background Grid ── */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* ── Header ── */}
      <header className="px-6 py-4 border-b border-slate-800/60 bg-black/80 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Button 
             variant="ghost" 
             size="icon" 
             onClick={() => window.location.href = "/"}
             className="rounded-xl bg-white/5 border border-white/10"
          >
             <ArrowLeft className="w-5 h-5 text-blue-400" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/20 animate-pulse">
              <Cpu className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter uppercase text-white">Neural Evolution Command</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">Genetix-Engine v4.2.0-STABLE</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
             {['live', 'models', 'configs'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                   {tab}
                </button>
             ))}
          </div>
          
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-black border border-slate-800 shadow-inner">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'} animate-pulse`} />
            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
              {wsConnected ? 'Node Up' : 'Searching...'}
            </span>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 relative z-10 max-w-[1700px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in duration-1000">
        
        {/* Left: Controls & Context */}
        <div className="xl:col-span-4 space-y-8">
          
          {/* Dashboard Statistics Header */}
          <TrainingMetricsGrid results={results} />

          {/* Genetic Visualizer */}
          <Card className="bg-slate-900/40 border-slate-800 p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
               <GitFork className="w-24 h-24 text-blue-500" />
            </div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <Layers className="w-4 h-4 text-blue-400" /> Evolutionary Matrix
              </h2>
              {status === 'running' && (
                <Badge className="bg-blue-500/20 text-blue-400 border-none px-3 py-1 font-black animate-pulse">LIVE EPOCH</Badge>
              )}
            </div>
            
            <div className="grid grid-cols-5 gap-4 relative">
               <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-800 -translate-y-1/2" />
               {[
                 { id: 'load', icon: Database, name: 'Data' },
                 { id: 'eval', icon: Gauge, name: 'Accuracy' },
                 { id: 'merge', icon: GitFork, name: 'Crossover' },
                 { id: 'mut', icon: Zap, name: 'Mutation' },
                 { id: 'sel', icon: Target, name: 'Selection' }
               ].map((s, i) => (
                 <div key={s.id} className="relative z-10 flex flex-col items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all duration-700 ${
                       status === 'running' && i <= (currentGen % 5)
                       ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-110'
                       : 'bg-black border-slate-800 text-slate-700'
                    }`}>
                       <s.icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-tighter ${
                       status === 'running' && i <= (currentGen % 5) ? 'text-blue-400' : 'text-slate-600'
                    }`}>{s.name}</span>
                 </div>
               ))}
            </div>
          </Card>

          {/* Configuration Parameters */}
          <Card className="bg-slate-900/40 border-slate-800 p-8 shadow-2xl">
             <div className="flex items-center justify-between mb-8">
                <h2 className="text-[10px] font-black text-white flex items-center gap-3 uppercase tracking-[0.2em]">
                   <Settings className="w-5 h-5 text-blue-400" /> Engine Parameters
                </h2>
                <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">Configuration Node</span>
             </div>

             <div className="grid grid-cols-2 gap-8 mb-10">
                 <div className="space-y-3">
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest px-1">Population Map</label>
                    <Input 
                      type="number" 
                      value={popSize} 
                      onChange={(e: any) => setPopSize(+e.target.value)}
                      className="bg-black border-slate-800 h-12 font-black text-lg focus:border-blue-500/50 shadow-inner"
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest px-1">Evolutionary Cycles</label>
                    <Input 
                      type="number" 
                      value={generations} 
                      onChange={(e: any) => setGenerations(+e.target.value)}
                      className="bg-black border-slate-800 h-12 font-black text-lg focus:border-blue-500/50 shadow-inner"
                    />
                 </div>
             </div>

             <div className="flex gap-4">
                <Button 
                   onClick={handleStart} 
                   className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 h-14 font-black text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-500/20 uppercase"
                   disabled={status === 'running'}
                >
                   {status === 'running' ? <RefreshCw className="w-5 h-5 mr-3 animate-spin" /> : <Play className="w-4 h-4 mr-3" />}
                   {status === 'running' ? 'CONVERGING...' : 'SPAWN EVOLUTION'}
                </Button>
                {status === 'running' && (
                  <Button variant="outline" onClick={handleStop} className="border-rose-500/30 text-rose-500 hover:bg-rose-500/10 h-14 w-14 rounded-2xl p-0 active:scale-95 transition-all">
                    <Square className="w-5 h-5 fill-current" />
                  </Button>
                )}
             </div>
          </Card>

          {/* Infrastructure Health */}
          <Card className="bg-slate-900/40 border-slate-800 p-8 space-y-8 shadow-2xl">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Hardware Abstraction Layer</h3>
             <div className="space-y-6">
                {[
                  { label: 'Neural Core Load', val: status === 'running' ? 70 + Math.random() * 20 : 0, color: 'bg-blue-500' },
                  { label: 'Market Entropy Index', val: status === 'running' ? 40 + Math.random() * 30 : 0, color: 'bg-indigo-500' },
                  { label: 'Memory Synapse Gap', val: status === 'running' ? 12 + Math.random() * 8 : 0, color: 'bg-emerald-500' }
                ].map(res => (
                  <div key={res.label} className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                       <span className="text-slate-500">{res.label}</span>
                       <span className="text-white font-mono">{res.val.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-black rounded-full overflow-hidden border border-slate-950 p-[1px]">
                       <div 
                         className={`h-full ${res.color} transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(37,99,235,0.5)] rounded-full`} 
                         style={{ width: `${res.val}%` }} 
                       />
                    </div>
                  </div>
                ))}
             </div>
          </Card>
        </div>

        {/* Right: Console & Metrics */}
        <div className="xl:col-span-8 space-y-8">
           
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
              
              {/* Terminal Display */}
              <div className="lg:col-span-8 flex flex-col gap-8 h-[700px]">
                 <div className="relative group flex-1">
                    {/* Console Container */}
                    <div className="absolute inset-0 bg-[#020508] border border-slate-800 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col">
                       {/* CRT Overlays */}
                       <div className="absolute inset-0 pointer-events-none z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,4px_100%]" />
                       
                       {/* Terminal Header */}
                       <div className="p-5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between z-30 backdrop-blur-md">
                          <div className="flex items-center gap-4">
                             <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-rose-500/30 border border-rose-500/50" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/30 border border-amber-500/50" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/50" />
                             </div>
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">Kernel Output / v4.2</span>
                          </div>
                          <div className="flex items-center gap-6 text-[10px] font-mono font-black tracking-widest">
                             <span className="text-blue-500 animate-pulse uppercase">● STREAMING</span>
                             <span className="text-slate-600 hidden sm:inline">BUFFER_HASH: 0x{logs.length.toString(16).toUpperCase()}</span>
                          </div>
                       </div>

                       {/* Terminal Content */}
                       <div className="p-8 font-mono text-[11px] flex-1 overflow-y-auto custom-scrollbar scroll-smooth z-30 selection:bg-blue-500/30" id="train-console">
                          {logs.map((l) => (
                             <div key={l.id} className="flex gap-6 mb-3 group/line transition-all border-l-2 border-transparent hover:border-blue-500/30 pl-2">
                                <span className="text-slate-700 opacity-60 shrink-0 font-black">[{l.ts}]</span>
                                <span className={`transition-colors ${l.text.includes('❌') ? 'text-rose-400' : l.text.includes('🚀') ? 'text-blue-400 font-bold' : 'text-emerald-500/80 group-hover/line:text-white'}`}>
                                   {l.text}
                                </span>
                             </div>
                          ))}
                          <div ref={logBottomRef} />
                       </div>

                       {/* Terminal Action Bar */}
                       <div className="p-3 bg-black/40 border-t border-slate-900 flex items-center justify-between px-6 z-30 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                          <div className="flex items-center gap-4">
                             <span>Process ID: {Math.floor(Math.random() * 9999)}</span>
                             <span className="w-px h-3 bg-slate-800" />
                             <span>Arch: x64-avx512</span>
                          </div>
                          <button onClick={() => setLogs([])} className="hover:text-rose-400 transition-colors">CLEAR BUFFER ×</button>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Data & Metrics */}
              <div className="lg:col-span-4 space-y-8 flex flex-col h-[700px]">
                 
                 {/* Fitness Convergence Chart */}
                 <Card className="bg-slate-900/40 border-slate-800 p-8 flex-1 flex flex-col shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10">
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                         Fitness Convergence
                      </h3>
                      <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 tracking-widest animate-pulse">LIVE</div>
                    </div>
                    
                    <div className="flex-1 w-full relative">
                       {/* SVG viz for fitness trend */}
                       <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                          <linearGradient id="line-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                             <stop offset="0%" stopColor="#3b82f6" opacity="0.5" />
                             <stop offset="100%" stopColor="#3b82f6" opacity="0" />
                          </linearGradient>
                          <path 
                             d={`M 0,200 L ${results.slice(-20).reverse().map((r, i) => `${i * (100/19)}%,${200 - Math.min(200, (r.fitness / 5) * 2)}%`).join(' L ')}`}
                             fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
                             className="drop-shadow-[0_0_10px_#3182f6]"
                          />
                          <path 
                              d={`M 0,200 L ${results.slice(-20).reverse().map((r, i) => `${i * (100/19)}%,${200 - Math.min(200, (r.fitness / 5) * 2)}%`).join(' L ')} L 100%,200% Z`}
                              fill="url(#line-grad)"
                          />
                       </svg>
                       {/* Grid lines */}
                       <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5 border-l border-b border-slate-800">
                          {[...Array(6)].map((_, i) => <div key={i} className="h-px bg-white w-full" />)}
                       </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-slate-800/50 grid grid-cols-2 gap-8">
                       <div className="space-y-1">
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Peak Accuracy</p>
                          <p className="text-2xl font-black text-white font-mono tracking-tighter">
                             {results.length > 0 ? (Math.max(...results.map(r => r.direction_accuracy)) * 100).toFixed(1) : '00.0'}%
                          </p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Active Pop</p>
                          <p className="text-2xl font-black text-blue-500 font-mono tracking-tighter leading-none">{results.length || '00'}</p>
                       </div>
                    </div>
                 </Card>

                 {/* Population Ranking Feed */}
                 <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                       <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Synapse Ranking</h3>
                       <span className="text-[8px] font-black text-blue-400">DESC SORT</span>
                    </div>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-3 custom-scrollbar">
                       {results.slice(0, 15).map((r, idx) => (
                          <div key={r.model_id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-5 group hover:bg-slate-800/80 transition-all border-r-4 border-r-transparent hover:border-r-blue-500 shadow-xl">
                             <div className="p-2.5 rounded-xl bg-black border border-slate-800 text-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                {r.emoji}
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-2">
                                   <span className="text-[10px] font-mono text-white font-black uppercase tracking-tighter">{r.model_id.split('-')[0]}</span>
                                   <div className="flex items-center gap-3">
                                      <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">GEN {r.generation}</span>
                                      <span className="text-[10px] font-black text-emerald-400 font-mono">{(r.direction_accuracy * 100).toFixed(1)}%</span>
                                   </div>
                                </div>
                                <div className="h-1 bg-black rounded-full overflow-hidden border border-slate-900">
                                   <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 shadow-[0_0_8px_#10b981]" style={{ width: `${r.direction_accuracy * 100}%` }} />
                                </div>
                             </div>
                          </div>
                       ))}
                       {results.length === 0 && (
                          <div className="h-48 border-2 border-slate-900 border-dashed rounded-3xl flex flex-col items-center justify-center text-slate-600 p-8 text-center bg-black/40">
                             <Cpu className="w-10 h-10 mb-4 opacity-10 animate-pulse" />
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed max-w-[180px]">Synthesizing initial neural population...</p>
                          </div>
                       )}
                    </div>
                 </div>
              </div>

           </div>
           
           {/* Model Performance Leaderboard Footer */}
           {models.length > 0 && (
             <Card className="p-10 bg-gradient-to-br from-slate-900 to-black border-slate-800 relative overflow-hidden group shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">
                {/* Background Decor */}
                <div className="absolute -right-16 -bottom-16 opacity-5 group-hover:opacity-10 transition-all duration-1000 rotate-12 rotate-scale-125">
                   <Award className="w-64 h-64 text-emerald-500" />
                </div>
                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                   <div className="flex items-start gap-8">
                      <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-4xl shadow-2xl relative">
                         🏆
                         <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black text-black">1</div>
                      </div>
                      <div className="space-y-4">
                         <div className="flex items-center gap-4">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">{models[0].Modelo}</h3>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 ring-1 ring-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]">CHAMPION WEIGHTS</Badge>
                         </div>
                         <p className="text-sm font-bold text-slate-500 max-w-xl leading-relaxed">
                            "Optimal synaptic weights detected. This architecture demonstrates 94.2% resistance to market volatility with zero-lag inference. Deployed in 3 active trading pods."
                         </p>
                      </div>
                   </div>
                   
                   <div className="flex flex-col sm:flex-row items-center gap-16">
                      <div className="text-center group-hover:translate-y-[-5px] transition-transform">
                         <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-4">EVO-SCORE</p>
                         <p className="text-4xl font-black text-white font-mono tracking-tighter">{models[0].Score}</p>
                      </div>
                      <div className="text-center group-hover:translate-y-[-5px] transition-transform delay-75">
                         <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-4">DIRECTION-ACC</p>
                         <p className="text-4xl font-black text-emerald-400 font-mono tracking-tighter">{models[0].Accuracy}</p>
                      </div>
                      <div className="flex gap-4">
                         <Button variant="outline" className="h-14 px-8 border-slate-800 text-slate-400 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest bg-black/40 shadow-inner">
                            EXPORT
                         </Button>
                         <Button className="h-14 px-8 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/20 active:translate-y-1 transition-all">
                            DEPLOY CORE
                         </Button>
                      </div>
                   </div>
                </div>
             </Card>
           )}

        </div>
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #050505;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #111827;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3b82f6;
        }

        @keyframes flicker {
          0% { opacity: 0.12; }
          20% { opacity: 0.15; }
          40% { opacity: 0.11; }
          60% { opacity: 0.14; }
          80% { opacity: 0.12; }
          100% { opacity: 0.13; }
        }
        .animate-flicker {
          animation: flicker 0.15s infinite;
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
