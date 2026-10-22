import type {
  OperationIdentity,
  OperationIdentityCapabilityContract,
  OperationIdentityCapabilityInput,
  OperationIdentityCapabilityContractMaterializerInterface,
  OperationIdentityCapabilityRuntimeAlgebraInterface,
} from './operationIdentityCapability';
import type { SemanticReasoningContract } from './semanticReasoning';

/**
 * Upstream contract materializer for operation identity capability.
 *
 * This is not the runtime executor. It seals an already-resolved route
 * capability and carries forward its evidence, derivation, provenance, and
 * reasoning proof without classifying HTTP methods or deriving route identity.
 */
const materializeOperationIdentityCapability = (
  input: OperationIdentityCapabilityInput,
): OperationIdentityCapabilityContract => {
  const identity: OperationIdentity = Object.freeze({
    kind: 'operation_identity',
    route: input.identity,
  });
  const reasoning: SemanticReasoningContract = input.reasoning;

  return Object.freeze({
    kind: 'operation_identity_capability',
    authority: 'upstream',
    identity,
    reasoning,
    evidence: Object.freeze({
      kind: 'operation_identity_capability_evidence',
      route: input.identity,
      closed: true,
    }),
    derivation: input.derivation,
    provenance: input.provenance,
    closed: true,
  });
};

/** Canonical upstream materializer; only seals already-resolved evidence. */
export const operationIdentityCapabilityContractMaterializer: OperationIdentityCapabilityContractMaterializerInterface = Object.freeze({
  materialize: materializeOperationIdentityCapability,
});

/** @deprecated Compatibility facade for historical callers. */
export const operationIdentityCapabilityAlgebra: OperationIdentityCapabilityRuntimeAlgebraInterface = Object.freeze({
  materialize: materializeOperationIdentityCapability,
  fromRoute: materializeOperationIdentityCapability,
});
