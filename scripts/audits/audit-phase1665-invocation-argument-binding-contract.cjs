const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const knowledge = read('packages/core/src/types/upstream/semanticDataflowKnowledge.ts');
const algebra = read('packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const checks = [
  ['interface declares explicit binding outcomes', /kind: 'not-required'[\s\S]*kind: 'established'[\s\S]*kind: 'incomplete'[\s\S]*kind: 'blocked'/.test(contract)],
  ['source invocation models only an ordered argument identity list', /interface SemanticInvocation\s*\{[\s\S]*readonly arguments: readonly KnowledgeId\[\]/.test(knowledge)],
  ['binding contract unconditionally asserts positional correspondence', /correspondence: 'invocation-argument-index-to-callable-parameter-index'/.test(contract)],
  ['algebra binds arguments by array index', /resolved\.parameters\[argumentIndex\]/.test(algebra)],
  ['binding judgment variants do not carry an argument-form/evaluation-mode witness', !/argumentForm|argumentMode|unpacking|namedArgument/i.test(contract.match(/export type InvocationArgumentBindingJudgment =[\s\S]*?;\n\n\/\*\*/)?.[0] ?? '')],
  ['blocked target cardinality is not encoded as a correlated union', /targetResolution: 'unresolved' \| 'ambiguous'[\s\S]*candidates: readonly SemanticCallable\[\]/.test(contract)],
  ['binding completeness is stated as policy, not enforced by variant structure', /everyArgumentBound: 'established'/.test(contract) && !/everyArgumentBound/.test(contract.match(/export type InvocationArgumentBindingJudgment =[\s\S]*?;\n\n\/\*\*/)?.[0] ?? '')],
  ['binding evidence is an uncorrelated source array', /readonly evidence: readonly SemanticSource\[\]/.test(contract.match(/export type InvocationArgumentBindingJudgment =[\s\S]*?;\n\n\/\*\*/)?.[0] ?? '')],
  ['algebra still emits the pre-1664 judgment shape', /argumentParameters: slice\.bindings/.test(algebra)],
];
let failed = false;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!pass) failed = true;
}
process.stdout.write(`\n${checks.length - checks.filter(([, pass]) => pass).length} failed checks; ${checks.filter(([, pass]) => pass).length} audit observations confirmed.\n`);
// This audit intentionally records design gaps; a confirmed gap is a passing observation.
if (failed) process.exitCode = 1;
