const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const algebra = read('packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const authority = read('packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts');
const executor = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const checks = [
  ['contract/model versions advanced', /readonly version: 21/.test(contract) && /readonly version: 10/.test(contract) && /version: 21/.test(contract) && /version: 10/.test(contract)],
  ['positional binding requires explicit upstream normalization evidence', /argumentFormPrerequisite: 'explicit-upstream-positional-normalization-evidence'/.test(contract) && /interface InvocationPositionalArgumentEvidence/.test(contract)],
  ['binding correspondence has claim-specific provenance', /interface InvocationArgumentCorrespondenceEvidence/.test(contract) && /argumentEvidence: readonly SemanticSource\[\]/.test(contract) && /parameterEvidence: readonly SemanticSource\[\]/.test(contract) && /correspondenceEvidence: readonly SemanticSource\[\]/.test(contract)],
  ['established requires non-empty bindings and no unbound arguments', /kind: 'established'[\s\S]*?bindings: readonly \[InvocationArgumentBindingClaim, \.\.\.InvocationArgumentBindingClaim\[\]\][\s\S]*?unboundArguments: readonly \[\]/.test(contract)],
  ['incomplete requires at least one typed unbound argument', /kind: 'incomplete'[\s\S]*?unboundArguments: readonly \[InvocationUnboundArgument, \.\.\.InvocationUnboundArgument\[\]\]/.test(contract)],
  ['no-argument outcome narrows invocation arguments to empty tuple', /kind: 'not-required'[\s\S]*?arguments: readonly \[\][\s\S]*?bindings: readonly \[\]/.test(contract)],
  ['target unavailability correlates unresolved/ambiguous with candidate cardinality', /kind: 'unresolved'[\s\S]*?candidates: readonly \[\][\s\S]*?kind: 'ambiguous'[\s\S]*?candidates: readonly \[SemanticCallable, SemanticCallable, \.\.\.SemanticCallable\[\]\]/.test(contract)],
  ['unproven argument form has a first-class typed obligation and rule owner', /kind: 'argument_form_unproven'/.test(contract) && /id: 'invocation-argument-form-evidence'/.test(contract) && /argumentFormUnproven/.test(contract)],
  ['identity, coverage, and provenance invariants are explicit', /identityInvariant: 'every-binding-matches-enclosing-invocation-and-target'/.test(contract) && /coverageInvariant: 'bound-and-unbound-arguments-partition-invocation-arguments'/.test(contract) && /provenanceInvariant: 'each-binding-and-obligation-retains-claim-specific-evidence'/.test(contract)],
  ['algebra remains untouched for interface-first staging', /argumentParameters: slice\.bindings/.test(algebra)],
  ['authority and executor remain untouched for later wiring phase', /argumentParameters|parameterFlowsForInvocation/.test(authority) && /executeAll/.test(executor)],
];
let failed = false;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!pass) failed = true;
}
process.stdout.write(`\n${checks.length - checks.filter(([, pass]) => pass).length} failed checks; ${checks.filter(([, pass]) => pass).length}/${checks.length} passed.\n`);
if (failed) process.exitCode = 1;
