/**
 * Stress Test 33: Rate Limit Body Size
 * Send payload > 1MB, expect 413 or error (express.json limit is 1mb)
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, reqId } from './helpers.mjs';

describe('Stress Test 33: Rate Limit Body Size — payload > 1MB', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should reject payloads exceeding the 1MB body size limit',
    { timeout: 60000 },
    async () => {
      // Create a payload larger than 1MB (1,048,576 bytes)
      const bigString = 'x'.repeat(1_100_000);
      const oversizedPayload = { data: bigString };

      const payloadSizeKB = Math.round(JSON.stringify(oversizedPayload).length / 1024);
      console.log(`\n  [Stress-33] Payload size: ${payloadSizeKB} KB`);

      const res = await post('/api/orchestrate', oversizedPayload, { 'X-Request-ID': reqId() });

      console.log(`  [Stress-33] Response status: ${res.status}`);
      console.log(`  [Stress-33] Response body: ${JSON.stringify(res.body).slice(0, 200)}`);

      // Should get 413 (Payload Too Large) or some error
      // express.json with limit: '1mb' returns 413
      expect([413, 400, 500, 429]).toContain(res.status);

      // Now test with a normal-sized payload to confirm server still works
      const normalRes = await post(
        '/api/orchestrate',
        { sequence: 'AUCG', agentName: 'Test', agentRole: 'Tester' },
        { 'X-Request-ID': reqId() }
      );

      console.log(`  [Stress-33] Normal payload status: ${normalRes.status}`);
      // Normal request should not be 413
      expect(normalRes.status).not.toBe(413);
    }
  );
});