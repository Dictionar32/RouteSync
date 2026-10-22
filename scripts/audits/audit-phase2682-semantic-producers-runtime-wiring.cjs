const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const composition = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticComposition.ts');
const decision = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticDecision.ts');
const authority = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticAuthority.ts');
const integrity = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthorityIntegrity.ts');
const assembler = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['runtime named export is explicitly typed and wired to real producer factories', /export const requestTypeDerivationSemanticComposition:\s*RequestTypeDerivationSemanticPipelineCompositionInterface/.test(composition) && /createRequestTypeDerivationSemanticDecision\(requestTypeDerivationContract\)/.test(composition) && /createRequestTypeDerivationSemanticAuthority\(requestTypeDerivationContract\)/.test(composition)],
  ['decision algebra emits distinct proof rules for derived/incomplete/conflict/rejected/failed verification', /closed_derivation_with_complete_verification/.test(decision) && /incomplete_derivation_with_complete_verification/.test(decision) && /conflicted_derivation_with_complete_verification/.test(decision) && /invalid_input_with_matching_rejection_witness/.test(decision) && /non_invalid_judgment_with_counterexample/.test(decision)],
  ['partial verification cannot become a verified derivation', /coverage\.kind === 'verification_incomplete'/.test(decision) && /verified_law_coverage_incomplete/.test(decision)],
  ['decision proof retains exact input, judgment, verification and inference binding', /const \{ input, judgment \} = premises\.inference/.test(decision) && /verificationBinding: Object\.freeze\(\{ contract, inference: premises\.inference \}\)/.test(decision)],
  ['authority validates source identity and closed proof coherence without re-deriving', /proof\.premises\.input !== input/.test(authority) && /validateRequestTypeDerivationSemanticAssessment/.test(authority) && !/deriveJudgment|reasoning\.infer/.test(authority)],
  ['integrity checks contract equivalence and exact source/inference/judgment/verification witnesses', /equivalent\(capability\.contract, candidate\.contract\)/.test(integrity) && /source_input_mismatch/.test(integrity) && /inference_packet_mismatch/.test(integrity) && /judgment_mismatch/.test(integrity) && /verification_result_mismatch/.test(integrity)],
  ['canonical assembler calls preparation, reasoning, verifier, decision and authority integrity gate in order', /composition\.preparation\.prepare\(input\)/.test(assembler) && /composition\.reasoning\.infer\(preparedInput\)/.test(assembler) && /verifier\.verify\(inference\)/.test(assembler) && /composition\.decision\.decide\(/.test(assembler) && /authorityIntegrityGate\.evaluate\(input, candidate, verification\)/.test(assembler)],
  ['scan and sync preserve manifest preflight as a runtime gate before projection', /routeManifestRequestResolutionPreflight\.evaluate\(completeManifest\)/.test(scan) && /project\(\s*requestResolutionPreflight/.test(scan) && /routeManifestRequestResolutionPreflight\.evaluate\(completeManifest\)/.test(sync) && /project\(\s*requestResolutionPreflight/.test(sync)],
  ['audit is registered as a runnable package script', pkg.scripts?.['audit:phase2682-semantic-producers-runtime-wiring'] === 'node scripts/audits/audit-phase2682-semantic-producers-runtime-wiring.cjs'],
];
let failed = 0;
for (const [name, pass] of checks) { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`); if (!pass) failed++; }
console.log(`Phase 2682 semantic producer/runtime wiring: ${checks.length - failed}/${checks.length}`);
if (failed) process.exitCode = 1;
