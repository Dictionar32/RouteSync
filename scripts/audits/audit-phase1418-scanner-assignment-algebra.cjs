const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const algebra = read('packages/core/src/types/upstream/scannerAssignmentPartsAlgebra.ts');
const pkg = JSON.parse(read('package.json'));
const start = runtime.indexOf('function parseAssignmentParts(');
const end = runtime.indexOf('\nfunction classifyAssignment(', start);
const assignmentAdapter = runtime.slice(start, end);
const checks = [
  ['upstream algebra exposes generic assignment contract', /AssignmentPartsContract/.test(algebra) && /ScannerAssignmentPartsAlgebra/.test(algebra)],
  ['algebra owns ordered operator candidate resolution without a second search', /const resolveAt =/.test(algebra) && /contract\.findTopLevelOperator/.test(algebra) && (algebra.match(/contract\.findTopLevelOperator\(contract\.tokens, operator\.token\)/g) || []).length === 1],
  ['algebra returns explicit target/value failures and owns reference marker', /invalid_target/.test(algebra) && /empty_value/.test(algebra) && /by_reference/.test(algebra) && /by_value/.test(algebra)],
  ['algebra emits a typed assignment-parts resolution', /AssignmentPartsResolution/.test(algebra) && /operator: \{ kind: operator\.kind \}/.test(algebra) && /kind: 'malformed'/.test(algebra) && /kind: 'contract_violation'/.test(algebra)],
  ['runtime supplies PHP operator vocabulary as capabilities', /PHP_SYNTAX_OPERATOR_SPELLINGS\.nullCoalesceAssign/.test(assignmentAdapter) && /kind: 'set'/.test(assignmentAdapter)],
  ['runtime delegates assignment decomposition to algebra', /scannerAssignmentPartsAlgebra\.resolve/.test(assignmentAdapter) && !/const candidate = relationFirst/.test(assignmentAdapter)],
  ['runtime supplies PHP-specific target and expression resolvers', /classifyTarget: classifyAssignmentTarget/.test(assignmentAdapter) && /classifyValue: classifyAstTokens/.test(assignmentAdapter)],
  ['build script preserved', pkg.scripts && pkg.scripts.build === 'tsdown'],
  ['new assignment contract contains no any', !/\bany\b/.test(algebra)],
];
const result = { phase: 1418, title: 'scanner-assignment-parts-algebra', checks: checks.map(([name, passed]) => ({ name, passed })), passed: checks.filter(([, passed]) => passed).length, total: checks.length, status: checks.every(([, passed]) => passed) ? 'passed_with_typecheck_pending' : 'failed' };
const report = path.join(root, 'scripts/audits/reports/phase1418-scanner-assignment-algebra.json');
fs.mkdirSync(path.dirname(report), { recursive: true });
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.status === 'failed') process.exitCode = 1;
