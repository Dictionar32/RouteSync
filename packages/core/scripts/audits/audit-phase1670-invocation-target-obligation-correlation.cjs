const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const source = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts'), 'utf8');
const checks = [
  ['model version advanced to 13', /readonly version: 13/.test(source) && /version: 13,/.test(source)],
  ['contract version advanced to 24', /readonly version: 24/.test(source) && /version: 24,/.test(source)],
  ['unavailable argument is a discriminated domain union', /type InvocationBindingUnavailableArgument =[\s\S]*?targetStatus: 'unresolved'[\s\S]*?targetStatus: 'ambiguous'/.test(source)],
  ['unresolved status requires unresolved-target obligation', /targetStatus: 'unresolved';\s*readonly obligation: Extract<SemanticInvocationObligation, \{ readonly kind: 'callable_target_unresolved' \}>/.test(source)],
  ['ambiguous status requires ambiguous-target obligation', /targetStatus: 'ambiguous';\s*readonly obligation: Extract<SemanticInvocationObligation, \{ readonly kind: 'callable_target_ambiguous' \}>/.test(source)],
  ['status cannot be declared without its matching obligation', !/interface InvocationBindingUnavailableArgument[\s\S]*?targetStatus: 'unresolved' \| 'ambiguous'/.test(source)],
  ['blocked judgment retains per-argument unavailable dispositions', /kind: 'blocked'[\s\S]*?argumentDispositions: readonly InvocationBindingUnavailableArgument\[\]/.test(source)],
  ['coverage invariant covers every outcome', /single-ordered-disposition-per-invocation-argument-with-no-loss-or-duplication-in-every-outcome/.test(source)],
  ['target-obligation correlation invariant is explicit', /each-unavailable-argument-status-matches-its-typed-target-obligation/.test(source)],
  ['argument-form-unproven still retains each argument', /kind: 'argument-form-unproven'[\s\S]*?readonly \[InvocationArgumentFormUnprovenDisposition, \.\.\.InvocationArgumentFormUnprovenDisposition\[\]\]/.test(source)],
  ['established remains bound-only and non-empty', /kind: 'established'[\s\S]*?readonly \[InvocationArgumentBindingClaim, \.\.\.InvocationArgumentBindingClaim\[\]\]/.test(source)],
  ['ambiguous target requires at least two callable candidates', /kind: 'callable_target_ambiguous'[\s\S]*?candidateCallables: readonly \[SemanticCallable, SemanticCallable, \.\.\.SemanticCallable\[\]\]/.test(source)],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} interface-contract checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
