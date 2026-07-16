import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import {
  uploadFile,
  downloadFile,
  generatePresignedDownloadUrl,
  listUserFiles,
  deleteFile,
  getS3ConfigInfo,
} from '../s3';

/**
 * Router de S3 - Gerenciamento de arquivos
 */
export const s3Router = router({
  /**
   * Fazer upload de arquivo
   */
  uploadFile: publicProcedure
    .input(z.object({
      fileName: z.string().min(1, 'Nome do arquivo é obrigatório'),
      fileType: z.string().min(1, 'Tipo do arquivo é obrigatório'),
      fileBuffer: z.string(), // base64 encoded
      category: z.enum(['reports', 'genomic_data', 'medical_records', 'research_data']),
      userId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error('Não autenticado');
      }

      // Verificar se o userId do input corresponde ao usuário autenticado
      if (ctx.user.role !== 'admin' && ctx.user.userId !== input.userId) {
        throw new Error('Acesso negado');
      }

      // Validar tamanho (100MB max em base64 ~ 133MB string)
      if (input.fileBuffer.length > 133_000_000) {
        throw new Error('Arquivo excede o tamanho máximo de 100MB');
      }

      try {
        const metadata = await uploadFile({
          fileBuffer: input.fileBuffer,
          fileName: input.fileName,
          fileType: input.fileType,
          userId: input.userId,
          category: input.category,
        });

        return {
          success: true,
          file: {
            key: metadata.key,
            url: `/trpc/s3.generateDownloadUrl?fileKey=${encodeURIComponent(metadata.key)}&userId=${input.userId}`,
            fileName: metadata.fileName,
            fileSize: metadata.fileSize,
            uploadedAt: metadata.uploadedAt,
            category: metadata.category,
            isEncrypted: metadata.isEncrypted,
          },
        };
      } catch (error) {
        throw new Error((error as Error).message || 'Erro ao fazer upload do arquivo');
      }
    }),

  /**
   * Gerar URL de download pré-assinada
   */
  generateDownloadUrl: publicProcedure
    .input(z.object({
      fileKey: z.string(),
      userId: z.string(),
      expirationSeconds: z.number().optional().default(3600),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error('Não autenticado');
      }

      if (ctx.user.role !== 'admin' && ctx.user.userId !== input.userId) {
        throw new Error('Acesso negado');
      }

      try {
        const downloadUrl = await generatePresignedDownloadUrl(
          input.fileKey,
          input.userId,
          input.expirationSeconds
        );

        return {
          success: true,
          downloadUrl,
          expiresIn: input.expirationSeconds,
        };
      } catch (error) {
        throw new Error((error as Error).message || 'Erro ao gerar URL de download');
      }
    }),

  /**
   * Listar arquivos do usuário
   */
  listFiles: publicProcedure
    .input(z.object({
      userId: z.string(),
      category: z.enum(['reports', 'genomic_data', 'medical_records', 'research_data']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error('Não autenticado');
      }

      if (ctx.user.role !== 'admin' && ctx.user.userId !== input.userId) {
        throw new Error('Acesso negado');
      }

      try {
        const files = await listUserFiles(input.userId, input.category);
        return { success: true, files };
      } catch (error) {
        throw new Error((error as Error).message || 'Erro ao listar arquivos');
      }
    }),

  /**
   * Deletar arquivo
   */
  deleteFile: publicProcedure
    .input(z.object({
      fileKey: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error('Não autenticado');
      }

      if (ctx.user.role !== 'admin' && ctx.user.userId !== input.userId) {
        throw new Error('Acesso negado');
      }

      try {
        await deleteFile(input.fileKey, input.userId);
        return { success: true, message: 'Arquivo deletado com sucesso' };
      } catch (error) {
        throw new Error((error as Error).message || 'Erro ao deletar arquivo');
      }
    }),

  /**
   * Informações de configuração S3
   */
  configInfo: publicProcedure
    .query(() => {
      return { success: true, config: getS3ConfigInfo() };
    }),

  /**
   * Categorias disponíveis para upload
   */
  categories: publicProcedure
    .query(() => {
      return {
        success: true,
        categories: [
          { value: 'reports', label: 'Relatórios Clínicos', description: 'Laudos, pareceres e relatórios médicos' },
          { value: 'genomic_data', label: 'Dados Genômicos', description: 'Sequências genômicas e dados moleculares' },
          { value: 'medical_records', label: 'Registros Médicos', description: 'Prontuários e históricos clínicos' },
          { value: 'research_data', label: 'Dados de Pesquisa', description: 'Datasets e resultados de estudos' },
        ],
      };
    }),
});