
export type ViewType = 'landing' | 'compiler' | 'runner' | 'history' | 'details';

export type DisplayType = 'markdown' | 'table' | 'matrix' | 'recipe_card' | 'score_card';

export interface Artifact {
  id: string;
  role: 'Extractor' | 'Profiler' | 'Copywriter' | 'Architect' | 'Judge';
  title: string;
  content: string;
  summary: string;
  status: 'pending' | 'cooking' | 'served' | 'error';
  version: number;
  displayType: DisplayType;
  structuredData?: any; 
}

export interface ProjectSession {
  id: string;
  projectName: string;
  rawInput: string;
  offerDetails: string;
  artifacts: Artifact[];
  status: 'idle' | 'running' | 'completed';
  timestamp: number;
  score?: number; // Michelin Star rating (1-3)
}
