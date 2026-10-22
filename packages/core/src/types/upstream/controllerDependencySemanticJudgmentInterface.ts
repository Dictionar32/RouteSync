import type {
  ControllerDependency,
  ControllerDependencyInjection,
  ControllerVariableSemantic,
} from './controller';
import type { ControllerParameterClassNameJudgment } from './controllerParameterClassNameJudgmentInterface';
import type { ExpressionArguments } from './expression';
import type { ClassName, VariableName } from './names';

export interface ControllerDependencyAttributeEvidence {
  readonly name: ClassName;
  readonly arguments: ExpressionArguments;
}

/** AST-independent evidence for one constructor or action-method parameter. */
export interface ControllerDependencySemanticInput {
  readonly injection: ControllerDependencyInjection;
  readonly semantic: ControllerVariableSemantic;
  readonly parameter: VariableName;
  readonly classNameJudgment: ControllerParameterClassNameJudgment;
  readonly attributes: readonly ControllerDependencyAttributeEvidence[];
  readonly customContextualAttributeNames: readonly ClassName[];
}

export type ControllerDependencySemanticJudgment =
  | Readonly<{
      readonly kind: 'controller_dependency_resolved';
      readonly dependency: ControllerDependency;
      readonly closure: 'class-name-and-contextual-resolution-judgments-are-closed';
    }>
  | Readonly<{
      readonly kind: 'controller_dependency_excluded';
      readonly reason: 'unresolved-class-name' | 'method-route-or-request-parameter' | 'method-contextual-attribute';
      readonly closure: 'parameter-is-not-a-container-resolved-controller-dependency';
    }>;

export type ControllerDependencySemanticRule =
  | Readonly<{ readonly kind: 'unresolved-class-name-rule'; readonly premise: 'class-name-judgment-unresolved'; readonly conclusion: 'dependency-excluded' }>
  | Readonly<{ readonly kind: 'constructor-dependency-rule'; readonly premise: 'constructor-injection-and-class-name-resolved'; readonly conclusion: 'dependency-published' }>
  | Readonly<{ readonly kind: 'contextual-attribute-dependency-rule'; readonly premise: 'method-injection-and-contextual-attribute-resolved'; readonly conclusion: 'dependency-published' }>
  | Readonly<{ readonly kind: 'method-route-parameter-exclusion-rule'; readonly premise: 'method-injection-and-route-or-request-origin-without-contextual-attribute'; readonly conclusion: 'dependency-excluded' }>
  | Readonly<{ readonly kind: 'method-container-dependency-rule'; readonly premise: 'method-injection-and-expression-or-external-origin-without-contextual-attribute'; readonly conclusion: 'dependency-published' }>;

export interface ControllerDependencySemanticReasoningContract {
  readonly kind: 'controller_dependency_semantic_reasoning_contract';
  readonly authority: 'upstream';
  readonly closed: true;
  readonly rules: readonly [
    Extract<ControllerDependencySemanticRule, { readonly kind: 'unresolved-class-name-rule' }>,
    Extract<ControllerDependencySemanticRule, { readonly kind: 'constructor-dependency-rule' }>,
    Extract<ControllerDependencySemanticRule, { readonly kind: 'contextual-attribute-dependency-rule' }>,
    Extract<ControllerDependencySemanticRule, { readonly kind: 'method-route-parameter-exclusion-rule' }>,
    Extract<ControllerDependencySemanticRule, { readonly kind: 'method-container-dependency-rule' }>,
  ];
}

export interface ControllerDependencySemanticJudgmentAuthorityInterface {
  readonly kind: 'controller_dependency_semantic_judgment_authority';
  readonly contractVersion: 1;
  readonly reasoning: ControllerDependencySemanticReasoningContract;
  readonly judge: (input: ControllerDependencySemanticInput) => ControllerDependencySemanticJudgment;
}

