const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const checks = [
  ['no duplicated integrated-response authority', !pipeline.includes('InvocationSemanticIntegratedResponseAuthorityInterface')],
  ['scanner does not own semantic analysis or correspondence validation', !analyzer.includes('InvocationSemanticCoveragePublicationInterface') && !analyzer.includes('validateCorrespondence')],
  ['source-bound composition result does not claim runtime implementation', pipeline.includes('composition-interface-defined-only-no-production-composition-implementation-or-laravel-wiring-claimed')],
  ['scanner runtime status remains truthful', scanner.includes('current-controller-dataflow-returns-ordinary-analysis-only-and-does-not-yet-publish-integrated-response')],
  ['no semantic foundation dependency was reintroduced', !pipeline.includes('semantic/foundation') && !scanner.includes('semantic/foundation')],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} Phase 1744 regression checks passed.\n`);
fs.writeFileSync(path.join(root, 'PHASE1744_REGRESSION_AUDIT.json'), JSON.stringify({ phase: 1744, total: checks.length, passed: checks.length - failed.length, failed: failed.length, checks: checks.map(([name, passed]) => ({ name, passed })) }, null, 2) + '\n');
if (failed.length) process.exit(1);
