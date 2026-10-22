import type { ControllerContextualAttribute, ControllerContextualAttributeName, ControllerCustomContextualAttribute, ControllerDependency, ControllerDependencyResolution } from './controller';
import type {
  ControllerDependencyAttributeEvidence,
  ControllerDependencySemanticInput,
  ControllerDependencySemanticJudgment,
  ControllerDependencySemanticJudgmentAuthorityInterface,
  ControllerDependencySemanticReasoningContract,
} from './controllerDependencySemanticJudgmentInterface';
import { createClassName } from './names';

type FrameworkAttributeJudgment =
  | Readonly<{ readonly kind: 'framework_attribute_known'; readonly name: ControllerContextualAttributeName }>
  | Readonly<{ readonly kind: 'framework_attribute_unknown' }>;

type CustomAttributeJudgment =
  | Readonly<{ readonly kind: 'custom_attribute_matched' }>
  | Readonly<{ readonly kind: 'custom_attribute_unmatched' }>;

const finalName = (name: string): string => {
  const normalized = name.replace(/\\+$/, '');
  return normalized.slice(normalized.lastIndexOf('\\') + 1);
};

const frameworkAttribute = (name: string): FrameworkAttributeJudgment => {
  switch (finalName(name)) {
    case 'Auth': return Object.freeze({ kind: 'framework_attribute_known', name: 'auth' });
    case 'Authenticated': return Object.freeze({ kind: 'framework_attribute_known', name: 'authenticated' });
    case 'Cache': return Object.freeze({ kind: 'framework_attribute_known', name: 'cache' });
    case 'Config': return Object.freeze({ kind: 'framework_attribute_known', name: 'config' });
    case 'Context': return Object.freeze({ kind: 'framework_attribute_known', name: 'context' });
    case 'DB': return Object.freeze({ kind: 'framework_attribute_known', name: 'db' });
    case 'Database': return Object.freeze({ kind: 'framework_attribute_known', name: 'database' });
    case 'Give': return Object.freeze({ kind: 'framework_attribute_known', name: 'give' });
    case 'Log': return Object.freeze({ kind: 'framework_attribute_known', name: 'log' });
    case 'RequestAttribute': return Object.freeze({ kind: 'framework_attribute_known', name: 'request_attribute' });
    case 'RouteParameter': return Object.freeze({ kind: 'framework_attribute_known', name: 'route_parameter' });
    case 'Storage': return Object.freeze({ kind: 'framework_attribute_known', name: 'storage' });
    case 'Tag': return Object.freeze({ kind: 'framework_attribute_known', name: 'tag' });
    case 'CurrentUser': return Object.freeze({ kind: 'framework_attribute_known', name: 'current_user' });
    default: return Object.freeze({ kind: 'framework_attribute_unknown' });
  }
};

const customAttribute = (name: string, customNames: ControllerDependencySemanticInput['customContextualAttributeNames']): CustomAttributeJudgment => {
  const normalizedName = finalName(name);
  for (const candidate of customNames) {
    switch (Object.is(candidate.value.value, name) || Object.is(finalName(candidate.value.value), normalizedName)) {
      case true: return Object.freeze({ kind: 'custom_attribute_matched' });
      case false: break;
    }
  }
  return Object.freeze({ kind: 'custom_attribute_unmatched' });
};

const contextualResolutionValue = (attribute: ControllerContextualAttribute | ControllerCustomContextualAttribute): ControllerDependencyResolution => {
  const resolution: ControllerDependencyResolution = { kind: 'contextual_attribute', attribute };
  return Object.freeze(resolution);
};

const contextualResolution = (attribute: ControllerDependencyAttributeEvidence, customNames: ControllerDependencySemanticInput['customContextualAttributeNames']): ControllerDependencyResolution => {
  const framework = frameworkAttribute(attribute.name.value.value);
  switch (framework.kind) {
    case 'framework_attribute_known': {
      const resolvedAttribute: ControllerContextualAttribute = { kind: 'laravel_contextual_attribute', name: framework.name, arguments: attribute.arguments };
      Object.freeze(resolvedAttribute);
      return contextualResolutionValue(resolvedAttribute);
    }
    case 'framework_attribute_unknown':
      switch (customAttribute(attribute.name.value.value, customNames).kind) {
        case 'custom_attribute_matched': {
          const resolvedAttribute: ControllerCustomContextualAttribute = { kind: 'custom_contextual_attribute', name: createClassName(attribute.name.value.value), arguments: attribute.arguments };
          Object.freeze(resolvedAttribute);
          return contextualResolutionValue(resolvedAttribute);
        }
        case 'custom_attribute_unmatched': {
          const containerResolution: ControllerDependencyResolution = { kind: 'container' };
          return Object.freeze(containerResolution);
        }
      }
  }
};

const firstResolution = (attributes: readonly ControllerDependencyAttributeEvidence[], customNames: ControllerDependencySemanticInput['customContextualAttributeNames']): ControllerDependencyResolution => {
  for (const attribute of attributes) {
    const resolution = contextualResolution(attribute, customNames);
    switch (resolution.kind) {
      case 'contextual_attribute': return resolution;
      case 'container': break;
    }
  }
  return Object.freeze({ kind: 'container' });
};

