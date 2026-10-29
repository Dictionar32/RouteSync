const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const upstream = read('packages/core/src/types/upstream/scannerExpressionStructure.ts');
const contract = read('packages/core/src/types/upstream/scannerExpressionJudgmentInterface.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const provider = read('packages/core/src/compiler/frontend/php/phpExpressionStructureEvidenceProvider.ts');
const index = read('packages/core/src/types/upstream/index.ts');
const checks = [
  ['upstream owns candidate arbitration through one judgment authority', /const resolve = [\s\S]*scannerExpressionCandidateAlgebra\.resolveFirst\(contract\)/.test(upstream) && /interface ExpressionStructureJudgmentInterface/.test(contract)],
  ['upstream authority closes the arbitration result into a judgment', /return judgeExpressionStructureResolution\(resolution, sourceEvidence, selectedStructure\)/.test(upstream)],
  ['upstream accepts evidence and structure selection as typed inputs', /contract: ExpressionCandidateContract<Id, Value>[\s\S]*sourceEvidence: readonly Token\[\][\s\S]*selectStructure: \(value: Value\)/.test(contract)],
  ['runtime calls the upstream authority rather than candidate algebra directly', /providePhpExpressionStructureJudgment\(tokens/.test(runtime) && /expressionStructureJudgmentAuthority\.resolve/.test(provider) && !/scannerExpressionCandidateAlgebra\.resolveFirst/.test(runtime)],
  ['runtime no longer reconstructs resolution from a separate local variable', !/const resolution = scannerExpressionCandidateAlgebra\.resolveFirst/.test(runtime)],
  ['runtime only projects the closed structure judgment after resolution', /switch \(judgment\.kind\)[\s\S]*case 'structured': return relationSome\(projectPhpExpressionStructure\(judgment\.structure/.test(runtime)],
  ['PHP candidate recognition is isolated from runtime executor', !/id: 'short-ternary'[\s\S]*id: 'unary'/.test(runtime) && /id: 'short-ternary'[\s\S]*id: 'unary'/.test(provider)],
  ['candidate algebra is no longer imported into the scanner runtime', !/import \{[^}]*scannerExpressionCandidateAlgebra/.test(runtime)],
  ['upstream barrel exposes the new authority', /expressionStructureJudgmentAuthority/.test(index)],
  ['source evidence is carried into provenance by upstream authority', /ruleId: resolution\.candidate,[\s\S]*sourceEvidence,[\s\S]*attempts: resolution\.attempts/.test(upstream)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
if (failed) process.exitCode = 1;
