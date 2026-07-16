import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

/**
 * Tipos de usuário e suas permissões (RBAC)
 */
export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  RESEARCHER = 'researcher',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * Configurações de autenticação
 */
const JWT_SECRET = process.env.JWT_SECRET || 'ai-doctor-dev-secret-key-2024';
const JWT_EXPIRATION = '24h';
const SALT_ROUNDS = 10;

/**
 * Schemas de validação
 */
export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum([UserRole.PATIENT, UserRole.DOCTOR, UserRole.RESEARCHER]),
});

export const ChangePasswordSchema = z.object({
  userId: z.string(),
  currentPassword: z.string(),
  newPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Senhas não correspondem',
  path: ['confirmPassword'],
});

/**
 * Hash de senha
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Comparar senha com hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Gerar JWT token
 */
export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 horas
  };

  return jwt.sign(payload, JWT_SECRET);
}

/**
 * Verificar e decodificar JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extrair token do header Authorization
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

/**
 * Extrair token do query param ou header
 */
export function extractToken(authHeader?: string, queryToken?: string): string | null {
  return extractTokenFromHeader(authHeader) || queryToken || null;
}

/**
 * Permissões por papel
 */
export const rolePermissions: Record<UserRole, string[]> = {
  [UserRole.PATIENT]: [
    'read:own_data',
    'read:diagnoses',
    'read:treatments',
    'read:recommendations',
    'write:feedback',
    'read:telemedicine',
    'read:files',
    'upload:files',
  ],
  [UserRole.DOCTOR]: [
    'read:all_patients',
    'write:diagnoses',
    'write:treatments',
    'write:recommendations',
    'read:research',
    'write:medical_board',
    'read:analytics',
    'read:files',
    'upload:files',
    'download:files',
    'delete:files',
  ],
  [UserRole.RESEARCHER]: [
    'read:all_data',
    'read:research',
    'write:research',
    'read:analytics',
    'export:data',
    'read:genomic_data',
    'read:files',
    'upload:files',
    'download:files',
  ],
  [UserRole.ADMIN]: [
    'admin:all',
    'manage:users',
    'manage:roles',
    'manage:system',
    'read:logs',
    'manage:s3',
  ],
};

/**
 * Verificar se usuário tem permissão específica
 */
export function hasPermissionTo(userRole: UserRole, permission: string): boolean {
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission) || permissions.includes('admin:all');
}

/**
 * Mock de banco de dados de usuários (em produção, usar banco de dados real)
 */
const users: Map<string, User> = new Map();

/**
 * Criar novo usuário
 */
export async function createUser(
  email: string,
  name: string,
  password: string,
  role: UserRole = UserRole.PATIENT
): Promise<User> {
  if (users.has(email)) {
    throw new Error('Usuário já existe com este email');
  }

  const passwordHash = await hashPassword(password);
  const user: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    email,
    name,
    role,
    passwordHash,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  };

  users.set(email, user);
  return user;
}

/**
 * Buscar usuário por email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return users.get(email) || null;
}

/**
 * Buscar usuário por ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  for (const user of users.values()) {
    if (user.id === userId) {
      return user;
    }
  }
  return null;
}

/**
 * Atualizar usuário
 */
export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  for (const [email, user] of users.entries()) {
    if (user.id === userId) {
      const updated = { ...user, ...updates, updatedAt: new Date() };
      users.set(email, updated);
      return updated;
    }
  }
  return null;
}

/**
 * Listar todos os usuários (apenas para admin)
 */
export async function listUsers(): Promise<Omit<User, 'passwordHash'>[]> {
  return Array.from(users.values()).map(({ passwordHash: _, ...rest }) => rest);
}

/**
 * Deletar usuário
 */
export async function deleteUser(userId: string): Promise<boolean> {
  for (const [email, user] of users.entries()) {
    if (user.id === userId) {
      users.delete(email);
      return true;
    }
  }
  return false;
}

/**
 * Autenticar requisição via token
 */
export async function authenticateRequest(authHeader?: string, queryToken?: string): Promise<JWTPayload | null> {
  const token = extractToken(authHeader, queryToken);
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Seed de usuários para desenvolvimento
 */
export async function seedUsers() {
  try {
    await createUser('patient@example.com', 'João Silva', 'password123', UserRole.PATIENT);
    await createUser('doctor@example.com', 'Dra. Maria Santos', 'password123', UserRole.DOCTOR);
    await createUser('researcher@example.com', 'Prof. Carlos Oliveira', 'password123', UserRole.RESEARCHER);
    await createUser('admin@example.com', 'Admin System', 'admin123', UserRole.ADMIN);
    console.log('✓ Usuários de teste criados com sucesso');
  } catch (error) {
    console.log('Usuários de teste já existem ou erro ao criar:', error);
  }
}