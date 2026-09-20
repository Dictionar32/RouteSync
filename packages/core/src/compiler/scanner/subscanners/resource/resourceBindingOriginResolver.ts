import type { ResourceExpressionModel } from '../../../../types/domain/resourceExpressionModel';
import type { ResourceBindingDefinitionContext, ResourceBindingDefinitionModel } from '../../../../types/domain/resourceBindingModel';
import type { ResourceBindingModelOrigin, ResourceBindingOriginState } from '../../../../types/domain/resourceBindingOrigin';
import type { VariableName } from '../../../../types/domain/semanticValues';

export function resolveResourceBindingOrigin(
  expression: ResourceExpressionModel,
  context: readonly ResourceBindingDefinitionContext[],
  visited: readonly VariableName[] = []
): ResourceBindingOriginState {
  if (expression.semantic.kind !== 'requires_binding') return unresolved({ kind: 'unknown', reason: 'no_binding_origin' });
  const requirement = expression.semantic.requirement;
  switch (requirement.kind) {
    case 'static_method': return known([{ kind: 'model', model: requirement.model }]);
    case 'variable': return requirement.name.value === '$this'
      ? known([{ kind: 'controller_this' }])
      : resolveVariable(requirement.name, context, visited);
    case 'property': return resolveResourceBindingOrigin(requirement.receiver, context, visited);
    case 'method': return resolveResourceBindingOrigin(requirement.receiver, context, visited);
    case 'array_access': return resolveResourceBindingOrigin(requirement.target, context, visited);
    case 'function_call': return mergeStates(...requirement.arguments.map(argument => resolveResourceBindingOrigin(argument, context, visited)));
    case 'cast': return resolveResourceBindingOrigin(requirement.operand, context, visited);
    case 'computation': return mergeStates(
      resolveResourceBindingOrigin(requirement.left, context, visited),
      resolveResourceBindingOrigin(requirement.right, context, visited)
    );
    case 'conditional': return mergeStates(
      resolveResourceBindingOrigin(requirement.truthy, context, visited),
      resolveResourceBindingOrigin(requirement.falsy, context, visited)
    );
    case 'short_conditional': return resolveResourceBindingOrigin(requirement.falsy, context, visited);
    case 'null_coalesce': return mergeStates(
      resolveResourceBindingOrigin(requirement.left, context, visited),
      resolveResourceBindingOrigin(requirement.right, context, visited)
    );
    case 'nested_object': return mergeStates(...requirement.fields.map(field => resolveResourceBindingOrigin(field.value, context, visited)));
    case 'nested_array': return mergeStates(...requirement.entries.map(entry => resolveResourceBindingOrigin(entry.value, context, visited)));
    case 'unary': return resolveResourceBindingOrigin(requirement.operand, context, visited);
    case 'match': return mergeStates(
      resolveResourceBindingOrigin(requirement.subject, context, visited),
      ...requirement.arms.flatMap(arm => resolveMatchArmOrigins(arm, context, visited))
    );
    case 'class_reference': return unresolved({ kind: 'unknown', reason: 'no_binding_origin' });
    case 'construct': return mergeStates(...requirement.arguments.map(argument => resolveResourceBindingOrigin(argument, context, visited)));
    case 'instance_of': return resolveResourceBindingOrigin(requirement.expression, context, visited);
    case 'closure': return unresolved({ kind: 'unknown', reason: 'no_binding_origin' });
    case 'arrow_function': return resolveResourceBindingOrigin(requirement.body, context, visited);
  }
}

function resolveVariable(
  variable: VariableName,
  context: readonly ResourceBindingDefinitionContext[],
  visited: readonly VariableName[]
): ResourceBindingOriginState {
  if (visited.some(item => item.value === variable.value)) return rejected('cyclic_definition');
  const entry = context.find(item => item.variable.value === variable.value);
  if (!entry) return unresolved({ kind: 'unknown', reason: 'external_variable' });
  return mergeDefinitions(entry.definitions, context, [...visited, variable]);
}

function mergeDefinitions(
  definitions: readonly ResourceBindingDefinitionModel[],
  context: readonly ResourceBindingDefinitionContext[],
  visited: readonly VariableName[]
): ResourceBindingOriginState {
  const states = definitions.map(definition => resolveResourceBindingOrigin(definition.expression, context, visited));
  return states.length === 0 ? unresolved({ kind: 'unknown', reason: 'no_binding_origin' }) : mergeStates(...states);
}

function mergeStates(...states: readonly ResourceBindingOriginState[]): ResourceBindingOriginState {
  const origins: ResourceBindingModelOrigin[] = [];
  let rejectedState: ResourceBindingOriginState | undefined;
  for (const state of states) {
    if (state.kind === 'known') origins.push(...state.origins);
    if (state.kind === 'unresolved') origins.push(state.origin);
    if (state.kind === 'rejected') rejectedState = state;
  }
  const unique = dedupe(origins);
  if (rejectedState && unique.length === 0) return rejectedState;
  const unknown = uniqueUnknown(unique);
  if (unknown.kind === 'found') return unresolved(unknown.origin);
  return known(unique);
}

function dedupe(origins: readonly ResourceBindingModelOrigin[]): ResourceBindingModelOrigin[] {
  const result: ResourceBindingModelOrigin[] = [];
  for (const origin of origins) {
    const key = originKey(origin);
    const exists = result.some(item => originKey(item) === key);
    if (!exists) result.push(origin);
  }
  return result;
}


function resolveMatchArmOrigins(
  arm: import('../../../../types/domain/expressions').ResourceMatchArm,
  context: readonly ResourceBindingDefinitionContext[],
  visited: readonly VariableName[]
): readonly ResourceBindingOriginState[] {
  if (arm.kind === 'conditional') {
    return [
      ...arm.conditions.map(condition => resolveResourceBindingOrigin(condition, context, visited)),
      resolveResourceBindingOrigin(arm.value, context, visited)
    ];
  }
  return [resolveResourceBindingOrigin(arm.value, context, visited)];
}

function originKey(origin: ResourceBindingModelOrigin): string {
  switch (origin.kind) {
    case 'controller_this': return 'controller_this';
    case 'model': return `model:${origin.model.value}`;
    case 'resource': return `resource:${origin.resource.value}`;
    case 'variable': return `variable:${origin.variable.value}`;
    case 'unknown': return `unknown:${origin.reason}`;
  }
}

function known(origins: readonly ResourceBindingModelOrigin[]): ResourceBindingOriginState {
  return { kind: 'known', origins: Object.freeze(origins) };
}
function unresolved(origin: ResourceBindingModelOrigin): ResourceBindingOriginState {
  return { kind: 'unresolved', origin };
}
function rejected(reason: 'cyclic_definition' | 'unsupported_expression'): ResourceBindingOriginState {
  return { kind: 'rejected', reason };
}

function uniqueUnknown(origins: readonly ResourceBindingModelOrigin[]): { readonly kind: 'found'; readonly origin: Extract<ResourceBindingModelOrigin, { kind: 'unknown' }> } | { readonly kind: 'none' } {
  for (const origin of origins) {
    if (origin.kind === 'unknown') return { kind: 'found', origin };
  }
  return { kind: 'none' };
}
