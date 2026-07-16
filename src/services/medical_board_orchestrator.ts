/**
 * Medical Board Orchestrator
 * Coordinates PhD specialists for clinical consensus
 */

export interface BoardMember {
  id: string;
  name: string;
  specialty: string;
  expertise_areas: string[];
  credentials: string;
}

export interface CasePresentation {
  patient_id: string;
  tumor_type: string;
  stage: string;
  mutations?: string[];
  prior_treatments?: string[];
  biomarkers?: Record<string, number>;
  immune_profile?: Record<string, number>;
  clinical_notes?: string;
}

export interface BoardDiscussion {
  board_member_id: string;
  board_member_name: string;
  specialty: string;
  position_statement: string;
  evidence_cited: string[];
  agreement_level: number; // 0-100
  recommendations: string[];
}

export interface BoardConsensus {
  case_id: string;
  patient_id: string;
  board_date: string;
  participating_members: BoardMember[];
  discussions: BoardDiscussion[];
  primary_recommendation: string;
  alternative_recommendations: string[];
  consensus_level: 'Unânime' | 'Maioria' | 'Dividido' | 'Sem Consenso';
  discussion_summary: string;
  final_decision: string;
  confidence_score: number;
}

export class MedicalBoardOrchestrator {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = '/api') {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Get available board members by specialty
   */
  async getAvailableBoardMembers(specialty?: string): Promise<BoardMember[]> {
    try {
      const url = specialty 
        ? `${this.apiBaseUrl}/board/members?specialty=${encodeURIComponent(specialty)}`
        : `${this.apiBaseUrl}/board/members`;
      
      const response = await fetch(url);
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.error('Error fetching board members:', error);
      return [];
    }
  }

  /**
   * Assemble a board for a specific case
   */
  async assembleBoard(casePresentation: CasePresentation): Promise<BoardMember[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/board/assemble`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(casePresentation)
      });

      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.error('Error assembling board:', error);
      return [];
    }
  }

  /**
   * Initiate board discussion
   */
  async initiateBoardDiscussion(
    casePresentation: CasePresentation,
    boardMembers: BoardMember[]
  ): Promise<BoardConsensus> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/board/discuss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case: casePresentation,
          board_members: boardMembers
        })
      });

      if (!response.ok) throw new Error('Board discussion failed');
      return response.json();
    } catch (error) {
      console.error('Error initiating board discussion:', error);
      throw error;
    }
  }

  /**
   * Get agent perspective on case
   */
  async getAgentPerspective(
    agentId: string,
    casePresentation: CasePresentation
  ): Promise<BoardDiscussion> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/board/perspective`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          case: casePresentation
        })
      });

      if (!response.ok) throw new Error('Failed to get agent perspective');
      return response.json();
    } catch (error) {
      console.error('Error getting agent perspective:', error);
      throw error;
    }
  }

  /**
   * Calculate consensus level
   */
  async calculateConsensus(discussions: BoardDiscussion[]): Promise<{
    consensus_level: 'Unânime' | 'Maioria' | 'Dividido' | 'Sem Consenso';
    agreement_percentage: number;
    primary_recommendation: string;
    alternative_recommendations: string[];
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/board/consensus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discussions })
      });

      if (!response.ok) throw new Error('Consensus calculation failed');
      return response.json();
    } catch (error) {
      console.error('Error calculating consensus:', error);
      throw error;
    }
  }

  /**
   * Generate board report
   */
  async generateBoardReport(consensus: BoardConsensus): Promise<string> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/board/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consensus)
      });

      if (!response.ok) throw new Error('Report generation failed');
      const data = await response.json();
      return data.report;
    } catch (error) {
      console.error('Error generating board report:', error);
      return '';
    }
  }

  /**
   * Get board history for patient
   */
  async getBoardHistory(patientId: string): Promise<BoardConsensus[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/board/history/${patientId}`);
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.error('Error fetching board history:', error);
      return [];
    }
  }

  /**
   * Compare board recommendations over time
   */
  async compareRecommendations(patientId: string): Promise<{
    timeline: Array<{
      date: string;
      recommendation: string;
      consensus_level: string;
    }>;
    evolution: string;
    current_status: string;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/board/compare/${patientId}`);
      if (!response.ok) throw new Error('Comparison failed');
      return response.json();
    } catch (error) {
      console.error('Error comparing recommendations:', error);
      throw error;
    }
  }

  /**
   * Request expert opinion from specific agent
   */
  async requestExpertOpinion(
    agentId: string,
    question: string,
    context?: string
  ): Promise<string> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/board/expert-opinion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          question,
          context
        })
      });

      if (!response.ok) throw new Error('Expert opinion request failed');
      const data = await response.json();
      return data.opinion;
    } catch (error) {
      console.error('Error requesting expert opinion:', error);
      return '';
    }
  }

  /**
   * Debate between agents on treatment options
   */
  async debateTreatmentOptions(
    casePresentation: CasePresentation,
    treatmentOptions: string[]
  ): Promise<{
    debates: Array<{
      treatment: string;
      proponents: string[];
      opponents: string[];
      key_arguments: string[];
      evidence_strength: number;
    }>;
    winner: string;
    reasoning: string;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/board/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case: casePresentation,
          treatment_options: treatmentOptions
        })
      });

      if (!response.ok) throw new Error('Debate failed');
      return response.json();
    } catch (error) {
      console.error('Error initiating debate:', error);
      throw error;
    }
  }

  /**
   * Get board statistics
   */
  async getBoardStatistics(): Promise<{
    total_cases_reviewed: number;
    average_consensus_level: number;
    most_common_recommendations: string[];
    specialist_agreement_matrix: Record<string, Record<string, number>>;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/board/statistics`);
      if (!response.ok) throw new Error('Statistics fetch failed');
      return response.json();
    } catch (error) {
      console.error('Error fetching board statistics:', error);
      throw error;
    }
  }
}

export const medicalBoardOrchestrator = new MedicalBoardOrchestrator();
