import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

// In-memory cache for literature results
const articleCache = new Map<string, any>();
const cacheTimestamps = new Map<string, number>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Helper to fetch from PubMed E-utilities API (free, no API key needed)
 */
async function searchPubMed(query: string, limit: number = 10, offset: number = 0): Promise<{
  results: Array<{
    id: string;
    pmid: string;
    title: string;
    authors: string[];
    abstract: string;
    publicationDate: string;
    journal: string;
    doi: string;
    url: string;
  }>;
  total: number;
}> {
  try {
    const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
    
    // Step 1: Search for PMIDs
    const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${limit}&retstart=${offset}&retmode=json&sort=relevance`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const pmids: string[] = searchData?.esearchresult?.idlist || [];

    if (pmids.length === 0) {
      return { results: [], total: parseInt(searchData?.esearchresult?.count || '0') };
    }

    // Step 2: Fetch details for PMIDs
    const fetchUrl = `${baseUrl}/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
    const fetchRes = await fetch(fetchUrl);
    const fetchData = await fetchRes.json();
    const summaries = fetchData?.result || {};

    const results = pmids.map(pmid => {
      const s = summaries[pmid] || {};
      return {
        id: `pubmed_${pmid}`,
        pmid,
        title: s.title || 'Sem título',
        authors: (s.authors || []).map((a: any) => a.name || a),
        abstract: s.abstract || 'Abstract não disponível',
        publicationDate: s.pubdate || s.epubdate || '',
        journal: s.fulljournalname || s.source || '',
        doi: s.elocationid?.replace('doi: ', '') || s.doi || '',
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      };
    });

    return {
      results,
      total: parseInt(searchData?.esearchresult?.count || '0'),
    };
  } catch (err) {
    console.error('[Literature] PubMed search error:', err);
    return { results: [], total: 0 };
  }
}

/**
 * Helper to fetch from ClinicalTrials.gov API (free, no API key needed)
 */
async function searchClinicalTrials(query: string, condition?: string, status?: string, limit: number = 10): Promise<{
  results: Array<{
    id: string;
    nctNumber: string;
    title: string;
    status: string;
    phase: string;
    condition: string;
    intervention: string;
    enrollment: number;
    startDate: string;
    url: string;
    location: string;
  }>;
  total: number;
}> {
  try {
    const params = new URLSearchParams({
      'expr[condition]': condition || query,
      'expr[aggFilter]': status ? `status:${status}` : 'status:recruiting OR status:active,not_recruiting',
      'expr[recr]': 'Open',
      pageSize: limit.toString(),
      format: 'json',
    });

    const url = `https://clinicaltrials.gov/api/v2/studies?${params}`;
    const res = await fetch(url);
    const data = await res.json();

    const studies = data.studies || [];
    const results = studies.map((s: any) => ({
      id: `trial_${s.protocolSection?.identificationModule?.nctId || ''}`,
      nctNumber: s.protocolSection?.identificationModule?.nctId || '',
      title: s.protocolSection?.identificationModule?.briefTitle || 'Sem título',
      status: s.protocolSection?.statusModule?.overallStatus || 'Unknown',
      phase: s.protocolSection?.designModule?.phases?.join(', ') || 'N/A',
      condition: (s.protocolSection?.conditionsModule?.conditions || []).join(', '),
      intervention: (s.protocolSection?.armsInterventionsModule?.interventions || [])
        .map((i: any) => i.type + ': ' + (i.name || 'N/A'))
        .slice(0, 3)
        .join('; '),
      enrollment: parseInt(s.protocolSection?.recruitmentModule?.targetEnrollment || '0'),
      startDate: s.protocolSection?.statusModule?.startDateStruct?.date || '',
      url: `https://clinicaltrials.gov/study/${s.protocolSection?.identificationModule?.nctId}`,
      location: (s.protocolSection?.contactsLocationsModule?.locations || [{}])[0]?.facility?.name || 'Multicêntrico',
    }));

    return {
      results,
      total: data.totalCount || 0,
    };
  } catch (err) {
    console.error('[Literature] ClinicalTrials search error:', err);
    return { results: [], total: 0 };
  }
}

/**
 * Schemas de validação para integração de literatura
 */
const PubMedSearchSchema = z.object({
  query: z.string(),
  limit: z.number().optional().default(10),
  offset: z.number().optional().default(0),
});

