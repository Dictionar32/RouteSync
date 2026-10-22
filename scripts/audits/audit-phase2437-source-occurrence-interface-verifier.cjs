const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const operationPath = path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts');
const assemblerPath = path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
const indexPath = path.join(root, 'packages/core/src/index.ts');
const operation = fs.readFileSync(operationPath, 'utf8');
const assembler = fs.readFileSync(assemblerPath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');
const checks = [
  ['decorates canonical ProofVerificationInterface', operation.includes('RequestTypeDerivationProofVerificationInterface')],
  ['accepts the contract-bound inference packet', operation.includes('RequestTypeDerivationSemanticInferenceFor') && operation.includes('inference: TInference')],
  ['returns the canonical verification envelope', operation.includes('RequestTypeDerivationSemanticVerificationFor') && operation.includes('result: RequestTypeDerivationVerification')],
  ['delegates remaining laws to the supplied complete verifier', operation.includes('delegate.verify(inference).result')],
  ['guards the assembler verifier operation', assembler.includes('createSourceOccurrenceGuardedRequestTypeDerivationProofVerifier(composition.verifier)') && assembler.includes('verifier.verify(inference)')],
  ['checks occurrence keys against source coordinates', operation.includes('source_occurrence_key_matches_source_coordinates') && operation.includes('keyMismatch')],
  ['checks evidence location and input source coordinates', operation.includes('source_occurrence_location_matches_evidence') && operation.includes('sourceOccurrenceInputMembership') && operation.includes('sameLocation(source.location, membership.location)')],
  ['checks semantic identity against its evidence key', operation.includes('semanticKeyMatchesSourceIdentity')],
  ['checks pairwise duplicate occurrence locations', operation.includes('all_duplicate_occurrence_locations_are_pairwise_distinct') && operation.includes('duplicateOccurrenceViolation')],
  ['emits canonical failure ADTs rather than a parallel success ADT', operation.includes('RequestTypeDerivationVerificationFailure') && !operation.includes('source_occurrence_integrity_verified')],
  ['does not import semantic foundation or relations', !operation.includes('semantic/foundation') && !operation.includes('semantic/relations')],
  ['exports the interface decorator from core public entry', index.includes('createSourceOccurrenceGuardedRequestTypeDerivationProofVerifier')],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`\nPhase2437 source-occurrence interface verifier audit: ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
