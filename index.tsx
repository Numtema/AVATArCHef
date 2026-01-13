
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from '@google/genai';
import { 
  ChefHat, Plus, History, Layers, Zap, Utensils, ClipboardList, 
  Sparkles, ArrowRight, Maximize2, ChevronRight, RefreshCw, Send,
  Target, ShieldCheck, Cpu, Globe, ArrowDown, Activity, FileText,
  Search, Archive, Trash2, X, Star, Award, Layout, Eye, Check,
  AlertCircle, Download, BookOpen, Quote, Table as TableIcon, Columns, ListChecks,
  Binary, Workflow, Gauge, Terminal, Share2, Box, GitBranch, FlaskConical, Boxes
} from 'lucide-react';
import { ViewType, ProjectSession, Artifact, DisplayType } from './types';

// --- PocketFlow Engine Logic ---

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const callPocketFlowAgent = async (role: string, mission: string, displayType: DisplayType, context: any) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Tu es un Node Agent PocketFlow spécialisé (Pattern: AsyncParallelBatchFlow).
Rôle de la Brigade : ${role}
Mission Critique : ${mission}

Shared Storage (Context):
${JSON.stringify(context, null, 2)}

Output UI Expected: ${displayType}
Contrainte de service : Produis un JSON ultra-propre. Pas de superflu, juste la substantifique moelle stratégique.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: "Detailed Markdown report. Focus on identity tension and status drivers." },
            summary: { type: Type.STRING, description: "Punchy one-liner for the kitchen dashboard." },
            structuredData: { 
              type: Type.OBJECT, 
              properties: {
                headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                rows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } },
                quadrants: { 
                  type: Type.OBJECT, 
                  properties: {
                    q1: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.STRING } } } },
                    q2: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.STRING } } } },
                    q3: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.STRING } } } },
                    q4: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.STRING } } } }
                  }
                },
                ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                steps: { type: Type.ARRAY, items: { type: Type.STRING } },
                overallScore: { type: Type.NUMBER },
                metrics: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT, 
                    properties: { label: { type: Type.STRING }, score: { type: Type.NUMBER }, advice: { type: Type.STRING } } 
                  } 
                }
              }
            }
          },
          required: ['content', 'summary']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error(`Empty service from node ${role}`);
    
    try {
      return JSON.parse(text);
    } catch (e) {
      const cleaned = text.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
      return JSON.parse(cleaned);
    }
  } catch (err) {
    console.error(`Kitchen Incident [${role}]:`, err);
    throw err;
  }
};

// --- Top Chef UI Components ---

