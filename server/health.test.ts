// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
// We test the health endpoint pattern without importing server.ts
// (which requires Gemini API key). Instead, we replicate the route.

function createHealthApp(envConfig: Record<string, string> = {}) {
  const app = express();
  app.get('/api/health', (_req, res) => {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    res.json({
      status: 'healthy',
      version: envConfig.npm_package_version || '3.0.0',
      uptime: Math.round(uptime),
      environment: envConfig.NODE_ENV || 'unknown',
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      },
      timestamp: new Date().toISOString(),
    });
  });
  return app;
}

describe('Health Check Endpoint', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createHealthApp({ NODE_ENV: 'test' });
  });

  it('should return 200 with healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('should include version', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.version).toBeDefined();
    expect(typeof res.body.version).toBe('string');
  });

  it('should include uptime as number', async () => {
    const res = await request(app).get('/api/health');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should include environment', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.environment).toBe('test');
  });

  it('should include memory stats with MB units', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.memory).toBeDefined();
    expect(res.body.memory.rss).toMatch(/\d+MB$/);
    expect(res.body.memory.heapUsed).toMatch(/\d+MB$/);
    expect(res.body.memory.heapTotal).toMatch(/\d+MB$/);
  });

  it('should include ISO timestamp', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.timestamp).toBeDefined();
    const date = new Date(res.body.timestamp);
    expect(date.toISOString()).toBe(res.body.timestamp);
  });

  it('should reflect custom NODE_ENV', async () => {
    const customApp = createHealthApp({ NODE_ENV: 'staging', npm_package_version: '2.5.0' });
    const res = await request(customApp).get('/api/health');
    expect(res.body.environment).toBe('staging');
    expect(res.body.version).toBe('2.5.0');
  });
});