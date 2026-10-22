const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const loader = read('packages/cli/src/standaloneCompositionLoader.ts');
const cli = read('packages/cli/src/index.ts');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const semantic = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticComposition.ts');
const decision = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticDecision.ts');
const authority = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticAuthority.ts');
const integrity = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthorityIntegrity.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const template = read('examples/upstream-composition/host-composition.template.ts');
const readme = read('examples/upstream-composition/README.md');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['CLI runtime resolves the documented named export from configured module', /ROUTESYNC_UPSTREAM_COMPOSITION_MODULE/.test(cli) && /ROUTESYNC_UPSTREAM_COMPOSITION_EXPORT\s*=\s*'requestTypeDerivationSemanticComposition'/.test(loader)],
  ['configured module import/evaluation failures remain an explicit typed ADT and fail closed at CLI', /composition_module_import_failed/.test(loader) && /case 'composition_module_import_failed'/.test(cli) && /could not import composition module/.test(cli)],
  ['loader regression test exercises missing configured module without fallback', /configured but unresolvable module/.test(read('packages/cli/src/__tests__/standaloneCompositionLoader.phase2661.test.ts')) && /composition_module_import_failed/.test(read('packages/cli/src/__tests__/standaloneCompositionLoader.phase2661.test.ts'))],
  ['runtime guard requires executable preparation before reasoning', /member\(preparation, 'prepare'\)\s*===\s*'function'/.test(loader)],
  ['canonical interface requires preparation and all semantic stages', /readonly preparation:/.test(contract) && /readonly reasoning:/.test(contract) && /readonly verifier:/.test(contract) && /readonly decision:/.test(contract) && /readonly authority:/.test(contract) && /readonly integrity:/.test(contract)],
  ['host template uses export const name: Interface syntax', /export const requestTypeDerivationSemanticComposition:\s*RequestTypeDerivationSemanticPipelineCompositionInterface/.test(template)],
  ['in-repository runtime composition itself uses export const name: Interface syntax', /export const requestTypeDerivationSemanticComposition:\s*RequestTypeDerivationSemanticPipelineCompositionInterface/.test(semantic)],
  ['loader dynamically imports configured module and resolves the canonical named export', /await import\(moduleSpecifier\)/.test(loader) && /member\(loaded, ROUTESYNC_UPSTREAM_COMPOSITION_EXPORT\)/.test(loader) && /requestTypeDerivationSemanticComposition/.test(loader)],
  ['host template wires the canonical contract and all six capabilities', /contract: requestTypeDerivationContract/.test(template) && /preparation: productionPreparation/.test(template) && /reasoning: productionReasoning/.test(template) && /verifier: completeProofVerifier/.test(template) && /decision: productionDecision/.test(template) && /authority: sourceBoundAuthority/.test(template) && /integrity: completeIntegrityValidator/.test(template)],
  ['example explicitly marks host capability module as an implementation seam', /not a runnable production bundle/.test(template) && /not a file supplied by this repository/.test(readme)],
  ['CLI missing-composition diagnostic names preparation and points to example', /executable preparation/.test(cli) && /examples\/upstream-composition/.test(cli)],
  ['scan preserves source identity/inventory ADT failures', /source-document identity binding/.test(scan) && /controller-inventory judgment/.test(scan)],
  ['sync preserves source identity/inventory ADT failures', /source-document identity binding/.test(sync) && /controller-inventory judgment/.test(sync)],
  ['scan preflights complete manifest then passes exact preflight packet to projection', /routeManifestRequestResolutionPreflight\.evaluate\(completeManifest\)/.test(scan) && /project\(\s*requestResolutionPreflight/.test(scan)],
  ['sync preflights complete manifest then passes exact preflight packet to projection', /routeManifestRequestResolutionPreflight\.evaluate\(completeManifest\)/.test(sync) && /project\(\s*requestResolutionPreflight/.test(sync)],
  ['runtime composition instantiates decision, authority and integrity implementations', /createRequestTypeDerivationSemanticDecision\(requestTypeDerivationContract\)/.test(semantic) && /createRequestTypeDerivationSemanticAuthority\(requestTypeDerivationContract\)/.test(semantic) && /createRequestTypeDerivationSemanticAuthorityIntegrity\(/.test(semantic)],
  ['decision producer constructs closed proofs for derived, incomplete, conflict and rejection outcomes', /closed_derivation_with_complete_verification/.test(decision) && /incomplete_derivation_with_complete_verification/.test(decision) && /conflicted_derivation_with_complete_verification/.test(decision) && /invalid_input_with_matching_rejection_witness/.test(decision) && /verification_incomplete/.test(decision)],
  ['authority binds candidate to exact input and validates proof conclusion coherence', /proof\.premises\.input !== input/.test(authority) && /validateRequestTypeDerivationSemanticAssessment/.test(authority)],
  ['integrity gate checks exact input, inference, judgment and verification witnesses', /source_input_mismatch/.test(integrity) && /inference_packet_mismatch/.test(integrity) && /judgment_mismatch/.test(integrity) && /verification_result_mismatch/.test(integrity)],
  ['audit registered as package script', pkg.scripts?.['audit:phase2680-cli-manifest-interface-first-runtime-trace'] === 'node scripts/audits/audit-phase2680-cli-manifest-interface-first-runtime-trace.cjs'],
];
let failed = 0;
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
  if (!pass) failed++;
}
console.log(`Phase 2680 CLI manifest interface-first runtime trace: ${checks.length - failed}/${checks.length}`);
if (failed) process.exitCode = 1;
