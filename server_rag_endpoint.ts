// RAG Endpoint for Oncology Knowledge Base
// This endpoint integrates with the knowledge base to provide AI-assisted responses

import fs from 'fs';
import path from 'path';

/**
 * RAG Endpoint for Oncology Queries
 * POST /api/rag/oncology-query
 * 
 * Request body:
 * {
 *   query: string,
 *   context: 'diagnosis' | 'treatment' | 'prognosis' | 'side_effects' | 'alternative_medicine',
 *   patientData?: {
 *     age: number,
 *     tumorType: string,
 *     stage: string,
 *     mutations: string[],
 *     priorTreatments: string[]
 *   }
 * }
 */
export async function setupRAGEndpoint(app: any, getGemini: any) {
  
  // Load knowledge base
  const knowledgeBasePath = path.join(process.cwd(), 'rag_knowledge_base.md');
  let knowledgeBase = '';
  
  try {
    knowledgeBase = fs.readFileSync(knowledgeBasePath, 'utf-8');
  } catch (err) {
    console.warn('Knowledge base file not found, RAG will use general knowledge');
  }

  app.post('/api/rag/oncology-query', async (req: any, res: any) => {
    try {
      const { query, context = 'treatment', patientData } = req.body;
      
      if (!query || query.trim().length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Query is required' 
        });
      }

      const client = getGemini();

      // Build context-aware prompt
      const systemPrompt = buildSystemPrompt(context, patientData);
      const augmentedPrompt = buildAugmentedPrompt(query, context, knowledgeBase, patientData);

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: augmentedPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        }
      });

      const responseText = response.text || 'Unable to generate response';

      res.json({
        success: true,
        query,
        context,
        response: responseText,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Error in RAG query:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error processing RAG query'
      });
    }
  });

  // Endpoint for retrieving specific knowledge sections
  app.post('/api/rag/retrieve-section', async (req: any, res: any) => {
    try {
      const { section } = req.body;
      
      const sections: Record<string, string> = {
        'immunotherapy': extractSection(knowledgeBase, '## 1. Imunoterapia Moderna'),
        'nanotechnology': extractSection(knowledgeBase, '## 2. Nanotecnologia em Oncologia'),
        'alternative_medicine': extractSection(knowledgeBase, '## 3. Medicina Alternativa e Complementar'),
        'diagnosis': extractSection(knowledgeBase, '## 4. Diagnóstico Avançado'),
        'dimhex': extractSection(knowledgeBase, '## 5. Protocolo DIMHEX'),
        'algorithms': extractSection(knowledgeBase, '## 6. Algoritmos de Predição'),
        'clinical_trials': extractSection(knowledgeBase, '## 7. Estudos Clínicos em Andamento'),
        'recommendations': extractSection(knowledgeBase, '## 8. Recomendações para Seleção de Terapia')
      };

      const content = sections[section] || 'Section not found';

      res.json({
        success: true,
        section,
        content,
        length: content.length
      });

    } catch (error: any) {
      console.error('Error retrieving section:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Endpoint for treatment recommendation
  app.post('/api/rag/recommend-treatment', async (req: any, res: any) => {
    try {
      const { 
        tumorType, 
        stage, 
        mutations = [], 
        priorTreatments = [],
        patientAge,
        performanceStatus
      } = req.body;

      const client = getGemini();

      const prompt = `Based on the knowledge base of advanced oncology treatments, provide a personalized treatment recommendation for:

Tumor Type: ${tumorType}
Stage: ${stage}
Mutations: ${mutations.join(', ') || 'Not specified'}
Prior Treatments: ${priorTreatments.join(', ') || 'None'}
Patient Age: ${patientAge || 'Not specified'}
Performance Status: ${performanceStatus || 'Not specified'}

Consider:
1. Standard of care treatments
2. Immunotherapy options (CAR-T, checkpoint inhibitors, bispecific antibodies)
3. Nanotechnology-based approaches
4. Complementary and alternative medicine options
5. Clinical trial eligibility
6. Potential side effects and management

Provide a comprehensive, evidence-based recommendation with references to the knowledge base.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert oncologist with deep knowledge of advanced cancer therapies, including immunotherapy, nanotechnology, and integrative medicine. Provide evidence-based recommendations.',
          temperature: 0.8,
        }
      });

      res.json({
        success: true,
        recommendation: response.text || 'Unable to generate recommendation',
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Error generating treatment recommendation:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

// Helper functions

function buildSystemPrompt(context: string, patientData?: any): string {
  let prompt = 'You are an expert oncologist with deep knowledge of advanced cancer therapies, including immunotherapy, nanotechnology, and integrative medicine. ';
  
  switch (context) {
    case 'diagnosis':
      prompt += 'Focus on diagnostic approaches, biomarkers, and early detection methods.';
      break;
    case 'treatment':
      prompt += 'Focus on treatment options, including conventional, immunotherapy, and alternative approaches.';
      break;
    case 'prognosis':
      prompt += 'Focus on prognostic factors, survival rates, and outcome prediction.';
      break;
    case 'side_effects':
      prompt += 'Focus on managing side effects and improving quality of life.';
      break;
    case 'alternative_medicine':
      prompt += 'Focus on complementary and alternative medicine approaches with scientific evidence.';
      break;
    default:
      prompt += 'Provide comprehensive, evidence-based information.';
  }

  if (patientData) {
    prompt += ` Patient profile: ${JSON.stringify(patientData)}`;
  }

  return prompt;
}

function buildAugmentedPrompt(query: string, context: string, knowledgeBase: string, patientData?: any): string {
  let prompt = `Context: ${context}\n\n`;
  
  if (patientData) {
    prompt += `Patient Data:\n${JSON.stringify(patientData, null, 2)}\n\n`;
  }

  prompt += `Knowledge Base (relevant sections):\n${knowledgeBase.substring(0, 5000)}\n\n`;
  
  prompt += `User Query: ${query}\n\n`;
  
  prompt += `Please provide a comprehensive, evidence-based response based on the knowledge base and your expertise. Include:
1. Direct answer to the query
2. Relevant scientific evidence
3. Clinical considerations
4. Recommendations
5. References to the knowledge base where applicable`;

  return prompt;
}

function extractSection(content: string, sectionHeader: string): string {
  const startIndex = content.indexOf(sectionHeader);
  if (startIndex === -1) return '';

  let endIndex = content.indexOf('\n## ', startIndex + 1);
  if (endIndex === -1) endIndex = content.length;

  return content.substring(startIndex, endIndex).trim();
}
