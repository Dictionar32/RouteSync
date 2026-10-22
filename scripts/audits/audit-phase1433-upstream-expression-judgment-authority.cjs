const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const upstream = read('packages/core/src/types/upstream/scannerExpressionStructure.ts');
const contract = read('packages/core/src/types/upstream/scannerExpressionJudgmentInterface.ts');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const provider = read('packages/core/src/compiler/scanner/lexer/phpExpressionStructureEvidenceProvider.ts');
const index = read('packages/core/src/types/upstream/index.ts');
const checks = [
  ['upstream exposes judgment authority over candidate resolution', /judgeExpressionStructureResolution/.test(upstream)],
  ['upstream closes not-found results from algebra attempt trail', /kind: 'not_structured';[\s\S]*rejectedRules: readonly string\[\]/.test(contract) && /rejectedRules: resolution\.attempts\.map/.test(upstream)],
  ['upstream preserves selected candidate provenance', /kind: 'structured',[\s\S]*ruleId: resolution\.candidate,[\s\S]*candidatePriority: resolution\.priority,[\s\S]*sourceEvidence,[\s\S]*attempts: resolution\.attempts/.test(upstream)],
  ['upstream closes candidate contract violations', /case 'contract_violation':[\s\S]*kind: 'contract_violation'/.test(upstream)],
  ['missing structure for selected candidate is explicit violation', /selected_candidate_without_structure/.test(contract)],
  ['runtime delegates arbitration and judgment construction to upstream authority', /providePhpExpressionStructureJudgment\(tokens/.test(runtime) && /expressionStructureJudgmentAuthority\.resolve/.test(provider) && !/scannerExpressionCandidateAlgebra\.resolveFirst/.test(runtime)],
  ['runtime consumes judgment variants exhaustively', /switch \(judgment\.kind\)[\s\S]*case 'not_structured':[\s\S]*case 'contract_violation':[\s\S]*case 'structured':/.test(runtime)],
  ['runtime no longer constructs semantic judgment variants itself', !/kind: 'structured',[\s\S]{0,100}provenance: \{ ruleId: resolution\.candidate/.test(runtime) && !/rejectedRules: resolution\.attempts\.map/.test(runtime)],
  ['upstream barrel exports judgment authority', /expressionStructureJudgmentAuthority/.test(index)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
if (failed) process.exitCode = 1;
