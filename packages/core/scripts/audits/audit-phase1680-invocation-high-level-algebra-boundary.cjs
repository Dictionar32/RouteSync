const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const algebra = read('packages/core/src/types/upstream/invocationSemanticAlgebraBoundaryInterface.ts');
const packageIndex = read('packages/core/src/index.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const checks = [
  ['canonical high-level algebra boundary interface exists', /interface InvocationSemanticAlgebraBoundaryInterface/.test(algebra)],
  ['algebra exposes one domain derivation operation', /readonly derive:\s*\(input: InvocationSemanticInput\) => InvocationSemanticJudgment/.test(algebra)],
  ['low-level phase operations are not exposed by the new boundary', !/deriveTargetResolution|deriveArgumentBinding|deriveEffectProjection|closeJudgment/.test(algebra)],
  ['contract names target-resolution semantic obligations', /targetMeaning:/.test(algebra) && /unresolved-or-ambiguous-obligations/.test(algebra)],
  ['contract requires evidence-backed argument binding', /argumentMeaning:/.test(algebra) && /established-by-evidence/.test(algebra)],
  ['contract distinguishes result and exception effect meaning', /distinct-result-and-exception-meaning/.test(algebra)],
  ['contract binds proof claims to witness and rule trace', /correlated-witness-and-rule-trace/.test(algebra)],
  ['contract makes closure conditional on obligations and proof', /all-applicable-obligations-are-satisfied-and-proof-is-closed/.test(algebra)],
  ['contract retains established facts and unresolved obligations', /preserve-established-facts-and-all-unresolved-obligations/.test(algebra)],
  ['contract requires correlated semantic identities', /invocation-target-argument-parameter-emission-and-evidence-identities-must-correlate/.test(algebra)],
  ['public core index exports high-level algebra boundary', /InvocationSemanticAlgebraBoundaryInterface/.test(packageIndex) && /INVOCATION_SEMANTIC_ALGEBRA_BOUNDARY_CONTRACT/.test(packageIndex) && !/InvocationTargetResolutionAlgebraInput/.test(packageIndex)],
  ['upstream barrel exports high-level algebra boundary', /invocationSemanticAlgebraBoundaryInterface/.test(upstreamIndex)],
  ['boundary avoids any, generic callable abstractions, and semantic foundation', !/:\s*any\b|\bFunction\b|semantic\/foundation/.test(algebra)],
];
let failed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`Phase 1680 high-level algebra boundary audit: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
