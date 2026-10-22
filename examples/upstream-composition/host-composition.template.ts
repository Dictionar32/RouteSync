/**
 * Host-owned integration template; intentionally not a runnable production bundle.
 * Replace ./productionCapabilities.js with real implementations that satisfy the
 * canonical interfaces. Do not import the diagnostic composition as a fallback.
 */
import {
  requestTypeDerivationContract,
  type RequestTypeDerivationSemanticPipelineCompositionInterface,
} from '@routesync/core/upstream';
import {
  productionPreparation,
  productionReasoning,
  completeProofVerifier,
  productionDecision,
  sourceBoundAuthority,
  completeIntegrityValidator,
} from './productionCapabilities.js';

/** This exact named export is what the standalone CLI loader resolves at runtime. */
export const requestTypeDerivationSemanticComposition:
  RequestTypeDerivationSemanticPipelineCompositionInterface = Object.freeze({
    contract: requestTypeDerivationContract,
    preparation: productionPreparation,
    reasoning: productionReasoning,
    verifier: completeProofVerifier,
    decision: productionDecision,
    authority: sourceBoundAuthority,
    integrity: completeIntegrityValidator,
  });
