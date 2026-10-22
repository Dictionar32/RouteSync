import type { ControllerVariableSemantic } from './controller';
import type { ClassName } from './names';

/** Closed rules for deciding whether a controller parameter denotes a class. */
export type ControllerParameterClassNameRule =
  | Readonly<{
      readonly kind: 'model_class_name_rule';
      readonly premise: 'model_origin_with_model_class';
      readonly conclusion: 'resolved_class_name';
    }>
  | Readonly<{
      readonly kind: 'request_class_name_rule';
      readonly premise: 'request_origin';
      readonly conclusion: 'resolved_class_name';
    }>
  | Readonly<{
      readonly kind: 'table_origin_non_class_rule';
      readonly premise: 'model_origin_with_table';
      readonly conclusion: 'unresolved_class_name';
    }>
  | Readonly<{
      readonly kind: 'non_class_expression_rule';
      readonly premise: 'expression_or_external_origin';
      readonly conclusion: 'unresolved_class_name';
    }>;

export interface ControllerParameterClassNameReasoningContract {
  readonly kind: 'controller_parameter_class_name_reasoning_contract';
  readonly authority: 'upstream';
  readonly closed: true;
  readonly rules: readonly [
    Extract<ControllerParameterClassNameRule, { readonly kind: 'model_class_name_rule' }>,
    Extract<ControllerParameterClassNameRule, { readonly kind: 'request_class_name_rule' }>,
    Extract<ControllerParameterClassNameRule, { readonly kind: 'table_origin_non_class_rule' }>,
    Extract<ControllerParameterClassNameRule, { readonly kind: 'non_class_expression_rule' }>,
  ];
}

/** The resolved branch carries the existing domain type; unresolved reasons remain explicit. */
export type ControllerParameterClassNameJudgment =
  | Readonly<{
      readonly kind: 'controller_parameter_class_name_resolved';
      readonly source: 'model_class';
      readonly name: ClassName;
      readonly closed: true;
    }>
  | Readonly<{
      readonly kind: 'controller_parameter_class_name_resolved';
      readonly source: 'request_origin';
      readonly name: ClassName;
      readonly closed: true;
    }>
  | Readonly<{
      readonly kind: 'controller_parameter_class_name_unresolved';
      readonly reason: 'table_origin' | 'expression_origin' | 'external_origin';
      readonly closed: true;
    }>;

export interface ControllerParameterClassNameJudgmentInterface {
  readonly kind: 'controller_parameter_class_name_judgment_authority';
  readonly reasoning: ControllerParameterClassNameReasoningContract;
  readonly judge: (semantic: ControllerVariableSemantic) => ControllerParameterClassNameJudgment;
}
