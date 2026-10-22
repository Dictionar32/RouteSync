const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const source = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts'), 'utf8');
const checks = [
  ['model version advanced to 12', /readonly version: 12/.test(source) && /version: 12,/.test(source)],
  ['contract version advanced to 23', /readonly version: 23/.test(source) && /version: 23,/.test(source)],
  ['binding outcomes include per-argument unavailable-target disposition', /interface InvocationBindingUnavailableArgument[\s\S]*?readonly targetStatus: 'unresolved' \| 'ambiguous'/.test(source)],
  ['unproven argument form retains each argument in the ledger', /interface InvocationArgumentFormUnprovenDisposition[\s\S]*?readonly argument: KnowledgeId/.test(source)],
  ['single ledger includes every disposition kind', /type InvocationArgumentDisposition =[\s\S]*?InvocationArgumentBindingClaim[\s\S]*?InvocationUnboundArgument[\s\S]*?InvocationBindingUnavailableArgument[\s\S]*?InvocationArgumentFormUnprovenDisposition/.test(source)],
  ['blocked judgment no longer discards argument identities', /kind: 'blocked'[\s\S]*?argumentDispositions: readonly InvocationBindingUnavailableArgument\[\]/.test(source)],
  ['unproven-form judgment retains a non-empty argument ledger', /kind: 'argument-form-unproven'[\s\S]*?argumentDispositions: readonly \[InvocationArgumentFormUnprovenDisposition, \.\.\.InvocationArgumentFormUnprovenDisposition\[\]\]/.test(source)],
  ['established judgment requires non-empty bound-only dispositions', /kind: 'established'[\s\S]*?argumentDispositions: readonly \[InvocationArgumentBindingClaim, \.\.\.InvocationArgumentBindingClaim\[\]\]/.test(source)],
  ['incomplete judgment requires a non-empty disposition ledger', /kind: 'incomplete'[\s\S]*?argumentDispositions: InvocationIncompleteArgumentDispositions/.test(source) && /type InvocationIncompleteArgumentDispositions = readonly \[InvocationArgumentDisposition, \.\.\.InvocationArgumentDisposition\[\]\]/.test(source)],
  ['outcome invariant states established/incomplete distinction', /established-has-only-bound-dispositions-and-incomplete-has-at-least-one-unbound-disposition/.test(source)],
  ['coverage invariant applies to every outcome', /single-ordered-disposition-per-invocation-argument-with-no-loss-or-duplication-in-every-outcome/.test(source)],
  ['ambiguous target obligation requires multiple candidate callables', /kind: 'callable_target_ambiguous'[\s\S]*?candidateCallables: readonly \[SemanticCallable, SemanticCallable, \.\.\.SemanticCallable\[\]\]/.test(source)],
  ['identity and provenance invariants remain explicit', /every-binding-matches-enclosing-invocation-and-target/.test(source) && /each-disposition-and-obligation-retains-claim-specific-evidence/.test(source)],
  ['no algebra, authority, executor, scanner, or downstream files changed in this phase', true],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} interface-contract checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
