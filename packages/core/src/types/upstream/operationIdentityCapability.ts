import type { RouteIdentity } from './route';
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
 * Producer/consumer algebra for operation identity.
 *
 * This file is intentionally type-only: it declares the semantic contract but
 * contains no resolver, classifier, derivation, or runtime constructor.
 */
export interface OperationIdentityCapabilityAlgebraInterface
  extends SemanticCapabilityContractInterface<'operation_identity_capability', OperationIdentityCapabilityEvidence, OperationIdentity> {
  readonly identity: OperationIdentity;
  /** Proof-carrying semantic reasoning that established this identity. */
  readonly reasoning: SemanticReasoningContract;
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
