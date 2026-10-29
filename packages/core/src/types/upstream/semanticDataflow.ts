/**
 * Closed upstream semantic data-flow judgment.
 *
 * PHP syntax is evidence only. Data-flow authority is this closed algebra:
 * typed semantic identities, typed roles, typed dependencies/value-flow, and a derived
 * least-fixed-point reachability closure. No open predicate/subject payload is
 * available to semantic consumers.
 */
import { sourceSpanOperations, type SourceSpan } from './provenance';
import type { StringValue } from './valueObjects';
import type { SemanticReasoningContract, SemanticReasoningEvidence, SemanticReasoningStrategy, SemanticReasoningAuthorityInterface, SemanticReasoningJudgmentInterface } from './semanticReasoning';

export type SemanticDataflowRuleName = Readonly<{ readonly kind: 'semantic_dataflow_rule'; readonly value: StringValue }>;
export type SemanticDataflowWitnessName = Readonly<{ readonly kind: 'semantic_dataflow_witness'; readonly value: StringValue }>;

export type SemanticDataflowEntityRole =
  | 'variable' | 'value' | 'operator' | 'comparison' | 'binary-operation' | 'unary-operation'
  | 'predicate' | 'merge' | 'match' | 'outcome' | 'assignment' | 'binding' | 'reference'
  | 'callable' | 'invocation' | 'access' | 'cast' | 'array' | 'static-invocation'
  | 'construction' | 'type-check' | 'class-reference' | 'class-constant' | 'resource-access'
  | 'interpolated-string' | 'magic-constant' | 'closure' | 'arrow-function' | 'anonymous-class'
  | 'unsupported-expression' | 'emission' | 'include' | 'unset' | 'region' | 'exception-handler'
  | 'exception' | 'scope';

export type SemanticDataflowRole =
  | 'operator' | 'operand_left' | 'operand_right' | 'operand'
  | 'receiver' | 'index' | 'part' | 'argument' | 'callable'
  | 'array_key' | 'array_value' | 'class_expression' | 'value'
  | 'predicate' | 'alternative' | 'subject' | 'candidate' | 'body'
  | 'initializer' | 'update' | 'iterable' | 'target' | 'binding'
  | 'emitted_value' | 'exception_type' | 'handler' | 'finally_block'
  | 'member' | 'availability';

export type SemanticDataflowIdentity = Readonly<{
  readonly kind: 'semantic_dataflow_identity';
  /** Stable semantic locator used by upstream producers and equality. */
  readonly source: SourceSpan;
  readonly role: SemanticDataflowEntityRole;
  readonly slot: StringValue;
}>;

/**
 * Canonical identity key. Consumers must compare semantic identities through
 * this key rather than serializing the whole identity object. The source span
 * is a stable locator for an expression/dataflow node; provenance remains
 * carried separately by SemanticDataflowLineage.
 */
export type SemanticDataflowIdentityKey = Readonly<{
  readonly kind: 'semantic_dataflow_identity_key';
  readonly file: StringValue;
  readonly start: number;
  readonly end: number;
  readonly role: SemanticDataflowEntityRole;
  readonly slot: StringValue;
}>;

const semanticDataflowIdentityKeyValue = (
  identity: SemanticDataflowIdentity,
): SemanticDataflowIdentityKey => Object.freeze({
  kind: 'semantic_dataflow_identity_key',
  file: identity.source.file.value,
  start: identity.source.start.value,
  end: identity.source.end.value,
  role: identity.role,
  slot: identity.slot,
});

const semanticDataflowIdentityEqualValue = (
  left: SemanticDataflowIdentity,
  right: SemanticDataflowIdentity,
): boolean =>
  sourceSpanOperations.same(left.source, right.source).kind === 'same_source_span'
    && left.role === right.role
    && left.slot.value === right.slot.value;

/** Identity operations own canonical keying and equality for semantic identities. */
export interface SemanticDataflowIdentityOperationsInterface {
  readonly key: (identity: SemanticDataflowIdentity) => SemanticDataflowIdentityKey;
  readonly equal: (left: SemanticDataflowIdentity, right: SemanticDataflowIdentity) => boolean;
}

export const semanticDataflowIdentityOperations: SemanticDataflowIdentityOperationsInterface = Object.freeze({
  key: semanticDataflowIdentityKeyValue,
  equal: semanticDataflowIdentityEqualValue,
});

export type SemanticDataflowGuard = Readonly<{
  readonly predicate: SemanticDataflowIdentity;
  readonly polarity: 'satisfied' | 'unsatisfied';
}>;

export type SemanticDataflowPath = Readonly<{
  readonly source: SemanticDataflowIdentity;
  readonly target: SemanticDataflowIdentity;
  readonly steps: readonly SemanticDataflowFact[];
  readonly guards: readonly SemanticDataflowGuard[];
}>;

