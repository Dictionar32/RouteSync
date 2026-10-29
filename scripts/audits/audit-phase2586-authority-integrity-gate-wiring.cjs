const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const assembler = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
const gate = read('packages/core/src/types/upstream/requestTypeDerivationAuthorityIntegrityGate.ts');
const preparation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationOperationPreparation.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const index = read('packages/core/src/index.ts');
const checks = [
  ['semantic composition requires the upstream integrity capability', /readonly integrity:\s*RequestTypeDerivationSemanticAuthorityIntegrityInterface<TContract, TInference>/.test(contract)],
  ['integrity capability contract mismatch is an explicit assembly rejection', /capability: 'reasoning' \| 'verifier' \| 'decision' \| 'authority' \| 'integrity'/.test(contract) && /mismatch\('integrity', composition\.contract, composition\.integrity\.contract\)/.test(assembler)],
  ['assembler constructs canonical integrity gate', assembler.includes('createRequestTypeDerivationAuthorityIntegrityGate(composition.authority, composition.integrity)')],
  ['gate receives original input candidate and verification envelope', assembler.includes('authorityIntegrityGate.evaluate(input, candidate, verification)')],
  ['integrity rejection remains an explicit pipeline result', /kind: 'integrity_rejected'[\s\S]*?kind: 'integrity_invalid'/.test(contract)],
  ['pipeline derive exposes closed derivation result ADT', /readonly derive:[\s\S]*?RequestTypeDerivationSemanticPipelineDerivationResult<TContract, TInference>/.test(contract)],
  ['assembler does not invoke authority directly outside gate', !/return composition\.authority\.evaluate\(input, candidate\)/.test(assembler)],
  ['invalid integrity short-circuits authority evaluation', /integrity_invalid[\s\S]*?kind: 'integrity_rejected'[\s\S]*?authority\.evaluate/.test(gate)],
  ['operation preparation converts gate rejection to closed execution outcome', /derivation\.kind === 'integrity_rejected'[\s\S]*?kind: 'authority_integrity_failed'/.test(preparation)],
  ['manifest lowering propagates authority integrity failure as non-projectable', /case 'authority_integrity_failed'/.test(lowering)],
  ['public core entry exports pipeline derivation result ADT', index.includes('RequestTypeDerivationSemanticPipelineDerivationResult')],
  ['legacy RequestType[] solver is not used to fabricate proof in assembler', !assembler.includes('requestTypeDerivationSolver') && !assembler.includes('RequestType[]')],
  ['new wiring does not import semantic foundation/relation', !/semantic\/(foundation|relations)|semantic\/relation/.test(assembler + gate + preparation)],
  ['new wiring does not introduce subscanner imports', !/operations\//.test(assembler + gate + preparation)],
  ['source occurrence guard remains a decorator of the supplied complete verifier', /createSourceOccurrenceGuardedRequestTypeDerivationProofVerifier\(composition\.verifier\)/.test(assembler)],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
const syntaxFiles = [
  'packages/core/src/types/upstream/requestTypeDerivationInterface.ts',
  'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts',
  'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationOperationPreparation.ts',
  'packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts',
  'packages/core/src/index.ts',
  'packages/core/src/types/upstream/__test__/requestTypeDerivationAssessmentContractBinding.phase1600.test.ts',
  'packages/core/src/types/upstream/__test__/requestTypeDerivationPipelineInferencePreservation.phase1606.test.ts',
  'packages/core/src/types/upstream/__test__/requestTypeDerivationCapabilityInferenceClosure.phase1607.test.ts',
];
for (const file of syntaxFiles) {
  const syntax = ts.transpileModule(read(file), {
    fileName: path.basename(file),
    compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
  });
  const errors = (syntax.diagnostics ?? []).filter(item => item.category === ts.DiagnosticCategory.Error);
  const passed = errors.length === 0;
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} syntax transpilation ${file}\n`);
  if (!passed) failed += errors.length;
}
process.stdout.write(`RESULT ${checks.length + syntaxFiles.length - failed}/${checks.length + syntaxFiles.length} assertions passed\n`);
if (failed) process.exitCode = 1;
