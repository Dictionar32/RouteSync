import type {
  OperationIdentityCapabilityAuthorityInterface,
  OperationIdentityCapabilityContract,
  OperationIdentityCapabilityInput,
  OperationIdentityCapabilityContractMaterializerInterface,
} from './operationIdentityCapability';
import { operationIdentityCapabilityContractMaterializer } from './operationIdentityCapabilityAlgebra';

/**
 * Compose an upstream authority around the canonical executable algebra.
 * The authority adds ownership metadata and delegates judgment construction;
 * it does not rebuild identity, evidence, or semantic proof.
 */
export function createOperationIdentityCapabilityAuthority(
  materializer: OperationIdentityCapabilityContractMaterializerInterface,
): OperationIdentityCapabilityAuthorityInterface {
  return Object.freeze({
    kind: 'operation_identity_capability_authority',
    authority: 'upstream',
    closed: true,
    materialize: (input: OperationIdentityCapabilityInput): OperationIdentityCapabilityContract =>
      materializer.materialize(input),
    fromRoute: (input: OperationIdentityCapabilityInput): OperationIdentityCapabilityContract =>
      materializer.materialize(input),
  });
}

/** Canonical upstream authority bound to the production algebra. */
export const operationIdentityCapabilityAuthority = createOperationIdentityCapabilityAuthority(
  operationIdentityCapabilityContractMaterializer,
);

/** Backwards-compatible authority entry point; callers may supply a composed authority. */
export function operationIdentityCapabilityFromRoute(
  route: OperationIdentityCapabilityInput,
  authority: OperationIdentityCapabilityAuthorityInterface = operationIdentityCapabilityAuthority,
): OperationIdentityCapabilityContract {
  return authority.materialize(route);
}

/** Canonical producer entry point: materialize an identity from already-resolved route evidence. */
export function materializeOperationIdentityCapability(
  input: OperationIdentityCapabilityInput,
  authority: OperationIdentityCapabilityAuthorityInterface = operationIdentityCapabilityAuthority,
): OperationIdentityCapabilityContract {
  return authority.materialize(input);
}
