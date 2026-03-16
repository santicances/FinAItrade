"use client";

import { useCallback, useEffect, useState } from "react";
import { 
  ArrowLeft, 
  Bot, 
  Brain, 
  Settings, 
  Activity, 
  Cpu, 
  Zap, 
  Database, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Search,
  Filter,
  Layers,
  Clock,
  ExternalLink,
  ChevronRight,
  RefreshCcw,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

// ─── MOCK DATA GENERATOR ─────────────────────────────────────────────────────

const ARCHITECTURES = ["LSTM", "RNN", "GRU", "Transformer", "DPO", "TCN", "Dense"];
const STATUSES = ["active", "idle", "training", "error"];
const MODELS_TYPES = ["Prediction-V4", "Signal-Alpha", "Trend-Follower", "Legacy-V1", "Sentiment-Neural"];

const generateMockAgents = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `agt-${1000 + i}`,
    name: `Neural Operator ${i + 1}`,
    architecture: ARCHITECTURES[i % ARCHITECTURES.length],
    status: STATUSES[i % STATUSES.length],
    fitness: 80 + Math.random() * 15,
    accuracy: 70 + Math.random() * 25,
    generation: Math.floor(i / 5) + 1,
    asset: i % 2 === 0 ? "BTC/USDT" : "ETH/USDT",
    uptime: `${Math.floor(Math.random() * 1000)}h`,
    tags: ["Trading", "Scalping", i % 3 === 0 ? "HighFreq" : "Trend"],
  }));
};

const generateMockModels = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `mod-${5000 + i}`,
    name: `${MODELS_TYPES[i % MODELS_TYPES.length]} #${i + 1}`,
    version: `${1 + Math.floor(i / 10)}.${i % 10}.0`,
    type: MODELS_TYPES[i % MODELS_TYPES.length],
    loss: (0.01 + Math.random() * 0.05).toFixed(4),
    accuracy: (0.85 + Math.random() * 0.12).toFixed(4),
    lastTrained: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString(),
    epochs: 50 + Math.floor(Math.random() * 450),
    parameters: `${(Math.random() * 5).toFixed(1)}M`,
    status: i % 10 === 0 ? "deprecated" : "stable",
  }));
};

