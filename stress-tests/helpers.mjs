/**
 * Stress Test Helpers
 *
 * Manages a child-process server for true end-to-end stress testing.
 * All tRPC endpoints are at /trpc/* (no rate limit).
 * REST endpoints at /api/* have a 100 req / 15 min rate limit.
 */
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';

let _proc = null;
const BASE = 'http://localhost:3777';
let _reqCounter = 0;

export function getBaseUrl() { return BASE; }

export function reqId() { return `stress-${++_reqCounter}-${randomUUID().slice(0, 8)}`; }

export async function startServer() {
  // Idempotent: check if already running
  try {
    const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      console.log('  [helpers] Server already running on port 3777');
      return;
    }
  } catch {
    // Not running yet, proceed
  }

  _proc = spawn('npx', ['tsx', 'server.ts'], {
    cwd: '/home/z/my-project/AI_Doctor',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: '3777',
      JWT_SECRET: 'stress-test-secret-key-2024-long-enough',
      GEMINI_API_KEY: 'fake-gemini-key-for-stress-testing',
      CORS_ORIGINS: 'http://localhost:3777',
      DISABLE_HMR: 'true',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Server startup timeout (20s)'));
    }, 20000);

    _proc.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('running on')) {
        clearTimeout(timeout);
        console.log('  [helpers] Server started successfully');
        // Extra wait for full init (Vite middleware, tRPC, etc.)
        setTimeout(resolve, 800);
      }
    });

    _proc.stderr.on('data', (d) => {
      const msg = d.toString();
      // Suppress Vite noise but log errors
      if (msg.includes('Error') || msg.includes('error')) {
        // Only log real errors, not Vite warnings
      }
    });

    _proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    _proc.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        clearTimeout(timeout);
        reject(new Error(`Server exited with code ${code}`));
      }
    });
  });
}

export async function stopServer() {
  if (!_proc) return;
  try {
    _proc.kill('SIGTERM');
    // Force kill after 3s
    setTimeout(() => {
      try { _proc.kill('SIGKILL'); } catch {}
    }, 3000);
  } catch {}
  _proc = null;
}

/**
 * Make an HTTP GET request and return { status, headers, body, ok }
 */
export async function get(path, headers = {}) {
  const res = await fetch(`${BASE}${path}`, { headers });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, headers: Object.fromEntries(res.headers), body: json || text, ok: res.ok };
}

/**
 * Make an HTTP POST request and return { status, headers, body, ok }
 */
export async function post(path, body, headers = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, headers: Object.fromEntries(res.headers), body: json || text, ok: res.ok };
}

/**
 * Wait for a specified number of milliseconds
 */
export function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Generate a fake patient object
 */
export function makePatient(i) {
  return {
    name: `Paciente Stress ${i}`,
    age: 20 + (i % 60),
    email: `stress${i}@test.com`,
    phone: `1199${String(i).padStart(6, '0')}`,
  };
}

/**
 * Register a new user via tRPC and return the token.
 * Uses unique email per call to avoid duplicates.
 */
export async function registerAndLogin(emailSuffix) {
  const email = `stress_user_${emailSuffix}@test.com`;
  const name = `Stress User ${emailSuffix}`;
  const password = 'password123';

  // Register
  const regRes = await post('/trpc/auth.register', {
    json: { email, name, password, role: 'patient' },
  });

  // Login (always works, even if register failed due to duplicate)
  const loginRes = await post('/trpc/auth.login', {
    json: { email, password },
  });

  // Extract token from tRPC response
  // tRPC wraps result: { result: { data: { json: { success, user, token } } } }
  const token = loginRes.body?.result?.data?.json?.token
    || loginRes.body?.result?.data?.json;

  if (!token || typeof token !== 'string') {
    // Fallback: register might have returned a token
    const regToken = regRes.body?.result?.data?.json?.token
      || regRes.body?.result?.data?.json;
    return { token: regToken, email, name };
  }

  return { token, email, name };
}

/**
 * Compute percentile from sorted array of numbers
 */
export function percentile(sortedArr, p) {
  const idx = Math.ceil(sortedArr.length * p) - 1;
  return sortedArr[Math.max(0, idx)];
}

/**
 * Format latency stats from an array of ms values
 */
export function latencyStats(latencies) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  return {
    count: sorted.length,
    avg: avg.toFixed(2),
    min: min.toFixed(2),
    max: max.toFixed(2),
    p50: percentile(sorted, 0.50).toFixed(2),
    p95: percentile(sorted, 0.95).toFixed(2),
    p99: percentile(sorted, 0.99).toFixed(2),
  };
}

/**
 * Raw fetch wrapper — returns the native Response (no auto-parsing).
 * Used by tests that need to send non-JSON bodies or inspect raw responses.
 */
export async function rawFetch(path, opts = {}) {
  return fetch(`${BASE}${path}`, opts);
}

/**
 * Print formatted metrics for a test run.
 * Used by stress tests 76-100.
 */
export function printMetrics(label, durations, errors, total) {
  const sorted = [...durations].sort((a, b) => a - b);
  const avg = sorted.length ? (sorted.reduce((a, b) => a + b, 0) / sorted.length) : 0;
  const p50 = sorted.length ? percentile(sorted, 0.50) : 0;
  const p95 = sorted.length ? percentile(sorted, 0.95) : 0;
  const p99 = sorted.length ? percentile(sorted, 0.99) : 0;
  const maxLat = sorted.length ? sorted[sorted.length - 1] : 0;

  console.log(`\n  --- ${label} ---`);
  console.log(`  Requests: ${total} | Errors: ${errors} | Success: ${total - errors}`);
  console.log(`  Avg: ${avg.toFixed(1)}ms | P50: ${p50.toFixed(1)}ms | P95: ${p95.toFixed(1)}ms | P99: ${p99.toFixed(1)}ms | Max: ${maxLat.toFixed(1)}ms`);
}

/**
 * Convenience login helper — logs in with seed user and returns token.
 */
export async function login(role = 'patient') {
  const emails = {
    patient: 'patient@example.com',
    doctor: 'doctor@example.com',
    researcher: 'researcher@example.com',
    admin: 'admin@example.com',
  };
  const passwords = {
    patient: 'password123',
    doctor: 'password123',
    researcher: 'password123',
    admin: 'admin123',
  };
  const res = await post('/trpc/auth.login', {
    json: { email: emails[role], password: passwords[role] },
  });
  const token = res.body?.result?.data?.json?.token;
  return { token, email: emails[role], role };
}

/**
 * Run N async functions concurrently and return results.
 */
export async function concurrent(fn, n) {
  const promises = Array.from({ length: n }, (_, i) => fn(i));
  return Promise.all(promises);
}

/**
 * tRPC-specific POST (same as post, kept for API compatibility)
 */
export async function trpcPost(procedure, input, headers = {}) {
  return post(`/trpc/${procedure}`, { json: input }, headers);
}

/**
 * tRPC-specific GET (query endpoint)
 */
export async function trpcGet(procedure, input) {
  const qs = input ? `?input=${encodeURIComponent(JSON.stringify(input))}` : '';
  return get(`/trpc/${procedure}${qs}`);
}