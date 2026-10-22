/**
 * Canonical semantic input preparation for the active manifest path.
 *
 * This operation owns the source inventory and request/resource resolution
 * ledgers. It intentionally stops before semantic judgment production: only the
 * reasoning capability may turn this packet's source evidence into a judgment.
 */
import type {
  RequestTypeDerivationInput,
  RequestTypeDerivationSemanticInputPreparation,
  RequestTypeDerivationSemanticInputPreparationInterface,
} from '../../../types/upstream/requestTypeDerivationInterface';
import { requestTypeDerivationSourceEvidenceInventory } from './requestTypeDerivationSourceEvidenceInventory';
import { requestTypeDerivationRequestResolutionInventory } from './requestTypeDerivationRequestResolutionInventory';
import { requestTypeDerivationRequestResolutionAssessment } from './requestTypeDerivationRequestResolutionAssessment';
import { requestTypeDerivationResourceResolutionInventory } from './requestTypeDerivationResourceResolutionInventory';
import { requestTypeDerivationResourceResolutionAssessment } from './requestTypeDerivationResourceResolutionAssessment';

export const prepareRequestTypeDerivationSemanticInput: RequestTypeDerivationSemanticInputPreparationInterface['prepare'] = (
  input: RequestTypeDerivationInput,
): RequestTypeDerivationSemanticInputPreparation => {
  const inventory = requestTypeDerivationSourceEvidenceInventory.inventory(input);
  const identityCollisionInventory = requestTypeDerivationSourceEvidenceInventory.identityCollisionInventory(input);
  const requestResolutionLedger = requestTypeDerivationRequestResolutionInventory.resolve({ ...input, inventory });
  const resourceResolutionLedger = requestTypeDerivationResourceResolutionInventory.resolve({ ...input, inventory });

  return Object.freeze({
    ...input,
    kind: 'request_type_derivation_semantic_input_preparation',
    input,
    inventory,
    sourceEvidence: Object.freeze([...inventory.routes, ...inventory.resources, ...inventory.requests]),
    identityCollisionInventory,
    requestResolutionLedger,
    requestAssessment: requestTypeDerivationRequestResolutionAssessment.assess(requestResolutionLedger),
    resourceResolutionLedger,
    resourceAssessment: requestTypeDerivationResourceResolutionAssessment.assess(resourceResolutionLedger),
  });
};

export const requestTypeDerivationSemanticInputPreparation: RequestTypeDerivationSemanticInputPreparationInterface = Object.freeze({
  prepare: prepareRequestTypeDerivationSemanticInput,
});
