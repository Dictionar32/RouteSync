/**
 * Closed upstream semantic data-flow judgment.
 *
 * PHP syntax is evidence only. Data-flow authority is this closed algebra:
 * typed semantic identities, typed roles, typed dependencies/value-flow, and a derived
 * least-fixed-point reachability closure. No open predicate/subject payload is
 * available to semantic consumers.
 */
import type { AstRuleName, AstWitnessName } from './ast';
import type { SourceSpan } from './provenance';
import type { StringValue } from './valueObjects';

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
  readonly source: SourceSpan;
  readonly role: SemanticDataflowEntityRole;
  readonly slot: StringValue;
}>;

export type SemanticDataflowFact =
  | Readonly<{
      readonly kind: 'dependency';
      readonly source: SemanticDataflowIdentity;
      readonly target: SemanticDataflowIdentity;
      readonly role: SemanticDataflowRole;
    }>
  | Readonly<{
      readonly kind: 'value_flow';
      readonly source: SemanticDataflowIdentity;
      readonly target: SemanticDataflowIdentity;
      readonly role: SemanticDataflowRole;
    }>
  | Readonly<{
      readonly kind: 'reaches';
      readonly source: SemanticDataflowIdentity;
      readonly target: SemanticDataflowIdentity;
    }>;

export type SemanticDataflowDerivation = Readonly<{
  readonly kind: 'semantic_dataflow_derivation';
  readonly rule: AstRuleName;
  readonly witness: AstWitnessName;
  readonly premises: readonly SemanticDataflowFact[];
  readonly conclusion: SemanticDataflowFact;
}>;

export type SemanticDataflowInputFact = Exclude<SemanticDataflowFact, { readonly kind: 'reaches' }>;

export type SemanticDataflowJudgment = Readonly<{
  readonly kind: 'semantic_dataflow_judgment';
  readonly node: SemanticDataflowIdentity;
  readonly source: SourceSpan;
  readonly facts: readonly SemanticDataflowFact[];
  readonly closure: readonly SemanticDataflowFact[];
  readonly derivations: readonly SemanticDataflowDerivation[];
  readonly fixedPoint: 'least_fixed_point';
  readonly reasoning: 'declarative_relation_rewrite_fixed_point';
  readonly authority: 'semantic_dataflow_judgment';
  readonly closed: true;
}>;

export type SemanticDataflowOrigin = Readonly<{
  readonly kind: 'semantic_dataflow_origin';
  readonly source: 'semantic_dataflow_input';
  readonly identity: 'typed_semantic_dataflow_identity';
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

export type SemanticDataflowInterface = Readonly<{
  readonly kind: 'semantic_dataflow_interface';
  readonly authority: 'semantic_dataflow_judgment';
  readonly origin: SemanticDataflowOrigin;
  readonly judgment: SemanticDataflowJudgment;
  readonly closed: true;
}>;

/**
 * Reconnect an already-authoritative judgment to the canonical upstream interface.
 * This is a boundary wiring operation only; it never re-encodes dataflow facts.
 */
export const semanticDataflowInterfaceFromJudgment = (
  judgment: SemanticDataflowJudgment,
): SemanticDataflowInterface => Object.freeze({
  kind: 'semantic_dataflow_interface',
  authority: 'semantic_dataflow_judgment',
  origin: Object.freeze({
    kind: 'semantic_dataflow_origin',
    source: 'semantic_dataflow_input',
    identity: 'typed_semantic_dataflow_identity',
    closed: true,
  }),
  judgment,
  closed: true,
});
