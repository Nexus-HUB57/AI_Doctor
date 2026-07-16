// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authRouter } from './auth';
import {
  seedUsers,
  getUserByEmail,
  generateToken,
  verifyToken,
  UserRole,
} from '../auth';

describe('Auth Router', () => {
  beforeEach(async () => {
    // Ensure seed users exist (idempotent — skips if already present)
    await seedUsers();
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const caller = authRouter.createCaller({});
      const result = await caller.login({
        email: 'admin@example.com',
        password: 'admin123',
      });
      expect(result.success).toBe(true);
      expect(result.user).toHaveProperty('id');
      expect(result.user.email).toBe('admin@example.com');
      expect(result.user.role).toBe(UserRole.ADMIN);
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
    });

    it('should login a patient user', async () => {
      const caller = authRouter.createCaller({});
      const result = await caller.login({
        email: 'patient@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
      expect(result.user.role).toBe(UserRole.PATIENT);
    });

    it('should throw with invalid password', async () => {
      const caller = authRouter.createCaller({});
      await expect(
        caller.login({ email: 'admin@example.com', password: 'wrongpassword' })
      ).rejects.toThrow('Email ou senha incorretos');
    });

    it('should throw with non-existent email', async () => {
      const caller = authRouter.createCaller({});
      await expect(
        caller.login({ email: 'nobody@example.com', password: 'anything' })
      ).rejects.toThrow('Email ou senha incorretos');
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const caller = authRouter.createCaller({});
      const result = await caller.register({
        email: 'newuser@test.com',
        name: 'New User',
        password: 'securepass123',
        role: UserRole.PATIENT,
      });
      expect(result.success).toBe(true);
      expect(result.user.email).toBe('newuser@test.com');
      expect(result.user.name).toBe('New User');
      expect(result.token).toBeDefined();

      // Verify the new user can login
      const loginResult = await caller.login({
        email: 'newuser@test.com',
        password: 'securepass123',
      });
      expect(loginResult.success).toBe(true);
    });

    it('should throw when registering a duplicate user', async () => {
      const caller = authRouter.createCaller({});
      await expect(
        caller.register({
          email: 'admin@example.com',
          name: 'Duplicate',
          password: 'password123',
          role: UserRole.PATIENT,
        })
      ).rejects.toThrow('Usuário já existe');
    });
  });

  describe('me', () => {
    it('should return null user without token', async () => {
      const caller = authRouter.createCaller({});
      const result = await caller.me({ token: undefined as any });
      expect(result.user).toBeNull();
      expect(result.isAuthenticated).toBe(false);
    });

    it('should return user info with valid token', async () => {
      // First login to get a token
      const caller = authRouter.createCaller({});
      const loginResult = await caller.login({
        email: 'doctor@example.com',
        password: 'password123',
      });
      const token = loginResult.token;

      // Now query me with the token
      const meResult = await caller.me({ token });
      expect(meResult.isAuthenticated).toBe(true);
      expect(meResult.user).not.toBeNull();
      expect(meResult.user!.email).toBe('doctor@example.com');
    });

    it('should return unauthenticated for invalid token', async () => {
      const caller = authRouter.createCaller({});
      const result = await caller.me({ token: 'invalid.jwt.token' });
      expect(result.user).toBeNull();
      expect(result.isAuthenticated).toBe(false);
    });
  });

  describe('changePassword', () => {
    it('should change password with correct current password', async () => {
      // Get the user first
      const user = await getUserByEmail('patient@example.com');
      expect(user).not.toBeNull();

      // Create a caller with authenticated context
      const caller = authRouter.createCaller({
        user: {
          userId: user!.id,
          email: user!.email,
          role: user!.role,
          iat: 0,
          exp: 0,
        },
      });

      const result = await caller.changePassword({
        userId: user!.id,
        currentPassword: 'password123',
        newPassword: 'newpassword456',
        confirmPassword: 'newpassword456',
      });
      expect(result.success).toBe(true);

      // Verify old password no longer works
      const publicCaller = authRouter.createCaller({});
      await expect(
        publicCaller.login({ email: 'patient@example.com', password: 'password123' })
      ).rejects.toThrow();

      // Verify new password works
      const newLogin = await publicCaller.login({
        email: 'patient@example.com',
        password: 'newpassword456',
      });
      expect(newLogin.success).toBe(true);
    });

    it('should throw with wrong current password', async () => {
      const user = await getUserByEmail('doctor@example.com');
      const caller = authRouter.createCaller({
        user: {
          userId: user!.id,
          email: user!.email,
          role: user!.role,
          iat: 0,
          exp: 0,
        },
      });

      await expect(
        caller.changePassword({
          userId: user!.id,
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword456',
          confirmPassword: 'newpassword456',
        })
      ).rejects.toThrow('Senha atual incorreta');
    });
  });

  describe('listUsers', () => {
    it('should list users for admin context', async () => {
      const adminUser = await getUserByEmail('admin@example.com');
      const caller = authRouter.createCaller({
        user: {
          userId: adminUser!.id,
          email: adminUser!.email,
          role: UserRole.ADMIN,
          iat: 0,
          exp: 0,
        },
      });

      const result = await caller.listUsers();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.users)).toBe(true);
      expect(result.users.length).toBeGreaterThanOrEqual(4); // seeded users

      // Users should not contain passwordHash
      const anyUser = result.users[0] as any;
      expect(anyUser).not.toHaveProperty('passwordHash');
    });

    it('should throw for non-admin user', async () => {
      const patientUser = await getUserByEmail('patient@example.com');
      const caller = authRouter.createCaller({
        user: {
          userId: patientUser!.id,
          email: patientUser!.email,
          role: UserRole.PATIENT,
          iat: 0,
          exp: 0,
        },
      });

      await expect(caller.listUsers()).rejects.toThrow('Acesso negado');
    });

    it('should throw when unauthenticated', async () => {
      const caller = authRouter.createCaller({});
      await expect(caller.listUsers()).rejects.toThrow('Não autenticado');
    });
  });

  describe('rolesInfo', () => {
    it('should return role information', async () => {
      const caller = authRouter.createCaller({});
      const result = await caller.rolesInfo();
      expect(result).toHaveProperty('roles');
      expect(result.roles).toHaveProperty(UserRole.PATIENT);
      expect(result.roles).toHaveProperty(UserRole.DOCTOR);
      expect(result.roles).toHaveProperty(UserRole.RESEARCHER);
      expect(result.roles).toHaveProperty(UserRole.ADMIN);
      expect(result.roles[UserRole.PATIENT]).toHaveProperty('label');
      expect(result.roles[UserRole.PATIENT]).toHaveProperty('description');
    });
  });
});