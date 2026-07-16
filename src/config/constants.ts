/**
 * Constantes Globais - AI_Doctor v3.0
 */

export const APP_NAME = 'AI_Doctor';
export const APP_VERSION = '3.0.0';
export const APP_DESCRIPTION = 'Plataforma de Oncologia Assistida por IA com Humanidade';

// Módulos Disponíveis
export const MODULES = {
  DASHBOARD: 'dashboard',
  DIAGNOSTIC: 'diagnostic',
  BOARD: 'board',
  ANALYTICS: 'analytics',
  LIVEBOOK: 'livebook',
  TELEMEDICINE: 'telemedicine',
  RESEARCH: 'research',
  ADVANCED: 'advanced',
  MOLTBOOK: 'moltbook',
  CEREBRO: 'cerebro',
  WORMHOLE: 'wormhole',
  BLACKHOLE: 'blackhole',
  ONCO_RESEARCH: 'onco_research',
  ERADICATION: 'eradication',
} as const;

// Status de Agentes
export const AGENT_STATUS = {
  ACTIVE: 'ACTIVE',
  IDLE: 'IDLE',
  SYNCED: 'SYNCED',
  ANALYZING: 'ANALYZING',
  ERROR: 'ERROR',
} as const;

// Status de Pacientes
export const PATIENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DISCHARGED: 'discharged',
  DECEASED: 'deceased',
} as const;

// Status de Tratamentos
export const TREATMENT_STATUS = {
  PLANNED: 'planned',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  DISCONTINUED: 'discontinued',
} as const;

// Status de Recomendações
export const RECOMMENDATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

// Tipos de Tumor
export const TUMOR_TYPES = [
  'Carcinoma de Células Escamosas',
  'Adenocarcinoma',
  'Carcinoma de Pequenas Células',
  'Carcinoma de Grandes Células',
  'Mesotelioma',
  'Linfoma',
  'Mieloma Múltiplo',
  'Leucemia',
  'Melanoma',
  'Carcinoma Basocelular',
  'Carcinoma de Células Escamosas de Pele',
  'Outro',
] as const;

// Estágios de Câncer (TNM)
export const CANCER_STAGES = [
  'Estágio 0 (In Situ)',
  'Estágio I',
  'Estágio II',
  'Estágio III',
  'Estágio IV (Metastático)',
] as const;

// Especialidades Médicas
export const MEDICAL_SPECIALTIES = [
  'Oncologia Clínica',
  'Oncologia Cirúrgica',
  'Radioterapia',
  'Patologia',
  'Radiologia',
  'Hematologia',
  'Imunoterapia',
  'Genética Médica',
  'Cuidados Paliativos',
  'Psico-Oncologia',
  'Nutrição Oncológica',
  'Enfermagem Oncológica',
] as const;

// Tipos de Biomarcadores
export const BIOMARKER_TYPES = [
  'PSA',
  'CEA',
  'CA-125',
  'CA 19-9',
  'AFP',
  'HCG',
  'Hemoglobina',
  'Leucócitos',
  'Plaquetas',
  'Albumina',
  'Bilirrubina',
  'Creatinina',
] as const;

// Tipos de Mutações
export const MUTATION_TYPES = [
  'Substituição',
  'Inserção',
  'Deleção',
  'Duplicação',
  'Inversão',
  'Translocação',
  'Amplificação',
  'Perda de Função',
] as const;

// Endpoints da API
export const API_ENDPOINTS = {
  PATIENTS: '/api/patients',
  DIAGNOSES: '/api/diagnoses',
  MUTATIONS: '/api/mutations',
  BIOMARKERS: '/api/biomarkers',
  TREATMENTS: '/api/treatments',
  RECOMMENDATIONS: '/api/recommendations',
  MEDICAL_AGENTS: '/api/medical-agents',
  MEDICAL_BOARD: '/api/medical-board',
  CLINICAL_CASES: '/api/clinical-cases',
  LITERATURE: '/api/literature',
  CLINICAL_TRIALS: '/api/clinical-trials',
  ANALYTICS: '/api/analytics',
} as const;

// Limites de Paginação
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 5,
} as const;

// Timeouts
export const TIMEOUTS = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 10000,
  VERY_LONG: 30000,
} as const;

// Mensagens
export const MESSAGES = {
  SUCCESS: 'Operação realizada com sucesso!',
  ERROR: 'Ocorreu um erro. Tente novamente.',
  LOADING: 'Carregando...',
  NO_DATA: 'Nenhum dado disponível.',
  CONFIRM_DELETE: 'Tem certeza que deseja deletar?',
  UNSAVED_CHANGES: 'Você tem alterações não salvas.',
} as const;

// Cores por Status
export const STATUS_COLORS = {
  active: 'emerald',
  inactive: 'slate',
  pending: 'amber',
  completed: 'emerald',
  error: 'red',
  warning: 'amber',
  info: 'blue',
} as const;

// Configurações de Animação
export const ANIMATION_DURATION = {
  FAST: 150,
  BASE: 200,
  SLOW: 300,
  SLOWER: 500,
} as const;

// Configurações de Breakpoints (Tailwind)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Configurações de Armazenamento Local
export const LOCAL_STORAGE_KEYS = {
  THEME: 'ai-doctor-theme',
  SIDEBAR_STATE: 'ai-doctor-sidebar-open',
  ACTIVE_TAB: 'ai-doctor-active-tab',
  USER_PREFERENCES: 'ai-doctor-user-preferences',
  RECENT_PATIENTS: 'ai-doctor-recent-patients',
} as const;

// Configurações de Sessão
export const SESSION_CONFIG = {
  TIMEOUT: 1800000, // 30 minutos
  WARNING_TIME: 300000, // 5 minutos antes do timeout
  REFRESH_INTERVAL: 60000, // 1 minuto
} as const;

// Configurações de Validação
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 255,
  MAX_EMAIL_LENGTH: 320,
  MAX_PHONE_LENGTH: 20,
} as const;

export default {
  APP_NAME,
  APP_VERSION,
  MODULES,
  AGENT_STATUS,
  PATIENT_STATUS,
  TREATMENT_STATUS,
  TUMOR_TYPES,
  CANCER_STAGES,
  MEDICAL_SPECIALTIES,
  BIOMARKER_TYPES,
  MUTATION_TYPES,
  API_ENDPOINTS,
  PAGINATION,
  TIMEOUTS,
  MESSAGES,
  STATUS_COLORS,
  ANIMATION_DURATION,
  BREAKPOINTS,
  LOCAL_STORAGE_KEYS,
  SESSION_CONFIG,
  VALIDATION,
};
