import type { ResourceExpressionModel } from '../../../../types/domain/resourceExpressionModel';
import type { ResourceBindingDefinitionContext, ResourceBindingDefinitionModel } from '../../../../types/domain/resourceBindingModel';
import type { ResourceBindingDefinitionTrace, ResourceBindingProvenance, ResourceBindingProvenanceNode, ResourceBindingOrigin } from '../../../../types/domain/resourceBindingProvenance';
import type { VariableName } from '../../../../types/domain/semanticValues';

export function buildResourceBindingProvenance(source: ResourceExpressionModel, context: readonly ResourceBindingDefinitionContext[]): ResourceBindingProvenance {
  const result = buildNode(source, context, []);
  if (result.kind === 'partial') return Object.freeze({ kind: 'partial', roots: Object.freeze([result.node]), missing: result.missing });
  if (result.kind === 'rejected') return Object.freeze({ kind: 'rejected', roots: Object.freeze([result.node]), reason: result.reason });
  return Object.freeze({ kind: 'complete', roots: Object.freeze([result.node]) });
}

type NodeResult =
  | { readonly kind: 'complete'; readonly node: ResourceBindingProvenanceNode }
  | { readonly kind: 'partial'; readonly node: ResourceBindingProvenanceNode; readonly missing: ResourceBindingOrigin }
  | { readonly kind: 'rejected'; readonly node: ResourceBindingProvenanceNode; readonly reason: 'cycle' | 'unsupported_expression' };

type Visit = { readonly variable: VariableName };

function buildNode(expression: ResourceExpressionModel, context: readonly ResourceBindingDefinitionContext[], visited: readonly Visit[]): NodeResult {
  if (expression.semantic.kind !== 'requires_binding') return { kind: 'rejected', node: emptyNode(expression), reason: 'unsupported_expression' };
  const requirement = expression.semantic.requirement;
  if (requirement.kind !== 'variable') return { kind: 'complete', node: emptyNode(expression) };
  const variable = requirement.name;
  if (visited.some(item => item.variable.value === variable.value)) return { kind: 'rejected', node: emptyNode(expression), reason: 'cycle' };
  if (variable.value === '$this') return { kind: 'complete', node: node({ kind: 'controller_this' }, expression, []) };
  const match = context.find(item => item.variable.value === variable.value);
  if (!match) {
    const origin: ResourceBindingOrigin = { kind: 'external_variable', variable };
    return { kind: 'partial', node: node(origin, expression, []), missing: origin };
  }
  const definitions = match.definitions.map(definition => buildDefinition(definition, context, [...visited, { variable }]));
  const traces = Object.freeze(definitions.map(result => result.trace));
  const base = node({ kind: 'variable', variable }, expression, traces);
  return merge(base, definitions);
}

type DefinitionResult =
  | { readonly kind: 'complete'; readonly node: ResourceBindingProvenanceNode; readonly trace: ResourceBindingDefinitionTrace }
  | { readonly kind: 'partial'; readonly node: ResourceBindingProvenanceNode; readonly trace: ResourceBindingDefinitionTrace; readonly missing: ResourceBindingOrigin }
  | { readonly kind: 'rejected'; readonly node: ResourceBindingProvenanceNode; readonly trace: ResourceBindingDefinitionTrace; readonly reason: 'cycle' | 'unsupported_expression' };

function buildDefinition(definition: ResourceBindingDefinitionModel, context: readonly ResourceBindingDefinitionContext[], visited: readonly Visit[]): DefinitionResult {
  const result = buildNode(definition.expression, context, visited);
  const trace: ResourceBindingDefinitionTrace = Object.freeze({
    identity: definition.identity,
    variable: definition.variable,
    expression: definition.expression,
    availability: definition.availability,
    dependencies: Object.freeze([result.node])
  });
  if (result.kind === 'partial') return { kind: 'partial', node: result.node, trace, missing: result.missing };
  if (result.kind === 'rejected') return { kind: 'rejected', node: result.node, trace, reason: result.reason };
  return { kind: 'complete', node: result.node, trace };
}

function merge(base: ResourceBindingProvenanceNode, children: readonly NodeResult[]): NodeResult {
  for (const child of children) {
    if (child.kind === 'partial') return { kind: 'partial', node: base, missing: child.missing };
    if (child.kind === 'rejected') return { kind: 'rejected', node: base, reason: child.reason };
  }
  return { kind: 'complete', node: base };
}

function node(origin: ResourceBindingOrigin, expression: ResourceExpressionModel, definitions: readonly ResourceBindingDefinitionTrace[]): ResourceBindingProvenanceNode {
  return Object.freeze({ origin, expression, definitions: Object.freeze(definitions) });
}

function emptyNode(expression: ResourceExpressionModel): ResourceBindingProvenanceNode {
  return node({ kind: 'expression', reason: 'non_variable_root' }, expression, []);
}
