
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from '@google/genai';
import { 
  ChefHat, Plus, Zap, Utensils, ClipboardList, 
  ChevronRight, RefreshCw, Send, Target, ShieldCheck, 
  Globe, ArrowDown, FileText, Trash2, X, Star, Award, 
  Check, AlertCircle, Download, Table as TableIcon, 
  Columns, Binary, Workflow, Gauge, Terminal, Share2, 
  Boxes, Menu, Swords, Coins, Activity, Eye, Search
} from 'lucide-react';
import { ViewType, ProjectSession, Artifact, DisplayType } from './types';

// --- PocketFlow Engine Logic ---

const COST_PER_1M_TOKENS = 0.25; // Tarif indicatif Gemini 2.0 Flash

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const callPocketFlowAgent = async (role: string, mission: string, displayType: DisplayType, context: any) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      // Fix: Use standard model name from guidelines
      model: 'gemini-3-flash-preview',
      contents: `Tu es un Node Agent PocketFlow spécialisé (Pattern: AsyncParallelBatchFlow).
Rôle de la Brigade : ${role}
Mission Critique (Méthode de Rétro-Ingénierie Avancée) : 
${mission}

Shared Storage (Context):
${JSON.stringify(context, null, 2)}

Tu travailles comme un ANALYSTE COMPORTEMENTAL : tu déduis la psychologie uniquement à partir des traces (textes, offres, prix, structures).
Output UI Expected: ${displayType}
Contrainte : Produis un JSON propre. Le champ 'content' doit être extrêmement LONG, DÉTAILLÉ et EXHAUSTIF (format Markdown). Ne sois pas superficiel.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: "Detailed Markdown report. Exhaustive analysis." },
            summary: { type: Type.STRING, description: "Punchy executive summary." },
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

    // Fix: Access .text property directly as per guidelines
    const text = response.text || "";
    const estimatedTokens = Math.ceil(text.length / 3); // Estimation simple
    
    try {
      const data = JSON.parse(text);
      return { ...data, tokens: estimatedTokens };
    } catch (e) {
      const cleaned = text.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
      return { ...JSON.parse(cleaned), tokens: estimatedTokens };
    }
  } catch (err) {
    console.error(`Kitchen Incident [${role}]:`, err);
    throw err;
  }
};

// --- UI Components ---

const TableRenderer = ({ data }: { data: any }) => (
  <div className="overflow-x-auto rounded-3xl border border-emerald-500/30 bg-emerald-950/80 shadow-2xl">
    <table className="w-full text-left text-xs md:text-sm">
      <thead className="bg-emerald-900/60 text-[10px] font-black uppercase tracking-widest text-emerald-400">
        <tr>
          {data?.headers?.map((h: string, i: number) => (
            <th key={i} className="px-6 py-4 border-b border-emerald-800/40 whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-emerald-800/20">
        {data?.rows?.map((row: any[], i: number) => (
          <tr key={i} className="hover:bg-emerald-500/5 transition-all group">
            {row.map((cell: any, j: number) => (
              <td key={j} className="px-6 py-4 text-emerald-100/90 italic group-hover:text-amber-400 transition-colors font-light leading-relaxed">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const MatrixRenderer = ({ data }: { data: any }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {data?.quadrants && Object.entries(data.quadrants).map(([key, quad]: any) => (
      <div key={key} className="glass p-8 rounded-[40px] border-emerald-500/10 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-500">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-6 flex items-center gap-3">
          <Activity className="w-4 h-4 text-amber-500" /> {quad?.label || "Quadrant"}
        </h5>
        <ul className="space-y-4">
          {quad?.items?.map((item: string, i: number) => (
            <li key={i} className="text-sm md:text-base text-emerald-100 italic flex gap-4 leading-relaxed font-light">
              <span className="text-amber-500/30 font-mono text-xs mt-1">#{i+1}</span> {item}
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

const RecipeRenderer = ({ data }: { data: any }) => (
  <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
    <div className="p-8 md:p-10 bg-emerald-950/60 rounded-[40px] md:rounded-[48px] border border-emerald-500/20">
      <h5 className="flex items-center gap-4 text-amber-500 font-black text-[10px] md:text-[11px] uppercase tracking-[0.5em] mb-8">
        <Utensils className="w-5 h-5" /> Ingrédients du Business Model
      </h5>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
        {data?.ingredients?.map((ing: string, i: number) => (
          <li key={i} className="flex gap-4 text-emerald-100 italic border-b border-emerald-800/30 pb-3">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {ing}
          </li>
        ))}
      </ul>
    </div>
    <div className="space-y-6">
      <h5 className="text-emerald-700 font-black text-[9px] md:text-[10px] uppercase tracking-[0.4em] px-4">Préparation & Funnel Sequencing</h5>
      <div className="space-y-4">
        {data?.steps?.map((step: string, i: number) => (
          <div key={i} className="flex gap-6 p-8 glass rounded-[32px] border-emerald-500/10 group hover:bg-emerald-900/50 transition-all">
            <div className="w-12 h-12 rounded-[18px] bg-emerald-950 flex items-center justify-center font-serif text-2xl text-amber-500 border border-emerald-800/50 group-hover:border-amber-400 transition-all shrink-0">
              {i + 1}
            </div>
            <p className="text-lg text-emerald-100 font-light leading-relaxed italic self-center">{step}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ScoreRenderer = ({ data }: { data: any }) => (
  <div className="space-y-12 text-center animate-in zoom-in duration-700">
    <div className="flex justify-center gap-6 py-8">
      {[1, 2, 3].map((star) => (
        <Star 
          key={star} 
          className={`w-16 md:w-24 h-16 md:h-24 ${star <= (data?.overallScore || 3) ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-bounce' : 'text-emerald-950 opacity-20'}`}
          style={{ animationDelay: `${star * 200}ms` }}
        />
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {data?.metrics?.map((metric: any, i: number) => (
        <div key={i} className="glass p-8 rounded-[40px] border-emerald-500/10 space-y-4 bg-emerald-950/40">
           <Gauge className="w-10 h-10 text-emerald-400 mx-auto" />
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700">{metric.label}</p>
           <div className="text-4xl md:text-5xl font-serif italic text-white">{metric.score}/10</div>
           <p className="text-xs text-emerald-500 italic leading-relaxed font-medium">{metric.advice}</p>
        </div>
      ))}
    </div>
  </div>
);

