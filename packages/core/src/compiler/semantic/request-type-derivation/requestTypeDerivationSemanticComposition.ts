/**
 * Canonical upstream semantic composition used by the standalone CLI runtime.
 * All exposed capabilities are executable semantic implementations, not example
 * placeholders. Incomplete proof-law verification remains an explicit ADT result.
 */
import {
  requestTypeDerivationContract,
  type RequestTypeDerivationSemanticPipelineCompositionInterface,
} from '../../../types/upstream/requestTypeDerivationInterface';
import { requestTypeDerivationSemanticInputPreparation } from './requestTypeDerivationSemanticInputPreparation';
import { requestTypeDerivationSemanticReasoning } from './requestTypeDerivationSemanticReasoning';
import { requestTypeDerivationProofVerifier } from './requestTypeDerivationProofVerifier';
import { createRequestTypeDerivationSemanticDecision } from './requestTypeDerivationSemanticDecision';
import { createRequestTypeDerivationSemanticAuthority } from './requestTypeDerivationSemanticAuthority';
import { createRequestTypeDerivationSemanticAuthorityIntegrity } from './requestTypeDerivationAuthorityIntegrity';

const contractEquivalence = Object.freeze({
  equivalent: (left: typeof requestTypeDerivationContract, right: typeof requestTypeDerivationContract): boolean => left === right,
});

export const requestTypeDerivationSemanticDecision = createRequestTypeDerivationSemanticDecision(requestTypeDerivationContract);
export const requestTypeDerivationSemanticAuthority = createRequestTypeDerivationSemanticAuthority(requestTypeDerivationContract);
export const requestTypeDerivationSemanticAuthorityIntegrity = createRequestTypeDerivationSemanticAuthorityIntegrity({
  contract: requestTypeDerivationContract,
  contractEquivalence,
});

/** The exact named export required by standaloneCompositionLoader is runtime-owned. */
export const requestTypeDerivationSemanticComposition: RequestTypeDerivationSemanticPipelineCompositionInterface = Object.freeze({
  contract: requestTypeDerivationContract,
  preparation: requestTypeDerivationSemanticInputPreparation,
  reasoning: requestTypeDerivationSemanticReasoning,
  verifier: requestTypeDerivationProofVerifier,
  decision: requestTypeDerivationSemanticDecision,
  authority: requestTypeDerivationSemanticAuthority,
  integrity: requestTypeDerivationSemanticAuthorityIntegrity,
});
