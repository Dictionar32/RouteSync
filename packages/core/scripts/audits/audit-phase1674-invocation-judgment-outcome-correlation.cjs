const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const source = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts'), 'utf8');
const judgment = source.slice(source.indexOf('export type InvocationClosedSemanticJudgment'), source.indexOf('/** Aggregate analysis returned to callers'));
const checks = [
  ['semantic model version advanced to 18', /readonly version: 20/.test(source) && /version: 20,/.test(source)],
  ['semantic contract version advanced to 32', /readonly version: 33/.test(source) && /version: 33,/.test(source)],
  ['closed judgment requires resolved target', /InvocationClosedSemanticJudgment[\s\S]*?readonly status: 'closed'[\s\S]*?targetResolution: Extract<InvocationTargetResolutionJudgment, \{ readonly kind: 'resolved' \}>/.test(judgment)],
  ['closed judgment permits only complete argument-binding outcomes', /InvocationClosedSemanticJudgment[\s\S]*?argumentBinding: Extract<InvocationArgumentBindingJudgment, \{ readonly kind: 'not-required' \| 'established' \}>/.test(judgment)],
  ['resolved incomplete judgments exclude blocked binding', source.includes("export type InvocationResolvedTargetArgumentBindingJudgment = Extract<\n  InvocationArgumentBindingJudgment,\n  { readonly kind: 'not-required' | 'established' | 'incomplete' | 'argument-form-unproven' }\n>")],
  ['unresolved target is correlated with unresolved blocked binding', /targetResolution: Extract<InvocationTargetResolutionJudgment, \{ readonly kind: 'unresolved' \}>;[\s\S]*?argumentBinding: Extract<InvocationArgumentBindingJudgment, \{ readonly kind: 'blocked' \}> & Readonly<\{\s*readonly target: Extract<InvocationArgumentBindingUnavailableTarget, \{ readonly kind: 'unresolved' \}>/.test(judgment)],
  ['ambiguous target is correlated with ambiguous blocked binding', /targetResolution: Extract<InvocationTargetResolutionJudgment, \{ readonly kind: 'ambiguous' \}>;[\s\S]*?argumentBinding: Extract<InvocationArgumentBindingJudgment, \{ readonly kind: 'blocked' \}> & Readonly<\{\s*readonly target: Extract<InvocationArgumentBindingUnavailableTarget, \{ readonly kind: 'ambiguous' \}>/.test(judgment)],
  ['contract explicitly records target/outcome correlation laws', /closedTargetResolution: 'resolved-only'/.test(source) && /unavailableTargetBinding: 'unresolved-matches-blocked-unresolved-and-ambiguous-matches-blocked-ambiguous'/.test(source)],
  ['interface remains independent of semantic foundation', !/semantic\/foundation/.test(source)],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} interface-contract checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
