const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const projector = read('packages/core/src/compiler/scanner/lexer/phpExpressionStructureProjector.ts');
const algebra = read('packages/core/src/types/upstream/scannerExpressionOperatorAlgebra.ts');
const phpContract = read('packages/core/src/compiler/scanner/lexer/phpExpressionOperatorContract.ts');
const test = read('packages/core/src/types/upstream/__test__/scannerExpressionOperatorAlgebra.phase1421.test.ts');
const pkg = JSON.parse(read('package.json'));
const start = runtime.indexOf('function classifyCompoundExpression(');
const end = runtime.indexOf('\nfunction classifyInstanceOf(', start);
const compound = runtime.slice(start, end);
const rootResolver = phpContract;
const checks = [
  ['root operator is resolved through the precedence algebra', /scannerExpressionOperatorAlgebra\.resolve/.test(rootResolver)],
  ['null coalescing belongs to the same root-operator catalog', /nullCoalesce, operator: \{ kind: 'null_coalesce' \}, precedence: 5, associativity: 'right'/.test(rootResolver)],
  ['runtime has one root-operator path for coalescing and binary operators', /id: 'root-operator'/.test(compound) && /resolvePhpExpressionRootOperator\(tokens\)/.test(compound) && !/id: 'coalesce'/.test(compound) && !/id: 'binary'/.test(compound)],
  ['AST construction is a projection after root selection', /projectPhpExpressionStructure/.test(compound) && /structure\.operator\.kind === 'null_coalesce'/.test(projector) && /PhpAstFactory\.nullCoalesce/.test(projector) && /PhpAstFactory\.binaryExpression/.test(projector)],
  ['recursive operands are classified after root selection', /left: relationSlice\(tokens, 0, value\.index\)/.test(compound) && /right: relationSlice\(tokens, relationAdvanceIndex\(value\.index, 1\)\)/.test(compound) && /classify\(structure\.left\)/.test(projector) && /classify\(structure\.right\)/.test(projector)],
  ['algebra returns a closed resolution ADT', /kind: 'resolved'/.test(algebra) && /kind: 'not_found'/.test(algebra) && /kind: 'malformed'/.test(algebra) && /kind: 'contract_violation'/.test(algebra)],
  ['algebra checks operator vocabulary and precedence contract', /empty_operator_token/.test(algebra) && /invalid_precedence/.test(algebra) && /duplicate_operator_token/.test(algebra)],
  ['tests cover precedence, right associativity, and coalesce chains', /null coalescing as a low-precedence right-associative root operator/.test(test) && /\$a', '\|\|', '\$b', '\?\?', '\$c/.test(test) && /\$a', '\?\?', '\$b', '\?\?', '\$c/.test(test)],
  ['no any escape hatch was introduced', !/\bany\b/.test(algebra) && !/\bany\b/.test(rootResolver)],
  ['build script remains unchanged', pkg.scripts.build === 'tsdown'],
  ['previous phase audits remain registered', pkg.scripts['audit:phase1421-scanner-expression-operator-algebra'] === 'node scripts/audits/audit-phase1421-scanner-expression-operator-algebra.cjs' && pkg.scripts['audit:phase1424-scanner-expression-candidate-algebra'] === 'node scripts/audits/audit-phase1424-scanner-expression-candidate-algebra.cjs'],
];
const result = { phase: 1425, title: 'expression-root-operator-contract', checks: checks.map(([name, passed]) => ({ name, passed })), passed: checks.filter(([, passed]) => passed).length, total: checks.length, status: checks.every(([, passed]) => passed) ? 'passed_with_build_pending' : 'failed' };
const report = path.join(root, 'scripts/audits/reports/phase1425-expression-root-operator-contract.json');
fs.mkdirSync(path.dirname(report), { recursive: true });
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.status === 'failed') process.exitCode = 1;
