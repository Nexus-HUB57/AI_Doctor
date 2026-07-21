import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { mysqlTable, varchar, boolean, timestamp } from 'drizzle-orm/mysql-core';

// ── Drizzle Schema ──────────────────────────────────────────────
const usersTable = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('patient'),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ── Types ──────────────────────────────────────────────────────
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

// ── Config ─────────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || (isProduction
  ? (() => { throw new Error('JWT_SECRET environment variable is required in production.'); })()
  : 'ai-doctor-dev-secret-key-2024'
);
const JWT_EXPIRATION = '24h';
const SALT_ROUNDS = 10;

// ── Validation Schemas ──────────────────────────────────────────
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

// ── Password Utilities ──────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── JWT Utilities ───────────────────────────────────────────────
export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
  };
  return jwt.sign(payload, JWT_SECRET);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error);
    return null;
  }
}

export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

export function extractToken(authHeader?: string, queryToken?: string): string | null {
  return extractTokenFromHeader(authHeader) || queryToken || null;
}

// ── RBAC Permissions ────────────────────────────────────────────
export const rolePermissions: Record<UserRole, string[]> = {
  [UserRole.PATIENT]: [
    'read:own_data', 'read:diagnoses', 'read:treatments',
    'read:recommendations', 'write:feedback', 'read:telemedicine',
    'read:files', 'upload:files',
  ],
  [UserRole.DOCTOR]: [
    'read:all_patients', 'write:diagnoses', 'write:treatments',
    'write:recommendations', 'read:research', 'write:medical_board',
    'read:analytics', 'read:files', 'upload:files',
    'download:files', 'delete:files',
  ],
  [UserRole.RESEARCHER]: [
    'read:all_data', 'read:research', 'write:research',
    'read:analytics', 'export:data', 'read:genomic_data',
    'read:files', 'upload:files', 'download:files',
  ],
  [UserRole.ADMIN]: [
    'admin:all', 'manage:users', 'manage:roles',
    'manage:system', 'read:logs', 'manage:s3',
  ],
};

export function hasPermissionTo(userRole: UserRole, permission: string): boolean {
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission) || permissions.includes('admin:all');
}

// ── MySQL Connection Pool ───────────────────────────────────────
let db: ReturnType<typeof drizzle> | null = null;
let pool: mysql.Pool | null = null;

function getDatabaseUrl(): string | null {
  return process.env.DATABASE_URL || null;
}

async function ensureDbConnection(): Promise<ReturnType<typeof drizzle>> {
  if (db) return db;

  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error('[AUTH] DATABASE_URL not set. Auth requires MySQL in production.');
  }

  pool = mysql.createPool(databaseUrl, {
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 30000,
  });

  db = drizzle(pool);
  console.log('[AUTH] MySQL connection established via drizzle-orm');
  return db;
}

// Graceful shutdown
export async function closeAuthDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
    console.log('[AUTH] MySQL connection pool closed');
  }
}

// ── Fallback in-memory store (dev only, no DATABASE_URL) ────────
const inMemoryUsers: Map<string, User> = new Map();

// ── CRUD Operations ─────────────────────────────────────────────