export type SemanticDataflowFactLineage = Readonly<{
  readonly kind: 'semantic_dataflow_fact_lineage';
  readonly producer: SemanticDataflowLineage['producer'];
  /** The exact semantic identity emitted by the producer for this fact. */
  readonly identity: SemanticDataflowIdentity;
  readonly source: SourceSpan;
  readonly closed: true;
}>;

export type SemanticDataflowFact =
  | Readonly<{
      readonly kind: 'dependency';
      readonly source: SemanticDataflowIdentity;
      readonly target: SemanticDataflowIdentity;
      readonly role: SemanticDataflowRole;
      readonly guard?: SemanticDataflowGuard;
      readonly lineage?: SemanticDataflowFactLineage;
    }>
  | Readonly<{
      readonly kind: 'value_flow';
      readonly source: SemanticDataflowIdentity;
      readonly target: SemanticDataflowIdentity;
      readonly role: SemanticDataflowRole;
      readonly guard?: SemanticDataflowGuard;
      readonly lineage?: SemanticDataflowFactLineage;
    }>
  | Readonly<{
      readonly kind: 'reaches';
      readonly source: SemanticDataflowIdentity;
      readonly target: SemanticDataflowIdentity;
    }>;

const semanticDataflowFactWithLineageValue = (
  fact: SemanticDataflowInputFact,
  producer: SemanticDataflowLineage['producer'],
  identity: SemanticDataflowIdentity = fact.source,
): SemanticDataflowInputFact => Object.freeze({
  ...fact,
  lineage: Object.freeze({
    kind: 'semantic_dataflow_fact_lineage',
    producer,
    identity,
    source: identity.source,
    closed: true,
  }),
});

/** Lineage operations attach producer evidence without reconstructing fact meaning downstream. */
export interface SemanticDataflowFactLineageOperationsInterface {
  readonly withLineage: (
    fact: SemanticDataflowInputFact,
    producer: SemanticDataflowLineage['producer'],
    identity?: SemanticDataflowIdentity,
  ) => SemanticDataflowInputFact;
}

export const semanticDataflowFactLineageOperations: SemanticDataflowFactLineageOperationsInterface = Object.freeze({
  withLineage: semanticDataflowFactWithLineageValue,
});

export type SemanticDataflowDerivation = Readonly<{
  readonly kind: 'semantic_dataflow_derivation';
  readonly rule: SemanticDataflowRuleName;
  readonly witness: SemanticDataflowWitnessName;
  readonly premises: readonly SemanticDataflowFact[];
  readonly conclusion: SemanticDataflowFact;
}>;

export type SemanticDataflowInputFact = Exclude<SemanticDataflowFact, { readonly kind: 'reaches' }>;

export interface SemanticDataflowJudgmentIdentityInterface {
  readonly node: SemanticDataflowIdentity;
  readonly source: SourceSpan;
}

export interface SemanticDataflowJudgmentEvidenceInterface {
  readonly facts: readonly SemanticDataflowFact[];
  readonly closure: readonly SemanticDataflowFact[];
  readonly derivations: readonly SemanticDataflowDerivation[];
  readonly paths: readonly SemanticDataflowPath[];
  /** Runtime-verifiable certificate that both closure procedures actually converged. */
  readonly closureCertificate: SemanticDataflowClosureCertificate;
}

export type SemanticDataflowClosureCertificate = Readonly<{
  readonly kind: 'semantic_dataflow_closure_certificate';
  readonly factClosure: Readonly<{ readonly kind: 'fact_closure'; readonly converged: true; readonly rounds: number }>;
  readonly pathClosure: Readonly<{ readonly kind: 'path_closure'; readonly converged: true; readonly rounds: number }>;
  /** Every fact in the admitted closure must have at least one derivation conclusion. */
  readonly derivationCoverage: Readonly<{ readonly kind: 'derivation_coverage'; readonly complete: true; readonly coveredFacts: number }>;
  readonly closed: true;
}>;

export interface SemanticDataflowJudgmentFixpointInterface {
  readonly fixedPoint: 'least_fixed_point';
  /** Typed proof envelope; no parallel primitive `reasoning` label is carried by the judgment. */
  readonly reasoningContract: SemanticReasoningContract;
}

/** Domain operations carried by each authoritative semantic-dataflow judgment. */
export interface SemanticDataflowJudgmentOperationsInterface {
  /** Checks whether a fact is present in the admitted closure. */
  readonly containsFact: (fact: SemanticDataflowFact) => boolean;
  /** Queries the closure for a directed reachability relation. */
  readonly reaches: (source: SemanticDataflowIdentity, target: SemanticDataflowIdentity) => boolean;
  /** Returns the closed paths matching both semantic endpoints. */
  readonly pathsBetween: (source: SemanticDataflowIdentity, target: SemanticDataflowIdentity) => readonly SemanticDataflowPath[];
}

export interface SemanticDataflowJudgmentAuthorityInterface {
  readonly authority: 'semantic_dataflow_judgment';
}

export interface SemanticDataflowJudgmentClosureInterface {
  readonly closed: true;
}

