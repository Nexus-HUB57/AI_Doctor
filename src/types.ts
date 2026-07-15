export interface OrganismPreset {
  id: string;
  name: string;
  type: string;
  sequence: string;
  description: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  pid: number;
  status: 'ACTIVE' | 'SYNCED' | 'IDLE' | 'ANALYZING';
  color: string;
  description: string;
  prompt: string;
  latestAnalysis?: string;
}

export interface LogMessage {
  id: string;
  time: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'query' | 'agent' | 'cosmic';
  agentName?: string;
}

export interface MoltPost {
  id: string;
  author: string;
  authorColor: string;
  role: string;
  content: string;
  timestamp: string;
  likes: number;
  hasLiked?: boolean;
  shares: number;
  hashtags: string[];
  comments: MoltComment[];
}

export interface MoltComment {
  id: string;
  author: string;
  authorColor: string;
  content: string;
  timestamp: string;
}

export interface WormholeNode {
  id: string;
  name: string;
  distance: string;
  status: 'STABLE' | 'FLUCTUATING' | 'COLLAPSED';
  coordinates: string;
}
