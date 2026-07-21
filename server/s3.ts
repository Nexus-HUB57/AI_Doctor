import { z } from 'zod';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl as getPresignedUrl } from '@aws-sdk/s3-request-presigner';

// ── Validation Schemas ──────────────────────────────────────────
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
}

// ── S3 Client (real AWS or fallback mock) ────────────────────────
let s3Client: S3Client | null = null;
let s3Bucket: string | null = null;

function isRealS3Configured(): boolean {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.S3_BUCKET);
}

function getS3Client(): S3Client {
  if (!s3Client) {
    if (!isRealS3Configured()) {
      throw new Error('[S3] AWS credentials not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET.');
    }
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    s3Bucket = process.env.S3_BUCKET!;
    console.log(`[S3] Real AWS S3 client initialized — bucket: ${s3Bucket}, region: ${process.env.AWS_REGION || 'us-east-1'}`);
  }
  return s3Client;
}

function getBucket(): string {
  if (!s3Bucket) {
    if (!process.env.S3_BUCKET) throw new Error('[S3] S3_BUCKET not configured.');
    s3Bucket = process.env.S3_BUCKET;
  }
  return s3Bucket;
}

// ── Mock Store (fallback when no AWS credentials) ───────────────
const mockStore: Map<string, { metadata: S3FileMetadata; buffer: string }> = new Map();

// ── Utility Functions ───────────────────────────────────────────
export function generateFileKey(userId: string, category: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${category}/${userId}/${timestamp}_${sanitizedFileName}`;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function validateBase64Buffer(fileBuffer: string): Buffer {
  let bufferData: Buffer;
  try {
    bufferData = Buffer.from(fileBuffer, 'base64');
  } catch {
    throw new Error('Buffer de arquivo inválido (base64 malformado)');
  }
  if (bufferData.length === 0) {
    throw new Error('Buffer de arquivo vazio');
  }
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB for real S3
  if (bufferData.length > MAX_FILE_SIZE) {
    throw new Error(`Arquivo excede o limite de ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
  return bufferData;
}

function validateFileAccess(fileKey: string, userId: string): void {
  const normalizedKey = fileKey.replace(/\/+/g, '/');
  if (!normalizedKey.includes(`/${userId}/`)) {
    throw new Error('Acesso negado ao arquivo');
  }
}

// ── Upload ──────────────────────────────────────────────────────
export async function uploadFile(params: {
  fileBuffer: string;
  fileName: string;
  fileType: string;
  userId: string;
  category: string;
}): Promise<S3FileMetadata> {
  const { fileBuffer, fileName, fileType, userId, category } = params;
  const fileKey = generateFileKey(userId, category, fileName);
  const bufferData = validateBase64Buffer(fileBuffer);

  if (isRealS3Configured()) {
    // Real AWS S3 upload
    const client = getS3Client();
    await client.send(new PutObjectCommand({
      Bucket: getBucket(),
      Key: fileKey,
      Body: bufferData,
      ContentType: fileType,
      ServerSideEncryption: 'AES256',
      Metadata: {
        'uploaded-by': userId,
        'category': category,
        'original-filename': fileName,
      },
    }));
    console.log(`[S3] File uploaded to AWS: ${fileKey} (${formatFileSize(bufferData.length)})`);
  } else {
    // Mock fallback
    const metadata: S3FileMetadata = {
      key: fileKey, fileName, fileType,
      fileSize: bufferData.length, uploadedBy: userId,
      uploadedAt: new Date(), category, isEncrypted: false,
    };
    mockStore.set(fileKey, { metadata, buffer: fileBuffer });
    console.log(`[S3] File stored in-memory (mock): ${fileKey} (${formatFileSize(bufferData.length)})`);
  }

  return {
    key: fileKey, fileName, fileType,
    fileSize: bufferData.length, uploadedBy: userId,
    uploadedAt: new Date(), category,
    isEncrypted: isRealS3Configured(),
  };
}

// ── Download ────────────────────────────────────────────────────
export async function downloadFile(fileKey: string, userId: string): Promise<{ buffer: Buffer; metadata: S3FileMetadata }> {
  validateFileAccess(fileKey, userId);

  if (isRealS3Configured()) {
    const client = getS3Client();
    const response = await client.send(new GetObjectCommand({
      Bucket: getBucket(),
      Key: fileKey,
    }));
    const buffer = Buffer.from(await response.Body!.transformToByteArray());
    return {
      buffer,
      metadata: {
        key: fileKey,
        fileName: (response.Metadata?.['original-filename'] || fileKey.split('/').pop() || fileKey),
        fileType: response.ContentType || 'application/octet-stream',
        fileSize: buffer.length,
        uploadedBy: response.Metadata?.['uploaded-by'] || '',
        uploadedAt: response.LastModified || new Date(),
        category: response.Metadata?.['category'] || '',
        isEncrypted: true,
      },
    };
  }

  // Mock fallback
  const entry = mockStore.get(fileKey);
  if (!entry) throw new Error('Arquivo não encontrado');
  return {
    buffer: Buffer.from(entry.buffer, 'base64'),
    metadata: entry.metadata,
  };
}

