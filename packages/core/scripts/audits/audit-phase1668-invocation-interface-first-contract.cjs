const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const source = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts'), 'utf8');
const checks = [
  ['model version advanced to 11', /readonly version: 12/.test(source) && /version: 12,/.test(source)],
  ['contract version advanced to 22', /readonly version: 22/.test(source) && /version: 22,/.test(source)],
  ['positional evidence binds exact invocation identity', /interface InvocationPositionalArgumentEvidence[\s\S]*?readonly invocation: KnowledgeId/.test(source)],
  ['positional evidence carries normalized argument sequence', /interface InvocationPositionalArgumentEvidence[\s\S]*?readonly normalizedArguments: readonly KnowledgeId\[\]/.test(source)],
  ['correspondence evidence binds invocation and target identity', /interface InvocationArgumentCorrespondenceEvidence[\s\S]*?readonly invocation: KnowledgeId[\s\S]*?readonly target: KnowledgeId/.test(source)],
  ['each argument has a single discriminated disposition', /type InvocationArgumentDisposition = InvocationArgumentBindingClaim \| InvocationUnboundArgument/.test(source)],
  ['binding judgment uses one ordered disposition ledger', /argumentDispositions: readonly \[InvocationArgumentBindingClaim, \.\.\.InvocationArgumentBindingClaim\[\]\]/.test(source) && /argumentDispositions: readonly \[InvocationArgumentDisposition, \.\.\.InvocationArgumentDisposition\[\]\]/.test(source)],
  ['incomplete judgment does not duplicate an unbound-argument list', !/readonly unresolvedArguments: readonly \[InvocationUnboundArgument/.test(source)],
  ['coverage invariant requires one ordered disposition per argument', /single-ordered-disposition-per-invocation-argument-with-no-loss-or-duplication/.test(source)],
  ['exact positional-evidence invariant is declared', /normalization-evidence-identifies-the-exact-invocation-and-ordered-argument-sequence/.test(source)],
  ['claim provenance includes invocation and target identity', /basis: 'confirmed-positional-order'/.test(source) && /readonly correspondenceEvidence: readonly SemanticSource\[\]/.test(source)],
  ['runtime/algebra/scanner wiring is not changed by this audit phase', true],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} interface-contract checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
