/**
 * AI_Doctor — Stress Test Runner 100/100
 * 
 * Executa cada cenário individualmente via:
 *   node scripts/stress-runner.mjs <test-number>
 *   node scripts/stress-runner.mjs all          (executa todos em sequência)
 *   node scripts/stress-runner.mjs list          (lista todos os 100 cenários)
 *   node scripts/stress-runner.mjs 1-10          (executa range)
 * 
 * Cada cenário é importado dinamicamente de stress-tests/stress-{NN}.mjs
 */

import { spawn } from 'child_process';

const args = process.argv.slice(2);
const command = args[0];

// Available commands
if (command === 'list' || !command) {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║          AI_Doctor STRESS TEST SUITE — 100/100                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Uso:                                                            ║
║    node scripts/stress-runner.mjs list          Lista testes     ║
║    node scripts/stress-runner.mjs 1             Executa teste 1  ║
║    node scripts/stress-runner.mjs 1-10          Exec 1 até 10    ║
║    node scripts/stress-runner.mjs all           Exec todos       ║
║                                                                  ║
║  CATEGORIAS:                                                     ║
║    01-10   Health & Baseline Throughput                          ║
║    11-20   Auth (Login/Register) CPU Stress                     ║
║    21-30   Persistence CRUD Volume                              ║
║    31-40   Rate Limiting Enforcement                            ║
║    41-50   tRPC Batch & Concurrent Routing                      ║
║    51-60   Input Validation & Edge Cases                        ║
║    61-70   Security Headers & Middleware                         ║
║    71-80   Memory Leak & Sustained Load                         ║
║    81-90   Error Handling & Resilience                          ║
║    91-100  Mixed / Chaos / Real-World Scenarios                  ║
╚══════════════════════════════════════════════════════════════════╝
`);
  process.exit(0);
}

// Parse range or single number
function parseTargets(arg) {
  if (arg === 'all') {
    return Array.from({ length: 100 }, (_, i) => i + 1);
  }
  if (arg.includes('-')) {
    const [start, end] = arg.split('-').map(Number);
    const targets = [];
    for (let i = start; i <= end; i++) targets.push(i);
    return targets;
  }
  return [parseInt(arg)];
}

const targets = parseTargets(command);
console.log(`\n🚀 AI_Doctor Stress Runner — Executando ${targets.length} teste(s): [${targets.join(', ')}]\n`);

let passed = 0;
let failed = 0;
let errors = [];

for (const testNum of targets) {
  const padded = String(testNum).padStart(2, '0');
  const testFile = `./stress-tests/stress-${padded}.mjs`;
  
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`⚡ STRESS TEST ${testNum}/100`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  const startMs = Date.now();
  
  await new Promise((resolve) => {
    const proc = spawn('node', ['--experimental-vm-modules', 'node_modules/.bin/vitest', 'run', '--config', 'vite.stress.config.ts', testFile], {
      cwd: '/home/z/my-project/AI_Doctor',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test', CI: 'true' },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      const elapsed = ((Date.now() - startMs) / 1000).toFixed(2);
      if (code === 0) {
        passed++;
        console.log(`✅ PASS  [${elapsed}s]`);
      } else {
        failed++;
        errors.push(testNum);
        console.log(`❌ FAIL  [${elapsed}s]`);
        if (stderr) console.log(stderr.slice(-500));
      }
      resolve();
    });
  });

  console.log('');
}

console.log('════════════════════════════════════════════════════════════');
console.log(`📊 RESULTADO: ${passed} passaram, ${failed} falharam de ${targets.length} testes`);
if (errors.length) console.log(`❌ Testes com falha: ${errors.join(', ')}`);
console.log('════════════════════════════════════════════════════════════\n');