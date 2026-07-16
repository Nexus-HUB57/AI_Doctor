// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateEnvironment, validateAndReport } from './env-validation';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    // Fresh copy of process.env
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateEnvironment', () => {
    it('returns errors when GEMINI_API_KEY is missing', () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.NODE_ENV;

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('GEMINI_API_KEY')])
      );
    });

    it('returns error when GEMINI_API_KEY is too short', () => {
      process.env.GEMINI_API_KEY = 'short';

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('INVALID')])
      );
    });

    it('passes with valid GEMINI_API_KEY in development', () => {
      process.env.GEMINI_API_KEY = 'AIzaSyD1234567890abcdefghijklmnopqrstuvwx';
      process.env.NODE_ENV = 'development';

      const result = validateEnvironment();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('passes with valid GEMINI_API_KEY and JWT_SECRET in production', () => {
      process.env.GEMINI_API_KEY = 'AIzaSyD1234567890abcdefghijklmnopqrstuvwx';
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'a'.repeat(32);

      const result = validateEnvironment();

      expect(result.valid).toBe(true);
    });

    it('requires JWT_SECRET in production', () => {
      process.env.GEMINI_API_KEY = 'AIzaSyD1234567890abcdefghijklmnopqrstuvwx';
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('JWT_SECRET')])
      );
    });

    it('warns when JWT_SECRET is too short in production', () => {
      process.env.GEMINI_API_KEY = 'AIzaSyD1234567890abcdefghijklmnopqrstuvwx';
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'short123';

      const result = validateEnvironment();

      // Short JWT_SECRET in production: error for being too short
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('warns when JWT_SECRET looks like a dev value in production', () => {
      process.env.GEMINI_API_KEY = 'AIzaSyD1234567890abcdefghijklmnopqrstuvwx';
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'ai-doctor-dev-secret-key-2024-super-long';

      const result = validateEnvironment();

      expect(result.warnings).toEqual(
        expect.arrayContaining([expect.stringContaining('development')])
      );
    });

    it('defaults NODE_ENV to development', () => {
      process.env.GEMINI_API_KEY = 'AIzaSyD1234567890abcdefghijklmnopqrstuvwx';
      delete process.env.NODE_ENV;

      const result = validateEnvironment();

      expect(result.valid).toBe(true);
      expect(result.config.NODE_ENV).toBe('development');
    });

    it('warns about invalid NODE_ENV values', () => {
      process.env.GEMINI_API_KEY = 'AIzaSyD1234567890abcdefghijklmnopqrstuvwx';
      process.env.NODE_ENV = 'staging';

      const result = validateEnvironment();

      // Invalid NODE_ENV is a warning (not blocking), validation passes
      expect(result.warnings).toEqual(
        expect.arrayContaining([expect.stringContaining('NODE_ENV')])
      );
    });

    it('warns about DATABASE_URL not set in production', () => {
      process.env.GEMINI_API_KEY = 'AIzaSyD1234567890abcdefghijklmnopqrstuvwx';
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'a'.repeat(32);
      delete process.env.DATABASE_URL;

      const result = validateEnvironment();

      expect(result.warnings).toEqual(
        expect.arrayContaining([expect.stringContaining('DATABASE_URL')])
      );
    });

    it('returns correct config object', () => {
      process.env.GEMINI_API_KEY = 'AIzaSyD1234567890abcdefghijklmnopqrstuvwx';
      process.env.NODE_ENV = 'test';

      const result = validateEnvironment();

      expect(result.config.GEMINI_API_KEY).toBe(process.env.GEMINI_API_KEY);
      expect(result.config.NODE_ENV).toBe('test');
    });
  });

  describe('validateAndReport', () => {
    it('throws on invalid config', () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.NODE_ENV;

      expect(() => validateAndReport()).toThrow('Invalid environment configuration');
    });

    it('returns config on valid setup', () => {
      process.env.GEMINI_API_KEY = 'AIzaSyD1234567890abcdefghijklmnopqrstuvwx';

      const config = validateAndReport();

      expect(config.GEMINI_API_KEY).toBeDefined();
    });
  });
});