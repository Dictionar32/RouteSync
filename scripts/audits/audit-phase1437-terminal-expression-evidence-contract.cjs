const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const algebra = read('packages/core/src/types/upstream/scannerExpressionCandidateAlgebra.ts');
const judgment = read('packages/core/src/types/upstream/scannerExpressionStructure.ts');
const judgmentInterface = read('packages/core/src/types/upstream/scannerExpressionJudgmentInterface.ts');
const provider = read('packages/core/src/compiler/frontend/php/phpExpressionStructureEvidenceProvider.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const tests = read('packages/core/src/types/upstream/__test__/scannerExpressionCandidateAlgebra.phase1424.test.ts');
const checks = [
  ['candidate contract exposes terminal evidence predicate', /readonly isTerminal\?: \(value: Value\) => boolean/.test(algebra)],
  ['candidate algebra returns terminal outcome instead of selecting malformed evidence', /kind: 'terminal'[\s\S]*outcome: 'terminal'/.test(algebra)],
  ['terminal evidence stops later candidate evaluation', /isTerminal\?\.\(value\) === true/.test(algebra)],
  ['closed judgment represents malformed source evidence', /kind: 'malformed_source'[\s\S]*ruleId: string[\s\S]*location: ExpressionEvidenceLocation<Token>/.test(read('packages/core/src/types/upstream/scannerExpressionJudgmentInterface.ts'))],
  ['provider converts malformed conditional to typed evidence', /case 'malformed': return \{ kind: 'malformed_source'/.test(provider)],
  ['provider converts malformed unary and contract failure to typed evidence', /case 'malformed': return \{ kind: 'malformed_source'[\s\S]*case 'contract_violation': return \{ kind: 'terminal_contract_violation'/.test(provider)],
  ['provider does not throw for form-algebra malformed results', !/case 'malformed': throw new Error/.test(provider)],
  ['short-ternary candidate consumes source-partition interface evidence', /scannerTokenStructureInterface\.locateTopLevel[\s\S]*condition: operator\.occurrence\.before[\s\S]*fallback: operator\.occurrence\.after/.test(provider)],
  ['expression provider owns no runtime operator lookup callback and runtime exposes evidence, not offsets', !/findTopLevelOperator:/.test(provider) && /function findTopLevelOperatorEvidence/.test(runtime) && !/function findTopLevelOperator\(/.test(runtime)],
  ['upstream authority maps terminal evidence into closed judgment', /const terminalEvidence = selectTerminal\?\.\(resolution\.value\)[\s\S]*ruleId: resolution\.candidate[\s\S]*attempts: resolution\.attempts/.test(judgment)],
  ['runtime executor exhaustively handles malformed judgment', /case 'malformed_source': throw new Error\(`Malformed \$\{judgment\.ruleId\}/.test(runtime)],
  ['regression test asserts terminal stops arbitration', /stops arbitration on terminal source evidence[\s\S]*expect\(evaluated\)\.toEqual\(\[\]\)/.test(tests)],
  ['runtime no longer contains duplicate ternary classification path', !/classifyTernary|scannerExpressionFormAlgebra/.test(runtime)],
  ['runtime does not own candidate arbitration', !/scannerExpressionCandidateAlgebra\.resolveFirst/.test(runtime)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
if (failed) process.exitCode = 1;
