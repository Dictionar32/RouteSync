import type { ControllerVariableSemantic } from './controller';
import type { VariableName } from './names';
import type { SemanticValue } from './primitiveVocabulary';
import type { Expression } from './expression';

/** Syntax-neutral evidence extracted from a controller expression. */
export type ControllerVariableSemanticArgumentEvidence =
  | Readonly<{ readonly kind: 'positional_string_literal'; readonly value: string }>
  | Readonly<{ readonly kind: 'positional_non_string' }>
  | Readonly<{ readonly kind: 'named_argument' }>
  | Readonly<{ readonly kind: 'unpacked_argument' }>;

export type ControllerVariableSemanticEvidence =
  | Readonly<{ readonly kind: 'variable_reference'; readonly variable: VariableName }>
  | Readonly<{
      readonly kind: 'static_call';
      readonly className: string;
      readonly methodName: string;
      readonly arguments: readonly ControllerVariableSemanticArgumentEvidence[];
    }>
  | Readonly<{ readonly kind: 'other_expression' }>;

export interface ControllerVariableSemanticBinding {
  readonly variable: VariableName;
  readonly semantic: ControllerVariableSemantic;
}

export interface ControllerVariableSemanticResolutionRequest {
  /** Exact canonical expression projected from the same matched source payload that produced evidence. */
  readonly sourceExpression: Expression;
  readonly evidence: ControllerVariableSemanticEvidence;
  readonly parameterBindings: readonly ControllerVariableSemanticBinding[];
}

export type ControllerVariableSemanticRuleId = 'parameter-binding' | 'database-table-call' | 'external-fallback';

/**
 * Declarative rule vocabulary owned by the semantic interface. These are rule
 * descriptions, not executable callbacks; the upstream authority interprets
 * this closed contract and publishes a closed judgment.
 */
export type ControllerVariableSemanticReasoningRule =
  | Readonly<{
      readonly kind: 'parameter_binding_rule';
      readonly rule: 'parameter-binding';
      readonly premise: 'variable-reference';
      readonly matching: 'canonical-variable-name-identity';
      readonly cardinality: 'zero-continues;one-resolves;many-ambiguous';
    }>
  | Readonly<{
      readonly kind: 'database_table_call_rule';
      readonly rule: 'database-table-call';
      readonly premise: 'static-call-DB-table-with-non-empty-positional-string-literal';
      readonly conclusion: 'model-origin-table';
    }>
  | Readonly<{
      readonly kind: 'external_fallback_rule';
      readonly rule: 'external-fallback';
      readonly premise: 'no-higher-precedence-rule-resolves';
      readonly conclusion: 'external-semantic';
    }>;

export interface ControllerVariableSemanticReasoningContract {
  readonly kind: 'controller_variable_semantic_reasoning_contract';
  readonly revision: 2;
  readonly authority: 'upstream';
  readonly closed: true;
  readonly precedence: readonly [
    'parameter-binding',
    'database-table-call',
    'external-fallback',
  ];
  readonly rules: readonly [
    Extract<ControllerVariableSemanticReasoningRule, { readonly kind: 'parameter_binding_rule' }>,
    Extract<ControllerVariableSemanticReasoningRule, { readonly kind: 'database_table_call_rule' }>,
    Extract<ControllerVariableSemanticReasoningRule, { readonly kind: 'external_fallback_rule' }>,
  ];
  readonly parameterBindingAmbiguity: 'multiple-matching-bindings-produce-ambiguous-judgment;never-select-first';
  readonly expressionOwnership: 'all-judgments-retain-the-exact-sourceExpression-from-the-request';
}

export type ControllerVariableResolvedSemanticJudgment =
  | Readonly<{ readonly kind: 'resolved'; readonly rule: ControllerVariableSemanticRuleId; readonly semantic: Extract<ControllerVariableSemantic, { readonly kind: 'model_origin' }>; readonly expressionValue: Extract<SemanticValue, { readonly kind: 'reference' }>; readonly sourceExpression: Expression; readonly evidence: ControllerVariableSemanticEvidence; readonly closed: true }>
  | Readonly<{ readonly kind: 'resolved'; readonly rule: ControllerVariableSemanticRuleId; readonly semantic: Extract<ControllerVariableSemantic, { readonly kind: 'request_origin' }>; readonly expressionValue: Extract<SemanticValue, { readonly kind: 'reference' }>; readonly sourceExpression: Expression; readonly evidence: ControllerVariableSemanticEvidence; readonly closed: true }>
  | Readonly<{ readonly kind: 'resolved'; readonly rule: ControllerVariableSemanticRuleId; readonly semantic: Extract<ControllerVariableSemantic, { readonly kind: 'expression' }>; readonly expressionValue: Readonly<{ readonly kind: 'unresolved'; readonly reason: 'unsupported' }>; readonly sourceExpression: Expression; readonly evidence: ControllerVariableSemanticEvidence; readonly closed: true }>
  | Readonly<{ readonly kind: 'resolved'; readonly rule: ControllerVariableSemanticRuleId; readonly semantic: Extract<ControllerVariableSemantic, { readonly kind: 'external' }>; readonly expressionValue: Readonly<{ readonly kind: 'unresolved'; readonly reason: 'external' }>; readonly sourceExpression: Expression; readonly evidence: ControllerVariableSemanticEvidence; readonly closed: true }>;

/** Every outcome is closed; resolved variants correlate semantic kind with its expression value. */
export type ControllerVariableSemanticJudgment =
  | ControllerVariableResolvedSemanticJudgment
  | Readonly<{ readonly kind: 'not_resolved'; readonly sourceExpression: Expression; readonly evidence: ControllerVariableSemanticEvidence; readonly expressionValue: Extract<SemanticValue, { readonly kind: 'unresolved' }>; readonly closed: true }>
  | Readonly<{
      readonly kind: 'ambiguous';
      readonly reason: 'parameter_binding';
      readonly sourceExpression: Expression;
      readonly evidence: Extract<ControllerVariableSemanticEvidence, { readonly kind: 'variable_reference' }>;
      readonly candidates: readonly ControllerVariableSemanticBinding[];
      readonly expressionValue: Readonly<{ readonly kind: 'unresolved'; readonly reason: 'ambiguous' }>;
      readonly closed: true;
    }>
  | Readonly<{
      readonly kind: 'contract_violation';
      readonly reason: 'duplicate_rule_id' | 'invalid_precedence_relation' | 'ambiguous_precedence' | 'invalid_rule_contract' | 'unsupported_selection_policy';
      readonly sourceExpression: Expression;
      readonly expressionValue: Extract<SemanticValue, { readonly kind: 'unresolved' }>;
      readonly closed: true;
    }>;

/** Contract for the sole upstream authority that resolves controller variable meaning. */
export interface ControllerVariableSemanticAuthorityInterface {
  readonly kind: 'controller_variable_semantic_authority';
  readonly contractVersion: 2;
  readonly authority: 'upstream';
  /** The reasoning policy is part of the semantic contract, not hidden in executable rule callbacks. */
  readonly reasoning: ControllerVariableSemanticReasoningContract;
  readonly judgmentContract: 'semantic_and_expression_value_are_integrated';
  readonly sourceExpressionContract: 'every-closed-judgment-retains-the-exact-canonical-sourceExpression-reference-from-its-request';
  readonly resolve: (request: ControllerVariableSemanticResolutionRequest) => ControllerVariableSemanticJudgment;
}