const TableRenderer = ({ data }: { data: any }) => (
  <div className="overflow-x-auto rounded-[32px] border border-emerald-500/20 bg-emerald-950/80 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
    <table className="w-full text-left text-sm">
      <thead className="bg-emerald-900/60 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
        <tr>
          {data?.headers?.map((h: string, i: number) => (
            <th key={i} className="px-8 py-6 border-b border-emerald-800/40">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-emerald-800/20">
        {data?.rows?.map((row: any[], i: number) => (
          <tr key={i} className="hover:bg-emerald-500/5 transition-all group">
            {row.map((cell, j) => (
              <td key={j} className="px-8 py-5 text-emerald-100 italic group-hover:text-amber-400 transition-colors font-light">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const MatrixRenderer = ({ data }: { data: any }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    {data?.quadrants && Object.entries(data.quadrants).map(([key, quad]: any) => (
      <div key={key} className="glass p-10 rounded-[56px] border-emerald-500/10 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-700">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent group-hover:via-amber-400 transition-all" />
        <h5 className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-8 flex items-center gap-3">
          <FlaskConical className="w-4 h-4 text-amber-500" /> {quad?.label || "Quadrant Psychologique"}
        </h5>
        <ul className="space-y-4">
          {quad?.items?.map((item: string, i: number) => (
            <li key={i} className="text-base text-emerald-100 italic flex gap-5 leading-relaxed font-light">
              <span className="text-amber-500/30 font-mono text-xs">#{i+1}</span> {item}
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

const RecipeRenderer = ({ data }: { data: any }) => (
  <div className="space-y-12 animate-in slide-in-from-bottom-12 duration-1000">
    <div className="p-12 bg-gradient-to-br from-emerald-900/20 to-emerald-950/40 rounded-[64px] border border-emerald-500/20 shadow-3xl relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px]" />
      <h5 className="flex items-center gap-4 text-amber-500 font-black text-[12px] uppercase tracking-[0.5em] mb-10">
        <Utensils className="w-6 h-6" /> Ingrédients du Business Model
      </h5>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-16">
        {data?.ingredients?.map((ing: string, i: number) => (
          <li key={i} className="flex gap-5 text-lg text-emerald-100 italic border-b border-emerald-800/30 pb-4 group">
            <Check className="w-5 h-5 text-emerald-500 group-hover:scale-125 transition-all" /> {ing}
          </li>
        ))}
      </ul>
    </div>
    <div className="space-y-8">
      <h5 className="text-emerald-800 font-black text-[11px] uppercase tracking-[0.4em] px-8">Préparation & Dressage Funnel</h5>
      <div className="space-y-5">
        {data?.steps?.map((step: string, i: number) => (
          <div key={i} className="flex gap-10 p-10 glass rounded-[48px] border-emerald-500/5 group hover:bg-emerald-900/40 transition-all duration-700">
            <div className="w-16 h-16 rounded-[28px] bg-emerald-950/80 flex items-center justify-center font-serif text-3xl text-amber-500 border border-emerald-800/50 shadow-2xl group-hover:border-amber-400 transition-all shrink-0">
              {i + 1}
            </div>
            <p className="text-xl text-emerald-100 font-light leading-relaxed self-center italic">{step}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ScoreRenderer = ({ data }: { data: any }) => (
  <div className="space-y-12 text-center animate-in zoom-in duration-1000">
    <div className="flex justify-center gap-6 py-12">
      {[1, 2, 3].map((star) => (
        <Star 
          key={star} 
          className={`w-24 h-24 ${star <= (data?.overallScore || 3) ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.6)] animate-bounce' : 'text-emerald-950'} transition-all`}
          style={{ animationDelay: `${star * 250}ms` }}
        />
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {data?.metrics?.map((metric: any, i: number) => (
        <div key={i} className="glass p-10 rounded-[48px] border-emerald-500/10 space-y-6 group hover:scale-105 transition-all duration-500 bg-emerald-950/40">
           <Gauge className="w-10 h-10 text-emerald-400 mx-auto group-hover:text-amber-400 transition-colors" />
           <p className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-800">{metric.label}</p>
           <div className="text-5xl font-serif italic text-white">{metric.score}/10</div>
           <p className="text-sm text-emerald-600 italic leading-relaxed font-medium">{metric.advice}</p>
        </div>
      ))}
    </div>
  </div>
);

// --- Main Project Builder ---

const TopChefApp = () => {
  const [activeView, setActiveView] = useState<ViewType>('landing');
  const [sessions, setSessions] = useState<ProjectSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [offerInput, setOfferInput] = useState('');
  const [isCooking, setIsCooking] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId), [sessions, activeSessionId]);

  useEffect(() => {
    const saved = localStorage.getItem('topchef_pocket_master_v2');
    if (saved) setSessions(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('topchef_pocket_master_v2', JSON.stringify(sessions));
  }, [sessions]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-15));
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setActiveView('landing');
    }
  };

  const runPocketFlow = async () => {
    if (!input.trim() || isCooking) return;
    setIsCooking(true);
    setError(null);
    setLogs(['[Command] Activation du PocketFlow AsyncParallelBatchFlow Cluster.']);

    const newSessionId = Math.random().toString(36).substr(2, 9);
    const newSession: ProjectSession = {
      id: newSessionId,
      projectName: input.slice(0, 30).trim() + (input.length > 30 ? '...' : ''),
      rawInput: input,
      offerDetails: offerInput,
      artifacts: [],
      status: 'running',
      timestamp: Date.now()
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    setActiveView('runner');

    try {
      // 1. EXTRACTOR (SEQUENTIAL)
      addLog('Node: Extractor -> Parsing raw text into strict evidence schema.');
      const res1 = await callPocketFlowAgent(
        'Extractor', 
        'Parses raw inputs (sales pages, emails) into a strict YAML-like evidence structure. Decouple fact extraction from psychological profiling. Output: table.', 
        'table', 
        { input, offer: offerInput }
      );
      const art1: Artifact = { id: 'art-1', role: 'Extractor', title: 'Factual Evidence Map', content: res1.content, summary: res1.summary, status: 'served', version: 1, displayType: 'table', structuredData: res1.structuredData };
      setSessions(prev => prev.map(s => s.id === newSessionId ? { ...s, artifacts: [...s.artifacts, art1] } : s));

      // 2. PARALLEL PHASE (Nodes 2-4)
      addLog('Parallel Batch Phase: Involving Profiler, CopyStrategist, and BizArchitect concurrently.');
      const [res2, res3, res4] = await Promise.all([
        callPocketFlowAgent(
          'Profiler', 
          'Reverse-engineer customer psychology based on actual business evidence. Detect identity tensions, deep purchasing drivers (ego, risk, validation). Shift to Psychological Dynamic Avatars. Output: matrix.', 
          'matrix', 
          { evidence: res1.content }
        ),
        callPocketFlowAgent(
          'Copywriter', 
          'Design persuasion logic and dynamic messaging hooks grounded in inferred status-drivers. Output: markdown.', 
          'markdown', 
          { evidence: res1.content, avatar_hints: 'Psychological Dynamic focus' }
        ),
        callPocketFlowAgent(
          'Architect', 
          'Business model optimization. Structure the offer to resolve specific customer identity tensions found in evidence. Output: recipe_card.', 
          'recipe_card', 
          { evidence: res1.content, offer_details: offerInput }
        )
      ]);

      const art2: Artifact = { id: 'art-2', role: 'Profiler', title: 'Psychological Profile', content: res2.content, summary: res2.summary, status: 'served', version: 1, displayType: 'matrix', structuredData: res2.structuredData };
      const art3: Artifact = { id: 'art-3', role: 'Copywriter', title: 'Persuasion Architecture', content: res3.content, summary: res3.summary, status: 'served', version: 1, displayType: 'markdown' };
      const art4: Artifact = { id: 'art-4', role: 'Architect', title: 'Business Design Plan', content: res4.content, summary: res4.summary, status: 'served', version: 1, displayType: 'recipe_card', structuredData: res4.structuredData };
      
      setSessions(prev => prev.map(s => s.id === newSessionId ? { ...s, artifacts: [...s.artifacts, art2, art3, art4] } : s));

      // 3. JUDGE & CONVERGENCE
      addLog('Node: Judge -> Pipeline convergence, quality scoring, and final rendering.');
      const res5 = await callPocketFlowAgent(
        'Judge', 
        'Enforce high quality standards and valid YAML/Markdown contracts. Generate final Michelin 3* score card and synthesis report.', 
        'score_card', 
        { state: [res1, res2, res3, res4] }
      );
      const art5: Artifact = { id: 'art-5', role: 'Judge', title: 'Rapport Stratégique 3*', content: res5.content, summary: res5.summary, status: 'served', version: 1, displayType: 'score_card', structuredData: res5.structuredData };
      
      setSessions(prev => prev.map(s => s.id === newSessionId ? { 
        ...s, 
        artifacts: [...s.artifacts, art5], 
        status: 'completed',
        score: res5.structuredData?.overallScore || 3
      } : s));

      addLog('Service converged. Dossier Ready for Execution.');
    } catch (err: any) {
      console.error(err);
      setError("Incident Cluster PocketFlow : " + (err.message || "Interruption Node."));
      addLog('CRITICAL: Pipeline convergence error.');
    } finally {
      setIsCooking(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#00100c] font-sans overflow-hidden relative">
      <div className="noise" />
      
      {/* Sidebar */}
      <aside className="w-80 border-r border-emerald-900/30 bg-[#000806] flex flex-col z-50">
        <div className="p-10 flex items-center gap-5 border-b border-emerald-900/20">
          <div className="w-16 h-16 bg-emerald-600 rounded-[28px] flex items-center justify-center text-white shadow-3xl shadow-emerald-500/20 shiny-edge border border-emerald-500/30 group-hover:rotate-6 transition-all">
            <ChefHat className="w-9 h-9" />
          </div>
          <div>
            <span className="font-serif italic text-2xl font-black tracking-tight block leading-none text-white">Top Chef <span className="text-amber-400">AI</span></span>
            <span className="text-[7px] font-black uppercase tracking-[0.4em] text-emerald-800 block mt-2">PocketFlow Engine v2.5</span>
          </div>
        </div>

        <nav className="flex-1 px-6 py-10 space-y-4 overflow-y-auto scroll-hide">
          <button 
            onClick={() => { setActiveView('landing'); setActiveSessionId(null); setSelectedArtifact(null); }}
            className={`w-full flex items-center gap-4 px-6 py-5 rounded-[28px] transition-all border ${activeView === 'landing' && !activeSessionId ? 'bg-emerald-600/10 text-emerald-300 border-emerald-500/30 shadow-2xl' : 'text-emerald-900 hover:bg-emerald-900/30 border-transparent hover:text-emerald-400'}`}
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Nouvelle Commande</span>
          </button>
          
          <div className="pt-10">
            <h3 className="text-[9px] font-black uppercase text-emerald-950 tracking-[0.4em] mb-6 px-6">Brigade Ledger</h3>
            {sessions.map(session => (
              <div 
                key={session.id}
                onClick={() => { setActiveSessionId(session.id); setActiveView('runner'); setSelectedArtifact(null); }}
                className={`group flex items-center justify-between p-5 rounded-[24px] cursor-pointer transition-all border mb-4 ${activeSessionId === session.id ? 'bg-emerald-800/40 border-emerald-500/40 shadow-xl' : 'hover:bg-emerald-900/20 border-transparent'}`}
              >
                <div className="truncate flex items-center gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full ${session.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-amber-500 animate-pulse'}`} />
                  <span className={`text-[13px] font-bold truncate ${activeSessionId === session.id ? 'text-emerald-400' : 'text-emerald-900 group-hover:text-emerald-500'}`}>{session.projectName}</span>
                </div>
                <button onClick={(e) => deleteSession(session.id, e)} className="opacity-0 group-hover:opacity-100 p-2 text-emerald-950 hover:text-red-400 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </nav>

        <div className="p-8 mt-auto border-t border-emerald-900/10">
          <div className="p-6 bg-emerald-950/40 rounded-[32px] border border-emerald-900/30 space-y-3">
            <div className="flex items-center gap-3 text-[8px] font-black uppercase text-emerald-800 tracking-[0.3em]">
              <Workflow className="w-4 h-4" /> System Health
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400">Node Cluster: Sync</span>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Theatre */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-br from-[#022c22] to-[#000806]">
        <header className="h-28 border-b border-emerald-900/20 glass flex items-center justify-between px-16 z-40 shrink-0">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3 px-5 py-2 bg-emerald-900/40 border border-emerald-800/50 rounded-full text-[10px] font-black text-emerald-600 uppercase tracking-widest">
               <Binary className="w-4 h-4" /> Node State: Concurrent
             </div>
             {isCooking && (
               <div className="flex items-center gap-4 px-5 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-black text-amber-500 uppercase tracking-widest animate-pulse shadow-xl">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Async Parallel Batch
               </div>
             )}
          </div>
          <div className="flex items-center gap-10">
            <button className="text-emerald-900 hover:text-emerald-400 transition-all font-mono text-[11px] uppercase tracking-widest">Protocol Documentation</button>
            <div className="h-10 w-[1px] bg-emerald-900/30" />
            <button className="p-3 text-emerald-900 hover:text-white transition-all"><Globe className="w-7 h-7" /></button>
            <button className="p-3 text-emerald-900 hover:text-amber-500 transition-all"><Zap className="w-7 h-7" /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scroll-hide relative">
          {activeView === 'landing' && (
            <div className="max-w-6xl mx-auto px-16 py-36 space-y-28 text-center animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <div className="space-y-10">
                <div className="inline-flex items-center gap-4 px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
                  <Boxes className="w-5 h-5 text-amber-500" />
                  <span className="text-[11px] font-black uppercase tracking-[0.5em]">Modular Multi-Agent Pipeline</span>
                </div>
                <h1 className="text-[130px] font-serif italic text-white leading-[0.8] tracking-tighter shadow-emerald-500/20">
                   Avatar <br /> <span className="text-gradient-gold">Reverse Engine</span>.
                </h1>
                <p className="text-emerald-600/60 text-3xl max-w-3xl mx-auto leading-relaxed font-light italic">
                  "Reverse-engineer customer psychology from actual business data. PocketFlow isolates facts from inference for bias-free, 3-star strategic assets."
                </p>
              </div>

              <div className="glass p-5 rounded-[72px] max-w-4xl mx-auto shiny-edge border-emerald-500/10 shadow-[0_0_100px_rgba(16,185,129,0.05)]">
                <div className="bg-[#000d0a] rounded-[56px] p-12 space-y-12 shadow-inner border border-emerald-900/40">
                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Input RAW sales copy, email scripts, or product descriptions..."
                    className="w-full h-64 bg-transparent border-none focus:ring-0 p-8 text-3xl font-serif italic text-emerald-100 placeholder-emerald-900/10 resize-none scroll-hide"
                  />
                  <div className="flex flex-col md:flex-row items-center gap-8 pt-10 border-t border-emerald-900/20">
                    <div className="flex-1 w-full relative group">
                       <Target className="absolute left-8 top-1/2 -translate-y-1/2 w-7 h-7 text-emerald-900 group-focus-within:text-amber-500 transition-colors" />
                       <input 
                        type="text"
                        value={offerInput}
                        onChange={(e) => setOfferInput(e.target.value)}
                        placeholder="Core Offer & Price Point"
                        className="w-full bg-emerald-950/60 border border-emerald-900/60 rounded-[32px] pl-20 pr-10 py-6 text-base font-bold text-emerald-100 outline-none focus:border-amber-500/50 transition-all shadow-inner"
                      />
                    </div>
                    <button 
                      onClick={runPocketFlow}
                      disabled={!input.trim() || isCooking}
                      className="w-full md:w-auto px-16 py-7 bg-emerald-500 text-emerald-950 rounded-[36px] font-black uppercase tracking-[0.3em] hover:bg-emerald-400 hover:scale-[1.04] active:scale-95 transition-all shadow-3xl disabled:opacity-10 flex items-center justify-center gap-5"
                    >
                      {isCooking ? <RefreshCw className="w-8 h-8 animate-spin" /> : <Send className="w-8 h-8" />}
                      Start Forge
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-16 pb-20">
                <FeatureCard icon={<Share2 className="w-7 h-7 text-amber-500" />} title="Parallel Processing" desc="Decoupled extraction & deduction nodes" />
                <FeatureCard icon={<Fingerprint className="w-7 h-7 text-emerald-400" />} title="Dynamic Profiling" desc="Psychological drivers vs static demographics" />
                <FeatureCard icon={<Award className="w-7 h-7 text-emerald-500" />} title="Michelin Grading" desc="Automated quality control convergence" />
              </div>
            </div>
          )}

          {activeView === 'runner' && activeSession && (
            <div className="max-w-7xl mx-auto px-16 py-24 grid grid-cols-12 gap-16">
              {/* Monitoring Cluster */}
              <div className="col-span-12 lg:col-span-4 space-y-10">
                <div className="glass p-12 rounded-[64px] space-y-12 sticky top-10 shadow-3xl border-emerald-900/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Workflow className="w-20 h-20 text-emerald-500" />
                  </div>
                  <div className="space-y-5">
                    <h3 className="text-5xl font-serif italic text-white leading-tight tracking-tighter">{activeSession.projectName}</h3>
                    <div className="flex items-center gap-4">
                       {activeSession.score && (
                         <div className="flex gap-1.5">
                           {Array.from({length: activeSession.score}).map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                         </div>
                       )}
                       <span className="text-emerald-800 text-[11px] font-black uppercase tracking-[0.4em]">Node Cluster Access</span>
                    </div>
                  </div>

                  <div className="space-y-8 pt-8 border-t border-emerald-900/20">
                    <p className="text-[11px] font-black uppercase text-emerald-900 tracking-[0.5em]">Graph Orchestration</p>
                    <div className="flex flex-col gap-5">
                       <WorkflowNode label="Extractor [Fact Node]" status={activeSession.artifacts.some(a => a.role === 'Extractor') ? 'served' : 'pending'} />
                       <div className="flex justify-center -my-3"><ArrowDown className="w-5 h-5 text-emerald-950" /></div>
                       <div className="grid grid-cols-3 gap-3">
                          <WorkflowNode small label="Profiler" status={activeSession.artifacts.some(a => a.role === 'Profiler') ? 'served' : 'pending'} />
                          <WorkflowNode small label="Copy" status={activeSession.artifacts.some(a => a.role === 'Copywriter') ? 'served' : 'pending'} />
                          <WorkflowNode small label="Architect" status={activeSession.artifacts.some(a => a.role === 'Architect') ? 'served' : 'pending'} />
                       </div>
                       <div className="flex justify-center -my-3"><ArrowDown className="w-5 h-5 text-emerald-950" /></div>
                       <WorkflowNode label="Judge [Convergence]" status={activeSession.artifacts.some(a => a.role === 'Judge') ? 'served' : 'pending'} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-emerald-900/30 pb-5">
                      <span className="text-[11px] font-black text-emerald-800 uppercase tracking-[0.4em]">Shared State Logs</span>
                      <Terminal className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div className="space-y-3 font-mono text-[11px] text-emerald-500/70 bg-[#000a08] p-8 rounded-[40px] border border-emerald-900/50 shadow-inner max-h-[350px] overflow-y-auto scroll-hide">
                      {logs.map((log, i) => <div key={i} className="animate-in slide-in-from-left-6 duration-500">{log}</div>)}
                      {isCooking && <div className="text-amber-500 animate-pulse mt-6 flex items-center gap-4"><RefreshCw className="w-4 h-4 animate-spin" /> Batch processing AsyncNodes...</div>}
                    </div>
                  </div>

                  {error && (
                    <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-[40px] flex gap-5 text-red-400 items-start shadow-inner">
                      <AlertCircle className="w-6 h-6 shrink-0 mt-1" />
                      <p className="text-[13px] font-bold leading-relaxed">{error}</p>
                    </div>
                  )}

                  <div className="pt-10">
                    <button 
                      onClick={runPocketFlow}
                      disabled={isCooking || activeSession.status === 'completed'}
                      className="w-full py-7 bg-emerald-800 text-white rounded-[36px] font-black uppercase tracking-[0.3em] hover:bg-emerald-700 transition-all shadow-2xl disabled:opacity-5 flex items-center justify-center gap-5 border border-emerald-700/50"
                    >
                      <RefreshCw className={`w-6 h-6 ${isCooking ? 'animate-spin' : ''}`} />
                      {isCooking ? 'Nodes Working...' : 'Relaunch Cluster'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Artifacts - Kitchen View */}
              <div className="col-span-12 lg:col-span-8 flex flex-col gap-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {activeSession.artifacts.map((art, i) => (
                    <div 
                      key={art.id}
                      onClick={() => setSelectedArtifact(art)}
                      className="artifact-card glass rounded-[64px] p-12 space-y-10 flex flex-col shiny-edge border-emerald-950 hover:border-amber-500/40 hover:bg-emerald-900/30 transition-all cursor-pointer group relative overflow-hidden animate-in zoom-in-90 duration-1000"
                      style={{ animationDelay: `${i * 150}ms` }}
                    >
                      <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-500/10 blur-[120px] opacity-0 group-hover:opacity-100 transition-all duration-1000" />
                      
                      <div className="flex items-center justify-between relative z-10">
                        <div className="w-20 h-20 rounded-[28px] bg-emerald-950/80 flex items-center justify-center text-emerald-400 border border-emerald-800/40 shadow-3xl group-hover:bg-amber-500 group-hover:text-emerald-950 transition-all duration-700 group-hover:rotate-12 group-hover:scale-110">
                          {art.displayType === 'table' && <TableIcon className="w-10 h-10" />}
                          {art.displayType === 'matrix' && <Columns className="w-10 h-10" />}
                          {art.displayType === 'recipe_card' && <Utensils className="w-10 h-10" />}
                          {art.displayType === 'score_card' && <Award className="w-10 h-10" />}
                          {art.displayType === 'markdown' && <FileText className="w-10 h-10" />}
                        </div>
                        <div className="text-right">
                           <span className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.4em] block mb-2">OUTPUT_NODE_0{i+1}</span>
                           <div className="px-4 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-500 uppercase tracking-widest">STATE_CONVERGED</div>
                        </div>
                      </div>
                      
                      <div className="space-y-4 relative z-10">
                        <h4 className="text-3xl font-serif italic font-bold text-white group-hover:text-amber-400 transition-colors leading-tight">{art.title}</h4>
                        <p className="text-base text-emerald-700 font-medium italic opacity-80 line-clamp-2">{art.summary}</p>
                      </div>

                      <div className="pt-10 border-t border-emerald-900/40 flex items-center justify-between text-[11px] font-black uppercase text-emerald-900 tracking-[0.4em] group-hover:text-amber-500 transition-colors relative z-10">
                        <span>Ouvrir Fiche Technique</span>
                        <ChevronRight className="w-6 h-6 group-hover:translate-x-3 transition-transform" />
                      </div>
                    </div>
                  ))}
                  
                  {isCooking && (
                    <div className="glass rounded-[64px] p-24 flex flex-col items-center justify-center text-center space-y-12 border-2 border-dashed border-emerald-900/50 animate-pulse min-h-[550px] shadow-3xl">
                       <div className="relative">
                          <div className="w-32 h-32 rounded-full border-t-2 border-amber-500 animate-spin" />
                          <ChefHat className="absolute inset-0 m-auto w-12 h-12 text-amber-500 animate-bounce" />
                       </div>
                       <div className="space-y-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.8em] text-amber-500">Pipeline Active</p>
                        <p className="text-3xl font-serif italic text-emerald-800">Dressage des Node Assets...</p>
                       </div>
                    </div>
                  )}
                </div>

                {activeSession.status === 'completed' && (
                  <div className="pt-24 flex justify-center animate-in fade-in slide-in-from-bottom-12 duration-1500">
                    <button className="px-20 py-10 bg-emerald-950/80 border border-emerald-500/20 text-emerald-400 rounded-[48px] text-[13px] font-black uppercase tracking-[0.5em] hover:bg-emerald-500 hover:text-emerald-950 transition-all flex items-center gap-6 shadow-3xl hover:scale-105 active:scale-95">
                      <Download className="w-8 h-8" /> Exporter le Dossier Michelin Final
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Artifact Drawer */}
      {selectedArtifact && (
        <>
          <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[60] animate-in fade-in duration-700" onClick={() => setSelectedArtifact(null)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-5xl bg-[#000806] border-l border-emerald-900/50 z-[70] shadow-3xl flex flex-col animate-in slide-in-from-right duration-1000 ease-out overflow-hidden">
            <header className="p-16 border-b border-emerald-900/10 glass flex justify-between items-center shrink-0 bg-[#000806]/95">
              <div className="flex items-center gap-10">
                <div className="w-24 h-24 rounded-[36px] bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-900/60 shadow-inner group">
                  {selectedArtifact.displayType === 'score_card' ? <Award className="w-12 h-12 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" /> : <Binary className="w-12 h-12" />}
                </div>
                <div>
                  <h3 className="text-6xl font-serif italic text-white leading-tight tracking-tighter">{selectedArtifact.title}</h3>
                  <p className="text-[12px] font-black uppercase tracking-[0.7em] text-emerald-900 mt-4">Station : {selectedArtifact.role} | Node Protocol</p>
                </div>
              </div>
              <button onClick={() => setSelectedArtifact(null)} className="p-5 text-emerald-900 hover:text-white transition-all hover:rotate-90">
                <X className="w-16 h-16" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-20 space-y-20 scroll-hide">
              <div className="space-y-20 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                
                {/* Visual Artifacts */}
                {selectedArtifact.displayType === 'table' && <TableRenderer data={selectedArtifact.structuredData} />}
                {selectedArtifact.displayType === 'matrix' && <MatrixRenderer data={selectedArtifact.structuredData} />}
                {selectedArtifact.displayType === 'recipe_card' && <RecipeRenderer data={selectedArtifact.structuredData} />}
                {selectedArtifact.displayType === 'score_card' && <ScoreRenderer data={selectedArtifact.structuredData} />}
                
                {/* Markdown Content */}
                <div className="p-16 bg-gradient-to-br from-emerald-950/40 to-[#000d0a] rounded-[100px] border border-emerald-900/40 space-y-16 relative overflow-hidden shadow-3xl">
                   <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                   <div className="flex items-center gap-6 text-amber-500 font-black text-[14px] uppercase tracking-[0.6em]">
                     <Terminal className="w-8 h-8" /> Rapport Stratégique de Brigade
                   </div>
                   <div className="prose prose-invert max-w-none text-emerald-100/90 font-light text-2xl leading-[1.8] italic whitespace-pre-wrap">
                     {selectedArtifact.content}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-10">
                  <StatDetail icon={<Share2 className="w-8 h-8" />} label="Orchestration Pattern" value="AsyncParallelFlow" />
                  <StatDetail icon={<ShieldCheck className="w-8 h-8" />} label="Data Compliance" value="PocketFlow YAML-Strict" />
                </div>
              </div>
            </div>

            <footer className="p-16 border-t border-emerald-900/20 glass flex gap-10 shrink-0 bg-[#000806]/98">
              <button className="flex-1 py-8 bg-emerald-950/80 border border-emerald-900/60 rounded-[40px] text-[13px] font-black uppercase tracking-[0.5em] text-emerald-700 hover:text-emerald-400 hover:border-emerald-500 transition-all flex items-center justify-center gap-5">
                <ClipboardList className="w-7 h-7" /> Copier le Dataset Brut
              </button>
              <button className="flex-1 py-8 bg-emerald-500 text-emerald-950 rounded-[40px] text-[13px] font-black uppercase tracking-[0.5em] hover:bg-emerald-400 hover:scale-[1.03] transition-all flex items-center justify-center gap-5 shadow-3xl">
                <Check className="w-7 h-7" /> Valider l'Artéfact 3*
              </button>
            </footer>
          </div>
        </>
      )}
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="glass p-12 rounded-[60px] space-y-6 text-left border-emerald-500/5 group hover:border-amber-500/30 transition-all duration-700 bg-emerald-950/10 shadow-3xl hover:scale-105">
    <div className="w-16 h-16 rounded-[24px] bg-emerald-900/40 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-emerald-950 transition-all duration-700 group-hover:rotate-12 group-hover:scale-110 shadow-inner">
      {icon}
    </div>
    <div className="space-y-3">
      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-800">{title}</p>
      <p className="text-xl font-bold text-emerald-100 italic leading-tight">{desc}</p>
    </div>
  </div>
);

const StatDetail = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="glass p-12 rounded-[56px] border-emerald-500/10 flex items-center gap-10 group hover:border-amber-500/20 transition-all duration-700">
    <div className="w-20 h-20 rounded-[28px] bg-emerald-950 flex items-center justify-center text-emerald-500 group-hover:text-amber-500 transition-all border border-emerald-900/50 shadow-inner">
      {icon}
    </div>
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.5em] text-emerald-950">{label}</p>
      <p className="text-2xl font-serif italic text-emerald-100">{value}</p>
    </div>
  </div>
);

const WorkflowNode = ({ label, status, small = false }: { label: string, status: 'pending' | 'served', small?: boolean }) => (
  <div className={`p-6 rounded-3xl border transition-all flex items-center justify-between ${status === 'served' ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300 shadow-xl' : 'bg-black/40 border-emerald-950 text-emerald-900'}`}>
     <span className={`${small ? 'text-[9px]' : 'text-[11px]'} font-black uppercase tracking-[0.4em]`}>{label}</span>
     {status === 'served' ? <Check className="w-5 h-5" /> : <div className="w-3 h-3 rounded-full bg-emerald-950 border border-emerald-900 animate-pulse" />}
  </div>
);

const Fingerprint = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.02-.26 3H9c-.33 0-.64.13-.87.35l-1.48 1.48C6.4 17.08 6.2 17.52 6.2 18V21h12.6l1-1h-2.6v-2c0-.5-.2-1-.6-1.4L15.1 15.1c-.2-.2-.5-.35-.9-.35h-.7c-.1-.9-.2-1.9-.2-2.9 0-1.1-.9-2-2-2z"/>
    <path d="M12 2a10 10 0 0 1 10 10c0 1.05-.1 2.08-.28 3.08l-1.05-1.05C20.9 13.3 21 12.65 21 12a9 9 0 0 0-18 0c0 .65.1 1.3.33 2.03l-1.05 1.05C2.1 14.08 2 13.05 2 12A10 10 0 0 1 12 2z"/>
    <path d="M12 6a6 6 0 0 1 6 6c0 .7-.1 1.4-.3 2.1l-1.2-1.2c.1-.3.2-.6.2-.9a4 4 0 0 0-8 0c0 .3.1.6.2.9L7.7 14.1C7.5 13.4 7.4 12.7 7.4 12a6 6 0 0 1 6-6z"/>
  </svg>
);

createRoot(document.getElementById('root')!).render(<TopChefApp />);
