/**
 * Closed upstream data-flow judgment.
 *
 * PHP syntax is evidence only. Data-flow authority is this closed algebra:
 * typed identities, typed roles, typed dependencies/value-flow, and a derived
 * least-fixed-point reachability closure. No open predicate/subject payload is
 * available to semantic consumers.
 */
import type { AstNodeIdentity, AstRuleName, AstWitnessName } from './ast';
import type { SourceSpan } from './provenance';
import type { StringValue } from './valueObjects';

export type AstDataflowEntityRole =
  | 'variable' | 'value' | 'operator' | 'comparison' | 'binary-operation' | 'unary-operation'
  | 'predicate' | 'merge' | 'match' | 'outcome' | 'assignment' | 'binding' | 'reference'
  | 'callable' | 'invocation' | 'access' | 'cast' | 'array' | 'static-invocation'
  | 'construction' | 'type-check' | 'class-reference' | 'class-constant' | 'resource-access'
  | 'interpolated-string' | 'magic-constant' | 'closure' | 'arrow-function' | 'anonymous-class'
  | 'unsupported-expression' | 'emission' | 'include' | 'unset' | 'region' | 'exception-handler'
  | 'exception' | 'scope';

export type AstDataflowRole =
  | 'operator' | 'operand_left' | 'operand_right' | 'operand'
  | 'receiver' | 'index' | 'part' | 'argument' | 'callable'
  | 'array_key' | 'array_value' | 'class_expression' | 'value'
  | 'predicate' | 'alternative' | 'subject' | 'candidate' | 'body'
  | 'initializer' | 'update' | 'iterable' | 'target' | 'binding'
  | 'emitted_value' | 'exception_type' | 'handler' | 'finally_block'
  | 'member' | 'availability';

export type AstDataflowIdentity = Readonly<{
  readonly kind: 'ast_dataflow_identity';
  readonly source: SourceSpan;
  readonly role: AstDataflowEntityRole;
  readonly slot: StringValue;
}>;

export type AstDataflowFact =
  | Readonly<{
      readonly kind: 'dependency';
      readonly source: AstDataflowIdentity;
      readonly target: AstDataflowIdentity;
      readonly role: AstDataflowRole;
    }>
  | Readonly<{
      readonly kind: 'value_flow';
      readonly source: AstDataflowIdentity;
      readonly target: AstDataflowIdentity;
      readonly role: AstDataflowRole;
    }>
  | Readonly<{
      readonly kind: 'reaches';
      readonly source: AstDataflowIdentity;
      readonly target: AstDataflowIdentity;
    }>;

export type AstDataflowDerivation = Readonly<{
  readonly kind: 'ast_dataflow_derivation';
  readonly rule: AstRuleName;
  readonly witness: AstWitnessName;
  readonly premises: readonly AstDataflowFact[];
  readonly conclusion: AstDataflowFact;
}>;

export type AstDataflowJudgment = Readonly<{
  readonly kind: 'ast_dataflow_judgment';
  readonly node: AstNodeIdentity;
  readonly source: SourceSpan;
  readonly facts: readonly AstDataflowFact[];
  readonly closure: readonly AstDataflowFact[];
  readonly derivations: readonly AstDataflowDerivation[];
  readonly fixedPoint: 'least_fixed_point';
  readonly reasoning: 'declarative_relation_rewrite_fixed_point';
  readonly authority: 'ast_dataflow_judgment';
  readonly closed: true;
}>;

export type AstDataflowInterface = Readonly<{
  readonly kind: 'ast_dataflow_interface';
  readonly authority: 'ast_dataflow_judgment';
  readonly judgment: AstDataflowJudgment;
  readonly closed: true;
}>;
