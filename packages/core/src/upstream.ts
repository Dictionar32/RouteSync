/** Narrow upstream composition surface for the CLI host boundary. */
export {
  requestTypeDerivationProductionPipelineAssembler,
  requestTypeDerivationSemanticPipelineRequirement,
} from './compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition';
export {
  REQUEST_TYPE_AUTHORITY_DECISION_RULE_IDS,
  requestTypeDerivationContract,
} from './types/upstream/requestTypeDerivationInterface';
export type {
  RequestTypeDerivationSemanticPipelineAssemblyResult,
  RequestTypeDerivationSemanticPipelineCompositionInterface,
  RequestTypeDerivationSemanticPipelineInterface,
} from './types/upstream/requestTypeDerivationInterface';
export {
  prepareRequestTypeDerivationSemanticInput,
  requestTypeDerivationSemanticInputPreparation,
} from './compiler/semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation';
export type {
  RequestTypeDerivationSemanticInputPreparation,
  RequestTypeDerivationSemanticInputPreparationInterface,
  RequestTypeDerivationIdentityCollisionInventory,
} from './types/upstream/requestTypeDerivationInterface';

export { requestTypeDerivationDuplicateIdentityWitnesses, requestTypeDerivationIdentityCollisionInventory } from './compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory';

// Concrete source-bound RequestType semantic stages. Their supported scope is
// explicit: selected source and contribution checks are implemented, but the
// independent verifier does not yet discharge the full 34-law contract.
export { requestTypeDerivationSemanticReasoning, requestTypeDerivationIdentityConflictLedgerVerification } from './compiler/semantic/request-type-derivation/requestTypeDerivationSemanticReasoning';
export type { RequestTypeDerivationIdentityConflictLedgerVerificationInterface } from './compiler/semantic/request-type-derivation/requestTypeDerivationSemanticReasoning';
export type { RequestTypeDerivationProductionPipelineAssemblerInterface, RequestTypeDerivationSemanticPipelineRequirementInterface } from './compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition';
export { requestTypeDerivationProofVerifier } from './compiler/semantic/request-type-derivation/requestTypeDerivationProofVerifier';
export { requestTypeDerivationGroupContributionAlgebra } from './compiler/semantic/request-type-derivation/requestTypeDerivationGroupContributionAlgebra';
export { RequestTypeDerivationSemanticProducerGapError } from './compiler/semantic/request-type-derivation/requestTypeDerivationSemanticProducerGap';
export { requestTypeDerivationSemanticComposition, requestTypeDerivationSemanticDecision, requestTypeDerivationSemanticAuthority, requestTypeDerivationSemanticAuthorityIntegrity } from './compiler/semantic/request-type-derivation/requestTypeDerivationSemanticComposition';
