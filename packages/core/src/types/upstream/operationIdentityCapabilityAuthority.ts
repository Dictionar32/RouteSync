import type {
  OperationIdentityCapabilityAuthorityInterface,
  OperationIdentityCapabilityContract,
  OperationIdentityCapabilityInput,
  OperationIdentityCapabilityContractMaterializerInterface,
} from './operationIdentityCapability';
import { operationIdentityCapabilityContractMaterializer } from './operationIdentityCapabilityAlgebra';

/**
 * Interface-first runtime surface for upstream operation-identity materialization.
 * Each operation seals already-resolved evidence; it never infers route meaning
 * or creates a replacement reasoning proof.
 */
export interface OperationIdentityCapabilityAuthorityOperationsInterface {
  readonly kind: 'operation_identity_capability_authority_operations';
  readonly contractVersion: 1;
  readonly createAuthority: (
    materializer: OperationIdentityCapabilityContractMaterializerInterface,
  ) => OperationIdentityCapabilityAuthorityInterface;
  readonly materialize: (
    input: OperationIdentityCapabilityInput,
    authority?: OperationIdentityCapabilityAuthorityInterface,
  ) => OperationIdentityCapabilityContract;
  /** @deprecated Compatibility projection; prefer materialize. */
  readonly fromRoute: (
    input: OperationIdentityCapabilityInput,
    authority?: OperationIdentityCapabilityAuthorityInterface,
  ) => OperationIdentityCapabilityContract;
}

const createOperationIdentityCapabilityAuthorityImpl = (
  materializer: OperationIdentityCapabilityContractMaterializerInterface,
): OperationIdentityCapabilityAuthorityInterface => Object.freeze({
  kind: 'operation_identity_capability_authority',
  authority: 'upstream',
  closed: true,
  materialize: (input: OperationIdentityCapabilityInput): OperationIdentityCapabilityContract =>
    materializer.materialize(input),
  fromRoute: (input: OperationIdentityCapabilityInput): OperationIdentityCapabilityContract =>
    materializer.materialize(input),
});

/** Canonical upstream authority bound to the production materializer. */
export const operationIdentityCapabilityAuthority: OperationIdentityCapabilityAuthorityInterface =
  createOperationIdentityCapabilityAuthorityImpl(operationIdentityCapabilityContractMaterializer);

const materializeOperationIdentityCapabilityImpl = (
  input: OperationIdentityCapabilityInput,
  authority: OperationIdentityCapabilityAuthorityInterface = operationIdentityCapabilityAuthority,
): OperationIdentityCapabilityContract => authority.materialize(input);

/** Public runtime operations: all exported behavior is accessed through this typed object. */
export const operationIdentityCapabilityAuthorityOperations: OperationIdentityCapabilityAuthorityOperationsInterface = Object.freeze({
  kind: 'operation_identity_capability_authority_operations',
  contractVersion: 1,
  createAuthority: createOperationIdentityCapabilityAuthorityImpl,
  materialize: materializeOperationIdentityCapabilityImpl,
  fromRoute: materializeOperationIdentityCapabilityImpl,
});
