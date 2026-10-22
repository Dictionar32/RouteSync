const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const file = path.join(root, 'packages/core/src/types/upstream/invocationSemanticAlgebraInterface.ts');
const source = fs.readFileSync(file, 'utf8');
const checks = [
  ['dedicated domain algebra interface exists', /interface InvocationSemanticAlgebraInterface/.test(source)],
  ['target resolution is an explicit phase', /deriveTargetResolution/.test(source)],
  ['binding consumes target judgment', /targetResolution: InvocationTargetResolutionJudgment/.test(source)],
  ['positional evidence is explicit input', /positionalEvidence: InvocationArgumentFormEvidence/.test(source)],
  ['effect projection has its own judgment', /type InvocationEffectProjectionJudgment/.test(source)],
  ['result and exception flows remain distinct', /InvocationResultEmissionFlow/.test(source) && /InvocationExceptionEmissionFlow/.test(source)],
  ['unavailable effect outcomes correlate target status and obligation kind', /kind: 'unresolved'[\s\S]*?callable_target_unresolved/.test(source) && /kind: 'ambiguous'[\s\S]*?callable_target_ambiguous/.test(source)],
  ['closure consumes derived phase judgments', /interface InvocationJudgmentClosureAlgebraInput/.test(source) && /argumentBinding: InvocationArgumentBindingJudgment/.test(source)],
  ['closure receives derivation artifacts', /ruleTrace: readonly InvocationSemanticRuleTraceEntry\[\]/.test(source) && /derivation: InvocationSemanticDerivationWitnesses/.test(source)],
  ['contract defines derivation order', /derivationOrder: readonly \[/.test(source)],
  ['contract forbids target reclassification during binding', /consume-target-resolution-judgment-without-reclassification/.test(source)],
  ['cross-field identity validation is explicitly assigned to authority', /authority-validates-cross-field-invocation-target-argument-and-evidence-identities/.test(source)],
  ['no any escape hatch', !/any/.test(source)],
  ['no foundation dependency', !/semantic\/foundation/.test(source)],
  ['implementation remains separate from interface', !/function deriveTargetResolution|const deriveTargetResolution\s*=/.test(source)],
];
let failed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`Phase 1676 algebra interface audit: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
