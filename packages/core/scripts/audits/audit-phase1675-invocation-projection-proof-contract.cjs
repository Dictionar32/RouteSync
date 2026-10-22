const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const source = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts'), 'utf8');
const checks = [
  ['semantic model remains at version 18', /readonly version: 20/.test(source) && /version: 20,/.test(source)],
  ['semantic contract advances to version 32', /readonly version: 33/.test(source) && /version: 33,/.test(source)],
  ['result emission flow has a dedicated discriminant', /kind: 'result-emission-flow'[\s\S]*?definition: \{ readonly code: 'result' \}/.test(source)],
  ['exception emission flow has a dedicated discriminant', /kind: 'exception-emission-flow'[\s\S]*?definition: \{ readonly code: 'exception' \}/.test(source)],
  ['effect flows require separate invocation, callable, emission and projection evidence', /invocationEvidence: InvocationSemanticEvidence;[\s\S]*?callableDeclarationEvidence: InvocationSemanticEvidence;[\s\S]*?emissionDeclarationEvidence: InvocationSemanticEvidence;[\s\S]*?projectionEvidence: InvocationSemanticEvidence;/.test(source)],
  ['judgment result flows use result-only flow type', /readonly resultFlows: readonly InvocationResultEmissionFlow\[\]/.test(source)],
  ['judgment exception flows use exception-only flow type', /readonly exceptionFlows: readonly InvocationExceptionEmissionFlow\[\]/.test(source)],
  ['input membership and missing-invocation behavior are explicit', /knowledgeMembership: 'authority-validates-requested-invocation-membership-before-derivation'/.test(source) && /absentInvocation: 'retain-missing-evidence-obligation-without-fabricating-membership'/.test(source)],
  ['trace coverage, witness ownership and subject correlation are explicit', /coverage: 'each-applicable-semantic-rule-has-one-subject-bound-trace-entry'/.test(source) && /witnessOwnership: 'each-witness-kind-matches-its-owning-rule'/.test(source) && /witnessSubject: 'every-witness-invocation-matches-trace-subject'/.test(source)],
  ['closure proof and proof-trace correlation are explicit', /closureProof: 'closed-only-when-all-applicable-rules-are-accounted-for-and-no-obligations-remain'/.test(source) && /proofTraceCorrelation: 'proof-status-and-obligations-match-the-enclosing-judgment-and-rule-trace'/.test(source)],
  ['proof binds effect projection, trace coverage and closure completeness', /effect-projection-identity'[\s\S]*?'effect-projection-provenance'[\s\S]*?'rule-trace-coverage'[\s\S]*?'closure-completeness'/.test(source)],
  ['interface does not depend on semantic foundation', !/semantic\/foundation/.test(source)],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} interface-contract checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
