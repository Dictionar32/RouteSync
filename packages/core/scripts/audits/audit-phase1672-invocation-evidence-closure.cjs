const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const source = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts'), 'utf8');
const bindingSection = source.slice(source.indexOf('export type InvocationSemanticEvidence'), source.indexOf('export interface SemanticCallEmissionFlow'));
const checks = [
  ['model interface version advanced to 15', /readonly version: 15/.test(source) && /version: 15,/.test(source)],
  ['contract version advanced to 26', /readonly version: 26/.test(source) && /version: 26,/.test(source)],
  ['source evidence alias is a non-empty tuple', /export type InvocationSemanticEvidence = readonly \[SemanticSource, \.\.\.SemanticSource\[\]\]/.test(source)],
  ['argument evidence must be non-empty', /readonly argumentEvidence: InvocationSemanticEvidence/.test(bindingSection)],
  ['parameter evidence must be non-empty', /readonly parameterEvidence: InvocationSemanticEvidence/.test(bindingSection)],
  ['correspondence evidence must be non-empty', /readonly correspondenceEvidence: InvocationSemanticEvidence/.test(bindingSection)],
  ['bound claims require non-empty evidence', /interface InvocationArgumentBindingClaim[\s\S]*?readonly evidence: InvocationSemanticEvidence/.test(bindingSection)],
  ['unbound claims require non-empty evidence', /interface InvocationUnboundArgument[\s\S]*?readonly evidence: InvocationSemanticEvidence/.test(bindingSection)],
  ['unavailable-target dispositions require non-empty evidence', /type InvocationBindingUnavailableArgument[\s\S]*?readonly evidence: InvocationSemanticEvidence/.test(bindingSection)],
  ['unproven-form dispositions require non-empty evidence', /interface InvocationArgumentFormUnprovenDisposition[\s\S]*?readonly evidence: InvocationSemanticEvidence/.test(bindingSection)],
  ['every outcome requires non-empty judgment evidence', (bindingSection.match(/readonly evidence: InvocationSemanticEvidence/g) || []).length >= 10],
  ['provenance invariant declares non-empty claim-specific source evidence', /every-binding-evidence-component-and-every-disposition-retains-non-empty-claim-specific-source-evidence/.test(source)],
  ['identity and coverage invariants remain present', /every-binding-matches-enclosing-invocation-and-target/.test(source) && /single-ordered-disposition-per-invocation-argument-with-no-loss-or-duplication-in-every-outcome/.test(source)],
  ['interface does not import semantic foundation', !/semantic\/foundation/.test(source)],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} interface-contract checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
