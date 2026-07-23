// ============================================================================
// AI_Doctor — Motor RAG Médico (6 Estágios)
// Inspirado no pipeline rRNA do LiveBook: Extract → Encode → Retrieve → Rerank → Augment → Generate
// Adaptado para contexto clínico: literatura médica, guidelines, protocolos DIMHEX
// ============================================================================

// ── Types ────────────────────────────────────────────────────────────────────

export interface RAGChunk {
  id: string;
  text: string;
  metadata: {
    source: string;
    agentName?: string;
    agentSlug?: string;
    chunkType: 'clinical_guideline' | 'research_paper' | 'protocol' | 'case_study' | 'drug_info' | 'general';
    chunkIndex: number;
    totalChunks: number;
    specialty?: string;
    pubYear?: number;
  };
}

export interface RAGDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  agentName?: string;
  agentSlug?: string;
  chunkType: RAGChunk['metadata']['chunkType'];
  specialty?: string;
}

export interface RAGQueryResult {
  query: string;
  answer: string;
  retrieved: Array<{
    id: string;
    title: string;
    source: string;
    agent: string;
    agentSlug?: string;
    score: number;
    chunkType?: string;
    specialty?: string;
  }>;
  contextLength: number;
  pipeline: {
    documentsScanned: number;
    retrieved: number;
    reranked: number;
    contextChars: number;
  };
}

export type LLMGenerator = (context: string, query: string) => Promise<string>;

// ═══════════════════════════════════════════════════════════════════════════════
// ESTÁGIO 1: RECURSIVE TEXT CHUNKER (Langchain-style)
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_SEPARATORS = [
  '\n\n',    // paragraph breaks
  '\n',      // line breaks
  '. ',      // sentence endings
  '; ',      // clause endings
  ', ',      // comma breaks
  ' ',       // word breaks
];

/**
 * RecursiveCharacterTextSplitter — splits text hierarchically
 * como Langchain's RecursiveCharacterTextSplitter
 */
export function recursiveChunk(
  text: string,
  chunkSize: number = 500,
  chunkOverlap: number = 50,
  separators: string[] = DEFAULT_SEPARATORS,
): string[] {
  if (!text || text.length <= chunkSize) return [text];

  for (const sep of separators) {
    if (!text.includes(sep)) continue;

    const splits = text.split(sep);
    const chunks: string[] = [];
    let current = '';

    for (const split of splits) {
      const candidate = current ? current + sep + split : split;

      if (candidate.length > chunkSize && current.length > 0) {
        chunks.push(current.trim());
        const overlapText = current.length > chunkOverlap
          ? current.slice(-chunkOverlap)
          : current;
        current = overlapText + sep + split;
      } else {
        current = candidate;
      }
    }

    if (current.trim()) {
      chunks.push(current.trim());
    }

    const allFit = chunks.every(c => c.length <= chunkSize * 1.2);
    if (allFit && chunks.length > 1) return chunks;

    return splits.flatMap(s =>
      recursiveChunk(s.trim(), chunkSize, chunkOverlap, separators.slice(separators.indexOf(sep) + 1))
    ).filter(c => c.length > 10);
  }

  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize).trim());
  }
  return chunks.filter(c => c.length > 10);
}

/**
 * Chunk a full document into RAGChunks with metadata
 */
export function chunkDocument(
  doc: { id: string; title: string; content: string; source: string; agentName?: string; agentSlug?: string; chunkType?: RAGChunk['metadata']['chunkType']; specialty?: string },
  chunkSize: number = 500,
  chunkOverlap: number = 50,
): RAGChunk[] {
  const chunks = recursiveChunk(doc.content, chunkSize, chunkOverlap);
  return chunks.map((text, i) => ({
    id: `${doc.id}_chunk_${i}`,
    text,
    metadata: {
      source: doc.source,
      agentName: doc.agentName,
      agentSlug: doc.agentSlug,
      chunkType: doc.chunkType || 'general',
      chunkIndex: i,
      totalChunks: chunks.length,
      specialty: doc.specialty,
    },
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESTÁGIO 2: TF-IDF ENCODER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tokeniza texto com suporte a termos médicos e acentuação
 */
function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\À-\u024F\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

/**
 * Gera n-grams para expansão de termos de busca
 */
function generateNgrams(tokens: string[], n: number = 2): string[] {
  const ngrams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join('_'));
  }
  return ngrams;
}

/**
 * Calcula TF (Term Frequency) para um documento
 */
function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  const total = tokens.length || 1;
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }
  for (const [k, v] of tf) {
    tf.set(k, v / total);
  }
  return tf;
}

