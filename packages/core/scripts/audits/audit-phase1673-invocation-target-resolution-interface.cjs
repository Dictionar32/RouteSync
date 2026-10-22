const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const source = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts'), 'utf8');
const judgment = source.slice(source.indexOf('export type InvocationSemanticJudgment ='), source.indexOf('/** Aggregate analysis returned to callers'));
const checks = [
  ['semantic model version advanced to 16', /readonly version: 16/.test(source) && /version: 16,/.test(source)],
  ['semantic contract version advanced to 27', /readonly version: 27/.test(source) && /version: 27,/.test(source)],
  ['canonical target resolution is a domain discriminated union', /export type InvocationTargetResolutionJudgment =\s*\| Readonly<\{[\s\S]*?readonly kind: 'resolved'/.test(source)],
  ['resolved outcome names one callable target, not an unconstrained candidate array', /readonly kind: 'resolved';\s*readonly invocation: SemanticInvocation;\s*readonly target: SemanticCallable;\s*readonly evidence: InvocationSemanticEvidence/.test(source)],
  ['unresolved outcome requires an empty candidate tuple and unresolved obligation', /readonly kind: 'unresolved';\s*readonly invocation: SemanticInvocation;\s*readonly candidates: readonly \[\];\s*readonly obligation: Extract<SemanticInvocationObligation, \{ readonly kind: 'callable_target_unresolved' \}>/.test(source)],
  ['ambiguous outcome requires at least two callable candidates and ambiguous obligation', /readonly kind: 'ambiguous';\s*readonly invocation: SemanticInvocation;\s*readonly candidates: readonly \[SemanticCallable, SemanticCallable, \.\.\.SemanticCallable\[\]\];\s*readonly obligation: Extract<SemanticInvocationObligation, \{ readonly kind: 'callable_target_ambiguous' \}>/.test(source)],
  ['judgment carries canonical targetResolution rather than raw callTargets', /readonly targetResolution: InvocationTargetResolutionJudgment/.test(judgment) && !/readonly callTargets:/.test(judgment)],
  ['proof contract binds target-resolution outcome', /'domain-phase-evidence', 'target-resolution-outcome', 'argument-binding-judgment'/.test(source)],
  ['semantic meaning records target outcome cardinality rules', /judgmentShape: 'resolved-single-target-or-unresolved-empty-candidates-or-ambiguous-multiple-candidates'/.test(source)],
  ['interface does not import semantic foundation', !/semantic\/foundation/.test(source)],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} interface-contract checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
