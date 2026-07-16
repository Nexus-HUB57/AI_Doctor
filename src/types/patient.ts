export interface PatientData {
  id?: string;
  name: string;
  age: number;
  diagnosis: string;
  stage: string;
  notes?: string;
  createdAt?: string;
}

export interface TreatmentRecommendation {
  id: string;
  patientId: string;
  recommendation: string;
  confidenceScore: number;
  interventions: string[];
  sources: string[];
  createdAt: string;
}

export interface MedicalBoardMember {
  id: string;
  name: string;
  specialty: string;
  role: string;
  avatar?: string;
}

export interface BoardDiscussion {
  id: string;
  patientId: string;
  specialistId: string;
  specialistName: string;
  comment: string;
  timestamp: string;
}

export interface BoardConsensus {
  patientId: string;
  consensusScore: number;
  finalRecommendation: string;
  specialistsAgreed: string[];
  reportUrl?: string;
}