/**
 * Calcula IDF (Inverse Document Frequency) sobre um corpus
 */
function computeIDF(documents: string[][]): Map<string, number> {
  const N = documents.length || 1;
  const df = new Map<string, number>();
  for (const doc of documents) {
    const unique = new Set(doc);
    for (const term of unique) {
      df.set(term, (df.get(term) || 0) + 1);
    }
  }
  const idf = new Map<string, number>();
  for (const [term, freq] of df) {
    idf.set(term, Math.log((N + 1) / (freq + 1)) + 1);
  }
  return idf;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESTÁGIO 3: BM25-STYLE RETRIEVER
// ═══════════════════════════════════════════════════════════════════════════════

interface RetrievalDocument extends RAGDocument {
  titleTokens: string[];
  contentTokens: string[];
  sourceTokens: string[];
}

const BM25_K1 = 1.5;  // term frequency saturation
const BM25_B = 0.75;   // length normalization

/**
 * BM25 scoring — padrão industry-standard para information retrieval
 * Similar ao que Langchain's BM25Retriever usa internamente
 */
function bm25Score(
  queryTokens: string[],
  docTokens: string[],
  docTF: Map<string, number>,
  idf: Map<string, number>,
  avgDL: number,
): number {
  const docLen = docTokens.length || 1;
  let score = 0;

  for (const qt of queryTokens) {
    const termIDF = idf.get(qt) || 0;
    const termTF = docTF.get(qt) || 0;
    const numerator = termTF * (BM25_K1 + 1);
    const denominator = termTF + BM25_K1 * (1 - BM25_B + BM25_B * (docLen / avgDL));
    score += termIDF * (numerator / denominator);
  }

  return score;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESTÁGIO 4: CROSS-ENCODER RERANKER (simplificado)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Re-ranking simplificado inspirado em cross-encoder
 * Usa heurísticas: matching exato de frase, bonus posicional,
 * proximidade semântica via token overlap ratios
 */
function rerank(
  query: string,
  queryTokens: string[],
  queryNgrams: string[],
  results: Array<RetrievalDocument & { bm25Score: number }>,
): Array<RetrievalDocument & { bm25Score: number; rerankScore: number }> {
  return results.map(doc => {
    let rerankBonus = 0;

    // Bonus 1: Frase exata no título (alto sinal)
    if (doc.title.toLowerCase().includes(query.toLowerCase())) {
      rerankBonus += 15;
    }

    // Bonus 2: N-gramas da query no conteúdo
    const contentNgrams = generateNgrams(doc.contentTokens, 2);
    const ngramOverlap = queryNgrams.filter(qn => contentNgrams.includes(qn)).length;
    rerankBonus += ngramOverlap * 3;

    // Bonus 3: Match posicional precoce (conceitos no início do documento)
    const first200 = doc.content.slice(0, 200).toLowerCase();
    const earlyMatches = queryTokens.filter(qt => first200.includes(qt)).length;
    rerankBonus += earlyMatches * 2;

    // Bonus 4: Relevância por tipo de chunk
    if (query.toLowerCase().includes('protocolo') && doc.chunkType === 'protocol') rerankBonus += 5;
    if (query.toLowerCase().includes('guideline') && doc.chunkType === 'clinical_guideline') rerankBonus += 5;
    if (query.toLowerCase().includes('caso') && doc.chunkType === 'case_study') rerankBonus += 5;
    if (query.toLowerCase().includes('droga') && doc.chunkType === 'drug_info') rerankBonus += 5;
    if (query.toLowerCase().includes('pesquisa') && doc.chunkType === 'research_paper') rerankBonus += 3;

    return {
      ...doc,
      rerankScore: doc.bm25Score + rerankBonus,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESTÁGIO 5: CONTEXT ASSEMBLER
// ═══════════════════════════════════════════════════════════════════════════════

interface AssembledContext {
  formattedContext: string;
  sources: RAGQueryResult['retrieved'];
  totalChars: number;
}

const MAX_CONTEXT_CHARS = 4000;

function assembleContext(
  results: Array<RetrievalDocument & { rerankScore: number }>,
  maxChars: number = MAX_CONTEXT_CHARS,
): AssembledContext {
  const sources: AssembledContext['sources'] = [];
  const parts: string[] = [];
  let usedChars = 0;

  for (const doc of results) {
    const snippet = doc.content.length > 400
      ? doc.content.slice(0, 400) + '...'
      : doc.content;

    const entry = `[${sources.length + 1}] ${doc.title} (${doc.agentName || 'Especialista'})\n${snippet}`;

    if (usedChars + entry.length > maxChars) break;

    parts.push(entry);
    sources.push({
      id: doc.id,
      title: doc.title,
      source: doc.source,
      agent: doc.agentName || 'Especialista',
      agentSlug: doc.agentSlug,
      score: Math.round(doc.rerankScore * 10) / 10,
      chunkType: doc.chunkType,
      specialty: doc.specialty,
    });
    usedChars += entry.length;
  }

  return {
    formattedContext: parts.join('\n\n---\n\n'),
    sources,
    totalChars: usedChars,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESTÁGIO 6: RAG PIPELINE ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Pipeline RAG completo — orquestrador médico inspirado em rRNA
 *
 * Analogia biológica:
 * - DNA → Base de conhecimento médico (entradas armazenadas)
 * - mRNA → Query (intenção transcrita do médico/paciente)
 * - tRNA → Retrieval (matching de codons/clínicas)
 * - Ribossomo (rRNA) → Este motor (assembly e síntese)
 * - Proteína → Resposta gerada (diagnóstico/conduta)
 */
export async function medicalRAGPipeline(
  query: string,
  documents: RAGDocument[],
  options: {
    topK?: number;
    maxContextChars?: number;
    llmGenerator?: LLMGenerator;
    agentName?: string;
  } = {},
): Promise<RAGQueryResult> {
  const {
    topK = 5,
    maxContextChars = MAX_CONTEXT_CHARS,
    llmGenerator,
  } = options;

  // ─── STAGE 1: PREPARE DOCUMENTS ───
  const preparedDocs: RetrievalDocument[] = documents.map(doc => ({
    ...doc,
    titleTokens: tokenize(doc.title),
    contentTokens: tokenize(doc.content),
    sourceTokens: tokenize(doc.source),
  }));

  // ─── STAGE 2: COMPUTE TF-IDF ───
  const queryTokens = tokenize(query);
  const queryNgrams = generateNgrams(queryTokens, 2);

  const allDocTokens = preparedDocs.map(d => [...d.titleTokens, ...d.contentTokens]);
  const idf = computeIDF(allDocTokens);
  const avgDL = allDocTokens.reduce((s, t) => s + t.length, 0) / (allDocTokens.length || 1);

  // ─── STAGE 3: BM25 RETRIEVAL ───
  const contentTFs = preparedDocs.map(d => computeTF(d.contentTokens));
  const titleTFs = preparedDocs.map(d => computeTF(d.titleTokens));
  const sourceTFs = preparedDocs.map(d => computeTF(d.sourceTokens));

  const scored = preparedDocs
    .map((doc, idx) => ({
      ...doc,
      bm25Score: bm25Score(queryTokens, doc.contentTokens, contentTFs[idx], idf, avgDL)
        + bm25Score(queryTokens, doc.titleTokens, titleTFs[idx], idf, avgDL) * 2
        + bm25Score(queryTokens, doc.sourceTokens, sourceTFs[idx], idf, avgDL) * 0.5,
    }))
    .filter(d => d.bm25Score > 0)
    .sort((a, b) => b.bm25Score - a.bm25Score)
    .slice(0, topK * 3);

  // ─── STAGE 4: CROSS-ENCODER RERANKING ───
  const reranked = rerank(query, queryTokens, queryNgrams, scored)
    .sort((a, b) => b.rerankScore - a.rerankScore)
    .slice(0, topK);

  // ─── STAGE 5: CONTEXT ASSEMBLY ───
  const assembled = assembleContext(reranked, maxContextChars);

  // ─── STAGE 6: GENERATION ───
  let answer: string;

  if (assembled.formattedContext) {
    if (llmGenerator) {
      try {
        answer = await llmGenerator(assembled.formattedContext, query);
      } catch (err) {
        console.error('[RAG Médico] Erro na geração LLM:', err);
        answer = generateClinicalSummary(query, assembled.sources);
      }
    } else {
      answer = generateClinicalSummary(query, assembled.sources);
    }
  } else {
    answer = 'Nenhum resultado encontrado na base de conhecimento médico. Tente perguntar sobre: protocolo DIMHEX, câncer de mama, oncologia torácica, biomarcadores, imunoterapia, quimioterapia, diagnóstico molecular.';
  }

  return {
    query,
    answer,
    retrieved: assembled.sources,
    contextLength: assembled.totalChars,
    pipeline: {
      documentsScanned: documents.length,
      retrieved: scored.length,
      reranked: reranked.length,
      contextChars: assembled.totalChars,
    },
  };
}

/**
 * Gera resumo clínico offline quando LLM não está disponível
 */
function generateClinicalSummary(
  query: string,
  results: Array<{ title: string; agent: string; score: number; chunkType?: string }>,
): string {
  if (results.length === 0) return 'Sem resultados clínicos relevantes.';

  const sections = results.slice(0, 5).map((r, i) => {
    return `**[${i + 1}] ${r.agent}** — ${r.title} (score: ${r.score})`;
  }).join('\n');

  return `## Resultados RAG Médico (Modo Offline)\n\n**Query:** ${query}\n\n${sections}\n\n_Fonte: Base de conhecimento com os 15 especialistas PhD do AI_Doctor. Ative LLM (Gemini) para respostas sintetizadas e recomendações clínicas._`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE BASE — Base de Conhecimento Médico Pré-carregada
// ═══════════════════════════════════════════════════════════════════════════════

export const MEDICAL_KNOWLEDGE_BASE: RAGDocument[] = [
  {
    id: 'dimhex_protocol',
    title: 'Protocolo DIMHEX v4 — Diagnóstico Molecular Híbrido Expressivo',
    content: 'O Protocolo DIMHEX (Diagnóstico Molecular Híbrido Expressivo) é um framework de 6 camadas para diagnóstico oncológico de precisão. Camada 1: Coleta e triagem de dados moleculares (NGS, FFPE, liquid biopsy). Camada 2: Análise computacional multi-ômica (genômica, transcriptômica, proteômica). Camada 3: Integração com agentes especialistas PhD para deliberação em consenso. Camada 4: Validação cruzada com bases PubMed e guidelines NCCN/ESMO. Camada 5: Geração de relatório com recomendações terapêuticas personalizadas. Camada 6: Monitoramento contínuo e adaptação do plano terapêutico. O protocolo suporta 38+ subtipos de câncer e integra com RAG v4 para busca em tempo real na literatura.',
    source: 'Protocolo DIMHEX v4',
    agentName: 'Dr. Atlas (Oncologista Molecular)',
    agentSlug: 'dr_atlas',
    chunkType: 'protocol',
    specialty: 'Oncologia Molecular',
  },
  {
    id: 'breast_cancer_guideline',
    title: 'Câncer de Mama — Diretrizes NCCN 2024',
    content: 'Câncer de Mama triplo-negativo (TNBC): Avaliar expressão de PD-L1 (CPS >= 10) para pembrolizumab + quimioterapia neoadjuvante. BRCA mutado: considerar olaparibe adjuvante. HR+/HER2-: endocrinoterapia adjuvante por 5-10 anos (tamoxifeno ou inibidor de aromatase). HER2+: trastuzumab + pertuzumab + quimioterapia (regime TCH-P). Estágio IV: palbociclib + letrozol como primeira-linha hormonal. Biomarcadores essenciais: RE, RP, HER2, Ki-67, PD-L1, NGS panel (BRCA1/2, PIK3CA, ESR1).',
    source: 'NCCN Guidelines 2024',
    agentName: 'Dra. Elara (Oncologista Mama)',
    agentSlug: 'dra_elara',
    chunkType: 'clinical_guideline',
    specialty: 'Oncologia Mamária',
  },
  {
    id: 'lung_cancer_immunotherapy',
    title: 'Imunoterapia no Câncer de Pulmão NSCLC',
    content: 'NSCLC não-pequenas células: PD-L1 >= 50%: pembrolizumab monoterapia em primeira-linha. PD-L1 1-49%: pembrolizumab + quimioterapia (carboplatina + pemetrexede ou carboplatina + paclitaxel). EGFR/ALK/ROS1 positivo: TKI direcionado como primeira-linha antes de imunoterapia. Segunda-linha: docetaxel + ramucirumabe ou nivolumabe. Testar TMB (tumor mutational burden) e NGS para identificar alvos terapêuticos. Pacientes nunca-fumantes com adenocarcinoma: testar obrigatoriamente EGFR, ALK, ROS1, BRAF, KRAS G12C, MET, RET, NTRK.',
    source: 'ESMO/ASCO Guidelines 2024',
    agentName: 'Dr. Kai (Oncologista Torácico)',
    agentSlug: 'dr_kai',
    chunkType: 'clinical_guideline',
    specialty: 'Oncologia Torácica',
  },
  {
    id: 'molecular_diagnostics',
    title: 'Diagnóstico Molecular — NGS e Biomarcadores',
    content: 'Painéis NGS oncológicos cobrem genes essenciais: TP53, BRCA1/2, PIK3CA, EGFR, ALK, ROS1, BRAF, KRAS, NRAS, HER2/ERBB2, MET, RET, NTRK1/2/3, MSI-H/dMMR, TMB. Técnica de amostragem: tecido FFPE (bloco de parafina) ou biópsia líquida (ctDNA). Vantagens da biópsia líquida: minimamente invasiva, monitoramento de resistência, detecção precoce de recidiva. NGSIon Torrent, Illumina, ou plataformas baseadas em hibridização captura. Tempo de turnaround: 7-14 dias. Sensibilidade: >= 5% VAF para detecção de mutações somáticas.',
    source: 'Revisão de Literatura',
    agentName: 'Dra. Vex (Patologista Molecular)',
    agentSlug: 'dra_vex',
    chunkType: 'research_paper',
    specialty: 'Patologia Molecular',
  },
  {
    id: 'dimhex_rag_integration',
    title: 'DIMHEX + RAG v4 — Busca em Tempo Real na Literatura',
    content: 'A integração DIMHEX com RAG v4 permite busca em tempo real nas bases PubMed e Google Scholar. O pipeline utiliza TF-IDF para indexação, BM25 para scoring, cross-encoder para re-ranking, e LLM (Gemini) para síntese. O sistema cobre 38+ subtipos de câncer com busca semântica em português e inglês. Cada resultado é atribuído a um dos 15 especialistas PhD para garantia de qualidade. A atualização da base é feita via scheduler que monitora novos artigos relevantes.',
    source: 'AI_Doctor RAG v4',
    agentName: 'Dr. Nexus (Arquiteto de IA)',
    agentSlug: 'dr_nexus',
    chunkType: 'protocol',
    specialty: 'Inteligência Artificial Médica',
  },
  {
    id: 'pharmacogenomics',
    title: 'Farmacogenômica em Oncologia — Guia Prático',
    content: 'DPYD: Testar antes de fluoropirimidinas (5-FU, capecitabina). Deficiência completa: contraindicado. Deficiência parcial: redução de 50% da dose. UGT1A1*28: Testar antes de irinotecano. Homozigoto *28/*28: reduzir dose em 30-50%. CYP2D6: Metabolismo de tamoxifeno. Metabolizador lento: considerar alternativa (inibidor de aromatase). G6PD: Testar antes de rasburicase. Deficiente: contraindicado. HLA-B*57:01: Abacavir — testar obrigatoriamente, positivo = contraindicado. Implementação em workflow clínico: pedido automatizado baseado na prescrição de medicamentos de alta-risk.',
    source: 'CPIC Guidelines',
    agentName: 'Dra. Mika (Farmacêutica Clínica)',
    agentSlug: 'dra_mika',
    chunkType: 'drug_info',
    specialty: 'Farmacogenômica',
  },
];
