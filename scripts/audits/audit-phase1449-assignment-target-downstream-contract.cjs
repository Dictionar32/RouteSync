const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const algebra = read('packages/core/src/types/upstream/scannerAssignmentTargetAlgebra.ts');
const contract = read('packages/core/src/types/upstream/scannerAssignmentTargetInterface.ts');
const legacyTest = read('packages/core/src/types/upstream/__test__/scannerAssignmentTargetAlgebra.phase1422.test.ts');
const runtimeTarget = runtime.slice(runtime.indexOf('function classifyAssignmentTarget('), runtime.indexOf('\nfunction classifyStaticPropertyTarget('));
const checks = [
  ['runtime calls the canonical assignment-target algebra', /scannerAssignmentTargetContractAlgebra\.resolve</.test(runtimeTarget)],
  ['runtime does not invoke the deprecated compatibility facade', !/scannerAssignmentTargetAlgebra\.resolve/.test(runtimeTarget)],
  ['runtime does not supply cursor slicing or index-returning operator callbacks', !/slice:\s*relationSlice/.test(runtimeTarget) && !/findTopLevelOperator:/.test(runtimeTarget)],
  ['runtime handles every closed judgment variant', /case 'resolved'/.test(runtimeTarget) && /case 'unresolved'/.test(runtimeTarget) && /case 'malformed'/.test(runtimeTarget) && /case 'contract_violation'/.test(runtimeTarget)],
  ['AST downstream projection consumes the resolved target', /PhpAstFactory\.assignment\(parsed\.target,/.test(runtime)],
  ['interface defines source-located malformed evidence', /kind:\s*'malformed';\s*readonly location:\s*TokenEvidenceLocation<Token>/.test(contract)],
  ['interface comment documents current canonical wiring', /canonical algebra implements this interface/.test(contract) && /runtime wiring/.test(contract)],
  ['compatibility facade is explicitly deprecated', /@deprecated Runtime wiring and new consumers must use scannerAssignmentTargetContractAlgebra/.test(algebra)],
  ['legacy regression test now uses the canonical contract algebra', /scannerAssignmentTargetContractAlgebra/.test(legacyTest) && !/scannerAssignmentTargetAlgebra\.resolve/.test(legacyTest)],
  ['legacy regression test retains recursive keyed, nested, reference and malformed coverage', /keyed, nested and reference destructuring/.test(legacyTest) && /mismatched delimiters/.test(legacyTest)],
  ['no any is introduced into the target interface/algebra', !/\bany\b/.test(contract) && !/\bany\b/.test(algebra)],
];
let failures = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failures += 1;
}
process.stdout.write(`Phase 1449 assignment-target downstream contract: ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures ? 1 : 0;