const MOCK_AGENTS = generateMockAgents(50);
const MOCK_MODELS = generateMockModels(50);

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState("agents");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Artificial loading for feel
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const filteredAgents = MOCK_AGENTS.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredModels = MOCK_MODELS.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-emerald-500/30">
      {/* Background patterns */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05),transparent_50%)]" />
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] left-[10%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Navigation */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-6">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => window.location.href = "/"}
                className="rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all shadow-xl"
            >
              <ArrowLeft className="w-5 h-5 text-emerald-400" />
            </Button>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-1">Configuración Central</h1>
              <p className="text-sm font-bold text-slate-500 tracking-widest uppercase flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-500" /> Control Tower / v2.1.0-stable
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-1 flex items-center">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'agents' ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}
                    onClick={() => setActiveTab('agents')}
                >
                    AGENTS
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'models' ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}
                    onClick={() => setActiveTab('models')}
                >
                    MODELS
                </Button>
             </div>
             <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white h-11 px-6 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all">
                DEPLOY NEW
             </Button>
          </div>
        </header>

        {/* Filters & Stats Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 items-end">
           <div className="lg:col-span-8">
              <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                 </div>
                 <input 
                    type="text" 
                    placeholder={`Search ${activeTab === 'agents' ? '50 Agents' : '50 Neural Models'} by registry ID or signature...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-800 focus:border-emerald-500/50 rounded-2xl text-white font-bold placeholder:text-slate-600 focus:ring-4 focus:ring-emerald-500/10 transition-all backdrop-blur-md"
                 />
              </div>
           </div>
           <div className="lg:col-span-4 grid grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[80px]">
                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Active Threads</span>
                 <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-white">42</span>
                    <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                 </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[80px]">
                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">System Load</span>
                 <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-white">18%</span>
                    <Cpu className="w-5 h-5 text-blue-500" />
                 </div>
              </div>
           </div>
        </div>

        {/* Content Area */}
        <div className="relative min-h-[500px]">
           {loading ? (
             <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCcw className="w-8 h-8 text-emerald-500 animate-spin" />
             </div>
           ) : (
             <AnimatePresence mode="wait">
               {activeTab === 'agents' ? (
                 <motion.div 
                    key="agents-grid"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                 >
                    {filteredAgents.map((agent, i) => (
                      <Card key={agent.id} className="group bg-slate-900/40 border-slate-800/80 hover:border-emerald-500/40 transition-all rounded-3xl overflow-hidden backdrop-blur-md">
                         <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                                     <Bot className="w-6 h-6 text-emerald-400" />
                                  </div>
                                  <div>
                                     <h3 className="font-black text-white uppercase tracking-tighter">{agent.name}</h3>
                                     <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">{agent.id}</p>
                                  </div>
                               </div>
                               <Badge className={`${agent.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'} border-none rounded-lg text-[9px] font-black uppercase px-2 py-0.5`}>
                                  {agent.status}
                               </Badge>
                            </div>

                            <div className="space-y-4 mb-6">
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-black/30 p-3 rounded-2xl border border-slate-800/50">
                                     <p className="text-[8px] text-slate-600 font-black uppercase mb-1">Architecture</p>
                                     <p className="text-xs font-bold text-white uppercase">{agent.architecture}</p>
                                  </div>
                                  <div className="bg-black/30 p-3 rounded-2xl border border-slate-800/50">
                                     <p className="text-[8px] text-slate-600 font-black uppercase mb-1">Win Rate</p>
                                     <p className="text-xs font-bold text-emerald-400">{(agent.accuracy).toFixed(1)}%</p>
                                  </div>
                               </div>

                               <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                     <Layers className="w-3.5 h-3.5 text-slate-500" />
                                     <span className="text-[10px] font-black text-slate-400 uppercase">Gen {agent.generation} Prototype</span>
                                  </div>
                                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{agent.asset}</span>
                               </div>
                            </div>

                            <div className="flex items-center gap-2">
                               <Button variant="outline" size="sm" className="flex-1 h-10 border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 text-slate-400 hover:text-white">
                                  CONFIGURE
                               </Button>
                               <Button size="icon" variant="outline" className="h-10 w-10 border-slate-800 rounded-xl text-slate-500 hover:text-emerald-400 transition-all">
                                  <BarChart3 className="w-4 h-4" />
                               </Button>
                            </div>
                         </CardContent>
                      </Card>
                    ))}
                 </motion.div>
               ) : (
                 <motion.div 
                    key="models-list"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                 >
                    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden">
                       <table className="w-full text-left border-collapse">
                          <thead>
                             <tr className="border-b border-slate-800 bg-black/20">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Model ID & Version</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Performance</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Complexity</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sync-Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                             </tr>
                          </thead>
                          <tbody>
                             {filteredModels.map((model) => (
                               <tr key={model.id} className="border-b border-slate-800/50 hover:bg-white/[0.02] transition-colors group">
                                  <td className="px-6 py-5">
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                           <Brain className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div>
                                           <p className="text-sm font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{model.name}</p>
                                           <p className="text-[9px] text-slate-600 font-bold font-mono tracking-tighter">V{model.version} | {model.id}</p>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="px-6 py-5">
                                     <Badge className="bg-slate-800/50 text-slate-400 border-none text-[8px] font-black uppercase">
                                        {model.type}
                                     </Badge>
                                  </td>
                                  <td className="px-6 py-5">
                                     <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between w-24">
                                           <span className="text-[8px] text-slate-600 font-black uppercase">ACC</span>
                                           <span className="text-[10px] font-black text-emerald-400">{(parseFloat(model.accuracy) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                                           <div className="h-full bg-emerald-500/50" style={{ width: `${parseFloat(model.accuracy) * 100}%` }} />
                                        </div>
                                     </div>
                                  </td>
                                  <td className="px-6 py-5">
                                     <div className="flex items-center gap-2">
                                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                                        <span className="text-xs font-black text-white">{model.parameters} PKT</span>
                                     </div>
                                  </td>
                                  <td className="px-6 py-5">
                                     <div className="flex items-center gap-2 text-slate-500">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold uppercase">{model.lastTrained}</span>
                                     </div>
                                  </td>
                                  <td className="px-6 py-5 text-right">
                                     <div className="flex items-center justify-end gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-800 transition-all">
                                           <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-800 transition-all text-emerald-400">
                                           <ChevronRight className="w-4 h-4" />
                                        </Button>
                                     </div>
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
           )}
        </div>

        {/* Floating Footer Stats */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-8 duration-1000">
           <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 flex items-center gap-6 shadow-2xl shadow-emerald-500/10">
              <div className="flex items-center gap-3 px-4 border-r border-white/5">
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Registry Online</span>
              </div>
              <div className="flex flex-col px-4">
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Total Assets</span>
                 <span className="text-xs font-black text-white tracking-widest">100 INFRASTRUCTURE UNITS</span>
              </div>
              <Button size="sm" className="bg-white hover:bg-slate-200 text-black h-10 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">
                 FORCE RE-SYNC 🔁
              </Button>
           </div>
        </div>
      </div>

      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #050505;
        }
        ::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
}
