-- AI_Doctor Database Schema
-- Persistent storage for clinical cases, patient data, and system memory

-- ============================================================================
-- 1. PACIENTES (Patients)
-- ============================================================================
CREATE TABLE IF NOT EXISTS patients (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  age INT NOT NULL,
  gender ENUM('M', 'F', 'Outro') NOT NULL,
  medical_record_number VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_mrn (medical_record_number)
);

-- ============================================================================
-- 2. DIAGNÓSTICOS (Diagnoses)
-- ============================================================================
CREATE TABLE IF NOT EXISTS diagnoses (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id VARCHAR(36) NOT NULL,
  tumor_type VARCHAR(255) NOT NULL,
  stage VARCHAR(10) NOT NULL,
  histology VARCHAR(255),
  grade VARCHAR(10),
  date_diagnosis DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_patient (patient_id),
  INDEX idx_tumor_type (tumor_type)
);

-- ============================================================================
-- 3. MUTAÇÕES GENÉTICAS (Genetic Mutations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mutations (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id VARCHAR(36) NOT NULL,
  gene_name VARCHAR(100) NOT NULL,
  mutation_type VARCHAR(50),
  variant_classification VARCHAR(50),
  allele_frequency DECIMAL(5,2),
  clinical_significance VARCHAR(255),
  detected_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_patient (patient_id),
  INDEX idx_gene (gene_name)
);

-- ============================================================================
-- 4. BIOMARCADORES (Biomarkers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS biomarkers (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id VARCHAR(36) NOT NULL,
  biomarker_name VARCHAR(255) NOT NULL,
  value DECIMAL(10,2),
  unit VARCHAR(50),
  reference_range VARCHAR(100),
  test_date DATE NOT NULL,
  status ENUM('Normal', 'Elevado', 'Reduzido', 'Crítico') DEFAULT 'Normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_patient (patient_id),
  INDEX idx_biomarker (biomarker_name)
);

-- ============================================================================
-- 5. PERFIL IMUNOLÓGICO (Immune Profile)
-- ============================================================================
CREATE TABLE IF NOT EXISTS immune_profiles (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id VARCHAR(36) NOT NULL,
  cd4_count INT,
  cd8_count INT,
  treg_percentage DECIMAL(5,2),
  nk_cell_activity DECIMAL(5,2),
  th1_th2_ratio DECIMAL(5,2),
  pd1_expression DECIMAL(5,2),
  lag3_expression DECIMAL(5,2),
  ctla4_expression DECIMAL(5,2),
  test_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_patient (patient_id)
);

-- ============================================================================
-- 6. HISTÓRICO DE TRATAMENTOS (Treatment History)
-- ============================================================================
CREATE TABLE IF NOT EXISTS treatments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id VARCHAR(36) NOT NULL,
  treatment_type VARCHAR(100) NOT NULL,
  treatment_name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  dosage VARCHAR(100),
  response ENUM('Completa', 'Parcial', 'Estável', 'Progressão', 'Não Avaliado') DEFAULT 'Não Avaliado',
  toxicity_grade INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_patient (patient_id),
  INDEX idx_type (treatment_type)
);

-- ============================================================================
-- 7. CONSULTAS DIAGNÓSTICAS (Diagnostic Queries)
-- ============================================================================
CREATE TABLE IF NOT EXISTS diagnostic_queries (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id VARCHAR(36),
  query_text TEXT NOT NULL,
  context VARCHAR(100),
  response_text LONGTEXT,
  confidence_score DECIMAL(3,2),
  source_model VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_patient (patient_id),
  INDEX idx_created (created_at)
);

-- ============================================================================
-- 8. RECOMENDAÇÕES DE TRATAMENTO (Treatment Recommendations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS treatment_recommendations (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id VARCHAR(36) NOT NULL,
  recommended_treatment VARCHAR(255) NOT NULL,
  evidence_score INT,
  clinical_phase VARCHAR(50),
  rationale TEXT,
  alternative_options TEXT,
  created_by_agent VARCHAR(255),
  accepted BOOLEAN DEFAULT FALSE,
  outcome TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_patient (patient_id),
  INDEX idx_created (created_at)
);

-- ============================================================================
-- 9. AGENTES MÉDICOS (Medical Agents - PhD Specialists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS medical_agents (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL UNIQUE,
  specialty VARCHAR(255) NOT NULL,
  expertise_areas TEXT,
  credentials VARCHAR(255),
  research_focus TEXT,
  publications_count INT DEFAULT 0,
  h_index INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_specialty (specialty),
  INDEX idx_active (active)
);

-- ============================================================================
-- 10. CONSENSO DE JUNTA MÉDICA (Medical Board Consensus)
-- ============================================================================
CREATE TABLE IF NOT EXISTS medical_board_consensus (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id VARCHAR(36) NOT NULL,
  case_id VARCHAR(36),
  board_date DATETIME NOT NULL,
  participating_agents TEXT,
  primary_recommendation VARCHAR(255),
  alternative_recommendations TEXT,
  consensus_level ENUM('Unânime', 'Maioria', 'Dividido', 'Sem Consenso') DEFAULT 'Sem Consenso',
  discussion_summary LONGTEXT,
  final_decision TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_patient (patient_id),
  INDEX idx_date (board_date)
);

-- ============================================================================
-- 11. AGENTE DISCUSSÃO (Agent Discussion Logs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_discussions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  board_consensus_id VARCHAR(36) NOT NULL,
  agent_id VARCHAR(36) NOT NULL,
  agent_name VARCHAR(255) NOT NULL,
  position_statement TEXT,
  evidence_cited TEXT,
  agreement_level INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (board_consensus_id) REFERENCES medical_board_consensus(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES medical_agents(id),
  INDEX idx_board (board_consensus_id),
  INDEX idx_agent (agent_id)
);

-- ============================================================================
-- 12. LITERATURA CIENTÍFICA CACHE (Scientific Literature Cache)
-- ============================================================================
CREATE TABLE IF NOT EXISTS literature_cache (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  pubmed_id VARCHAR(50) UNIQUE,
  title TEXT NOT NULL,
  authors TEXT,
  abstract LONGTEXT,
  publication_year INT,
  journal VARCHAR(255),
  doi VARCHAR(100),
  relevance_score DECIMAL(3,2),
  tumor_types TEXT,
  keywords TEXT,
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pubmed (pubmed_id),
  INDEX idx_year (publication_year),
  FULLTEXT INDEX ft_title (title),
  FULLTEXT INDEX ft_abstract (abstract)
);

-- ============================================================================
-- 13. ESTUDOS CLÍNICOS (Clinical Trials)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clinical_trials (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nct_number VARCHAR(50) UNIQUE,
  title VARCHAR(255) NOT NULL,
  condition VARCHAR(255),
  intervention VARCHAR(255),
  status VARCHAR(50),
  phase VARCHAR(50),
  enrollment INT,
  start_date DATE,
  completion_date DATE,
  sponsor VARCHAR(255),
  url VARCHAR(500),
  relevance_score DECIMAL(3,2),
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_nct (nct_number),
  INDEX idx_condition (condition),
  INDEX idx_status (status)
);

-- ============================================================================
-- 14. ANALYTICS - CONSULTAS (Query Analytics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS query_analytics (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  query_type VARCHAR(100),
  response_time_ms INT,
  success BOOLEAN,
  error_message TEXT,
  user_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type (query_type),
  INDEX idx_created (created_at)
);

-- ============================================================================
-- 15. ANALYTICS - PERFORMANCE (System Performance)
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_performance (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  metric_name VARCHAR(100),
  metric_value DECIMAL(10,2),
  unit VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_metric (metric_name),
  INDEX idx_timestamp (timestamp)
);

-- ============================================================================
-- 16. CASOS CLÍNICOS (Clinical Cases - Consolidated View)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clinical_cases (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id VARCHAR(36) NOT NULL,
  case_summary LONGTEXT,
  primary_diagnosis VARCHAR(255),
  current_status ENUM('Ativo', 'Remissão', 'Progressão', 'Falecido', 'Perdido') DEFAULT 'Ativo',
  case_complexity ENUM('Simples', 'Moderado', 'Complexo', 'Muito Complexo') DEFAULT 'Moderado',
  learning_outcomes TEXT,
  case_reviewed_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_patient (patient_id),
  INDEX idx_status (current_status),
  FULLTEXT INDEX ft_summary (case_summary)
);

-- ============================================================================
-- 17. MEMÓRIA DO SISTEMA (System Memory - Knowledge Graph)
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_memory (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  memory_type VARCHAR(100),
  key_concept VARCHAR(255),
  value LONGTEXT,
  confidence_score DECIMAL(3,2),
  source VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (memory_type),
  INDEX idx_concept (key_concept)
);

-- ============================================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ============================================================================
CREATE INDEX idx_patient_diagnosis ON diagnoses(patient_id, tumor_type);
CREATE INDEX idx_treatment_response ON treatments(patient_id, response);
CREATE INDEX idx_biomarker_status ON biomarkers(patient_id, status);
CREATE INDEX idx_literature_relevance ON literature_cache(relevance_score DESC);

-- ============================================================================
-- VIEWS PARA ANÁLISE
-- ============================================================================

-- View: Resumo do Paciente
CREATE OR REPLACE VIEW v_patient_summary AS
SELECT 
  p.id,
  p.name,
  p.age,
  p.gender,
  d.tumor_type,
  d.stage,
  COUNT(DISTINCT m.id) as mutation_count,
  COUNT(DISTINCT b.id) as biomarker_count,
  COUNT(DISTINCT t.id) as treatment_count,
  MAX(t.end_date) as last_treatment_date,
  p.created_at
FROM patients p
LEFT JOIN diagnoses d ON p.id = d.patient_id
LEFT JOIN mutations m ON p.id = m.patient_id
LEFT JOIN biomarkers b ON p.id = b.patient_id
LEFT JOIN treatments t ON p.id = t.patient_id
GROUP BY p.id;

-- View: Recomendações Aceitas
CREATE OR REPLACE VIEW v_accepted_recommendations AS
SELECT 
  tr.id,
  tr.patient_id,
  tr.recommended_treatment,
  tr.evidence_score,
  tr.clinical_phase,
  tr.created_by_agent,
  tr.created_at,
  t.response,
  t.end_date
FROM treatment_recommendations tr
LEFT JOIN treatments t ON tr.patient_id = t.patient_id 
  AND tr.recommended_treatment = t.treatment_name
WHERE tr.accepted = TRUE;

-- View: Consenso de Junta Recente
CREATE OR REPLACE VIEW v_recent_consensus AS
SELECT 
  mbc.id,
  mbc.patient_id,
  p.name as patient_name,
  mbc.board_date,
  mbc.primary_recommendation,
  mbc.consensus_level,
  COUNT(DISTINCT ad.agent_id) as agent_count,
  mbc.created_at
FROM medical_board_consensus mbc
LEFT JOIN patients p ON mbc.patient_id = p.id
LEFT JOIN agent_discussions ad ON mbc.id = ad.board_consensus_id
GROUP BY mbc.id
ORDER BY mbc.board_date DESC;
