/** CHIMERA LIVE LAB TRI-NUCLEAR — Type Definitions v3.0.0-iogue
 *  Ported from Nexus-HUB57/LiveBook-rRNA to AI_Doctor ecosystem */

export interface LiveLabModel {
  id: string; provedor: string; provedor_registry_id?: string;
  contexto_tokens: number;
  custo_por_1m_tokens: { entrada_usd: number; saida_usd: number };
  latencia_media_ms: number; peso_roteamento: number;
  qualidade_normalizada?: number; casos_uso_prioritarios: string[];
  formato_api?: string; is_local?: boolean;
  tokens_estimados?: number; modelo_preferido?: string;
}
export interface CascataRegra {
  regra: string; modelo_primario: string;
  fallback?: string[]; latencia_maxima_ms?: number;
}
export interface AlgoritmoRoteamento {
  tipo: string; descricao?: string;
  cascata: CascataRegra[];
  pesos_mcdm: Record<string, number>;
  promethee_thresholds?: Record<string, number>;
}
export interface NucleoAgregador {
  modelos: LiveLabModel[];
  algoritmo_roteamento: AlgoritmoRoteamento;
}
export interface Skill {
  id: string; nome: string; dominio: string; trigger: string;
  rbac_permissoes: string[]; nivel_criticidade: string;
  payload_schema?: Record<string, unknown>; descricao?: string;
  tokens_estimados?: number; modelo_preferido?: string;
}
export interface MetaSkill extends Skill {
  skills_compostas: string[];
  ordem_execucao: 'sequencial' | 'paralelo';
}
export interface NucleoProdutividade {
  skills: Skill[]; meta_skills: MetaSkill[];
}
export interface CriteriosAprovacao {
  taxa_acerto_minima: number;
  modulo_anterior_obrigatorio: boolean;
}
export interface ModuloEducacional {
  id: string; titulo: string; descricao: string;
  skills_exigidas: string[]; modelo_recomendado: string;
  criterios_aprovacao: CriteriosAprovacao;
  conteudo_teorico: string;
  avaliacao_tipo: 'pratico' | 'teorico' | 'misto';
}
export interface TrilhaCertificacao {
  prefixo: string; niveis: string[];
  requisitos_adicionais: string[];
}
export interface TrilhaAprendizagem {
  id: string; nome: string; descricao: string; nivel: string;
  modulos: ModuloEducacional[]; certificacao: TrilhaCertificacao;
}
export interface NucleoEcossistema {
  trilhas_aprendizagem: TrilhaAprendizagem[];
  certificacoes: Record<string, { descricao: string; nivel: string }>;
}
export interface WorkflowPasso {
  nucleo: number; acao: string; saida: string;
}
export interface WorkflowHibrido {
  id: string; nome: string; descricao: string;
  nucleos_envolvidos: number[]; trigger: string;
  passos: WorkflowPasso[];
}
export interface WorkflowsHibridos {
  malha_eventos_descricao: string;
  exemplos_fluxos: WorkflowHibrido[];
}
export interface InteracaoHistorico {
  data: string; tipo: string; nucleo: number; detalhes: string;
}
export interface Persona {
  id: string; nome: string; papel: string;
  nivel_acesso_rbac: string; trilha_ativa: string;
  certificacao_atual: string | null;
  historico_interacoes: InteracaoHistorico[];
}
export interface RateLimitTier {
  req_per_min: number; req_per_hour: number; req_per_day: number;
}
export interface BudgetTier {
  usd_mes: number; alerta_50: boolean; alerta_80: boolean; alerta_95: boolean;
}
export interface PoliticaGovernanca {
  rate_limiting: Record<string, RateLimitTier>;
  budget_tracking: Record<string, BudgetTier>;
  privacidade_e_pii: { campos_regex: string[]; acao: string; descricao?: string };
}
export interface IogueEssence {
  filosofia_nucleo: string;
  principios_sabedoria: string[];
  agentica_como_guru: string;
}
export interface LiveLabManifesto {
  versao: string; visao_executiva: string;
  essencia_iogue?: IogueEssence;
  nucleo_agregador: NucleoAgregador;
  nucleo_produtividade: NucleoProdutividade;
  nucleo_ecossistema: NucleoEcossistema;
  workflows_hibridos: WorkflowsHibridos;
  personas: Persona[];
  politicas_governanca: PoliticaGovernanca;
}
export interface AgenticaIdentity {
  readonly id: string; readonly nome: string; readonly papel: string;
  readonly versao: string; readonly nucleo_primario: number;
  readonly nucleo_secundario: number; readonly nucleo_terciario: number;
  readonly manifesto_versao: string; readonly criado_em: string;
  readonly descricao: string;
}
export interface MCDMScore {
  modelo_id: string; score_total: number; rank: number;
  phi_positivo: number; phi_negativo: number;
  detalhes: { custo_norm: number; latencia_norm: number;
    qualidade_norm: number; contexto_norm: number;
    disponibilidade_norm: number; estabilidade_norm: number };
}
export interface RoutingResult {
  agente: string; intencao: string; modelo_selecionado: string;
  provedor: string; score_mcdm: MCDMScore;
  latencia_estimada_ms: number; custo_estimado_usd: number;
  is_local: boolean; cascade_match: string | null; timestamp: string;
}
export interface SkillResult {
  sucesso: boolean; skill_id: string; modelo_selecionado: string;
  tokens_usados: number; custo_usd: number; latencia_ms: number;
  resultado: Record<string, unknown>;
}
export interface MetaSkillResult {
  sucesso: boolean; meta_skill_id: string;
  resultados: SkillResult[];
  total_tokens: number; total_custo_usd: number;
  total_latencia_ms: number;
  execution_plan: Array<{ skillId: string; order: number; parallelGroup: number }>;
}
export interface ModuloResult {
  modulo_id: string; aprovado: boolean; pontuacao: number;
  pontuacao_minima: number; feedback: string; modelo_usado: string;
}
export interface PersonaProgress {
  persona_id: string; nome: string; perfil: string; trilha: string;
  modulo_atual: string; modulo_index: number; total_modulos: number;
  progresso_pct: number; total_interacoes: number;
  certificacao_atual: string | null; proxima_acao: string;
}
export interface GovernancaCheck {
  autorizado: boolean; rbac_nivel: string; rbac_nivel_requerido: string;
  acao: string; motivo?: string;
  rate_limit_info?: { used_per_min: number; limit_per_min: number;
    remaining: number; reset_ms: number };
  budget_info?: { usado_usd: number; limite_usd: number;
    restante_usd: number; pct_usado: number };
}
export interface DiagnosticoEcosystem {
  agente: AgenticaIdentity;
  integridade: { manifesto_valido: boolean; typecheck: 'PASS' | 'FAIL';
    modelos_count: number; skills_count: number; meta_skills_count: number;
    trilhas_count: number; workflows_count: number; personas_count: number;
    certificacoes_count: number; iogue_essence: boolean };
  nucleos: { n1_modelos: number; n2_skills: number; n2_meta_skills: number;
    n3_trilhas: number; n3_total_modulos: number; n3_certificacoes: number };
  governanca: { rate_limit_ativo: boolean; budget_tracking_ativo: boolean;
    pii_masking_ativo: boolean; regex_count: number; tiers_count: number };
  routing: { algoritmo: string; cascade_rules: number;
    pesos_mcdm: Record<string, number> };
  alertas: string[]; timestamp: string;
}
export interface LiveLabStats {
  versao: string; agente: string; agente_versao: string;
  modelos: number; skills: number; metaSkills: number;
  trilhas: number; total_modulos: number; workflows: number;
  personas: number; certificacoes: number;
  dominios_skill: string[]; trilhas_nomes: string[];
}
export interface TokenBucketState { tokens: number; last_refill: number; }
export interface BudgetState {
  usado_usd: number; alerta_50_fired: boolean;
  alerta_80_fired: boolean; alerta_95_fired: boolean;
}
export interface BudgetForecast {
  willExhaust: boolean; projectedDailyAvg: number;
  daysUntilExhaustion: number | null; recommendation: string;
}
export interface PIIAuditEntry {
  type: string; position: number; original: string;
}
export interface PIIMaskResult {
  maskedText: string; detectedPii: PIIAuditEntry[];
}
export interface SkillCompositionPlan {
  orderedSkills: string[]; hasCycle: boolean;
  executionPlan: Array<{ skillId: string; order: number; parallelGroup: number }>;
}
export interface CascadeMatchResult {
  rule: CascataRegra; keyword: string; score: number;
}