// ── Presigned Download URL ──────────────────────────────────────
export async function generatePresignedDownloadUrl(
  fileKey: string,
  userId: string,
  expirationSeconds: number = 3600
): Promise<string> {
  validateFileAccess(fileKey, userId);

  if (isRealS3Configured()) {
    const client = getS3Client();
    const url = await getPresignedUrl(client, new GetObjectCommand({
      Bucket: getBucket(),
      Key: fileKey,
    }), { expiresIn: expirationSeconds });
    return url;
  }

  // Mock fallback — API download URL
  const expiresAt = Date.now() + (expirationSeconds * 1000);
  return `/api/files/download?key=${encodeURIComponent(fileKey)}&expires=${expiresAt}&sig=${Buffer.from(`${fileKey}:${expiresAt}`).toString('base64url')}`;
}

// ── List Files ──────────────────────────────────────────────────
export async function listUserFiles(userId: string, category?: string): Promise<S3FileMetadata[]> {
  const prefix = `${userId}/`;

  if (isRealS3Configured()) {
    const client = getS3Client();
    const response = await client.send(new ListObjectsV2Command({
      Bucket: getBucket(),
      Prefix: category ? `${category}/${prefix}` : prefix,
      MaxKeys: 1000,
    }));

    return (response.Contents || []).map(obj => ({
      key: obj.Key!,
      fileName: obj.Key!.split('/').pop() || obj.Key!,
      fileType: 'application/octet-stream',
      fileSize: obj.Size || 0,
      uploadedBy: userId,
      uploadedAt: obj.LastModified || new Date(),
      category: obj.Key!.split('/')[0] || '',
      isEncrypted: true,
    })).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  // Mock fallback
  const files: S3FileMetadata[] = [];
  for (const [, entry] of mockStore.entries()) {
    const matchesUser = entry.metadata.key.includes(`/${userId}/`);
    const matchesCategory = !category || entry.metadata.category === category;
    if (matchesUser && matchesCategory) {
      files.push(entry.metadata);
    }
  }
  return files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

// ── Delete File ─────────────────────────────────────────────────
export async function deleteFile(fileKey: string, userId: string): Promise<boolean> {
  validateFileAccess(fileKey, userId);

  if (isRealS3Configured()) {
    const client = getS3Client();
    await client.send(new DeleteObjectCommand({ Bucket: getBucket(), Key: fileKey }));
    console.log(`[S3] File deleted from AWS: ${fileKey}`);
    return true;
  }

  const existed = mockStore.delete(fileKey);
  if (existed) console.log(`[S3] File deleted from mock: ${fileKey}`);
  return existed;
}

// ── Get Metadata ────────────────────────────────────────────────
export async function getFileMetadata(fileKey: string): Promise<S3FileMetadata | null> {
  if (isRealS3Configured()) {
    try {
      const client = getS3Client();
      const response = await client.send(new GetObjectCommand({
        Bucket: getBucket(),
        Key: fileKey,
        Range: 'bytes=0-0', // HEAD request equivalent
      }));
      return {
        key: fileKey,
        fileName: response.Metadata?.['original-filename'] || fileKey.split('/').pop() || fileKey,
        fileType: response.ContentType || 'application/octet-stream',
        fileSize: response.ContentLength || 0,
        uploadedBy: response.Metadata?.['uploaded-by'] || '',
        uploadedAt: response.LastModified || new Date(),
        category: response.Metadata?.['category'] || '',
        isEncrypted: true,
      };
    } catch {
      return null;
    }
  }

  const entry = mockStore.get(fileKey);
  return entry ? entry.metadata : null;
}

// ── Config Info ─────────────────────────────────────────────────
export function getS3ConfigInfo() {
  if (isRealS3Configured()) {
    return {
      provider: 'AWS S3',
      encryption: 'AES-256 (server-side)',
      accessLevel: 'private',
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.S3_BUCKET,
      maxFileSize: '100MB',
      allowedCategories: ['reports', 'genomic_data', 'medical_records', 'research_data'],
    };
  }
  return {
    provider: 'Mock S3 (in-memory)',
    encryption: 'none (dev mode)',
    accessLevel: 'private',
    maxFileSize: '10MB',
    allowedCategories: ['reports', 'genomic_data', 'medical_records', 'research_data'],
    note: 'Configure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET for production.',
  };
}