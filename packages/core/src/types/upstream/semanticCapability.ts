/**
 * Closed semantic capability contract.
 *
 * Capability meaning is authoritative at the upstream semantic boundary.
 * Downstream layers may consume a capability, but may not reconstruct it.
 */
import type { SemanticReasoningAuthorityInterface, SemanticReasoningContract, SemanticReasoningEvidence, SemanticReasoningStrategy } from './semanticReasoning';

export type SemanticCapabilityAuthority = 'upstream';
export type SemanticCapabilityKind = 'route_capability' | 'resource_model_key_capability' | 'operation_identity_capability' | 'domain_intent_capability' | 'route_parameter_capability';

export type SemanticCapabilityEvidenceKind =
  | 'semantic_capability_evidence'
  | 'route_capability_evidence'
  | 'resource_model_key_capability_evidence'
  | 'operation_identity_capability_evidence'
  | 'domain_intent_capability_evidence'
  | 'route_parameter_capability_evidence';

export interface SemanticCapabilityEvidence {
  readonly kind: SemanticCapabilityEvidenceKind;
  readonly closed: true;
}

export interface SemanticCapabilityIdentityInterface<Identity> {
  readonly identity: Identity;
}

export interface SemanticCapabilityEvidenceInterface<Evidence extends SemanticCapabilityEvidence = SemanticCapabilityEvidence> {
  readonly evidence: Evidence;
}

export interface SemanticCapabilityAlgebraInterface<
  Identity,
  Evidence extends SemanticCapabilityEvidence = SemanticCapabilityEvidence,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>,
> extends
  SemanticCapabilityIdentityInterface<Identity>,
  SemanticCapabilityEvidenceInterface<Evidence>,
  SemanticCapabilityDerivationInterface<Reasoning['strategy']>,
  SemanticCapabilityProvenanceInterface,
  SemanticCapabilityClosureInterface,
  SemanticReasoningAuthorityInterface<Reasoning['strategy'], ReasoningEvidence, Reasoning> {}

export interface SemanticCapabilityDerivationInterface<
  Strategy extends SemanticReasoningStrategy = SemanticReasoningStrategy,
> {
  /** The capability derivation must agree with the proof-carrying reasoning contract. */
  readonly derivation: SemanticCapabilityDerivation<Strategy>;
}

export interface SemanticCapabilityProvenanceInterface {
  readonly provenance: SemanticCapabilityProvenance;
}

export interface SemanticCapabilityClosureInterface {
  readonly closed: true;
}

export interface SemanticCapabilityDerivation<
  Strategy extends SemanticReasoningStrategy = SemanticReasoningStrategy,
> {
  readonly kind: 'semantic_capability_derivation';
  readonly strategy: Strategy;
  readonly closed: true;
}

export interface SemanticCapabilityProvenance {
  readonly kind: 'semantic_capability_provenance';
  readonly lane: 'upstream';
  readonly closed: true;
}

export interface SemanticCapabilityContractInterface<
  Kind extends SemanticCapabilityKind = SemanticCapabilityKind,
  Evidence extends SemanticCapabilityEvidence = SemanticCapabilityEvidence,
  Identity = never,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>,
> extends
  SemanticCapabilityAlgebraInterface<Identity, Evidence, ReasoningEvidence, Reasoning>,
  SemanticCapabilityClosureInterface {
  readonly kind: Kind;
  readonly authority: SemanticCapabilityAuthority;
}

/** Concrete closed specialization of the capability contract algebra. */
export interface SemanticCapabilityContract<
  Kind extends SemanticCapabilityKind = SemanticCapabilityKind,
  Evidence extends SemanticCapabilityEvidence = SemanticCapabilityEvidence,
  Identity = never,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>,
> extends SemanticCapabilityContractInterface<Kind, Evidence, Identity, ReasoningEvidence, Reasoning> {}

/**
 * Consumer-facing closed capability interface.
 *
 * The interface is deliberately downstream-safe: it exposes the already-closed
 * semantic contract and its proof/authority facets, but no semantic execution
 * or re-resolution operation.
 */
export interface SemanticCapabilityConsumerAlgebraInterface<
  Kind extends SemanticCapabilityKind = SemanticCapabilityKind,
  Evidence extends SemanticCapabilityEvidence = SemanticCapabilityEvidence,
  Identity = never,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>,
> extends SemanticCapabilityContractInterface<Kind, Evidence, Identity, ReasoningEvidence, Reasoning> {}

export interface SemanticCapabilityConsumerContractInterface<
  Kind extends SemanticCapabilityKind = SemanticCapabilityKind,
  Evidence extends SemanticCapabilityEvidence = SemanticCapabilityEvidence,
  Identity = never,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>,
> extends SemanticCapabilityConsumerAlgebraInterface<Kind, Evidence, Identity, ReasoningEvidence, Reasoning> {}

export interface SemanticCapabilityConsumerInterface<
  Kind extends SemanticCapabilityKind = SemanticCapabilityKind,
  Evidence extends SemanticCapabilityEvidence = SemanticCapabilityEvidence,
  Identity = never,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>,
> extends SemanticCapabilityConsumerContractInterface<Kind, Evidence, Identity, ReasoningEvidence, Reasoning> {}

/** Public consumer surface: closed capability only; no semantic execution. */
export interface SemanticCapabilityInterface<
  Kind extends SemanticCapabilityKind = SemanticCapabilityKind,
  Evidence extends SemanticCapabilityEvidence = SemanticCapabilityEvidence,
  Identity = never,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>
> extends SemanticCapabilityConsumerInterface<Kind, Evidence, Identity, ReasoningEvidence, Reasoning> {}

export interface SemanticCapabilityAuthorityInterface<
  Capability extends SemanticCapabilityContract = SemanticCapabilityContract,
> {
  readonly capability: Capability;
}
