const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const index = read('packages/core/src/index.ts');
const gate = read('packages/core/src/types/upstream/requestTypeDerivationAuthorityIntegrityGate.ts');
const runtime = read('packages/core/src/types/upstream/requestTypeDerivationAuthorityIntegrityRuntime.ts');
const assembler = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
const report = read('packages/core/src/types/upstream/docs/PHASE2584_CLI_MANIFEST_UPSTREAM_END_TO_END_TRACE.md');
const checks = [
  ['public entry exports authority integrity gate operation', index.includes("export { createRequestTypeDerivationAuthorityIntegrityGate } from './types/upstream/requestTypeDerivationAuthorityIntegrityGate';")],
  ['public entry exports gate contract and result ADT', index.includes('RequestTypeDerivationAuthorityIntegrityGateInterface, RequestTypeDerivationAuthorityIntegrityGateResult')],
  ['public entry exports explicit integrity validator factory', index.includes("export { createRequestTypeDerivationSemanticAuthorityIntegrity } from './types/upstream/requestTypeDerivationAuthorityIntegrityRuntime';")],
  ['gate accepts exact source input, candidate and verification witness', /evaluate:\s*\(\s*input:\s*RequestTypeDerivationInput,\s*candidate:[\s\S]*?verification: RequestTypeDerivationSemanticVerificationFor/.test(gate)],
  ['gate short-circuits invalid integrity before authority invocation', /integrity_invalid[\s\S]*?kind: 'integrity_rejected'[\s\S]*?authority\.evaluate/.test(gate)],
  ['integrity validator checks source input identity', runtime.includes('proof.premises.input !== expectedInput || inference.input !== expectedInput')],
  ['integrity validator checks judgment/inference correlation', runtime.includes('proof.premises.judgment !== inference.judgment')],
  ['integrity validator checks verification-result correlation', runtime.includes('proof.premises.verification !== verification.result')],
  ['assembler wires the integrity gate before authority evaluation', assembler.includes('createRequestTypeDerivationAuthorityIntegrityGate') && assembler.includes('authorityIntegrityGate.evaluate(input, candidate, verification)')],
  ['report preserves missing production reasoning/verifier blocker', /producer|verifier|missing|blocker/i.test(report)],
  ['new export path avoids semantic foundation/relation imports', !/semantic\/(foundation|relations)|semantic\/relation/.test(index.slice(index.indexOf('export { assembleRequestTypeDerivationProductionPipeline'))),],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length} assertions passed\n`);
if (failed) process.exitCode = 1;
