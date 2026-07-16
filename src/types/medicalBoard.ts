export interface SpecialistPerspective {
  specialty: string;
  agentName: string;
  content: string;
  evidence: string[];
  confidenceScore: number;
}

export interface ConsensusReport {
  boardId: string;
  caseSummary: string;
  finalRecommendation: string;
  consensusScore: number;
  perspectives: SpecialistPerspective[];
  reportUrl: string;
  createdAt: string;
}