export async function createUser(
  email: string,
  name: string,
  password: string,
  role: UserRole = UserRole.PATIENT
): Promise<User> {
  const passwordHash = await hashPassword(password);
  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date();

  const databaseUrl = getDatabaseUrl();
  if (databaseUrl) {
    // MySQL path
    const orm = await ensureDbConnection();
    await orm.insert(usersTable).values({
      id,
      email,
      name,
      role,
      passwordHash,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`[AUTH] User created in MySQL: ${email}`);
  } else {
    // Fallback in-memory (dev only)
    if (inMemoryUsers.has(email)) {
      throw new Error('Usuário já existe com este email');
    }
    inMemoryUsers.set(email, {
      id, email, name, role, passwordHash,
      createdAt: now, updatedAt: now, isActive: true,
    });
    console.log(`[AUTH] User created in-memory (dev): ${email}`);
  }

  return {
    id, email, name, role, passwordHash,
    createdAt: now, updatedAt: now, isActive: true,
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const databaseUrl = getDatabaseUrl();
  if (databaseUrl) {
    const orm = await ensureDbConnection();
    const rows = await orm.select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role as UserRole,
      passwordHash: row.passwordHash,
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
      isActive: row.isActive as boolean,
    };
  }
  return inMemoryUsers.get(email) || null;
}

export async function getUserById(userId: string): Promise<User | null> {
  const databaseUrl = getDatabaseUrl();
  if (databaseUrl) {
    const orm = await ensureDbConnection();
    const rows = await orm.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role as UserRole,
      passwordHash: row.passwordHash,
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
      isActive: row.isActive as boolean,
    };
  }
  for (const user of inMemoryUsers.values()) {
    if (user.id === userId) return user;
  }
  return null;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  const databaseUrl = getDatabaseUrl();
  if (databaseUrl) {
    const orm = await ensureDbConnection();
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.passwordHash !== undefined) updateData.passwordHash = updates.passwordHash;

    await orm.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, userId));
    return getUserById(userId);
  }

  for (const [email, user] of inMemoryUsers.entries()) {
    if (user.id === userId) {
      const updated = { ...user, ...updates, updatedAt: new Date() };
      inMemoryUsers.set(email, updated);
      return updated;
    }
  }
  return null;
}

export async function listUsers(): Promise<Omit<User, 'passwordHash'>[]> {
  const databaseUrl = getDatabaseUrl();
  if (databaseUrl) {
    const orm = await ensureDbConnection();
    const rows = await orm.select().from(usersTable);
    return rows.map(({ passwordHash: _, ...rest }) => ({
      ...rest,
      createdAt: rest.createdAt as Date,
      updatedAt: rest.updatedAt as Date,
      isActive: rest.isActive as boolean,
    }));
  }
  return Array.from(inMemoryUsers.values()).map(({ passwordHash: _, ...rest }) => rest);
}

export async function deleteUser(userId: string): Promise<boolean> {
  const databaseUrl = getDatabaseUrl();
  if (databaseUrl) {
    const orm = await ensureDbConnection();
    const result = await orm.delete(usersTable).where(eq(usersTable.id, userId));
    return (result as unknown as { affectedRows: number }).affectedRows > 0;
  }
  for (const [email, user] of inMemoryUsers.entries()) {
    if (user.id === userId) {
      inMemoryUsers.delete(email);
      return true;
    }
  }
  return false;
}

// ── Request Authentication ──────────────────────────────────────
export async function authenticateRequest(authHeader?: string, queryToken?: string): Promise<JWTPayload | null> {
  const token = extractToken(authHeader, queryToken);
  if (!token) return null;
  return verifyToken(token);
}

// ── Seed Users (dev only) ──────────────────────────────────────
const SEED_USERS = [
  { email: 'patient@example.com', name: 'João Silva', password: 'password123', role: UserRole.PATIENT },
  { email: 'doctor@example.com', name: 'Dra. Maria Santos', password: 'password123', role: UserRole.DOCTOR },
  { email: 'researcher@example.com', name: 'Prof. Carlos Oliveira', password: 'password123', role: UserRole.RESEARCHER },
  { email: 'admin@example.com', name: 'Admin System', password: 'admin123', role: UserRole.ADMIN },
];

export async function seedUsers() {
  if (isProduction) {
    console.warn('[AUTH] Seed users skipped — running in production mode.');
    return;
  }

  // In dev, skip seed if DATABASE_URL is set (assume DB already has users)
  if (getDatabaseUrl()) {
    console.log('[AUTH] Seed users skipped — MySQL is configured, use admin panel to create users.');
    return;
  }

  console.log('[AUTH] Seeding dev users (in-memory, no DATABASE_URL)...');
  for (const seed of SEED_USERS) {
    if (!inMemoryUsers.has(seed.email)) {
      try {
        await createUser(seed.email, seed.name, seed.password, seed.role);
      } catch {
        // Already exists
      }
    }
  }
}