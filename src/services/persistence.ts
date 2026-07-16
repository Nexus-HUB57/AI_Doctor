/**
 * Persistence Service
 * Handles all database operations for AI_Doctor
 */

export interface Patient {
  id?: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Outro';
  medical_record_number?: string;
}

export interface Diagnosis {
  id?: string;
  patient_id: string;
  tumor_type: string;
  stage: string;
  histology?: string;
  grade?: string;
  date_diagnosis: string;
  notes?: string;
}

export interface Mutation {
  id?: string;
  patient_id: string;
  gene_name: string;
  mutation_type?: string;
  variant_classification?: string;
  allele_frequency?: number;
  clinical_significance?: string;
}

export interface Biomarker {
  id?: string;
  patient_id: string;
  biomarker_name: string;
  value: number;
  unit?: string;
  reference_range?: string;
  test_date: string;
  status?: 'Normal' | 'Elevado' | 'Reduzido' | 'Crítico';
}

export interface ImmuneProfile {
  id?: string;
  patient_id: string;
  cd4_count?: number;
  cd8_count?: number;
  treg_percentage?: number;
  nk_cell_activity?: number;
  th1_th2_ratio?: number;
  pd1_expression?: number;
  lag3_expression?: number;
  ctla4_expression?: number;
  test_date: string;
}

export interface Treatment {
  id?: string;
  patient_id: string;
  treatment_type: string;
  treatment_name: string;
  start_date: string;
  end_date?: string;
  dosage?: string;
  response?: 'Completa' | 'Parcial' | 'Estável' | 'Progressão' | 'Não Avaliado';
  toxicity_grade?: number;
  notes?: string;
}

export interface TreatmentRecommendation {
  id?: string;
  patient_id: string;
  recommended_treatment: string;
  evidence_score: number;
  clinical_phase: string;
  rationale: string;
  alternative_options?: string;
  created_by_agent: string;
  accepted?: boolean;
}

export interface MedicalAgent {
  id?: string;
  name: string;
  specialty: string;
  expertise_areas: string[];
  credentials?: string;
  research_focus?: string;
  publications_count?: number;
  h_index?: number;
  active?: boolean;
}

export interface MedicalBoardConsensus {
  id?: string;
  patient_id: string;
  board_date: string;
  participating_agents: string[];
  primary_recommendation: string;
  alternative_recommendations?: string[];
  consensus_level: 'Unânime' | 'Maioria' | 'Dividido' | 'Sem Consenso';
  discussion_summary: string;
  final_decision?: string;
}

export interface ClinicalCase {
  id?: string;
  patient_id: string;
  case_summary: string;
  primary_diagnosis: string;
  current_status: 'Ativo' | 'Remissão' | 'Progressão' | 'Falecido' | 'Perdido';
  case_complexity: 'Simples' | 'Moderado' | 'Complexo' | 'Muito Complexo';
  learning_outcomes?: string;
}

