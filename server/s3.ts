import { z } from 'zod';

/**
 * Schemas de validação para S3
 */
export const FileUploadSchema = z.object({
  fileName: z.string().min(1, 'Nome do arquivo é obrigatório'),
  fileType: z.string().min(1, 'Tipo de arquivo é obrigatório'),
  fileBuffer: z.string(), // base64
  userId: z.string(),
  category: z.enum(['reports', 'genomic_data', 'medical_records', 'research_data']),
});

export const FileDeleteSchema = z.object({
  fileKey: z.string(),
  userId: z.string(),
});

export const FileDownloadSchema = z.object({
  fileKey: z.string(),
  userId: z.string(),
  expirationSeconds: z.number().optional().default(3600),
});

export const FileListSchema = z.object({
  userId: z.string(),
  category: z.enum(['reports', 'genomic_data', 'medical_records', 'research_data']).optional(),
});

export interface S3FileMetadata {
  key: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
  category: string;
  isEncrypted: boolean;
  buffer?: string; // base64 encoded content (mock)
}

/**
 * Mock de armazenamento S3 (em produção, usar AWS SDK)
 * Armazena arquivos em memória para desenvolvimento
 */
const fileStore: Map<string, S3FileMetadata> = new Map();

/**
 * Gerar chave de arquivo segura
 */
export function generateFileKey(userId: string, category: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${category}/${userId}/${timestamp}_${sanitizedFileName}`;
}

/**
 * Upload de arquivo (mock S3)
 * Em produção, usar AWS SDK v3 para upload real
 */
export async function uploadFile(params: {
  fileBuffer: string; // base64
  fileName: string;
  fileType: string;
  userId: string;
  category: string;
}): Promise<S3FileMetadata> {
  const { fileBuffer, fileName, fileType, userId, category } = params;
  const fileKey = generateFileKey(userId, category, fileName);

  // Decodificar base64 para calcular tamanho
  const bufferData = Buffer.from(fileBuffer, 'base64');
  const fileSize = bufferData.length;

  const metadata: S3FileMetadata = {
    key: fileKey,
    fileName,
    fileType,
    fileSize,
    uploadedBy: userId,
    uploadedAt: new Date(),
    category,
    isEncrypted: true, // Sempre criptografado (AES-256 em produção)
    buffer: fileBuffer, // Mock: armazenar buffer em memória
  };

  fileStore.set(fileKey, metadata);
  console.log(`✓ Arquivo armazenado: ${fileKey} (${formatFileSize(fileSize)})`);

  return metadata;
}

/**
 * Download de arquivo (mock S3)
 */
export async function downloadFile(fileKey: string, userId: string): Promise<{ buffer: string; metadata: S3FileMetadata }> {
  const file = fileStore.get(fileKey);
  if (!file) {
    throw new Error('Arquivo não encontrado');
  }

  // Verificar se o usuário tem acesso ao arquivo
  if (!file.key.includes(`/${userId}/`) && file.uploadedBy !== userId) {
    throw new Error('Acesso negado ao arquivo');
  }

  return {
    buffer: file.buffer || '',
    metadata: { ...file, buffer: undefined },
  };
}

/**
 * Gerar URL pré-assinada para download (mock)
 * Em produção, usar S3 getSignedUrl
 */
export async function generatePresignedDownloadUrl(
  fileKey: string,
  userId: string,
  expirationSeconds: number = 3600
): Promise<string> {
  const file = fileStore.get(fileKey);
  if (!file) {
    throw new Error('Arquivo não encontrado');
  }

  // Verificar se o usuário tem acesso
  if (!file.key.includes(`/${userId}/`) && file.uploadedBy !== userId) {
    throw new Error('Acesso negado ao arquivo');
  }

  // Em produção, retornar URL pré-assinada real do S3
  // Para desenvolvimento, retornar URL de API local
  const expiresAt = Date.now() + (expirationSeconds * 1000);
  return `data:${file.fileType};base64,${file.buffer || ''}#expires=${expiresAt}`;
}

/**
 * Listar arquivos de um usuário por categoria
 */
export async function listUserFiles(
  userId: string,
  category?: string
): Promise<S3FileMetadata[]> {
  const files: S3FileMetadata[] = [];

  for (const [, file] of fileStore.entries()) {
    const matchesUser = file.key.includes(`/${userId}/`);
    const matchesCategory = !category || file.category === category;

    if (matchesUser && matchesCategory) {
      files.push({ ...file, buffer: undefined }); // Não enviar buffer na listagem
    }
  }

  // Ordenar por data de upload (mais recente primeiro)
  files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  return files;
}

/**
 * Deletar arquivo
 */
export async function deleteFile(fileKey: string, userId: string): Promise<boolean> {
  const file = fileStore.get(fileKey);
  if (!file) {
    throw new Error('Arquivo não encontrado');
  }

  // Verificar se o usuário tem acesso
  if (!file.key.includes(`/${userId}/`) && file.uploadedBy !== userId) {
    throw new Error('Acesso negado ao arquivo');
  }

  fileStore.delete(fileKey);
  console.log(`✓ Arquivo deletado: ${fileKey}`);
  return true;
}

/**
 * Obter metadados do arquivo
 */
export async function getFileMetadata(fileKey: string): Promise<S3FileMetadata | null> {
  const file = fileStore.get(fileKey);
  if (!file) return null;
  return { ...file, buffer: undefined };
}

/**
 * Formatar tamanho de arquivo
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Informações sobre a configuração S3 para exibição
 */
export function getS3ConfigInfo() {
  return {
    provider: 'Mock S3 (desenvolvimento)',
    encryption: 'AES-256 (simulado)',
    accessLevel: 'private',
    maxFileSize: '100MB',
    allowedCategories: ['reports', 'genomic_data', 'medical_records', 'research_data'],
    note: 'Em produção, configurar AWS S3 com credenciais reais',
  };
}