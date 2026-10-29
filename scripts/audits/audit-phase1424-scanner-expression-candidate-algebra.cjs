const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const algebra = read('packages/core/src/types/upstream/scannerExpressionCandidateAlgebra.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const projector = read('packages/core/src/compiler/frontend/php/phpExpressionStructureProjector.ts');
const phpContract = read('packages/core/src/compiler/frontend/php/phpExpressionOperatorContract.ts');
const test = read('packages/core/src/types/upstream/__test__/scannerExpressionCandidateAlgebra.phase1424.test.ts');
const pkg = JSON.parse(read('package.json'));
const start = runtime.indexOf('function classifyCompoundExpression(');
const end = runtime.indexOf('\nfunction classifyInstanceOf(', start);
const compound = runtime.slice(start, end);
const checks = [
  ['algebra declares generic candidate contract', /ExpressionCandidateContract<Id extends string, Value>/.test(algebra)],
  ['candidate resolution is a closed ADT', /kind: 'resolved'/.test(algebra) && /kind: 'not_found'/.test(algebra) && /kind: 'contract_violation'/.test(algebra)],
  ['candidate identity validation occurs before execution', /duplicate_candidate_id/.test(algebra) && /seenIds\.has\(candidate\.id\)/.test(algebra) && /seenPriorities\.has\(candidate\.priority\)/.test(algebra) && algebra.indexOf('for (const candidate of contract.candidates)') < algebra.indexOf('const orderedCandidates')],
  ['candidate resolution is lazy, priority-ordered, and stops at first resolved result', /const orderedCandidates = \[\.\.\.contract\.candidates\]\.sort/.test(algebra) && /const value = candidate.resolve\(\)/.test(algebra) && /if \(contract\.isResolved\(value\)\) return/.test(algebra)],
  ['compound expression runtime delegates arbitration to the algebra', /scannerExpressionCandidateAlgebra\.resolveFirst/.test(compound)],
  ['compound candidates are represented by named contracts and root operator is centralized', /id: 'short-ternary'/.test(compound) && /id: 'root-operator'/.test(compound) && /resolvePhpExpressionRootOperator/.test(compound) && /PHP_EXPRESSION_OPERATOR_RULES/.test(phpContract)],
  ['AST construction remains with the PHP projection adapter after structural resolution', /projectPhpExpressionStructure/.test(compound) && /PhpAstFactory\.nullCoalesce/.test(projector) && /PhpAstFactory\.binaryExpression/.test(projector)],
  ['runtime no longer uses eager optional-candidate arbitration for compound expressions', !/solveOptionalCandidate|OptionalSemanticCandidate/.test(compound)],
  ['tests cover lazy resolution and duplicate identity/priority violations', /does not evaluate later candidates/.test(test) && /duplicate candidate identities/.test(test) && /duplicate priorities/.test(test) && /invalid priorities/.test(test)],
  ['new algebra contains no any', !/\bany\b/.test(algebra)],
  ['build script remains unchanged', pkg.scripts.build === 'tsdown'],
  ['phase audit is registered', pkg.scripts['audit:phase1424-scanner-expression-candidate-algebra'] === 'node scripts/audits/audit-phase1424-scanner-expression-candidate-algebra.cjs'],
];
const result = { phase: 1424, title: 'scanner-expression-candidate-algebra', checks: checks.map(([name, passed]) => ({ name, passed })), passed: checks.filter(([, passed]) => passed).length, total: checks.length, status: checks.every(([, passed]) => passed) ? 'passed_with_build_pending' : 'failed' };
const report = path.join(root, 'scripts/audits/reports/phase1424-scanner-expression-candidate-algebra.json');
fs.mkdirSync(path.dirname(report), { recursive: true });
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.status === 'failed') process.exitCode = 1;