const excluded = (reason: Extract<ControllerDependencySemanticJudgment, { kind: 'controller_dependency_excluded' }>['reason']): ControllerDependencySemanticJudgment => {
  const judgment: ControllerDependencySemanticJudgment = { kind: 'controller_dependency_excluded', reason, closure: 'parameter-is-not-a-container-resolved-controller-dependency' };
  return Object.freeze(judgment);
};
const resolved = (dependency: ControllerDependency): ControllerDependencySemanticJudgment => {
  const judgment: ControllerDependencySemanticJudgment = { kind: 'controller_dependency_resolved', dependency, closure: 'class-name-and-contextual-resolution-judgments-are-closed' };
  return Object.freeze(judgment);
};


const unresolvedClassNameRule: Extract<ControllerDependencySemanticReasoningContract['rules'][number], { readonly kind: 'unresolved-class-name-rule' }> = { kind: 'unresolved-class-name-rule', premise: 'class-name-judgment-unresolved', conclusion: 'dependency-excluded' };
Object.freeze(unresolvedClassNameRule);
const constructorDependencyRule: Extract<ControllerDependencySemanticReasoningContract['rules'][number], { readonly kind: 'constructor-dependency-rule' }> = { kind: 'constructor-dependency-rule', premise: 'constructor-injection-and-class-name-resolved', conclusion: 'dependency-published' };
Object.freeze(constructorDependencyRule);
const contextualAttributeDependencyRule: Extract<ControllerDependencySemanticReasoningContract['rules'][number], { readonly kind: 'contextual-attribute-dependency-rule' }> = { kind: 'contextual-attribute-dependency-rule', premise: 'method-injection-and-contextual-attribute-resolved', conclusion: 'dependency-published' };
Object.freeze(contextualAttributeDependencyRule);
const methodRouteParameterExclusionRule: Extract<ControllerDependencySemanticReasoningContract['rules'][number], { readonly kind: 'method-route-parameter-exclusion-rule' }> = { kind: 'method-route-parameter-exclusion-rule', premise: 'method-injection-and-route-or-request-origin-without-contextual-attribute', conclusion: 'dependency-excluded' };
Object.freeze(methodRouteParameterExclusionRule);
const methodContainerDependencyRule: Extract<ControllerDependencySemanticReasoningContract['rules'][number], { readonly kind: 'method-container-dependency-rule' }> = { kind: 'method-container-dependency-rule', premise: 'method-injection-and-expression-or-external-origin-without-contextual-attribute', conclusion: 'dependency-published' };
Object.freeze(methodContainerDependencyRule);

const dependencySemanticRules: ControllerDependencySemanticReasoningContract['rules'] = [
  unresolvedClassNameRule,
  constructorDependencyRule,
  contextualAttributeDependencyRule,
  methodRouteParameterExclusionRule,
  methodContainerDependencyRule,
];
Object.freeze(dependencySemanticRules);

const dependencySemanticReasoning: ControllerDependencySemanticReasoningContract = Object.freeze({
  kind: 'controller_dependency_semantic_reasoning_contract',
  authority: 'upstream',
  closed: true,
  rules: dependencySemanticRules,
});

export const controllerDependencySemanticJudgmentAuthority: ControllerDependencySemanticJudgmentAuthorityInterface = Object.freeze({
  kind: 'controller_dependency_semantic_judgment_authority',
  contractVersion: 1,
  reasoning: dependencySemanticReasoning,
  judge: (input: ControllerDependencySemanticInput): ControllerDependencySemanticJudgment => {
    switch (input.classNameJudgment.kind) {
      case 'controller_parameter_class_name_unresolved':
        return excluded('unresolved-class-name');
      case 'controller_parameter_class_name_resolved': {
        const resolution = firstResolution(input.attributes, input.customContextualAttributeNames);
        switch (input.injection.kind) {
          case 'constructor':
            {
              const dependency: ControllerDependency = {
                kind: 'controller_dependency',
                injection: input.injection,
                resolution,
                parameter: input.parameter,
                type: input.classNameJudgment.name,
              };
              Object.freeze(dependency);
              return resolved(dependency);
            }
          case 'method':
            switch (resolution.kind) {
              case 'contextual_attribute':
                {
                  const dependency: ControllerDependency = {
                    kind: 'controller_dependency',
                    injection: input.injection,
                    resolution,
                    parameter: input.parameter,
                    type: input.classNameJudgment.name,
                  };
                  Object.freeze(dependency);
                  return resolved(dependency);
                }
              case 'container':
                switch (input.semantic.kind) {
                  case 'model_origin':
                  case 'request_origin':
                    return excluded('method-route-or-request-parameter');
                  case 'expression':
                  case 'external':
                    {
                      const dependency: ControllerDependency = {
                        kind: 'controller_dependency',
                        injection: input.injection,
                        resolution,
                        parameter: input.parameter,
                        type: input.classNameJudgment.name,
                      };
                      Object.freeze(dependency);
                      return resolved(dependency);
                    }
                }
            }
        }
      }
    }
  },
});
