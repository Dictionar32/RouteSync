import type { UpstreamWiringInterface } from '../interfaces/interfaceDependencyBoundary';

/**
 * Upstream semantic-reasoning algebra.
 *
 * Reasoning is an explicit contract between semantic evidence and a closed
 * judgment. The contract carries its proof shape; consumers do not need to
 * know which resolver/classifier produced the judgment.
 */
export type SemanticReasoningAuthority = 'upstream';

export type SemanticReasoningStrategy =
  | 'evidence_resolution'
  | 'declarative_relation_rewrite_fixed_point';

export type SemanticReasoningEvidenceKind =
  | 'semantic_evidence_resolution'
  | 'semantic_relation_fixed_point';

export type SemanticReasoningEvidenceForStrategy<
  Strategy extends SemanticReasoningStrategy,
> = Strategy extends 'evidence_resolution'
  ? { readonly kind: 'semantic_evidence_resolution'; readonly closed: true }
  : Strategy extends 'declarative_relation_rewrite_fixed_point'
    ? { readonly kind: 'semantic_relation_fixed_point'; readonly closed: true }
    : never;

export interface SemanticReasoningEvidence {
  readonly kind: SemanticReasoningEvidenceKind;
  readonly closed: true;
}

export interface SemanticReasoningExecutionInterface<Input, State> {
  readonly seed: (input: Input) => State;
  readonly derive: (state: State) => State;
  readonly close: (state: State) => State;
}

export interface SemanticReasoningRelationInterface<State, Relation> {
  /** Derive semantic relations without exposing parser/control-flow ownership. */
  readonly relate: (state: State) => readonly Relation[];
}

export interface SemanticReasoningRewriteInterface<State, Relation> {
  /** Rewrite state from an already-derived semantic relation. */
  readonly rewrite: (state: State, relation: Relation) => State;
}

export interface SemanticReasoningFixedPointInterface<State> {
  /** Close semantic derivation at its least fixed point. */
  readonly fixedPoint: (state: State) => State;
}

export interface SemanticReasoningJudgmentInterface<State, Judgment> {
  readonly judge: (state: State) => Judgment;
}

/** Operational reasoning algebra: execution, relation derivation, and judgment are explicit. */
export interface SemanticReasoningExecutionAlgebraInterface<Input, State, Relation, Judgment>
  extends SemanticReasoningExecutionInterface<Input, State>,
    SemanticReasoningRelationInterface<State, Relation>,
    SemanticReasoningRewriteInterface<State, Relation>,
    SemanticReasoningFixedPointInterface<State>,
    SemanticReasoningJudgmentInterface<State, Judgment> {}

/**
 * Producer-facing reasoning surface. Execution, relation derivation, rewrite,
 * fixed-point closure, and judgment are upstream-owned.
 */
export interface SemanticReasoningAlgebraInterface<Input, State, Relation, Judgment>
  extends SemanticReasoningExecutionAlgebraInterface<Input, State, Relation, Judgment> {}

export interface SemanticReasoningProducerContractInterface<Input, State, Relation, Judgment>
  extends SemanticReasoningExecutionAlgebraInterface<Input, State, Relation, Judgment> {}

export interface SemanticReasoningProducerInterface<Input, State, Relation, Judgment>
  extends SemanticReasoningProducerContractInterface<Input, State, Relation, Judgment> {}

/**
 * Public semantic reasoning boundary.
 *
 * The named `SemanticReasoningInterface` is intentionally consumer-facing:
 * execution/relation/rewrite/fixed-point operations belong to the producer
 * algebra above. Downstream code receives only the closed proof contract.
 */
export interface SemanticReasoningInterface<
  Strategy extends SemanticReasoningStrategy = SemanticReasoningStrategy,
  Evidence extends SemanticReasoningEvidenceForStrategy<Strategy> = SemanticReasoningEvidenceForStrategy<Strategy>,
  Contract extends SemanticReasoningContract<Strategy, Evidence> = SemanticReasoningContract<Strategy, Evidence>,
> extends SemanticReasoningConsumerInterface<Strategy, Evidence, Contract> {}

export interface SemanticReasoningEvidenceInterface<
  Evidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
> {
  readonly evidence: Evidence;
}

export interface SemanticReasoningDerivationInterface<
  Strategy extends SemanticReasoningStrategy = SemanticReasoningStrategy,
> {
  readonly derivation: {
    readonly kind: 'semantic_reasoning_derivation';
    readonly strategy: Strategy;
    readonly closed: true;
  };
}

export interface SemanticReasoningProvenanceInterface {
  readonly provenance: {
    readonly kind: 'semantic_reasoning_provenance';
    readonly authority: SemanticReasoningAuthority;
    readonly closed: true;
  };
}

export interface SemanticReasoningClosureInterface {
  readonly closure: {
    readonly kind: 'semantic_reasoning_closure';
    readonly closed: true;
  };
}

/**
 * Proof algebra shared by every closed semantic-reasoning result.
 *
 * Keeping the proof facets behind one interface makes the contract boundary
 * compositional: a consumer can depend on the proof algebra without knowing
 * the concrete reasoning implementation or execution algebra.
 */
export interface SemanticReasoningProofInterface<
  Strategy extends SemanticReasoningStrategy = SemanticReasoningStrategy,
  Evidence extends SemanticReasoningEvidenceForStrategy<Strategy> = SemanticReasoningEvidenceForStrategy<Strategy>,
>
  extends SemanticReasoningEvidenceInterface<Evidence>,
    SemanticReasoningDerivationInterface<Strategy>,
    SemanticReasoningProvenanceInterface,
    SemanticReasoningClosureInterface {}

