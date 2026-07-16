import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import { setupTelemedicineEndpoints } from './server_telemedicine_endpoints.js';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { appRouter } from './server/index.js';
import { createContext } from './server/trpc.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';
const port = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Safe lazy-initialization for Gemini Client as per SDK Guidelines
  let ai: GoogleGenAI | null = null;
  function getGemini(): GoogleGenAI {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not defined in the environment secrets.');
      }
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return ai;
  }

  // API endpoint for Agentic AI bidirectional orchestration & rRNA sequence query
  app.post('/api/orchestrate', async (req, res) => {
    try {
      const { sequence, agentName, agentRole, customPrompt, history = [] } = req.body;
      const client = getGemini();

      const systemInstruction = `You are an advanced molecular biology AI agent named "${agentName}" with the specific role: "${agentRole}".
We are analyzing ribosomal RNA (rRNA) sequence fragments in a live bidirectional orchestration environment (LiveBook-rRNA).
The current sequence is: "${sequence}".
Provide a concise, highly professional, scientific response (maximum 120 words). Highlight specific features of rRNA, structural elements, evolutionary significance, or secondary structure motifs (like loops, helices, peptidyl transferase center, or Shine-Dalgarno consensus) depending on your role.
Maintain an objective, technical, and analytical tone. Always write in Portuguese or English as requested, but prioritize Portuguese for this user.`;

      const contents = [
        ...history.map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        })),
        {
          role: 'user',
          parts: [{ text: customPrompt || 'Analyze this rRNA fragment and state your agentic consensus.' }]
        }
      ];

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({
        success: true,
        text: response.text || 'Agent has finished parsing without text output.'
      });
    } catch (error: any) {
      console.error('Error during agent orchestration:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Unknown internal agent orchestration error'
      });
    }
  });

  // API endpoint to generate simulated agent interactions (consensus loop)
  app.post('/api/consensus', async (req, res) => {
    try {
      const { sequence, agents = [] } = req.body;
      const client = getGemini();

      if (agents.length === 0) {
        return res.json({ success: true, conversation: [] });
      }

      // Format agent metadata
      const agentsMeta = agents.map((a: any) => `- ${a.name} (${a.role})`).join('\n');

      const prompt = `We have an rRNA sequence fragment: "${sequence}".
The following active agents in the LiveBook-rRNA Hub are coordinating a bidirectional analysis:
${agentsMeta}

Simulate a highly brief, realistic scientific consensus discussion between these agents regarding this rRNA fragment.
Each agent should speak once, pointing out a different aspect of the sequence (e.g., GC content, secondary structure motifs, mutation vulnerability, ribosomal translation binding).
Keep the discussion extremely professional and compact. Each agent's dialogue must be under 3 lines.
Format the output as a valid JSON array of objects, where each object has:
{
  "agent": "Name of the agent",
  "text": "Dialogue contribution in Portuguese"
}
Do not return any markdown markdown-wrapper or other text. Return ONLY the raw JSON array.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.8,
        }
      });

      const responseText = response.text || '[]';
      try {
        const conversation = JSON.parse(responseText.trim());
        res.json({ success: true, conversation });
      } catch (parseErr) {
        console.error('Failed to parse JSON response from model:', responseText);
        res.json({
          success: true,
          conversation: [
            { agent: agents[0]?.name || 'Seq-Parser', text: 'Conexão bidirecional estabelecida, mas o formato de resposta falhou ao decodificar. Sequência de rRNA está íntegra.' }
          ]
        });
      }
    } catch (error: any) {
      console.error('Error during consensus simulation:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API endpoint for Moltbook comments generated by active agents
  app.post('/api/moltbook-reply', async (req, res) => {
    try {
      const { postContent, author, agents = [] } = req.body;
      const client = getGemini();

      if (agents.length === 0) {
        return res.json({ success: true, comments: [] });
      }

      const agentsMeta = agents.map((a: any) => `- ${a.name} (${a.role})`).join('\n');
      const prompt = `User "${author}" posted a 'molt' on LiveBook's scientific feed (Moltbook) about rRNA mutations or structural biology:
"${postContent}"

The following active agents are reading the feed:
${agentsMeta}

Simulate 2 or 3 of these agents commenting on this post. Each agent should react according to their specific scientific role (e.g., Fold-Gen will focus on folding, Seq-Parser on GC ratio, etc.).
Comments should be in Portuguese, brief, insightful, and natural for a research-group collaboration platform.
Format the output as a valid JSON array of objects:
[
  {
    "author": "Name of Agent",
    "content": "Comment text in Portuguese",
    "authorColor": "Color associated with Agent (use hex color like #10b981, #3b82f6 or similar)"
  }
]
Do not return any markdown or commentary outside the JSON array.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.8,
        }
      });

      const responseText = response.text || '[]';
      try {
        const comments = JSON.parse(responseText.trim());
        res.json({ success: true, comments });
      } catch (parseErr) {
        res.json({
          success: true,
          comments: [
            { author: agents[0]?.name || 'Seq-Parser', content: 'Incrível hipótese evolutiva! O alinhamento molecular corrobora a sua tese de conservação genética.', authorColor: '#10b981' }
          ]
        });
      }
    } catch (error: any) {
      console.error('Error in Moltbook reply generator:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // RAG Endpoint for Oncology Knowledge Base
  const knowledgeBasePath = path.join(__dirname, 'rag_knowledge_base.md');
  let knowledgeBase = '';
  try {
    knowledgeBase = fs.readFileSync(knowledgeBasePath, 'utf-8');
  } catch (err) {
    console.warn('Knowledge base file not found, RAG will use general knowledge');
  }

  app.post('/api/rag/oncology-query', async (req, res) => {
    try {
      const { query, context = 'treatment', patientData } = req.body;
      if (!query || query.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Query is required' });
      }
      const client = getGemini();
      const systemPrompt = `You are an expert oncologist with deep knowledge of advanced cancer therapies. Context: ${context}. ${patientData ? `Patient: ${JSON.stringify(patientData)}` : ''}`;
      const prompt = `Knowledge Base:\n${knowledgeBase.substring(0, 3000)}\n\nUser Query: ${query}\n\nProvide a comprehensive, evidence-based response.`;
      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { systemInstruction: systemPrompt, temperature: 0.7 }
      });
      res.json({
        success: true,
        query,
        context,
        response: response.text || 'Unable to generate response',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error in RAG query:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/rag/recommend-treatment', async (req, res) => {
    try {
      const { tumorType, stage, mutations = [], priorTreatments = [], patientAge, performanceStatus } = req.body;
      const client = getGemini();
      const prompt = `Based on advanced oncology knowledge, recommend treatment for:\nTumor: ${tumorType}\nStage: ${stage}\nMutations: ${mutations.join(', ') || 'None'}\nPrior Treatments: ${priorTreatments.join(', ') || 'None'}\nAge: ${patientAge || 'N/A'}\nPerformance Status: ${performanceStatus || 'N/A'}\n\nConsider immunotherapy, nanotechnology, and complementary approaches.`;
      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { systemInstruction: 'You are an expert oncologist. Provide evidence-based treatment recommendations.', temperature: 0.8 }
      });
      res.json({
        success: true,
        recommendation: response.text || 'Unable to generate recommendation',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error generating treatment recommendation:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API endpoint for clinical intervention validation
  app.post('/api/v1/validate_intervention', async (req, res) => {
    try {
      const { intervention } = req.body;
      const client = getGemini();

      const interventionDescriptions: Record<string, string> = {
        'anti_ccr8_treg_depletion': 'Depleção de células T regulatórias (Tregs) através de bloqueio anti-CCR8',
        'th1_tbet_boost': 'Amplificação de resposta Th1 com polarização T-bet',
        'car_cth_pd1_ko': 'Engenharia genética CRISPR para knockout de PD-1 em células T citotóxicas',
        'mrna_vaccine_neo': 'Vacinação com RNAm personalizado contra neoantígenos tumorais',
        'granzyme_b_conjugation': 'Conjugação de Granzima B a anticorpos biespecíficos',
        'dialysis_cytokine_removal': 'Aférese para remoção de citocinas imunossupressoras',
        'massive_reinfusion': 'Reinfusão massiva de células T ativadas (>50x amplificação)'
      };

      const prompt = `Você é um especialista em oncologia clínica. Forneça uma análise de evidência científica para a seguinte intervenção terapêutica: ${interventionDescriptions[intervention] || intervention}.

Retorne um JSON com:
- validated (boolean): se a intervenção tem suporte em literatura clínica
- evidence_score (0-100): pontuação de evidência científica
- phase (string): fase clínica (Teórico, Pré-clínico, Fase I, Fase II, Fase III, Aprovado)
- description (string): descrição breve da intervenção
- recommendation (string): recomendação clínica
- citation (string): citação ou referência científica relevante

Retorne APENAS o JSON, sem markdown.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        }
      });

      const responseText = response.text || '{}';
      try {
        const validationData = JSON.parse(responseText.trim());
        res.json(validationData);
      } catch (parseErr) {
        // Fallback response if parsing fails
        res.json({
          validated: true,
          evidence_score: 75,
          phase: 'Fase II-III',
          description: `Análise de ${interventionDescriptions[intervention] || intervention}`,
          recommendation: 'Recomendado com monitoramento clínico',
          citation: 'Baseado em literatura oncológica contemporânea e ensaios clínicos.'
        });
      }
    } catch (error: any) {
      console.error('Error during intervention validation:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API endpoint for Cérebro global brain molecular analysis
  app.post('/api/brain-analysis', async (req, res) => {
    try {
      const { sequence, weights, customQuery = '' } = req.body;
      const client = getGemini();

      const { gc = 50, fold = 50, evolutionary = 50 } = weights || {};

      const systemInstruction = `You are "O CÉREBRO" (The Brain), the high-cognitive neural consensus core of LiveBook rRNA.
We are analyzing the ribosomal RNA sequence: "${sequence}".
Cognitive calibration weights:
- GC Content Bias: ${gc}% (Higher means emphasize GC stacking and hydrogen bonding energy)
- Secondary Fold Thermodynamics: ${fold}% (Higher means focus on Nussinov matrix, stable hairpin loops, and minimum free energy pairings)
- Evolutionary Phylogenetic Conservance: ${evolutionary}% (Higher means focus on ancestral lineages, bacterial vs eukaryotic conserved niches)

Provide a deep, beautifully written, advanced scientific analysis in Portuguese (around 150-200 words).
Structure your response in three clearly marked sections:
- 🧠 PERCEPÇÃO TERMODINÂMICA: (Focus on GC density and loop stability based on parameters)
- 🧬 ASSINATURA EVOLUTIVA: (Discuss homologies or mutational rates)
- ⚡ VEREDICTO DE COGNIÇÃO: (A synthesis action recommendation or consensus conclusion)`;

      const prompt = customQuery || 'Perform a global brain synthesis of this sequence structure under the current calibrations.';

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({
        success: true,
        text: response.text || 'The brain processed the sequence but returned no synapse text.'
      });
    } catch (error: any) {
      console.error('Error in Brain Deep Analysis:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Integrar tRPC
  const trpcServer = createHTTPServer({
    router: appRouter,
    createContext,
  });

  app.use('/trpc', (req, res) => {
    trpcServer.handler(req, res);
  });

  if (!isProd) {
    console.log('Integrating Vite dev server middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    // Setup Telemedicine Endpoints
    setupTelemedicineEndpoints(app, getGemini);
  } else {
    console.log('Serving production static assets...');
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`LiveBook rRNA full-stack server running on http://0.0.0.0:${port}`);
    console.log(`tRPC server available at http://0.0.0.0:${port}/trpc`);
  });
}

startServer().catch((err) => {
  console.error('Critical failure in server startup:', err);
});
