const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const source = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts'), 'utf8');
const checks = [
  ['model version advanced to 14', /readonly version: 14/.test(source) && /version: 14,/.test(source)],
  ['contract version advanced to 25', /readonly version: 25/.test(source) && /version: 25,/.test(source)],
  ['incomplete disposition domain excludes unavailable-target facts', /type InvocationIncompleteArgumentDisposition = InvocationArgumentBindingClaim \| InvocationUnboundArgument/.test(source)],
  ['incomplete ledger is a non-empty ordered tuple', /type InvocationIncompleteArgumentDispositions = readonly \[InvocationIncompleteArgumentDisposition, \.\.\.InvocationIncompleteArgumentDisposition\[\]\]/.test(source)],
  ['blocked unresolved target only accepts unresolved dispositions', /target: Extract<InvocationArgumentBindingUnavailableTarget, \{ readonly kind: 'unresolved' \}>;\s*readonly argumentDispositions: readonly Extract<InvocationBindingUnavailableArgument, \{ readonly targetStatus: 'unresolved' \}>\[\]/.test(source)],
  ['blocked ambiguous target only accepts ambiguous dispositions', /target: Extract<InvocationArgumentBindingUnavailableTarget, \{ readonly kind: 'ambiguous' \}>;\s*readonly argumentDispositions: readonly Extract<InvocationBindingUnavailableArgument, \{ readonly targetStatus: 'ambiguous' \}>\[\]/.test(source)],
  ['unresolved argument disposition requires unresolved obligation', /targetStatus: 'unresolved';\s*readonly obligation: Extract<SemanticInvocationObligation, \{ readonly kind: 'callable_target_unresolved' \}>/.test(source)],
  ['ambiguous argument disposition requires ambiguous obligation', /targetStatus: 'ambiguous';\s*readonly obligation: Extract<SemanticInvocationObligation, \{ readonly kind: 'callable_target_ambiguous' \}>/.test(source)],
  ['established outcome remains bound-only and non-empty', /kind: 'established'[\s\S]*?argumentDispositions: readonly \[InvocationArgumentBindingClaim, \.\.\.InvocationArgumentBindingClaim\[\]\]/.test(source)],
  ['unproven-form outcome cannot enter incomplete disposition type', /type InvocationIncompleteArgumentDisposition = InvocationArgumentBindingClaim \| InvocationUnboundArgument/.test(source) && !/type InvocationIncompleteArgumentDisposition =[^;]*InvocationArgumentFormUnprovenDisposition/.test(source)],
  ['outcome invariant explicitly limits incomplete dispositions', /incomplete-has-only-bound-or-unbound-dispositions-with-at-least-one-unbound/.test(source)],
  ['target invariant correlates each disposition with enclosing target outcome', /each-unavailable-argument-status-matches-its-typed-target-obligation-and-enclosing-target-outcome/.test(source)],
  ['argument-form-unproven retains each argument identity', /kind: 'argument-form-unproven'[\s\S]*?readonly \[InvocationArgumentFormUnprovenDisposition, \.\.\.InvocationArgumentFormUnprovenDisposition\[\]\]/.test(source)],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} interface-contract checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