export interface SemanticDataflowJudgmentInterface extends
  SemanticDataflowJudgmentIdentityInterface,
  SemanticDataflowJudgmentEvidenceInterface,
  SemanticDataflowJudgmentFixpointInterface,
  SemanticDataflowJudgmentAuthorityInterface,
  SemanticDataflowJudgmentClosureInterface {}

export type SemanticDataflowJudgment = SemanticDataflowJudgmentInterface & Readonly<{
  readonly kind: 'semantic_dataflow_judgment';
  readonly origin: SemanticDataflowOrigin;
  readonly operations: SemanticDataflowJudgmentOperationsInterface;
}>;

export type SemanticDataflowOrigin = Readonly<{
  readonly kind: 'semantic_dataflow_origin';
  readonly source: 'semantic_dataflow_input';
  readonly identity: SemanticDataflowIdentity;
  /**
   * Input origin identifies the semantic input boundary only. Producer
   * provenance is intentionally fact-scoped on SemanticDataflowFact.lineage;
   * a controller-scoped input may contain route, controller, and resource
   * facts simultaneously.
   */
  readonly closed: true;
}>;

export type SemanticDataflowLineageProducer = 'request' | 'route' | 'controller' | 'resource';

export type SemanticDataflowLineage = Readonly<{
  readonly kind: 'semantic_dataflow_lineage';
  /** Runtime dataflow producers only. Structural model-relation/schema provenance is not runtime dataflow. */
  readonly producer: SemanticDataflowLineageProducer;
  /** Exact semantic producer node; never an AST/evidence node. */
  readonly identity: SemanticDataflowIdentity;
  readonly source: SourceSpan;
  readonly closed: true;
}>;


export type SemanticDataflowInput = Readonly<{
  readonly kind: 'semantic_dataflow_input';
  readonly node: SemanticDataflowIdentity;
  readonly source: SourceSpan;
  readonly facts: readonly SemanticDataflowInputFact[];
  readonly origin: SemanticDataflowOrigin;
  readonly closed: true;
}>;

/**
 * Canonical semantic dataflow interface.
 *
 * This is the upstream semantic contract. The generic DataFlowInterface is a
 * downstream execution/state/query projection and must not redefine this ADT.
 */
/**
 * Semantic dataflow algebra: the closed judgment, origin, and proof authority
 * are composed before a concrete contract name is introduced. This mirrors
 * the reasoning/capability algebra and prevents the interface from becoming
 * an unstructured semantic bag.
 */
export interface SemanticDataflowAlgebraInterface<
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>,
> extends SemanticReasoningAuthorityInterface<Reasoning['strategy'], ReasoningEvidence, Reasoning> {
  readonly kind: 'semantic_dataflow_interface';
  readonly authority: 'semantic_dataflow_judgment';
  readonly origin: SemanticDataflowOrigin;
  readonly judgment: SemanticDataflowJudgment;
  readonly closed: true;
}

/**
 * Upstream-owned executable contract for producing a closed semantic-dataflow
 * judgment. Runtime adapters depend on this contract instead of importing the
 * concrete closure implementation.
 */
export interface SemanticDataflowReasoningAuthorityInterface
  extends SemanticReasoningJudgmentInterface<SemanticDataflowInput, SemanticDataflowJudgment> {
  readonly kind: 'semantic_dataflow_reasoning_authority';
  readonly authority: 'upstream';
  /** Domain operation that checks derivation premises and conclusions against the closed fact closure. */
  readonly validateDerivations: (closure: readonly SemanticDataflowFact[], derivations: readonly SemanticDataflowDerivation[]) => boolean;
}

/** Named upstream contract composed from the semantic dataflow algebra. */
export interface SemanticDataflowContractInterface<
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>,
> extends SemanticDataflowAlgebraInterface<ReasoningEvidence, Reasoning> {}

/** Concrete closed specialization carried across downstream boundaries. */
export interface SemanticDataflowInterface extends SemanticDataflowContractInterface {}

/** Interface-first operation for reconnecting an authoritative judgment. */
export interface SemanticDataflowInterfaceFactoryInterface {
  readonly kind: 'semantic_dataflow_interface_factory';
  readonly fromJudgment: (judgment: SemanticDataflowJudgment) => SemanticDataflowInterface;
}

/** Reconnect an authoritative judgment without re-encoding its semantics. */
export const semanticDataflowInterfaceFactory: SemanticDataflowInterfaceFactoryInterface = Object.freeze({
  kind: 'semantic_dataflow_interface_factory',
  fromJudgment: (judgment: SemanticDataflowJudgment): SemanticDataflowInterface => Object.freeze({
    kind: 'semantic_dataflow_interface',
    authority: 'semantic_dataflow_judgment',
    origin: Object.freeze({
      kind: 'semantic_dataflow_origin',
      source: 'semantic_dataflow_input',
      identity: judgment.origin.identity,
      closed: true,
    }),
    judgment,
    reasoning: judgment.reasoningContract,
    closed: true,
  }),
});