// --- Main App Logic ---

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId), [sessions, activeSessionId]);

  useEffect(() => {
    const saved = localStorage.getItem('topchef_forge_v3');
    if (saved) setSessions(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('topchef_forge_v3', JSON.stringify(sessions));
  }, [sessions]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-20));
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
    setLogs(['[Command] Activation du Cluster Multi-Agent PocketFlow v2.5...']);

    const newSessionId = Math.random().toString(36).substr(2, 9);
    const newSession: ProjectSession = {
      id: newSessionId,
      projectName: input.slice(0, 30).trim() + (input.length > 30 ? '...' : ''),
      rawInput: input,
      offerDetails: offerInput,
      artifacts: [],
      status: 'running',
      timestamp: Date.now(),
      totalTokens: 0,
      totalCost: 0
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    setActiveView('runner');

    try {
      // STATION 1: EXTRACTOR
      addLog('Station Extractor : Mapping factuel (Promesse, Mécanisme, Preuves)...');
      const res1 = await callPocketFlowAgent(
        'Extractor', 
        'MÉTHODE: 1) Identifier promesse principale. 2) Déduire douleur initiale + désir final. 3) Extraire objections traitées. 4) Extraire preuves et structure d\'offre factuelle. Output: table.', 
        'table', 
        { input, offer: offerInput }
      );
      // Fix: Call updateSession with artifacts as an array to resolve TS errors
      updateSession(newSessionId, [{ id: 'art-1', role: 'Extractor', title: 'Cartographie Factiviste', content: res1.content, summary: res1.summary, status: 'served', version: 1, displayType: 'table', structuredData: res1.structuredData, tokens: res1.tokens }]);

      // PHASE PARALLELE (2-5)
      addLog('Phase Parallèle : Activation Profiler, Competitor, Copywriter et Architect...');
      const [res2, res3, res4, res5] = await Promise.all([
        callPocketFlowAgent(
          'Profiler', 
          'MÉTHODE: 4) Inférer peurs inavouées (ego, honte, statut). 5) Inférer croyances structurantes. 6) Construire langage client (40 phrases exactes "je me dis..."). 7) Identifier type d\'avatar psychologique. Output: matrix.', 
          'matrix', 
          { evidence: res1.content }
        ),
        callPocketFlowAgent(
          'CompetitorAnalyzer',
          'Identifier les mentions de concurrents ou les langages comparatifs. Détecter comment l\'offre se différencie des rivaux nommés ou impliqués. Output: table.',
          'table',
          { evidence: res1.content, input }
        ),
        callPocketFlowAgent(
          'Copywriter', 
          'MÉTHODE: 8) Proposer 7 angles copywriting + hooks + claims testables. Bypasser les barrières psychologiques détectées. Output: markdown.', 
          'markdown', 
          { evidence: res1.content, avatar: 'Psychological Dynamic Focus' }
        ),
        callPocketFlowAgent(
          'Architect', 
          'MÉTHODE: 9) Proposer optimisation business model (offre core, upsells, garantie, friction killers). Aligné sur les peurs inavouées. Output: recipe_card.', 
          'recipe_card', 
          { evidence: res1.content, offer_details: offerInput }
        )
      ]);

      // Fix: Group concurrent artifacts into a single array for updateSession
      updateSession(newSessionId, [
        { id: 'art-2', role: 'Profiler', title: 'Psycho-Profil & Tensions', content: res2.content, summary: res2.summary, status: 'served', version: 1, displayType: 'matrix', structuredData: res2.structuredData, tokens: res2.tokens },
        { id: 'art-3', role: 'CompetitorAnalyzer', title: 'Intelligence Marché', content: res3.content, summary: res3.summary, status: 'served', version: 1, displayType: 'table', structuredData: res3.structuredData, tokens: res3.tokens },
        { id: 'art-4', role: 'Copywriter', title: 'Architecture de Persuasion', content: res4.content, summary: res4.summary, status: 'served', version: 1, displayType: 'markdown', tokens: res4.tokens },
        { id: 'art-5', role: 'Architect', title: 'Blueprint Business Design', content: res5.content, summary: res5.summary, status: 'served', version: 1, displayType: 'recipe_card', structuredData: res5.structuredData, tokens: res5.tokens }
      ]);

      // STATION 6: JUDGE
      addLog('Station Judge : Synthèse du Dossier de Prestige Michelin 3*...');
      const res6 = await callPocketFlowAgent(
        'Judge', 
        'Rédige un DOSSIER DE PRESTIGE STRATÉGIQUE exhaustif (sections A-F). Tu DOIS synthétiser les 5 agents précédents. Inclus : Avatar Reconstruit, Matrice Peurs/Désirs, Customer Language (40 phrases), Copy Map, BM Reco, Checklist 7 jours. Ton rapport doit être volumineux et faire preuve d\'une autorité michelin. Output: score_card.', 
        'score_card', 
        { state: [res1, res2, res3, res4, res5] }
      );
      // Fix: Call updateSession with array and trailing options to resolve TS errors
      updateSession(newSessionId, 
        [{ id: 'art-6', role: 'Judge', title: 'Dossier Master Prestige', content: res6.content, summary: res6.summary, status: 'served', version: 1, displayType: 'score_card', structuredData: res6.structuredData, tokens: res6.tokens }],
        true, res6.structuredData?.overallScore || 3
      );

      addLog('Pipeline complète. Dossier servi chaud.');
    } catch (err: any) {
      console.error(err);
      setError("Incident Brigade : " + (err.message || "Interruption Node."));
    } finally {
      setIsCooking(false);
    }
  };

  // Fix: Move rest parameter logic to simple array input to ensure TypeScript compliance (rest must be last)
  const updateSession = (id: string, newArtifacts: Artifact[], isDone = false, score?: number) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== id) return s;
      const filtered = newArtifacts;
      const updatedArtifacts = [...s.artifacts, ...filtered];
      const totalTokens = updatedArtifacts.reduce((acc, a) => acc + (a.tokens || 0), 0);
      const totalCost = (totalTokens / 1000000) * COST_PER_1M_TOKENS;
      return { 
        ...s, 
        artifacts: updatedArtifacts, 
        status: isDone ? 'completed' : s.status,
        score: score || s.score,
        totalTokens,
        totalCost
      };
    }));
  };

  const exportToMarkdown = () => {
    if (!activeSession) return;
    const sorted = [...activeSession.artifacts].sort((a, b) => {
      const order: Record<string, number> = { Extractor: 1, Profiler: 2, CompetitorAnalyzer: 3, Copywriter: 4, Architect: 5, Judge: 6 };
      return (order[a.role] || 99) - (order[b.role] || 99);
    });
    
    let md = `# DOSSIER DE PRESTIGE STRATÉGIQUE : ${activeSession.projectName.toUpperCase()}\n`;
    md += `*Généré par Top Chef AI le ${new Date(activeSession.timestamp).toLocaleDateString()}*\n`;
    md += `*Coût estimé : ${activeSession.totalCost?.toFixed(4)}€*\n\n---\n\n`;
    
    sorted.forEach(art => {
      md += `## [STATION: ${art.role}] ${art.title}\n`;
      md += `> ${art.summary}\n\n`;
      md += `${art.content}\n\n---\n\n`;
    });
    
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TOP_CHEF_DOSSIER_${activeSession.projectName.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#00100c] font-sans overflow-hidden relative">
      <div className="noise" />
      
      {/* Mobile Nav */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-emerald-900/40 bg-[#000806] z-[60]">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-emerald-500" />
          <span className="font-serif italic text-lg font-black text-white">Top Chef <span className="text-amber-400">AI</span></span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-emerald-500"><Menu /></button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-80 border-r border-emerald-900/30 bg-[#000806] flex flex-col z-50 transition-transform duration-500 md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 hidden md:flex items-center gap-5 border-b border-emerald-900/20">
          <div className="w-16 h-16 bg-emerald-600 rounded-[28px] flex items-center justify-center text-white shadow-2xl border border-emerald-500/30">
            <ChefHat className="w-9 h-9" />
          </div>
          <div>
            <span className="font-serif italic text-2xl font-black text-white">Top Chef <span className="text-amber-400">AI</span></span>
            <span className="text-[7px] font-black uppercase tracking-[0.4em] text-emerald-800 block mt-2">PocketFlow Engine v2.5</span>
          </div>
        </div>

        <nav className="flex-1 px-6 py-10 space-y-4 overflow-y-auto scroll-hide">
          <button 
            onClick={() => { setActiveView('landing'); setActiveSessionId(null); setSelectedArtifact(null); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-4 px-6 py-5 rounded-[24px] border transition-all ${activeView === 'landing' && !activeSessionId ? 'bg-emerald-600/10 text-emerald-300 border-emerald-500/40 shadow-xl' : 'text-emerald-900 border-transparent hover:bg-emerald-900/20 hover:text-emerald-400'}`}
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Nouveau Dossier</span>
          </button>
          
          <div className="pt-10">
            <h3 className="text-[9px] font-black uppercase text-emerald-950 tracking-[0.4em] mb-6 px-6">Brigade Ledger</h3>
            {sessions.map(session => (
              <div 
                key={session.id}
                onClick={() => { setActiveSessionId(session.id); setActiveView('runner'); setSidebarOpen(false); }}
                className={`group flex items-center justify-between p-5 rounded-[20px] cursor-pointer transition-all border mb-3 ${activeSessionId === session.id ? 'bg-emerald-800/40 border-emerald-500/40' : 'hover:bg-emerald-900/20 border-transparent'}`}
              >
                <div className="truncate flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${session.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  <span className={`text-[13px] font-bold truncate ${activeSessionId === session.id ? 'text-emerald-300' : 'text-emerald-900'}`}>{session.projectName}</span>
                </div>
                <button onClick={(e) => deleteSession(session.id, e)} className="opacity-0 group-hover:opacity-100 p-2 text-emerald-950 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </nav>

        <div className="p-8 mt-auto border-t border-emerald-900/10 hidden md:block">
          <div className="p-6 bg-emerald-950/40 rounded-[32px] border border-emerald-900/30 space-y-4">
            <div className="flex items-center justify-between">
               <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Coût Total</span>
               <div className="flex items-center gap-2 text-amber-500">
                  <Coins className="w-4 h-4" />
                  <span className="text-lg font-serif italic">{sessions.reduce((acc, s) => acc + (s.totalCost || 0), 0).toFixed(4)}€</span>
               </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Theatre */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-br from-[#022c22] to-[#000806]">
        <header className="h-28 border-b border-emerald-900/20 glass hidden md:flex items-center justify-between px-16 z-40 shrink-0">
          <div className="flex items-center gap-8">
             <div className="flex items-center gap-3 px-5 py-2 bg-emerald-900/40 border border-emerald-800/50 rounded-full text-[10px] font-black text-emerald-600 uppercase tracking-widest">
               <Binary className="w-4 h-4" /> 6-Agent Parallel
             </div>
             {isCooking && (
               <div className="flex items-center gap-4 px-5 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-[10px] font-black text-amber-500 uppercase tracking-widest animate-pulse shadow-xl">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Batch Processing
               </div>
             )}
          </div>
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-4 bg-emerald-950/80 px-6 py-3 rounded-full border border-emerald-900/60">
               <Activity className="w-5 h-5 text-emerald-500" />
               <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Active Cluster</span>
            </div>
            <div className="h-10 w-[1px] bg-emerald-900/30" />
            <button className="p-3 text-emerald-900 hover:text-white transition-all"><Globe className="w-7 h-7" /></button>
            <button className="p-3 text-emerald-900 hover:text-amber-500 transition-all"><Zap className="w-7 h-7" /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scroll-hide relative">
          {activeView === 'landing' && (
            <div className="max-w-6xl mx-auto px-6 md:px-16 py-16 md:py-32 space-y-24 md:space-y-32 text-center animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <div className="space-y-10 md:space-y-12">
                <div className="inline-flex items-center gap-4 px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
                  <Boxes className="w-5 h-5 text-amber-500" />
                  <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.5em]">Multi-Agent Strategy Cluster</span>
                </div>
                <h1 className="text-[60px] md:text-[120px] font-serif italic text-white leading-[0.9] tracking-tighter shadow-emerald-500/20">
                   Avatar <br /> <span className="text-gradient-gold">Reverse Engine</span>.
                </h1>
                <p className="text-emerald-600/60 text-xl md:text-3xl max-w-3xl mx-auto leading-relaxed font-light italic">
                  "Reverse-engineer customer psychology from raw assets. PocketFlow isolates facts from deep inference for Michelin 3-star dossiers."
                </p>
              </div>

              <div className="glass p-4 md:p-6 rounded-[40px] md:rounded-[72px] max-w-4xl mx-auto border-emerald-500/10 shadow-3xl">
                <div className="bg-[#000d0a] rounded-[32px] md:rounded-[56px] p-6 md:p-14 space-y-8 md:space-y-14 shadow-inner border border-emerald-900/50">
                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Collez ici votre sales copy, emails ou script..."
                    className="w-full h-48 md:h-64 bg-transparent border-none focus:ring-0 p-4 md:p-8 text-xl md:text-3xl font-serif italic text-emerald-100 placeholder-emerald-900/10 resize-none scroll-hide"
                  />
                  <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 pt-10 border-t border-emerald-900/30">
                    <div className="flex-1 w-full relative group">
                       <Target className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 w-6 md:w-7 h-6 md:h-7 text-emerald-900 group-focus-within:text-amber-500 transition-colors" />
                       <input 
                        type="text"
                        value={offerInput}
                        onChange={(e) => setOfferInput(e.target.value)}
                        placeholder="Offre Core & Prix"
                        className="w-full bg-emerald-950/60 border border-emerald-900/60 rounded-[28px] md:rounded-[36px] pl-16 md:pl-20 pr-8 md:pr-10 py-5 md:py-6 text-sm md:text-base font-bold text-emerald-100 outline-none focus:border-amber-500/50 transition-all"
                      />
                    </div>
                    <button 
                      onClick={runPocketFlow}
                      disabled={!input.trim() || isCooking}
                      className="w-full md:w-auto px-12 md:px-16 py-5 md:py-7 bg-emerald-500 text-emerald-950 rounded-[28px] md:rounded-[40px] font-black uppercase tracking-[0.3em] hover:bg-emerald-400 hover:scale-[1.04] transition-all disabled:opacity-10 flex items-center justify-center gap-5 shadow-3xl"
                    >
                      {isCooking ? <RefreshCw className="w-8 h-8 animate-spin" /> : <Send className="w-8 h-8" />}
                      Start Forge
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'runner' && activeSession && (
            <div className="max-w-7xl mx-auto px-4 md:px-16 py-12 md:py-24 grid grid-cols-12 gap-10 md:gap-16">
              {/* Monitoring */}
              <div className="col-span-12 lg:col-span-4 space-y-10">
                <div className="glass p-10 rounded-[48px] md:rounded-[64px] space-y-10 sticky top-10 border-emerald-900/50 relative overflow-hidden shadow-2xl">
                  <div className="space-y-4">
                    <h3 className="text-3xl md:text-5xl font-serif italic text-white leading-tight tracking-tighter">{activeSession.projectName}</h3>
                    <div className="flex items-center gap-4">
                       <div className="flex gap-1">
                         {Array.from({length: activeSession.score || 0}).map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                       </div>
                       <span className="text-emerald-800 text-[10px] font-black uppercase tracking-[0.4em]">MICHELIN STATUS</span>
                    </div>
                  </div>

                  <div className="p-8 bg-emerald-950/60 rounded-[32px] border border-emerald-900/40 space-y-4">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Coût Session</span>
                       <span className="text-lg font-serif italic text-amber-500">{activeSession.totalCost?.toFixed(4)}€</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Tokens Node</span>
                       <span className="text-lg font-serif italic text-emerald-300">{(activeSession.totalTokens || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-emerald-900/30 pb-4">
                      <span className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.4em]">Terminal Brigade</span>
                      <Terminal className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div className="space-y-3 font-mono text-[10px] text-emerald-500/80 bg-[#000a08] p-6 rounded-[32px] border border-emerald-900/60 max-h-[250px] overflow-y-auto scroll-hide">
                      {logs.map((log, i) => <div key={i}>{log}</div>)}
                      {isCooking && <div className="text-amber-500 animate-pulse mt-4">Node working...</div>}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={runPocketFlow}
                      disabled={isCooking || activeSession.status === 'completed'}
                      className="w-full py-6 bg-emerald-800 text-white rounded-[32px] font-black uppercase tracking-[0.3em] hover:bg-emerald-700 transition-all shadow-xl disabled:opacity-5 border border-emerald-700/50"
                    >
                      {isCooking ? 'Nodes Working...' : 'Restart Brigade'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Artifacts */}
              <div className="col-span-12 lg:col-span-8 flex flex-col gap-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {activeSession.artifacts.map((art, i) => (
                    <div 
                      key={art.id}
                      onClick={() => setSelectedArtifact(art)}
                      className="artifact-card glass rounded-[40px] p-8 md:p-12 space-y-8 flex flex-col border-emerald-900/50 hover:border-amber-500/50 hover:bg-emerald-900/30 transition-all cursor-pointer group relative overflow-hidden animate-in zoom-in-95 duration-700 shadow-2xl"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-500/10 blur-[100px] opacity-0 group-hover:opacity-100 transition-all duration-1000" />
                      <div className="flex items-center justify-between relative z-10">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-[20px] md:rounded-[28px] bg-emerald-950/80 flex items-center justify-center text-emerald-400 border border-emerald-800/40 group-hover:bg-amber-500 group-hover:text-emerald-950 transition-all duration-700 group-hover:scale-110 shadow-2xl">
                          {art.role === 'CompetitorAnalyzer' ? <Swords className="w-8 md:w-10 h-8 md:h-10" /> : null}
                          {art.role === 'Extractor' ? <Binary className="w-8 md:w-10 h-8 md:h-10" /> : null}
                          {art.role === 'Profiler' ? <Columns className="w-8 md:w-10 h-8 md:h-10" /> : null}
                          {art.role === 'Copywriter' ? <FileText className="w-8 md:w-10 h-8 md:h-10" /> : null}
                          {art.role === 'Architect' ? <Utensils className="w-8 md:w-10 h-8 md:h-10" /> : null}
                          {art.role === 'Judge' ? <Award className="w-8 md:w-10 h-8 md:h-10" /> : null}
                        </div>
                        <div className="text-right">
                           <span className="text-[9px] font-black text-emerald-900 uppercase tracking-[0.5em] block">STATION_0{i+1}</span>
                           <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-2">SERVED</div>
                        </div>
                      </div>
                      <div className="space-y-4 relative z-10">
                        <h4 className="text-2xl md:text-3xl font-serif italic font-bold text-white group-hover:text-amber-400 transition-colors leading-tight">{art.title}</h4>
                        <p className="text-sm md:text-base text-emerald-700 font-medium italic opacity-80 line-clamp-3 leading-relaxed">{art.summary}</p>
                      </div>
                      <div className="pt-10 border-t border-emerald-900/40 flex items-center justify-between text-[10px] font-black uppercase text-emerald-900 tracking-[0.5em] group-hover:text-amber-500 transition-colors relative z-10">
                        <span>Details Node</span>
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-3 transition-transform" />
                      </div>
                    </div>
                  ))}
                  {isCooking && (
                    <div className="glass rounded-[40px] p-24 flex flex-col items-center justify-center text-center space-y-8 border-2 border-dashed border-emerald-900/40 animate-pulse min-h-[450px]">
                       <RefreshCw className="w-12 h-12 text-amber-500 animate-spin" />
                       <p className="text-2xl font-serif italic text-emerald-800">Cuisine des rapports...</p>
                    </div>
                  )}
                </div>

                {activeSession.status === 'completed' && (
                  <div className="pt-20 pb-32 flex justify-center px-4">
                    <button 
                      onClick={exportToMarkdown}
                      className="w-full md:w-auto px-10 md:px-20 py-8 md:py-10 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 rounded-[32px] md:rounded-[48px] text-[12px] md:text-[14px] font-black uppercase tracking-[0.6em] hover:bg-emerald-500 hover:text-emerald-950 transition-all flex items-center justify-center gap-8 shadow-3xl hover:scale-105"
                    >
                      <Download className="w-8 h-8" /> Exporter le Dossier Master 3*
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
          <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl z-[70] animate-in fade-in duration-500" onClick={() => setSelectedArtifact(null)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-5xl bg-[#000806] border-l border-emerald-900/40 z-[80] shadow-3xl flex flex-col animate-in slide-in-from-right duration-700 ease-out overflow-hidden">
            <header className="p-8 md:p-16 border-b border-emerald-900/10 glass flex justify-between items-center shrink-0 bg-[#000806]/98">
              <div className="flex items-center gap-6 md:gap-10">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-[24px] md:rounded-[40px] bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-900/60 shadow-2xl shrink-0">
                   {selectedArtifact.role === 'Judge' ? <Award className="w-10 md:w-14 h-10 md:h-14 text-amber-400" /> : <Binary className="w-10 md:w-14 h-10 md:h-14" />}
                </div>
                <div>
                  <h3 className="text-3xl md:text-5xl font-serif italic text-white leading-tight tracking-tighter">{selectedArtifact.title}</h3>
                  <p className="text-[10px] md:text-[13px] font-black uppercase tracking-[0.7em] text-emerald-900 mt-2">Brigade Station : {selectedArtifact.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedArtifact(null)} className="p-4 md:p-6 text-emerald-900 hover:text-white transition-all shrink-0">
                <X className="w-10 md:w-16 h-10 md:h-16" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-20 space-y-16 md:space-y-24 scroll-hide">
              <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
                
                {/* Visual Artifacts */}
                <div className="mb-16 md:mb-24">
                  {selectedArtifact.displayType === 'table' && <TableRenderer data={selectedArtifact.structuredData} />}
                  {selectedArtifact.displayType === 'matrix' && <MatrixRenderer data={selectedArtifact.structuredData} />}
                  {selectedArtifact.displayType === 'recipe_card' && <RecipeRenderer data={selectedArtifact.structuredData} />}
                  {selectedArtifact.displayType === 'score_card' && <ScoreRenderer data={selectedArtifact.structuredData} />}
                </div>
                
                {/* Markdown Content */}
                <div className="p-10 md:p-20 bg-gradient-to-br from-emerald-950/50 to-[#000d0a] rounded-[50px] md:rounded-[100px] border border-emerald-900/40 space-y-12 md:space-y-20 relative overflow-hidden shadow-3xl">
                   <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
                   <div className="flex items-center gap-6 text-amber-500 font-black text-[14px] md:text-[16px] uppercase tracking-[0.6em]">
                     <Terminal className="w-7 md:w-9 h-7 md:h-9" /> Rapport Stratégique de Brigade
                   </div>
                   <div className="prose prose-invert max-w-none text-emerald-100/90 font-light text-xl md:text-2xl leading-[1.8] italic whitespace-pre-wrap">
                     {selectedArtifact.content}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 pt-16 md:pt-24 pb-10">
                   <div className="glass p-10 md:p-14 rounded-[40px] md:rounded-[64px] flex items-center gap-8 md:gap-12 border-emerald-500/10">
                      <Binary className="w-12 md:w-16 h-12 md:h-16 text-emerald-500" />
                      <div>
                        <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.5em] text-emerald-900">Tokens Node</p>
                        <p className="text-2xl md:text-3xl font-serif italic text-emerald-100">{(selectedArtifact.tokens || 0).toLocaleString()}</p>
                      </div>
                   </div>
                   <div className="glass p-10 md:p-14 rounded-[40px] md:rounded-[64px] flex items-center gap-8 md:gap-12 border-emerald-500/10">
                      <Coins className="w-12 md:w-16 h-12 md:h-16 text-amber-500" />
                      <div>
                        <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.5em] text-emerald-900">Coût Estimé</p>
                        <p className="text-2xl md:text-3xl font-serif italic text-amber-400">{((selectedArtifact.tokens || 0) / 1000000 * COST_PER_1M_TOKENS).toFixed(4)}€</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <footer className="p-8 md:p-16 border-t border-emerald-900/20 glass flex gap-6 md:gap-10 shrink-0 bg-[#000806]/98">
              <button className="flex-1 py-8 bg-emerald-950/80 border border-emerald-900/60 rounded-[32px] md:rounded-[48px] text-[12px] md:text-[14px] font-black uppercase tracking-[0.5em] text-emerald-800 hover:text-emerald-400 transition-all flex items-center justify-center gap-6">
                <ClipboardList className="w-7 h-7" /> Copy Raw
              </button>
              <button className="flex-1 py-8 bg-emerald-500 text-emerald-950 rounded-[32px] md:rounded-[48px] text-[12px] md:text-[14px] font-black uppercase tracking-[0.5em] hover:bg-emerald-400 hover:scale-[1.03] transition-all flex items-center justify-center gap-6 shadow-3xl">
                <Check className="w-7 h-7" /> Valider 3*
              </button>
            </footer>
          </div>
        </>
      )}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<TopChefApp />);