/** Read-only authority facet carried across upstream/downstream boundaries. */
export interface SemanticReasoningAuthorityInterface<
  Strategy extends SemanticReasoningStrategy = SemanticReasoningStrategy,
  Evidence extends SemanticReasoningEvidenceForStrategy<Strategy> = SemanticReasoningEvidenceForStrategy<Strategy>,
  Contract extends SemanticReasoningContract<Strategy, Evidence> = SemanticReasoningContract<Strategy, Evidence>,
> {
  /** Closed reasoning proof crossing the upstream/downstream boundary. */
  readonly reasoning: Contract;
}

/**
 * Consumer-facing reasoning surface. Consumers receive only the closed proof
 * authority; execution, relation derivation, rewrite, and fixed-point methods
 * remain upstream-owned.
 */
export interface SemanticReasoningConsumerAlgebraInterface<
  Strategy extends SemanticReasoningStrategy = SemanticReasoningStrategy,
  Evidence extends SemanticReasoningEvidenceForStrategy<Strategy> = SemanticReasoningEvidenceForStrategy<Strategy>,
  Contract extends SemanticReasoningContract<Strategy, Evidence> = SemanticReasoningContract<Strategy, Evidence>,
> extends SemanticReasoningAuthorityInterface<Strategy, Evidence, Contract> {}

export interface SemanticReasoningConsumerContractInterface<
  Strategy extends SemanticReasoningStrategy = SemanticReasoningStrategy,
  Evidence extends SemanticReasoningEvidenceForStrategy<Strategy> = SemanticReasoningEvidenceForStrategy<Strategy>,
  Contract extends SemanticReasoningContract<Strategy, Evidence> = SemanticReasoningContract<Strategy, Evidence>,
> extends SemanticReasoningConsumerAlgebraInterface<Strategy, Evidence, Contract> {}

export interface SemanticReasoningConsumerInterface<
  Strategy extends SemanticReasoningStrategy = SemanticReasoningStrategy,
  Evidence extends SemanticReasoningEvidenceForStrategy<Strategy> = SemanticReasoningEvidenceForStrategy<Strategy>,
  Contract extends SemanticReasoningContract<Strategy, Evidence> = SemanticReasoningContract<Strategy, Evidence>,
> extends SemanticReasoningConsumerContractInterface<Strategy, Evidence, Contract> {}

/**
 * Directional projection of a closed reasoning proof. The wiring layer may
 * transport proof authority, but cannot execute or recompute reasoning.
 */
export interface SemanticReasoningWiringInterface<Downstream,
  Strategy extends SemanticReasoningStrategy = SemanticReasoningStrategy,
  Evidence extends SemanticReasoningEvidenceForStrategy<Strategy> = SemanticReasoningEvidenceForStrategy<Strategy>,
  Contract extends SemanticReasoningContract<Strategy, Evidence> = SemanticReasoningContract<Strategy, Evidence>,
> extends UpstreamWiringInterface<
  SemanticReasoningConsumerInterface<Strategy, Evidence, Contract>,
  Downstream
> {}

/**
 * Contract algebra: the proof facets are interfaces first, while the concrete
 * contract merely closes a particular evidence strategy. This keeps the
 * upstream/downstream boundary compositional and prevents consumers from
 * depending on a concrete reasoning implementation.
 */
export interface SemanticReasoningContractInterface<
  Strategy extends SemanticReasoningStrategy = SemanticReasoningStrategy,
  Evidence extends SemanticReasoningEvidenceForStrategy<Strategy> = SemanticReasoningEvidenceForStrategy<Strategy>,
> extends SemanticReasoningProofInterface<Strategy, Evidence> {
  readonly kind: 'semantic_reasoning_contract';
  readonly authority: SemanticReasoningAuthority;
  readonly strategy: Strategy;
  readonly closed: true;
}

/** Proof-carrying contract shared by capability and data-flow authorities. */
export interface SemanticReasoningContract<
  Strategy extends SemanticReasoningStrategy = SemanticReasoningStrategy,
  Evidence extends SemanticReasoningEvidenceForStrategy<Strategy> = SemanticReasoningEvidenceForStrategy<Strategy>,
> extends SemanticReasoningContractInterface<Strategy, Evidence> {
  readonly kind: 'semantic_reasoning_contract';
  readonly authority: SemanticReasoningAuthority;
  readonly strategy: Strategy;
  readonly closed: true;
}

const semanticReasoningEvidenceKindByStrategy: Readonly<Record<
  SemanticReasoningStrategy,
  SemanticReasoningEvidenceKind
>> = Object.freeze({
  evidence_resolution: 'semantic_evidence_resolution',
  declarative_relation_rewrite_fixed_point: 'semantic_relation_fixed_point',
});

export const semanticReasoningContract = <Strategy extends SemanticReasoningStrategy>(
  strategy: Strategy,
): SemanticReasoningContract<Strategy, SemanticReasoningEvidenceForStrategy<Strategy>> => {
  const evidenceKind = semanticReasoningEvidenceKindByStrategy[strategy];

  return Object.freeze({
    kind: 'semantic_reasoning_contract' as const,
    authority: 'upstream' as const,
    strategy,
    closed: true as const,
    evidence: Object.freeze({
      kind: evidenceKind,
      closed: true as const,
    }),
    derivation: Object.freeze({
      kind: 'semantic_reasoning_derivation' as const,
      strategy,
      closed: true as const,
    }),
    provenance: Object.freeze({
      kind: 'semantic_reasoning_provenance' as const,
      authority: 'upstream' as const,
      closed: true as const,
    }),
    closure: Object.freeze({
      kind: 'semantic_reasoning_closure' as const,
      closed: true as const,
    }),
  });
};
