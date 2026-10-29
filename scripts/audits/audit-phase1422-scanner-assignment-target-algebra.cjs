const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const algebra = read('packages/core/src/types/upstream/scannerAssignmentTargetAlgebra.ts');
const contract = read('packages/core/src/types/upstream/scannerAssignmentTargetInterface.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const tests = read('packages/core/src/types/upstream/__test__/scannerAssignmentTargetAlgebra.phase1422.test.ts');
const pkg = JSON.parse(read('package.json'));
const start = runtime.indexOf('function classifyAssignmentTarget(');
const end = runtime.indexOf('\nfunction classifyStaticPropertyTarget(', start);
const targetRuntime = runtime.slice(start, end);
const checks = [
  ['assignment target contract is explicit and parameterized', /AssignmentTargetQuery<Token, Expression, Identifier, Target, Entry, Pattern>/.test(contract)],
  ['canonical algebra implements the upstream interface', /scannerAssignmentTargetContractAlgebra:\s*ScannerAssignmentTargetInterface/.test(algebra)],
  ['target-shape precedence and recursive destructuring remain in algebra', /const resolveEntry =/.test(algebra) && /const resolveTarget =/.test(algebra) && /query\.keyedEntry/.test(algebra) && /query\.referenceVariableEntry/.test(algebra) && /query\.nestedEntry/.test(algebra)],
  ['plain variable targets are resolved by canonical algebra', /tokens\.length === 1 && isVariableToken\(tokens\[0\], query\)/.test(algebra) && /scannerAssignmentTargetContractAlgebra\.resolve</.test(targetRuntime)],
  ['malformed evidence is source-located without an index in the public contract', /kind:\s*'malformed';\s*readonly location:\s*TokenEvidenceLocation<Token>/.test(contract)],
  ['PHP runtime delegates assignment target reasoning to canonical algebra', /scannerAssignmentTargetContractAlgebra\.resolve</.test(targetRuntime)],
  ['runtime supplies AST-specific observations and constructors', /classifyExpression:\s*classifyAstTokens/.test(targetRuntime) && /classifyStaticProperty:\s*classifyStaticPropertyTarget/.test(targetRuntime) && /propertyTarget:\s*property/.test(targetRuntime)],
  ['runtime does not own recursive destructuring recognition', !/function classifyDestructuringTarget/.test(targetRuntime) && !/function classifyDestructuringEntry/.test(targetRuntime)],
  ['regression test uses canonical contract and covers variable, append, recursive destructuring, and malformed delimiters', /scannerAssignmentTargetContractAlgebra/.test(tests) && /resolves append targets/.test(tests) && /keyed, nested and reference destructuring/.test(tests) && /mismatched delimiters/.test(tests)],
  ['no any is introduced in the target algebra', !/\bany\b/.test(algebra)],
  ['audit remains registered and existing build command is preserved', pkg.scripts && pkg.scripts['audit:phase1422-scanner-assignment-target-algebra'] === 'node scripts/audits/audit-phase1422-scanner-assignment-target-algebra.cjs' && pkg.scripts.build === 'tsdown'],
];
const result = { phase: 1422, title: 'scanner-assignment-target-algebra-current-contract', checks: checks.map(([name, passed]) => ({ name, passed })), passed: checks.filter(([, passed]) => passed).length, total: checks.length, status: checks.every(([, passed]) => passed) ? 'passed_with_runtime_typecheck_pending' : 'failed' };
const report = path.join(root, 'scripts/audits/reports/phase1422-scanner-assignment-target-algebra.json');
fs.mkdirSync(path.dirname(report), { recursive: true });
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.status === 'failed') process.exitCode = 1;
