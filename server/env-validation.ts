/**
 * AI_Doctor — Environment Validation
 *
 * Validates all required environment variables at startup.
 * Called from server.ts before any service initialization.
 * Provides clear error messages for missing/invalid configuration.
 */

interface EnvVarSpec {
  name: string;
  required: boolean;
  description: string;
  defaultValue?: string;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

const ENV_SPECS: EnvVarSpec[] = [
  {
    name: 'GEMINI_API_KEY',
    required: true,
    description: 'Google Gemini API key for AI-powered analysis',
    validator: (v) => v.length > 10,
    errorMessage: 'GEMINI_API_KEY appears too short. Get yours at https://aistudio.google.com/apikey',
  },
  {
    name: 'JWT_SECRET',
    required: false, // Only required in production
    description: 'Secret key for JWT token signing (required in production)',
    validator: (v) => v.length >= 16,
    errorMessage: 'JWT_SECRET must be at least 16 characters. Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
  },
  {
    name: 'NODE_ENV',
    required: false,
    description: 'Node environment (development/production/test)',
    defaultValue: 'development',
    validator: (v) => ['development', 'production', 'test'].includes(v),
    errorMessage: 'NODE_ENV must be one of: development, production, test',
  },
  {
    name: 'PORT',
    required: false,
    description: 'Server port',
    defaultValue: '3000',
    validator: (v) => {
      const port = parseInt(v, 10);
      return !isNaN(port) && port > 0 && port <= 65535;
    },
    errorMessage: 'PORT must be a number between 1 and 65535',
  },
  {
    name: 'DATABASE_URL',
    required: false,
    description: 'Database connection string (falls back to in-memory store if empty)',
  },
];

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  config: Record<string, string>;
}

export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config: Record<string, string> = {};
  const isProduction = process.env.NODE_ENV === 'production';

  for (const spec of ENV_SPECS) {
    const value = process.env[spec.name] || spec.defaultValue || '';

    // Track the effective value
    if (value) {
      config[spec.name] = value;
    }

    // Skip validation if not set and has a default
    if (!process.env[spec.name] && spec.defaultValue) {
      config[spec.name] = spec.defaultValue;
      continue;
    }

    // Check required
    const isRequired = spec.required || (spec.name === 'JWT_SECRET' && isProduction);
    if (isRequired && !process.env[spec.name]) {
      errors.push(`❌ REQUIRED: ${spec.name} — ${spec.description}`);
      if (spec.errorMessage) {
        errors.push(`   ${spec.errorMessage}`);
      }
      continue;
    }

    // Validate format
    if (process.env[spec.name] && spec.validator && !spec.validator(process.env[spec.name])) {
      if (isRequired) {
        errors.push(`❌ INVALID: ${spec.name} — ${spec.errorMessage || 'Invalid format'}`);
      } else {
        warnings.push(`⚠️  ${spec.name} — ${spec.errorMessage || 'Invalid format'}`);
      }
    }

    // Production warnings
    if (isProduction && spec.name === 'JWT_SECRET' && process.env[spec.name]) {
      const secret = process.env[spec.name];
      if (secret.includes('dev') || secret.includes('example') || secret.includes('test')) {
        warnings.push(`⚠️  JWT_SECRET appears to be a development value. Use a strong production secret.`);
      }
      if (secret.length < 32) {
        warnings.push(`⚠️  JWT_SECRET is only ${secret.length} chars. Recommend 32+ for production.`);
      }
    }
  }

  // Additional production checks
  if (isProduction && !process.env.DATABASE_URL) {
    warnings.push('⚠️  DATABASE_URL not set — using in-memory store. Data will be lost on restart.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    config,
  };
}

/**
 * Validate and print results. Throws if invalid.
 */
export function validateAndReport(): Record<string, string> {
  const result = validateEnvironment();

  if (result.warnings.length > 0) {
    console.log('\n📋 Environment Configuration Warnings:');
    for (const w of result.warnings) {
      console.log(`  ${w}`);
    }
  }

  if (result.errors.length > 0) {
    console.error('\n🚨 Environment Configuration Errors:');
    for (const e of result.errors) {
      console.error(`  ${e}`);
    }
    console.error('\nPlease set the required environment variables and try again.');
    console.error('See .env.example for reference.\n');
    throw new Error('Invalid environment configuration. See errors above.');
  }

  console.log('✅ Environment validation passed.');
  return result.config;
}