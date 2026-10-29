const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const algebra = read('packages/core/src/types/upstream/scannerExpressionCandidateAlgebra.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const test = read('packages/core/src/types/upstream/__test__/scannerExpressionCandidateAlgebra.phase1424.test.ts');
const index = read('packages/core/src/types/upstream/index.ts');
const pkg = JSON.parse(read('package.json'));
const start = runtime.indexOf('function classifyCompoundExpression(');
const end = runtime.indexOf('\nfunction classifyInstanceOf(', start);
const compound = runtime.slice(start, end);
const checks = [
  ['candidate priority is part of the upstream contract', /readonly priority: number/.test(algebra)],
  ['priority validity and uniqueness are rejected before candidate evaluation', /invalid_priority/.test(algebra) && /duplicate_priority/.test(algebra) && algebra.indexOf('seenPriorities.has') < algebra.indexOf('const orderedCandidates')],
  ['the algebra sorts by declared priority instead of relying on array order', /const orderedCandidates = \[\.\.\.contract\.candidates\]\.sort\(\(left, right\) => left\.priority - right\.priority\)/.test(algebra)],
  ['scanner consumes upstream policy while leaving candidate resolution to the algebra', /id: 'short-ternary', priority: scannerExpressionStructurePriority\('short-ternary'\)/.test(compound) && /id: 'root-operator', priority: scannerExpressionStructurePriority\('root-operator'\)/.test(compound) && /scannerExpressionCandidateAlgebra\.resolveFirst/.test(compound)],
  ['tests cover duplicate identity, duplicate priority, invalid priority, and lazy resolution', /duplicate candidate identities/.test(test) && /duplicate priorities/.test(test) && /invalid priorities/.test(test) && /does not evaluate later candidates/.test(test)],
  ['candidate algebra and policy are exported from the upstream interface surface', /ScannerExpressionStructureCandidateId/.test(index) && /SCANNER_EXPRESSION_STRUCTURE_PRIORITY/.test(index) && /scannerExpressionStructurePriority/.test(index) && /scannerExpressionCandidateAlgebra/.test(index)],
  ['new algebra remains free of any', !/\bany\b/.test(algebra)],
  ['phase 1430 audit is registered', pkg.scripts['audit:phase1430-expression-candidate-priority-contract'] === 'node scripts/audits/audit-phase1430-expression-candidate-priority-contract.cjs'],
];
const result = { phase: 1430, title: 'expression-candidate-priority-contract', checks: checks.map(([name, passed]) => ({ name, passed })), passed: checks.filter(([, passed]) => passed).length, total: checks.length, status: checks.every(([, passed]) => passed) ? 'passed_with_build_pending' : 'failed' };
const report = path.join(root, 'scripts/audits/reports/phase1430-expression-candidate-priority-contract.json');
fs.mkdirSync(path.dirname(report), { recursive: true });
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.status === 'failed') process.exitCode = 1;
