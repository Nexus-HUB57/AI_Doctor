import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import {
  generateTreatmentRecommendation,
  queryOncology,
  analyzeMutations,
  analyzeBiomarkers,
  analyzeDIMHEX,
  predictTreatmentResponse,
  predictToxicity,
  recommendImmunotherapy,
  recommendNanotherapy,
  recommendComplementaryMedicine,
  type TreatmentRecommendationInput,
} from '../../src/services/gemini-service';

/**
 * Schemas de validação para RAG
 */
const OncologyQuerySchema = z.object({
  query: z.string(),
  context: z.object({
    tumorType: z.string().optional(),
    stage: z.number().optional(),
    mutations: z.array(z.string()).optional(),
    biomarkers: z.array(z.string()).optional(),
  }).optional(),
});

const TreatmentRecommendationSchema = z.object({
  patientId: z.string(),
  tumorType: z.string(),
  stage: z.union([z.number(), z.string()]),
  mutations: z.array(z.string()).optional(),
  biomarkers: z.array(z.string()).optional(),
  previousTreatments: z.array(z.string()).optional(),
  comorbidities: z.array(z.string()).optional(),
  patientAge: z.number().optional(),
  performanceStatus: z.string().optional(),
});

/**
 * Router RAG (Retrieval-Augmented Generation)
 * Implementa procedimentos para consultas aumentadas com base de conhecimento
 */
export const ragRouter = router({
  /**
   * Consulta Geral de Oncologia
   * Busca na base de conhecimento e aumenta com contexto do paciente
   */
  oncologyQuery: publicProcedure
    .input(OncologyQuerySchema)
    .mutation(async ({ input }) => {
      console.log('Processing oncology query:', input);
      return await queryOncology(input.query, input.context);
    }),

  /**
   * Recomendação de Tratamento
   * Gera recomendações personalizadas baseadas em perfil do paciente
   */
  recommendTreatment: publicProcedure
    .input(TreatmentRecommendationSchema)
    .mutation(async ({ input }) => {
      console.log('Generating treatment recommendation:', input);
      
      try {
        const recommendation = await generateTreatmentRecommendation({
          tumorType: input.tumorType,
          stage: input.stage,
          mutations: input.mutations,
          biomarkers: input.biomarkers,
          previousTreatments: input.previousTreatments,
          patientAge: input.patientAge,
          performanceStatus: input.performanceStatus,
        });
        
        return recommendation;
      } catch (error) {
        console.error('Error in recommendTreatment:', error);
        throw new Error('Falha ao gerar recomendação de tratamento');
      }
    }),

  /**
   * Análise de Mutações
   * Analisa impacto de mutações genéticas no tratamento
   */
  analyzeMutations: publicProcedure
    .input(z.object({
      mutations: z.array(z.string()),
      tumorType: z.string(),
    }))
    .mutation(async ({ input }) => {
      console.log('Analyzing mutations:', input);
      const result = await analyzeMutations(input.mutations, input.tumorType);
      return {
        analysis: result.analysis,
        implications: result.therapeuticImplications,
        treatmentOptions: result.therapeuticImplications,
        confidenceScore: result.predictiveValue,
      };
    }),

  /**
   * Análise de Biomarcadores
   * Interpreta biomarcadores e suas implicações clínicas
   */
  analyzeBiomarkers: publicProcedure
    .input(z.object({
      biomarkers: z.array(z.object({
        type: z.string(),
        value: z.number(),
        unit: z.string(),
      })),
      tumorType: z.string(),
    }))
    .mutation(async ({ input }) => {
      console.log('Analyzing biomarkers:', input);
      const result = await analyzeBiomarkers(input.biomarkers, input.tumorType);
      return result;
    }),

  /**
   * Protocolo DIMHEX
   * Análise específica do protocolo DIMHEX para imunoterapia ex vivo
   */
  analyzeDIMHEX: publicProcedure
    .input(z.object({
      patientProfile: z.object({
        tumorType: z.string(),
        stage: z.number(),
        immuneProfile: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      console.log('Analyzing DIMHEX protocol:', input);
      const result = await analyzeDIMHEX(input.patientProfile);
      return result;
    }),

  /**
   * Predição de Resposta ao Tratamento
   * Prediz probabilidade de resposta ao tratamento
   */
  predictTreatmentResponse: publicProcedure
    .input(z.object({
      treatment: z.string(),
      patientProfile: z.object({
        tumorType: z.string(),
        stage: z.number(),
        mutations: z.array(z.string()).optional(),
        biomarkers: z.array(z.string()).optional(),
        age: z.number().optional(),
        comorbidities: z.array(z.string()).optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      console.log('Predicting treatment response:', input);
      const result = await predictTreatmentResponse(input);
      return result;
    }),

  /**
   * Predição de Toxicidade
   * Prediz risco de toxicidade para um tratamento específico
   */
  predictToxicity: publicProcedure
    .input(z.object({
      treatment: z.string(),
      patientProfile: z.object({
        age: z.number(),
        comorbidities: z.array(z.string()).optional(),
        organFunction: z.object({
          hepatic: z.string().optional(),
          renal: z.string().optional(),
          cardiac: z.string().optional(),
        }).optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      console.log('Predicting toxicity:', input);
      const result = await predictToxicity(input);
      return result;
    }),

  /**
   * Recomendação de Imunoterapia
   * Recomenda estratégias de imunoterapia
   */
  recommendImmunotherapy: publicProcedure
    .input(z.object({
      tumorType: z.string(),
      stage: z.number(),
      immuneProfile: z.string().optional(),
      previousTreatments: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      console.log('Recommending immunotherapy:', input);
      const result = await recommendImmunotherapy(input);
      return result;
    }),

  /**
   * Recomendação de Nanoterapia
   * Recomenda aplicações de nanotecnologia em tratamento
   */
  recommendNanotherapy: publicProcedure
    .input(z.object({
      tumorType: z.string(),
      stage: z.number(),
      targetMolecules: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      console.log('Recommending nanotherapy:', input);
      const result = await recommendNanotherapy(input);
      return result;
    }),

  /**
   * Recomendação de Medicina Complementar
   * Recomenda terapias complementares baseadas em evidências
   */
  recommendComplementaryMedicine: publicProcedure
    .input(z.object({
      tumorType: z.string(),
      primaryTreatment: z.string(),
      patientPreferences: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      console.log('Recommending complementary medicine:', input);
      const result = await recommendComplementaryMedicine(input);
      return result;
    }),
});
