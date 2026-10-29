const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const contract = read('packages/core/src/compiler/frontend/php/phpExpressionOperatorContract.ts');
const algebra = read('packages/core/src/types/upstream/scannerExpressionOperatorAlgebra.ts');
const test = read('packages/core/src/types/upstream/__test__/scannerExpressionOperatorAlgebra.phase1421.test.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['runtime delegates root resolution to the PHP expression contract', /resolvePhpExpressionRootOperator\(tokens\)/.test(runtime)],
  ['runtime no longer owns the root-operator catalog or resolver', !/function findExpressionRootOperator\(/.test(runtime) && !/type PhpExpressionRootOperator/.test(runtime)],
  ['PHP-specific operator vocabulary is isolated in its adapter contract', /PHP_EXPRESSION_OPERATOR_RULES/.test(contract) && /PHP_SYNTAX_OPERATOR_SPELLINGS/.test(contract)],
  ['language-neutral algebra owns precedence and associativity decisions', /scannerExpressionOperatorAlgebra\.resolve/.test(contract) && /const choose/.test(algebra)],
  ['operator algebra models non-associative operators', /non_associative/.test(algebra) && /parenthesized expression for non-associative operators/.test(algebra)],
  ['PHP comparison operators are marked non-associative', /token: '<', operator: \{ kind: 'less_than' \}, precedence: 30, associativity: 'non_associative'/.test(contract) && /token: '==', operator: \{ kind: 'equal' \}, precedence: 25, associativity: 'non_associative'/.test(contract)],
  ['tests cover non-associative chains and valid single comparisons', /rejects an unparenthesized chain at a non-associative precedence tier/.test(test) && /allows one non-associative operator/.test(test)],
  ['closed resolution distinguishes malformed input and contract violations', /kind: 'malformed'/.test(algebra) && /kind: 'contract_violation'/.test(algebra)],
  ['no any escape hatch was introduced', !/\bany\b/.test(contract) && !/\bany\b/.test(algebra) && !/\bany\b/.test(runtime)],
  ['build script remains unchanged', pkg.scripts.build === 'tsdown'],
  ['phase audit is registered', pkg.scripts['audit:phase1426-expression-operator-contract-migration'] === 'node scripts/audits/audit-phase1426-expression-operator-contract-migration.cjs'],
];
const result = { phase: 1426, title: 'expression-operator-contract-migration', checks: checks.map(([name, passed]) => ({ name, passed })), passed: checks.filter(([, passed]) => passed).length, total: checks.length, status: checks.every(([, passed]) => passed) ? 'passed_with_build_pending' : 'failed' };
const report = path.join(root, 'scripts/audits/reports/phase1426-expression-operator-contract-migration.json');
fs.mkdirSync(path.dirname(report), { recursive: true });
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.status === 'failed') process.exitCode = 1;
