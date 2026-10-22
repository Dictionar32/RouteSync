const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const upstream = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const upstreamBarrel = read('packages/core/src/types/upstream/index.ts');
const coreBarrel = read('packages/core/src/index.ts');
const preparation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation.ts');
const inventory = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts');
const assembler = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
const production = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts');
const reasoning = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticReasoning.ts');
const verifier = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProofVerifier.ts');
const loader = read('packages/cli/src/standaloneCompositionLoader.ts');
const cli = read('packages/cli/src/index.ts');
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed: Boolean(passed), detail });

check('canonical upstream contract declares the reasoning interface and closed judgment ADT',
  upstream.includes('interface RequestTypeDerivationSemanticReasoningInterface') &&
  upstream.includes("readonly kind: 'derived'") && upstream.includes("readonly kind: 'incomplete'") &&
  upstream.includes("readonly kind: 'conflict'") && upstream.includes("readonly kind: 'invalid_input'"),
  'The domain contract exists; this is not an interface-export typo.');
check('canonical upstream contract declares independent verifier and full law inventory',
  upstream.includes('interface RequestTypeDerivationProofVerificationInterface') &&
  upstream.includes('REQUEST_TYPE_DERIVATION_LAW_IDS') && /REQUEST_TYPE_DERIVATION_LAW_IDS\s*=\s*\[/.test(upstream),
  'Proof verification and the closed law inventory are specified upstream.');
check('canonical upstream barrel exports the contract',
  upstreamBarrel.includes("export * from './requestTypeDerivationInterface'") &&
  coreBarrel.includes("from './types/upstream/requestTypeDerivationInterface'"),
  'Do not create a competing interface or contract version.');
check('input preparation consumes canonical inventory and both resolution ledgers',
  /requestTypeDerivationSourceEvidenceInventory\.inventory\(input\)/.test(preparation) &&
  /requestTypeDerivationRequestResolutionInventory\.resolve/.test(preparation) &&
  /requestTypeDerivationResourceResolutionInventory\.resolve/.test(preparation),
  'The existing upstream preparation path reaches source inventory and request/resource assessment.');
check('identity and occurrence implementation is owned by semantic implementation layer',
  inventory.includes('canonicalRouteIdentity') && inventory.includes('canonicalResourceIdentity') &&
  inventory.includes('canonicalRequestIdentity') && inventory.includes('canonicalRouteOccurrenceKey'),
  'Canonical identity is implemented and should be reused by the producer/verifier.');
check('assembler is wiring only and delegates to supplied reasoning and verifier',
  /composition\.reasoning\.infer\(preparedInput\)/.test(assembler) &&
  /verifier\.verify\(inference\)/.test(assembler),
  'Composition wiring exists but does not create the missing semantic capabilities.');
check('production composition does not falsely export a complete pipeline producer',
  !/export const requestTypeDerivationSemanticPipelineComposition\s*=/.test(production),
  'Confirmed root blocker: no in-repository production semantic composition value.');
check('named reasoning producer is exported and source-bound',
  exists('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticReasoning.ts') &&
  /export const requestTypeDerivationSemanticReasoning:\s*RequestTypeDerivationSemanticReasoningInterface/.test(reasoning) &&
  /identityCollisionInventory/.test(reasoning) && /conflictsFromIdentityCollisions/.test(reasoning) && /kind: 'conflict'/.test(reasoning),
  'The producer emits duplicate identity as source-grounded conflict, plus source-ledger incomplete and ambiguous-request conflict judgments; contribution-complete derivation remains a typed gap.');
check('verifier independently recomputes duplicate identity evidence but does not claim all laws',
  exists('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProofVerifier.ts') &&
  /export const requestTypeDerivationProofVerifier:\s*RequestTypeDerivationProofVerificationInterface/.test(verifier) &&
  /IdentityConflictLedgerMatchesInput/.test(verifier) && /verification_incomplete/.test(verifier) &&
  /34 canonical proof laws/.test(verifier),
  'Collision witnesses are correlated to raw input but return verification_incomplete; remaining laws stay explicitly blocked.');
check('CLI defaults to the in-repository diagnostic composition and still permits host override',
  loader.includes('requestTypeDerivationSemanticComposition') &&
  /composition_module_loaded', composition: requestTypeDerivationSemanticComposition/.test(loader) &&
  loader.includes('ROUTESYNC_UPSTREAM_COMPOSITION_MODULE'),
  'The CLI reaches the upstream stages by default; unsupported stages throw typed gap errors and no legacy judgment is fabricated.');

for (const result of checks) {
  process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n  ${result.detail}\n`);
}
const passed = checks.filter(result => result.passed).length;
process.stdout.write(`\nPhase 2655 root-cause trace: ${passed}/${checks.length} assertions passed.\n`);
process.stdout.write('SEMANTIC CLOSURE BLOCKED: duplicate identity is emitted as a source-grounded conflict and partial conflict verification is explicit; contribution-complete derivation, all 34 verifier laws, decision/authority/integrity, and production completion remain incomplete.\n');
if (passed !== checks.length) process.exitCode = 1;
