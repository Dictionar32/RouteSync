const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const upstream = read('packages/core/src/types/upstream/scannerExpressionStructure.ts');
const contract = read('packages/core/src/types/upstream/scannerExpressionJudgmentInterface.ts');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const provider = read('packages/core/src/compiler/scanner/lexer/phpExpressionStructureEvidenceProvider.ts');
const algebra = read('packages/core/src/types/upstream/scannerExpressionCandidateAlgebra.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE1434_EXPRESSION_ARBITRATION_INTERFACE.md');
const checks = [
  ['closed judgment imports algebra-owned attempt type', /type ExpressionCandidateAttempt/.test(upstream)],
  ['successful judgment retains candidate priority', /candidatePriority: number/.test(contract)],
  ['successful judgment retains complete attempt trail', /provenance:[\s\S]*attempts: readonly ExpressionCandidateAttempt<string>\[\][\s\S]*readonly attempts: readonly ExpressionCandidateAttempt<string>\[\]/.test(contract)],
  ['not-structured judgment retains attempt trail', /kind: 'not_structured'; readonly rejectedRules: readonly string\[\]; readonly attempts: readonly ExpressionCandidateAttempt<string>\[\]/.test(contract)],
  ['upstream copies algebra attempt trail without recomputing it', /attempts: resolution\.attempts/.test(upstream)],
  ['priority is sourced from the resolved algebra result', /candidatePriority: resolution\.priority/.test(upstream)],
  ['candidate algebra defines selected/rejected proof outcomes', /outcome: 'rejected' \| 'selected'/.test(algebra)],
  ['runtime still consumes upstream judgment rather than direct arbitration', /providePhpExpressionStructureJudgment\(tokens/.test(runtime) && /expressionStructureJudgmentAuthority\.resolve/.test(provider) && !/scannerExpressionCandidateAlgebra\.resolveFirst/.test(runtime)],
  ['remaining PHP-specific evidence boundary is documented', /PHP-specific candidate evidence callbacks/.test(docs) && /typed source-evidence outcome/.test(docs)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
if (failed) process.exitCode = 1;
