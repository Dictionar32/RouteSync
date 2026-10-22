const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const source = fs.readFileSync(contractPath, 'utf8');

const checks = [
  ['distributive proof-to-inference binder exists', /type RequestTypeDerivationDecisionProofBoundToInference</.test(source)],
  ['binder preserves each decision variant premises', /TProof extends Readonly<\{\s*readonly premises: infer TPremises;\s*\}>/.test(source)],
  ['decision input is bound to inference input', /readonly input: TInference\['input'\]/.test(source)],
  ['decision judgment is bound to inference judgment', /readonly judgment: TInference\['judgment'\]/.test(source)],
  ['generic authority proof uses binder', /RequestTypeDerivationDecisionProofBoundToInference<\s*RequestTypeAuthorityDecisionProof,\s*TInference\s*>/.test(source)],
  ['verification result remains canonical in proof premises', /verification result itself remains canonical at `premises\.verification`/.test(source)],
  ['consumer-facing pipeline still exposes only derive', /readonly derive: \(\s*input: TInference\['input'\],\s*\) => RequestTypeDerivationSemanticAuthorityAssessmentFor/.test(source)],
];

let failed = false;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !passed;
}
if (failed) process.exitCode = 1;
