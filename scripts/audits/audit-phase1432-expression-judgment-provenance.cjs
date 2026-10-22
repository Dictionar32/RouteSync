const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const candidate = read('packages/core/src/types/upstream/scannerExpressionCandidateAlgebra.ts');
const structure = read('packages/core/src/types/upstream/scannerExpressionStructure.ts');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const index = read('packages/core/src/types/upstream/index.ts');
const judgmentAuthority = read('packages/core/src/types/upstream/scannerExpressionStructure.ts');
const checks = [
  ['algebra records every attempted candidate', /ExpressionCandidateAttempt[\s\S]*outcome: 'rejected' \| 'selected'/.test(candidate) && /attempts: Object\.freeze\(attempts\)/.test(candidate)],
  ['resolved judgment carries candidate priority', /kind: 'resolved';[\s\S]*candidate: Id;[\s\S]*priority: number;[\s\S]*attempts: readonly ExpressionCandidateAttempt/.test(candidate)],
  ['closed structure judgment carries provenance', /kind: 'structured'[\s\S]*provenance:[\s\S]*ruleId: string; readonly sourceEvidence: readonly Token\[\]/.test(structure)],
  ['not-structured judgment preserves rejected rule identities', /kind: 'not_structured'; readonly rejectedRules: readonly string\[\]/.test(structure)],
  ['upstream constructs judgment from algebra result', /judgeExpressionStructureResolution/.test(judgmentAuthority) && /ruleId: resolution\.candidate, sourceEvidence/.test(judgmentAuthority)],
  ['upstream derives rejected rules from algebra attempts', /rejectedRules: resolution\.attempts\.map\(attempt => attempt\.candidate\)/.test(judgmentAuthority)],
  ['upstream index exports attempt contract', /ExpressionCandidateAttempt/.test(index)],
  ['runtime does not define structural candidate priority values', !/id: '(short-ternary|ternary|array-access|call|root-operator|unary)', priority: \d+/.test(runtime)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
if (failed) process.exitCode = 1;
