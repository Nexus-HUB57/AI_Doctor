/**
 * Telemedicine Endpoints
 * Humanized dialogue system for patient support
 */

import express from 'express';

export function setupTelemedicineEndpoints(app: express.Application, getGemini: any) {
  
  // ========== CONSENSUS RESPONSE ==========
  
  app.post('/api/telemedicine/consensus-response', async (req, res) => {
    try {
      const { patient_message, conversation_history = [], context } = req.body;
      const client = getGemini();

      // System prompt focused on hope and support
      const systemPrompt = `You are a compassionate medical consensus team representing 15 PhD specialists in oncology.
Your role is to:
1. LISTEN with empathy and understanding
2. PROVIDE scientific evidence in accessible language
3. INSTILL HOPE based on real medical advances
4. NEVER prescribe or conduct - only orient and support
5. EMPHASIZE that cure is within reach with modern medicine
6. TRANSLATE complex science into human hope

Always:
- Acknowledge the patient's emotions
- Provide evidence-based information
- Highlight real success stories and statistics
- Offer next steps and resources
- End with hope and encouragement

Remember: You are not just providing information, you are offering hope backed by science.`;

      const userPrompt = `Patient message: "${patient_message}"

Please respond with:
1. A warm, compassionate main message (2-3 sentences)
2. 3-4 key scientific points
3. A hope indicator (0-100)
4. Evidence strength assessment
5. 2-3 practical next steps
6. Perspectives from relevant specialists
7. Emotional support message

Format as JSON with these fields:
{
  "main_message": "...",
  "key_points": ["...", "..."],
  "hope_indicator": 85,
  "evidence_strength": "Alta|Moderada|Baixa",
  "next_steps": ["...", "..."],
  "specialist_insights": [{"specialty": "...", "perspective": "..."}],
  "emotional_support": "...",
  "resources": ["...", "..."]
}`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.8
        }
      });

      const responseText = response.text || '{}';
      let parsedResponse;
      
      try {
        parsedResponse = JSON.parse(responseText);
      } catch {
        parsedResponse = generateDefaultConsensusResponse(patient_message);
      }

      res.json({
        success: true,
        data: parsedResponse
      });

    } catch (error: any) {
      console.error('Error in consensus response:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ========== EMOTION ANALYSIS ==========
  
  app.post('/api/telemedicine/analyze-emotion', async (req, res) => {
    try {
      const { message } = req.body;
      const client = getGemini();

      const prompt = `Analyze the emotional tone of this patient message and return only one word: hopeful, fearful, curious, desperate, or neutral.

Message: "${message}"

Return only the emotion word, nothing else.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { temperature: 0.3 }
      });

      const tone = response.text?.toLowerCase().trim() || 'neutral';
      const validTones = ['hopeful', 'fearful', 'curious', 'desperate', 'neutral'];
      const finalTone = validTones.includes(tone) ? tone : 'neutral';

      res.json({
        success: true,
        tone: finalTone
      });

    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ========== HOPE MESSAGE ==========
  
  app.post('/api/telemedicine/hope-message', async (req, res) => {
    try {
      const { topic, evidence_level } = req.body;
      const client = getGemini();

      const prompt = `Generate a brief, hopeful message about "${topic}" in oncology.
Evidence level: ${evidence_level}% (0=low, 100=high)

The message should:
1. Acknowledge the topic's importance
2. Highlight real scientific advances
3. Emphasize that cure is possible
4. Be warm and human, not clinical
5. Be 2-3 sentences maximum

Generate only the message, no formatting.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are a compassionate medical communicator who instills hope through science.',
          temperature: 0.8
        }
      });

      res.json({
        success: true,
        message: response.text || 'Sua pergunta é importante e merece esperança fundamentada em ciência.'
      });

    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ========== SPECIALIST PERSPECTIVES ==========
  
  app.post('/api/telemedicine/specialist-perspectives', async (req, res) => {
    try {
      const { question, specialties = [] } = req.body;
      const client = getGemini();

      const defaultSpecialties = [
        'Imunooncologia',
        'Oncologia Molecular',
        'Nanotecnologia',
        'Oncologia Clínica'
      ];

      const relevantSpecialties = specialties.length > 0 ? specialties : defaultSpecialties;

      const prompt = `For the patient question: "${question}"

Provide perspectives from these specialties: ${relevantSpecialties.join(', ')}

Format as JSON:
{
  "perspectives": [
    {"specialty": "Specialty Name", "perspective": "Brief perspective (2-3 sentences)"},
    ...
  ]
}

Each perspective should:
1. Be from that specialist's viewpoint
2. Offer hope and encouragement
3. Explain why this specialty is relevant
4. Highlight advances in this area`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7
        }
      });

      const responseText = response.text || '{"perspectives": []}';
      let parsedResponse;
      
      try {
        parsedResponse = JSON.parse(responseText);
      } catch {
        parsedResponse = { perspectives: [] };
      }

      res.json({
        success: true,
        perspectives: parsedResponse.perspectives || []
      });

    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ========== SUPPORT RESOURCES ==========
  
  app.post('/api/telemedicine/support-resources', async (req, res) => {
    try {
      const { situation } = req.body;

      const resources = [
        'Associação de Pacientes com Câncer - www.apcc.org.br',
        'Instituto Nacional de Câncer (INCA) - www.inca.gov.br',
        'Grupo de Apoio Psicológico - Psico-Oncologia',
        'Ensaios Clínicos Disponíveis - ClinicalTrials.gov',
        'Comunidades Online de Pacientes - Rede de Esperança',
        'Suporte Nutricional Especializado',
        'Programa de Reabilitação Pós-Tratamento',
        'Acesso a Segunda Opinião Médica'
      ];

      res.json({
        success: true,
        resources
      });

    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ========== SESSION SUMMARY ==========
  
  app.post('/api/telemedicine/session-summary', async (req, res) => {
    try {
      const { conversation } = req.body;
      const client = getGemini();

      const conversationText = conversation
        .map((msg: any) => `${msg.type}: ${msg.content}`)
        .join('\n');

      const prompt = `Summarize this patient-doctor conversation:

${conversationText}

Provide:
1. A brief summary (2-3 sentences)
2. Key learnings for the patient (3 points)
3. Action items (2-3 items)
4. Final hope score (0-100)

Format as JSON:
{
  "summary": "...",
  "key_learnings": ["...", "..."],
  "action_items": ["...", "..."],
  "hope_score": 85
}`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7
        }
      });

      const responseText = response.text || '{}';
      let parsedResponse;
      
      try {
        parsedResponse = JSON.parse(responseText);
      } catch {
        parsedResponse = {
          summary: 'Conversa produtiva com foco em esperança e informação científica.',
          key_learnings: [],
          action_items: [],
          hope_score: 80
        };
      }

      res.json({
        success: true,
        summary: parsedResponse
      });

    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ========== EMERGENCY SUPPORT ==========
  
  app.get('/api/telemedicine/emergency-support', async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Se você está em crise ou tendo pensamentos prejudiciais, por favor procure ajuda imediatamente. Você não está sozinho.',
        resources: [
          'CVV (Centro de Valorização da Vida) - 188',
          'Emergência Médica - 192',
          'SAMU - 192',
          'Psicólogo de Plantão - Procure hospital mais próximo'
        ],
        hotlines: [
          {
            country: 'Brasil',
            number: '188',
            name: 'CVV - Centro de Valorização da Vida'
          },
          {
            country: 'Brasil',
            number: '192',
            name: 'Emergência Médica / SAMU'
          },
          {
            country: 'Brasil',
            number: '180',
            name: 'Disque Denúncia / Orientação'
          }
        ]
      });

    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ========== TRACK PROGRESS ==========
  
  app.post('/api/telemedicine/track-progress', async (req, res) => {
    try {
      const { session_id, metrics } = req.body;
      
      // TODO: Store in database
      console.log(`Session ${session_id} tracked:`, metrics);

      res.json({
        success: true,
        message: 'Progresso registrado com sucesso'
      });

    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

// Helper function
function generateDefaultConsensusResponse(message: string) {
  return {
    main_message: 'Sua pergunta é importante e reflete uma preocupação legítima. Queremos que você saiba que a medicina moderna oferece esperança real. Cada dia, novos avanços são feitos em oncologia, e você não está sozinho nesta jornada.',
    key_points: [
      'Avanços em imunoterapia aumentaram taxas de remissão significativamente',
      'Medicina de precisão permite tratamentos personalizados',
      'Suporte multidisciplinar melhora outcomes e qualidade de vida',
      'Esperança é fundamentada em evidência científica'
    ],
    hope_indicator: 85,
    evidence_strength: 'Alta',
    next_steps: [
      'Consultar com oncologista para avaliação completa',
      'Explorar opções de tratamento disponíveis',
      'Conectar-se com grupos de apoio'
    ],
    specialist_insights: [
      {
        specialty: 'Oncologia Clínica',
        perspective: 'Cada paciente é único, e cada caso oferece novas oportunidades de sucesso. Estamos aqui para oferecer o melhor cuidado possível.'
      },
      {
        specialty: 'Imunooncologia',
        perspective: 'As terapias imunológicas estão revolucionando o tratamento do câncer. Pacientes que há poucos anos teriam prognóstico reservado hoje têm oportunidades reais de remissão.'
      }
    ],
    emotional_support: 'Seu medo é válido, mas você tem força. Essa força, combinada com a medicina moderna, é poderosa. Você não está sozinho.',
    resources: [
      'Instituto Nacional de Câncer (INCA)',
      'Associação de Pacientes com Câncer',
      'Grupos de Apoio Psicológico',
      'Ensaios Clínicos Disponíveis'
    ]
  };
}
