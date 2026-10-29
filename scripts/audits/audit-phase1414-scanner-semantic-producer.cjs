const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const checks = [
  ['syntax contract has no semantic request branch', !read('packages/core/src/types/upstream/astClassifierEvidenceContract.ts').includes("kind: 'semantic'")],
  ['syntax contract has no semantic stage result', !read('packages/core/src/types/upstream/astClassifierEvidenceContract.ts').includes('AstSemanticStageInterface')],
  ['scanner runtime no longer imports semantic stage authority', !read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts').includes('astSemanticStageAuthority')],
  ['scanner runtime no longer constructs semantic judgments', !read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts').includes('createScannerEvidencePort')],
  ['upstream producer owns stage port construction', read('packages/core/src/types/upstream/astSemanticEvidenceProducer.ts').includes('createScannerEvidencePort')],
  ['upstream producer contract is observation-based', read('packages/core/src/types/upstream/astSemanticEvidenceProducer.ts').includes('AstSemanticEvidenceObservation')],
  ['scanner adapter forwards syntax observation', read('packages/core/src/compiler/frontend/php/astClassifierEvidence.ts').includes('produceAstSemanticEvidence')],
  ['package build script preserved', /"build"\s*:\s*"tsdown"/.test(read('package.json'))],
];
const result = { phase: 1414, status: checks.every(([, ok]) => ok) ? 'passed' : 'failed', passed: checks.filter(([, ok]) => ok).length, total: checks.length, checks: checks.map(([name, ok]) => ({ name, status: ok ? 'passed' : 'failed' })) };
const report = path.join(root, 'scripts/audits/reports/phase1414-scanner-semantic-producer.json');
fs.mkdirSync(path.dirname(report), { recursive: true });
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
for (const check of result.checks) process.stdout.write(`${check.status === 'passed' ? 'PASS' : 'FAIL'} ${check.name}\n`);
process.stdout.write(`PHASE1414 ${result.status}: ${result.passed}/${result.total}\n`);
if (result.status !== 'passed') process.exitCode = 1;