export class PersistenceService {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = '/api') {
    this.apiBaseUrl = apiBaseUrl;
  }

  // ========== PACIENTES ==========
  async createPatient(patient: Patient): Promise<Patient> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient)
    });
    return response.json();
  }

  async getPatient(patientId: string): Promise<Patient> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/patients/${patientId}`);
    return response.json();
  }

  async getAllPatients(): Promise<Patient[]> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/patients`);
    return response.json();
  }

  async updatePatient(patientId: string, patient: Partial<Patient>): Promise<Patient> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/patients/${patientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient)
    });
    return response.json();
  }

  // ========== DIAGNÓSTICOS ==========
  async createDiagnosis(diagnosis: Diagnosis): Promise<Diagnosis> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/diagnoses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(diagnosis)
    });
    return response.json();
  }

  async getPatientDiagnoses(patientId: string): Promise<Diagnosis[]> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/patients/${patientId}/diagnoses`);
    return response.json();
  }

  // ========== MUTAÇÕES ==========
  async createMutation(mutation: Mutation): Promise<Mutation> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/mutations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mutation)
    });
    return response.json();
  }

  async getPatientMutations(patientId: string): Promise<Mutation[]> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/patients/${patientId}/mutations`);
    return response.json();
  }

  // ========== BIOMARCADORES ==========
  async createBiomarker(biomarker: Biomarker): Promise<Biomarker> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/biomarkers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(biomarker)
    });
    return response.json();
  }

  async getPatientBiomarkers(patientId: string): Promise<Biomarker[]> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/patients/${patientId}/biomarkers`);
    return response.json();
  }

  // ========== PERFIL IMUNOLÓGICO ==========
  async createImmuneProfile(profile: ImmuneProfile): Promise<ImmuneProfile> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/immune-profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    return response.json();
  }

  async getPatientImmuneProfile(patientId: string): Promise<ImmuneProfile | null> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/patients/${patientId}/immune-profile`);
    return response.json();
  }

  // ========== TRATAMENTOS ==========
  async createTreatment(treatment: Treatment): Promise<Treatment> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/treatments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(treatment)
    });
    return response.json();
  }

  async getPatientTreatments(patientId: string): Promise<Treatment[]> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/patients/${patientId}/treatments`);
    return response.json();
  }

  // ========== RECOMENDAÇÕES ==========
  async createRecommendation(recommendation: TreatmentRecommendation): Promise<TreatmentRecommendation> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recommendation)
    });
    return response.json();
  }

  async getPatientRecommendations(patientId: string): Promise<TreatmentRecommendation[]> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/patients/${patientId}/recommendations`);
    return response.json();
  }

  async acceptRecommendation(recommendationId: string): Promise<void> {
    await fetch(`${this.apiBaseUrl}/persistence/recommendations/${recommendationId}/accept`, {
      method: 'POST'
    });
  }

  // ========== AGENTES MÉDICOS ==========
  async createMedicalAgent(agent: MedicalAgent): Promise<MedicalAgent> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/medical-agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent)
    });
    return response.json();
  }

  async getAllMedicalAgents(): Promise<MedicalAgent[]> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/medical-agents`);
    return response.json();
  }

  async getMedicalAgentsBySpecialty(specialty: string): Promise<MedicalAgent[]> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/medical-agents?specialty=${specialty}`);
    return response.json();
  }

  // ========== JUNTA MÉDICA ==========
  async createBoardConsensus(consensus: MedicalBoardConsensus): Promise<MedicalBoardConsensus> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/board-consensus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consensus)
    });
    return response.json();
  }

  async getPatientBoardConsensus(patientId: string): Promise<MedicalBoardConsensus[]> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/patients/${patientId}/board-consensus`);
    return response.json();
  }

  // ========== CASOS CLÍNICOS ==========
  async createClinicalCase(clinicalCase: ClinicalCase): Promise<ClinicalCase> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/clinical-cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clinicalCase)
    });
    return response.json();
  }

  async getPatientClinicalCase(patientId: string): Promise<ClinicalCase | null> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/patients/${patientId}/clinical-case`);
    return response.json();
  }

  async searchClinicalCases(query: string): Promise<ClinicalCase[]> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/clinical-cases/search?q=${encodeURIComponent(query)}`);
    return response.json();
  }

  // ========== ANALYTICS ==========
  async getPatientSummary(patientId: string): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/patients/${patientId}/summary`);
    return response.json();
  }

  async getSystemAnalytics(): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/analytics/system`);
    return response.json();
  }

  async getQueryPerformance(timeRange: string = '24h'): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/persistence/analytics/queries?range=${timeRange}`);
    return response.json();
  }

  // ========== MEMÓRIA DO SISTEMA ==========
  async storeMemory(memoryType: string, keyConcept: string, value: string, confidenceScore: number = 0.8): Promise<void> {
    await fetch(`${this.apiBaseUrl}/persistence/system-memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memory_type: memoryType,
        key_concept: keyConcept,
        value,
        confidence_score: confidenceScore
      })
    });
  }

  async retrieveMemory(memoryType: string, keyConcept: string): Promise<any> {
    const response = await fetch(
      `${this.apiBaseUrl}/persistence/system-memory?type=${memoryType}&concept=${encodeURIComponent(keyConcept)}`
    );
    return response.json();
  }
}

// Singleton instance
export const persistenceService = new PersistenceService();
