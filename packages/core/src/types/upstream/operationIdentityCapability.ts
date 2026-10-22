import type { RouteCapabilityContract, RouteIdentity } from './route';
import type { SemanticReasoningContract } from './semanticReasoning';
import type { SemanticCapabilityContractInterface, SemanticCapabilityEvidence } from './semanticCapability';

/** Closed evidence produced by upstream semantic reasoning. */
export interface OperationIdentityCapabilityEvidence extends SemanticCapabilityEvidence {
  readonly kind: 'operation_identity_capability_evidence';
  readonly route: RouteIdentity;
}

/** Closed semantic judgment for operation identity. */
export interface OperationIdentity {
  readonly kind: 'operation_identity';
  readonly route: RouteIdentity;
}

/**
 * Closed result contract for operation identity capability (legacy exported name).
 *
 * This interface describes the resulting capability shape; it is not an
 * executable algebra. Upstream materialization is specified separately by
 * OperationIdentityCapabilityContractMaterializerInterface. This module remains type-only.
 */
export interface OperationIdentityCapabilityAlgebraInterface
  extends SemanticCapabilityContractInterface<'operation_identity_capability', OperationIdentityCapabilityEvidence, OperationIdentity> {
  readonly identity: OperationIdentity;
  /** Proof-carrying semantic reasoning that established this identity. */
  readonly reasoning: SemanticReasoningContract;
}

/** Runtime input accepted by the canonical operation-identity algebra. */
export type OperationIdentityCapabilityInput = Pick<
  RouteCapabilityContract,
  'evidence' | 'derivation' | 'provenance' | 'reasoning' | 'closed'
> & Readonly<{ readonly identity: RouteIdentity }>;

/**
 * Upstream contract materializer: seals already-resolved route capability
 * evidence into an operation-identity contract. It does not classify routes.
 */
export interface OperationIdentityCapabilityContractMaterializerInterface {
  materialize(input: OperationIdentityCapabilityInput): OperationIdentityCapabilityContract;
}

/** @deprecated Compatibility name. This is a producer-side materializer, not a runtime executor. */
export interface OperationIdentityCapabilityRuntimeAlgebraInterface
  extends OperationIdentityCapabilityContractMaterializerInterface {
  /** @deprecated Use materialize; the input must already contain resolved semantic evidence. */
  fromRoute(input: OperationIdentityCapabilityInput): OperationIdentityCapabilityContract;
}

/** Upstream authority that materializes a closed contract from resolved evidence. */
export interface OperationIdentityCapabilityAuthorityInterface
  extends OperationIdentityCapabilityContractMaterializerInterface {
  readonly kind: 'operation_identity_capability_authority';
  readonly authority: 'upstream';
  readonly closed: true;
  /** @deprecated Use materialize. */
  fromRoute(input: OperationIdentityCapabilityInput): OperationIdentityCapabilityContract;
}

export interface OperationIdentityCapabilityContract extends OperationIdentityCapabilityAlgebraInterface {}
export interface OperationIdentityCapabilityInterface extends OperationIdentityCapabilityContract {}
export interface OperationIdentityCapabilityConsumerInterface extends OperationIdentityCapabilityContract {}

/** Runtime-safe reference: representation only; semantic ownership remains upstream. */
export interface OperationIdentityReference {
  readonly kind: 'operation_identity_reference';
  readonly identity: Readonly<{
    readonly key: string;
    readonly method: string;
    readonly path: string;
  }>;
}
