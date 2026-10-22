const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const token = read('packages/core/src/types/upstream/scannerTokenStructureAlgebra.ts');
const expression = read('packages/core/src/types/upstream/scannerExpressionOperatorAlgebra.ts');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const phpContract = read('packages/core/src/compiler/scanner/lexer/phpExpressionOperatorContract.ts');
const pkg = JSON.parse(read('package.json'));
const binary = phpContract;
const checks = [
  ['token structure algebra exposes all top-level candidates in one traversal', /findTopLevelCandidates/.test(token) && /scanCandidates/.test(token) && /matches: readonly TopLevelTokenCandidate\[\]/.test(token)],
  ['candidate collector validates delimiter structure before returning candidates', /kind: 'malformed'/.test(token) && /stack\.length === 0/.test(token)],
  ['expression operator algebra owns precedence selection', /candidate\.rule\.precedence < current\.rule\.precedence/.test(expression) && /precedence: number/.test(expression)],
  ['expression operator algebra owns associativity selection', /associativity: 'left' \| 'right' \| 'non_associative'/.test(expression) && /candidate\.rule\.associativity === 'right'/.test(expression)],
  ['expression resolution uses a closed ADT for resolved, absent, malformed and contract violation', /kind: 'resolved'/.test(expression) && /kind: 'not_found'/.test(expression) && /kind: 'malformed'/.test(expression) && /kind: 'contract_violation'/.test(expression)],
  ['invalid and duplicate operator rules fail explicitly', /empty_operator_token/.test(expression) && /invalid_precedence/.test(expression) && /duplicate_operator_token/.test(expression) && /conflicting_associativity/.test(expression)],
  ['PHP expression contract supplies operator vocabulary and precedence facts', /precedence: 50/.test(binary) && /precedence: 60/.test(binary) && /precedence: 10/.test(binary) && /precedence: 5/.test(binary)],
  ['PHP expression contract delegates candidate selection to expression algebra', /scannerExpressionOperatorAlgebra\.resolve/.test(binary) && /scannerTokenStructureAlgebra\.findTopLevelCandidates/.test(binary)],
  ['PHP contract no longer locally projects and selects operator candidates', !/const candidates = relationProject\(operators/.test(binary) && !/relationFirst\(candidates/.test(binary)],
  ['PHP contract propagates malformed and contract-violation outcomes explicitly', /case 'malformed':/.test(binary) && /case 'contract_violation':/.test(binary)],
  ['root-operator contract includes coalesce below symbolic logic, multiplication above addition, and PHP 8 concat tier', /token: PHP_SYNTAX_OPERATOR_SPELLINGS\.nullCoalesce.*precedence: 5/.test(binary) && /token: '\*'.*precedence: 60/.test(binary) && /token: '\+'.*precedence: 50/.test(binary) && /token: '\.'.*precedence: 40/.test(binary)],
  ['no any introduced in new scanner algebra', !/\bany\b/.test(token + expression)],
  ['Phase 1421 audit script registered', pkg.scripts && pkg.scripts['audit:phase1421-scanner-expression-operator-algebra'] === 'node scripts/audits/audit-phase1421-scanner-expression-operator-algebra.cjs'],
  ['build script preserved', pkg.scripts && pkg.scripts.build === 'tsdown'],
];
const result = { phase: 1421, title: 'scanner-expression-operator-algebra', checks: checks.map(([name, passed]) => ({ name, passed })), passed: checks.filter(([, passed]) => passed).length, total: checks.length, status: checks.every(([, passed]) => passed) ? 'passed_with_repository_typecheck_pending' : 'failed' };
const report = path.join(root, 'scripts/audits/reports/phase1421-scanner-expression-operator-algebra.json');
fs.mkdirSync(path.dirname(report), { recursive: true });
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.status === 'failed') process.exitCode = 1;