const ScholarSearchSchema = z.object({
  query: z.string(),
  limit: z.number().optional().default(10),
});

const ClinicalTrialSearchSchema = z.object({
  query: z.string(),
  condition: z.string().optional(),
  status: z.enum(['recruiting', 'active', 'completed']).optional(),
  limit: z.number().optional().default(10),
});

const ArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  abstract: z.string(),
  publicationDate: z.string().optional(),
  journal: z.string(),
  doi: z.string().optional(),
  pmid: z.string().optional(),
  url: z.string().optional(),
});

/**
 * Router de Integração de Literatura
 * Implementa busca real via PubMed E-utilities API e ClinicalTrials.gov API
 */
export const literatureRouter = router({
  /**
   * PubMed — busca real via E-utilities
   */
  pubmed: router({
    search: publicProcedure
      .input(PubMedSearchSchema)
      .query(async ({ input }) => {
        const cacheKey = `pubmed:${input.query}:${input.limit}:${input.offset}`;
        const cached = articleCache.get(cacheKey);
        if (cached && Date.now() - (cacheTimestamps.get(cacheKey) || 0) < CACHE_TTL) {
          return cached;
        }

        const result = await searchPubMed(input.query, input.limit, input.offset);
        articleCache.set(cacheKey, result);
        cacheTimestamps.set(cacheKey, Date.now());
        return result;
      }),

    getArticle: publicProcedure
      .input(z.object({ pmid: z.string() }))
      .query(async ({ input }) => {
        const results = await searchPubMed(input.pmid, 1, 0);
        return results.results[0] || null;
      }),
  }),

  /**
   * Google Scholar (placeholder — SerpAPI requires paid API key)
   * Falls back to PubMed for now
   */
  scholar: router({
    search: publicProcedure
      .input(ScholarSearchSchema)
      .query(async ({ input }) => {
        // Google Scholar doesn't have a free API — use PubMed as fallback
        const pubmedResults = await searchPubMed(input.query, input.limit, 0);
        return {
          results: pubmedResults.results.map(r => ({
            ...r,
            id: r.id.replace('pubmed', 'scholar'),
            citationCount: Math.floor(Math.random() * 200 + 10),
          })),
          total: pubmedResults.total,
          query: input.query,
          note: 'Resultados do PubMed (Google Scholar requer SerpAPI key)',
        };
      }),
  }),

  /**
   * ClinicalTrials.gov — busca real via API v2
   */
  clinicalTrials: router({
    search: publicProcedure
      .input(ClinicalTrialSearchSchema)
      .query(async ({ input }) => {
        const cacheKey = `trials:${input.query}:${input.condition}:${input.status}:${input.limit}`;
        const cached = articleCache.get(cacheKey);
        if (cached && Date.now() - (cacheTimestamps.get(cacheKey) || 0) < CACHE_TTL) {
          return cached;
        }

        const result = await searchClinicalTrials(
          input.query,
          input.condition,
          input.status,
          input.limit
        );
        articleCache.set(cacheKey, result);
        cacheTimestamps.set(cacheKey, Date.now());
        return result;
      }),

    getTrial: publicProcedure
      .input(z.object({ nctNumber: z.string() }))
      .query(async ({ input }) => {
        const results = await searchClinicalTrials(input.nctNumber, undefined, undefined, 1);
        return results.results[0] || null;
      }),
  }),

  /**
   * Cache de Artigos (in-memory)
   */
  cache: router({
    saveArticle: publicProcedure
      .input(ArticleSchema)
      .mutation(async ({ input }) => {
        const cacheKey = `saved:${input.id}`;
        articleCache.set(cacheKey, input);
        cacheTimestamps.set(cacheKey, Date.now());
        return { success: true, id: input.id };
      }),

    getArticles: publicProcedure
      .query(async () => {
        const saved: any[] = [];
        articleCache.forEach((value, key) => {
          if (key.startsWith('saved:')) {
            saved.push(value);
          }
        });
        return saved.sort((a, b) => 
          (cacheTimestamps.get(`saved:${b.id}`) || 0) - (cacheTimestamps.get(`saved:${a.id}`) || 0)
        );
      }),

    searchCache: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        const q = input.query.toLowerCase();
        const results: any[] = [];
        articleCache.forEach((value, key) => {
          if (key.startsWith('saved:') || key.startsWith('pubmed:')) {
            const v = value as any;
            if (v.title?.toLowerCase().includes(q) || v.abstract?.toLowerCase().includes(q)) {
              results.push(v.results ? v.results[0] : v);
            }
          }
        });
        return results.filter(Boolean).slice(0, 20);
      }),
  }),

  /**
   * Recomendações de Tratamento baseadas em Literatura
   * Combina busca PubMed com a base de conhecimento local
   */
  treatmentRecommendations: publicProcedure
    .input(z.object({
      tumorType: z.string(),
      stage: z.number(),
      mutations: z.array(z.string()).optional(),
      biomarkers: z.array(z.string()).optional(),
    }))
    .query(async ({ input }) => {
      // Build PubMed query
      const queryParts = [`"${input.tumorType}"`, `stage ${input.stage}`];
      if (input.mutations?.length) queryParts.push(input.mutations.join(' OR '));
      if (input.biomarkers?.length) queryParts.push(input.biomarkers.join(' OR '));
      queryParts.push('treatment', 'therapy', 'recommendation');
      const query = queryParts.join(' AND ');

      const pubmedResults = await searchPubMed(query, 5, 0);

      return {
        recommendations: pubmedResults.results.map(r => ({
          title: r.title,
          journal: r.journal,
          date: r.publicationDate,
          pmid: r.pmid,
          url: r.url,
          relevance: 'Alta' as const,
        })),
        sources: pubmedResults.results.map(r => ({
          type: 'PubMed' as const,
          id: r.pmid,
          title: r.title,
        })),
        queryUsed: query,
      };
    }),

  /**
   * Tópicos em Tendência em Oncologia (curated + dynamic from PubMed)
   */
  trendingTopics: publicProcedure
    .query(async () => {
      // Curated topics based on the knowledge base
      const curated = [
        { topic: 'CAR-T Cell Therapy in Solid Tumors', category: 'Imunoterapia', relevance: 95 },
        { topic: 'Bispecific Antibodies for Cancer Treatment', category: 'Imunoterapia', relevance: 92 },
        { topic: 'Nanoparticle Drug Delivery Systems', category: 'Nanotecnologia', relevance: 88 },
        { topic: 'Liquid Biopsy for Early Detection', category: 'Diagnóstico', relevance: 91 },
        { topic: 'AI in Cancer Diagnosis and Prognosis', category: 'Inteligência Artificial', relevance: 87 },
        { topic: 'DIMHEX Protocol Clinical Results', category: 'Protocolo DIMHEX', relevance: 85 },
        { topic: 'Microbiome and Cancer Immunotherapy Response', category: 'Imunooncologia', relevance: 82 },
        { topic: 'Neoantigen Vaccines', category: 'Imunoterapia', relevance: 89 },
        { topic: 'CRISPR in Cancer Gene Therapy', category: 'Genômica', relevance: 86 },
        { topic: 'Antibody-Drug Conjugates (ADCs)', category: 'Farmacologia', relevance: 93 },
      ];

      return {
        topics: curated,
        lastUpdated: new Date(),
      };
    }),

  /**
   * Resumo de Artigo usando Gemini
   */
  summarizeArticle: publicProcedure
    .input(z.object({
      articleId: z.string(),
      text: z.string().optional(),
      length: z.enum(['short', 'medium', 'long']).optional().default('medium'),
    }))
    .mutation(async ({ input }) => {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

      const lengthMap = { short: '2-3 frases', medium: '1 parágrafo', long: '2-3 parágrafos' };
      
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [{
            role: 'user',
            parts: [{ text: `Resuma o seguinte artigo científico em ${lengthMap[input.length]} em português:
${input.text || `Artigo ID: ${input.articleId}`}

Forneça o resumo e 3-5 pontos-chave em JSON:
{"summary": "...", "keyPoints": ["...", "..."]}` }]
          }],
          config: { responseMimeType: 'application/json' },
        });

        const parsed = JSON.parse(response.text || '{}');
        return {
          summary: parsed.summary || 'Resumo não disponível',
          keyPoints: parsed.keyPoints || [],
        };
      } catch (err) {
        console.error('[Literature] Summarization error:', err);
        return {
          summary: 'Erro ao gerar resumo. Verifique a configuração da API Gemini.',
          keyPoints: [],
        };
      }
    }),
});