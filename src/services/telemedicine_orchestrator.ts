/**
 * Telemedicine Orchestrator
 * Humanized dialogue system for patient support and hope
 */

export interface PatientMessage {
  content: string;
  emotional_tone?: 'hopeful' | 'fearful' | 'curious' | 'desperate' | 'neutral';
  topics?: string[];
}

export interface ConsensusDialogue {
  main_message: string;
  key_points: string[];
  hope_indicator: number; // 0-100
  evidence_strength: 'Alta' | 'Moderada' | 'Baixa';
  next_steps: string[];
  specialist_insights: Array<{
    specialty: string;
    perspective: string;
  }>;
  emotional_support: string;
  resources: string[];
}

export class TelemedicineOrchestrator {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = '/api') {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Process patient message through Consensus with humanized response
   */
  async processPatientMessage(
    patientMessage: string,
    conversationHistory?: any[]
  ): Promise<ConsensusDialogue> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/telemedicine/consensus-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_message: patientMessage,
          conversation_history: conversationHistory || [],
          context: 'telemedicine_support'
        })
      });

      if (!response.ok) throw new Error('Consensus response failed');
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error processing patient message:', error);
      throw error;
    }
  }

  /**
   * Analyze emotional tone of patient message
   */
  async analyzeEmotionalTone(message: string): Promise<'hopeful' | 'fearful' | 'curious' | 'desperate' | 'neutral'> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/telemedicine/analyze-emotion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      if (!response.ok) return 'neutral';
      const data = await response.json();
      return data.tone;
    } catch (error) {
      console.error('Error analyzing emotion:', error);
      return 'neutral';
    }
  }

  /**
   * Generate hope-focused response
   */
  async generateHopeMessage(
    topic: string,
    evidence_level: number
  ): Promise<string> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/telemedicine/hope-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          evidence_level
        })
      });

      if (!response.ok) throw new Error('Hope message generation failed');
      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error('Error generating hope message:', error);
      return 'Sua pergunta é importante. Estamos aqui para apoiá-lo com informação científica e esperança fundamentada.';
    }
  }

  /**
   * Get specialist perspectives for patient question
   */
  async getSpecialistPerspectives(
    question: string,
    relevant_specialties?: string[]
  ): Promise<Array<{ specialty: string; perspective: string }>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/telemedicine/specialist-perspectives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          specialties: relevant_specialties
        })
      });

      if (!response.ok) return [];
      const data = await response.json();
      return data.perspectives;
    } catch (error) {
      console.error('Error fetching specialist perspectives:', error);
      return [];
    }
  }

  /**
   * Generate personalized support resources
   */
  async getSupportResources(
    patient_situation: string
  ): Promise<string[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/telemedicine/support-resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation: patient_situation })
      });

      if (!response.ok) return [];
      const data = await response.json();
      return data.resources;
    } catch (error) {
      console.error('Error fetching support resources:', error);
      return [];
    }
  }

  /**
   * Create session summary for patient
   */
  async createSessionSummary(
    conversation_history: any[]
  ): Promise<{
    summary: string;
    key_learnings: string[];
    action_items: string[];
    hope_score: number;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/telemedicine/session-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation: conversation_history })
      });

      if (!response.ok) throw new Error('Session summary failed');
      const data = await response.json();
      return data.summary;
    } catch (error) {
      console.error('Error creating session summary:', error);
      throw error;
    }
  }

  /**
   * Get emergency support if patient expresses crisis
   */
  async getEmergencySupport(): Promise<{
    message: string;
    resources: string[];
    hotlines: Array<{ country: string; number: string; name: string }>;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/telemedicine/emergency-support`);
      if (!response.ok) throw new Error('Emergency support failed');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching emergency support:', error);
      return {
        message: 'Se você está em crise, por favor procure ajuda imediatamente.',
        resources: [],
        hotlines: [
          { country: 'Brasil', number: '188', name: 'CVV - Centro de Valorização da Vida' },
          { country: 'Brasil', number: '192', name: 'Emergência Médica' }
        ]
      };
    }
  }

  /**
   * Track patient progress and hope indicators
   */
  async trackProgress(
    session_id: string,
    metrics: {
      initial_hope_level: number;
      final_hope_level: number;
      topics_discussed: string[];
      resources_provided: number;
    }
  ): Promise<void> {
    try {
      await fetch(`${this.apiBaseUrl}/telemedicine/track-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id,
          metrics
        })
      });
    } catch (error) {
      console.error('Error tracking progress:', error);
    }
  }
}

export const telemedicineOrchestrator = new TelemedicineOrchestrator();
