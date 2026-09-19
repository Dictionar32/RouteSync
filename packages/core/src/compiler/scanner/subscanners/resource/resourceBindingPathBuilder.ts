import type { ResourceExpressionModel, ResourceExpressionBindingRequirement } from '../../../../types/domain/resourceExpressionModel';
import type { ResourceBindingModelCatalog } from '../../../../types/domain/resourceBindingModelReference';
import type { ResourceBindingDefinitionContext, ResourceBindingDefinitionModel, ResourceBindingModel, ResourceBindingRoot, ResourceBindingResolution, ResourceBindingUnresolvedStep } from '../../../../types/domain/resourceBindingModel';
import type { ResourceBindingProvenance } from '../../../../types/domain/resourceBindingProvenance';
import { buildResourceBindingProvenance } from './resourceBindingProvenanceBuilder';
import { resolveResourceBindingOrigin } from './resourceBindingOriginResolver';
import type { ResourceTraversalModel } from '../../../../types/domain/resourceTraversalModel';
import { createResourceTraversal } from './resourceBindingTraversalBuilder';

export type BindingPath =
  | { readonly kind: 'path'; readonly root: ResourceBindingRoot; readonly steps: readonly ResourceBindingUnresolvedStep[] }
  | { readonly kind: 'unsupported' };

export function fromModel(expression: ResourceExpressionModel, context: readonly ResourceBindingDefinitionContext[], catalog: ResourceBindingModelCatalog): BindingPath {
  if (expression.semantic.kind !== 'requires_binding') return { kind: 'unsupported' };
  return fromRequirement(expression.semantic.requirement, context, catalog);
}

function fromRequirement(requirement: ResourceExpressionBindingRequirement, context: readonly ResourceBindingDefinitionContext[], catalog: ResourceBindingModelCatalog): BindingPath {
  switch (requirement.kind) {
    case 'variable':
      if (requirement.name.value === '$this') return { kind: 'path', root: { kind: 'controller_this' }, steps: [] };
      const match = context.find(item => item.variable.value === requirement.name.value);
      const origin = createVariableOrigin(requirement.name, match);
      return { kind: 'path', root: { kind: 'variable', variable: requirement.name, origin }, steps: [] };
    case 'property':
      return appendStep(requirement.receiver, { kind: 'member', property: requirement.property, access: requirement.access }, context, catalog);
    case 'method':
      return appendStep(requirement.receiver, { kind: 'method', method: requirement.method, arguments: requirement.arguments, access: requirement.access }, context, catalog);
    case 'static_method':
      return { kind: 'path', root: { kind: 'model', model: catalog.resolve(requirement.model) }, steps: [{ kind: 'method', method: requirement.method, arguments: requirement.arguments, access: { kind: 'direct' } }] };
    case 'array_access':
    case 'function_call':
    case 'cast':
    case 'computation':
    case 'conditional':
    case 'short_conditional':
    case 'null_coalesce':
    case 'nested_object':
      return { kind: 'unsupported' };
  }
}

function expandVariableRoot(
  path: Extract<BindingPath, { kind: 'path' }>,
  context: readonly ResourceBindingDefinitionContext[],
  visited: ReadonlySet<string>,
  catalog: ResourceBindingModelCatalog,
): Extract<BindingPath, { kind: 'path' }> {
  if (path.root.kind !== 'variable' || path.root.origin.kind !== 'resolved' || path.root.origin.definitions.length !== 1) return path;
  const variable = path.root.variable.value;
  if (visited.has(variable)) return path;
  const definition = path.root.origin.definitions[0];
  const nextVisited = new Set(visited);
  nextVisited.add(variable);
  const definitionPath = fromModel(definition.expression, context, catalog);
  if (definitionPath.kind === 'unsupported') return path;
  const expanded = expandVariableRoot(definitionPath, context, nextVisited, catalog);
  return Object.freeze({ kind: 'path', root: expanded.root, steps: Object.freeze([...expanded.steps, ...path.steps]) });
}

function toTraversalRoot(root: ResourceBindingRoot): ResourceTraversalRoot {
  switch (root.kind) {
    case 'model':
      if (root.model.kind === 'missing') return { kind: 'unresolved', reason: 'model' };
      return { kind: 'model', model: root.model.model };
    case 'controller_this': return root;
    case 'resource': return root;
    case 'variable': return { kind: 'variable', variable: root.variable };
  }
}

function createVariableOrigin(
  variable: import('../../../../types/domain/semanticValues').VariableName,
  context: ResourceBindingDefinitionContext | undefined
): import('../../../../types/domain/resourceBindingModel').ResourceBindingVariableOrigin {
  if (context) return { kind: 'resolved', variable, definitions: context.definitions };
  return { kind: 'unresolved', variable };
}

function appendStep(receiver: ResourceExpressionModel, step: ResourceBindingUnresolvedStep, context: readonly ResourceBindingDefinitionContext[], catalog: ResourceBindingModelCatalog): BindingPath {
  const path = fromModel(receiver, context, catalog);
  if (path.kind === 'unsupported') return path;
  return Object.freeze({ kind: 'path', root: path.root, steps: Object.freeze([...path.steps, step]) });
}

