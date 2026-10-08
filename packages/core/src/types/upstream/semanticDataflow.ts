/**
 * Closed upstream semantic data-flow judgment.
 *
 * PHP syntax is evidence only. Data-flow authority is this closed algebra:
 * typed semantic identities, typed roles, typed dependencies/value-flow, and a derived
 * least-fixed-point reachability closure. No open predicate/subject payload is
 * available to semantic consumers.
 */
import type { SourceSpan } from './provenance';
import type { StringValue } from './valueObjects';
import { semanticReasoningContract, type SemanticReasoningContract, type SemanticReasoningEvidence, type SemanticReasoningAuthorityInterface } from './semanticReasoning';

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

export const semanticDataflowIdentityKey = (
  identity: SemanticDataflowIdentity,
): SemanticDataflowIdentityKey => Object.freeze({
  kind: 'semantic_dataflow_identity_key',
  file: identity.source.file.value,
  start: identity.source.start.value,
  end: identity.source.end.value,
  role: identity.role,
  slot: identity.slot,
});

/** Canonical semantic identity equality for all upstream/downstream consumers. */
export const semanticDataflowIdentityEqual = (
  left: SemanticDataflowIdentity,
  right: SemanticDataflowIdentity,
): boolean => {
  const a = semanticDataflowIdentityKey(left);
  const b = semanticDataflowIdentityKey(right);
  return a.file.value === b.file.value
    && a.start === b.start
    && a.end === b.end
    && a.role === b.role
    && a.slot.value === b.slot.value;
};

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

export const semanticDataflowFactWithLineage = (
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
}

export interface SemanticDataflowJudgmentFixpointInterface {
  readonly fixedPoint: 'least_fixed_point';
  readonly reasoning: 'declarative_relation_rewrite_fixed_point';
  readonly reasoningContract: SemanticReasoningContract;
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

/** Named upstream contract composed from the semantic dataflow algebra. */
export interface SemanticDataflowContractInterface<
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>,
> extends SemanticDataflowAlgebraInterface<ReasoningEvidence, Reasoning> {}

/** Concrete closed specialization carried across downstream boundaries. */
export interface SemanticDataflowInterface extends SemanticDataflowContractInterface {}

/** Reconnect an authoritative judgment without re-encoding its semantics. */
export const semanticDataflowInterfaceFromJudgment = (
  judgment: SemanticDataflowJudgment,
): SemanticDataflowInterface => Object.freeze({
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
});

