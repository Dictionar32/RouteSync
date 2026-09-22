import type { ResourceExpressionModel } from '../../../../types/domain/resourceExpressionModel';
import type { ResourceBindingDefinitionContext, ResourceBindingRoot, ResourceBindingUnresolvedStep } from '../../../../types/domain/resourceBindingModel';
import type { ResourceBindingModelCatalog } from '../../../../types/domain/resourceBindingModelReference';
import type { ResourceTraversalModel, ResourceTraversalRoot, ResourceTraversalStep, ResourceTraversalTarget, ResourceTraversalCardinality } from '../../../../types/domain/resourceTraversalModel';
import { resolveResourceMethodInvocation, type ResourceQueryState } from '../../../../types/domain/resourceModelMethodSurface';
import { PrimitiveKind, PrimitiveType, ReferenceType } from '../../../types/SemanticType';

type BindingPath =
  | { readonly kind: 'path'; readonly root: ResourceBindingRoot; readonly steps: readonly ResourceBindingUnresolvedStep[] }
  | { readonly kind: 'derived'; readonly expression: ResourceExpressionModel; readonly origin: import('../../../../types/domain/resourceBindingOrigin').ResourceBindingOriginState };

type TraversalState = { readonly query: ResourceQueryState; readonly target: ResourceTraversalTarget; readonly cardinality: ResourceTraversalCardinality };

export function createResourceTraversal(
  source: ResourceExpressionModel,
  path: BindingPath,
  context: readonly ResourceBindingDefinitionContext[] = [],
  catalog: ResourceBindingModelCatalog,
): ResourceTraversalModel {
  void source;
  if (path.kind === 'derived') return { resolution: { kind: 'pending', root: { kind: 'unresolved', reason: 'method' }, steps: Object.freeze([]), reason: 'method' } };
  const expanded = expandVariableRoot(path, context, new Set<string>(), catalog);
  const root = toTraversalRoot(expanded.root);
  let state = initialState(root, catalog);
  const steps: ResourceTraversalStep[] = [];
  let missing: 'root_model' | 'property' | 'relation' | 'method' | undefined = state ? undefined : 'root_model';

  for (const step of expanded.steps) {
    if (!state) {
      steps.push(unresolvedStep(step));
      continue;
    }
    if (step.kind === 'member') {
      const resolved = resolveMember(state, step, catalog);
      steps.push(resolved.step);
      if (resolved.state) state = resolved.state;
      else missing = missing ?? resolved.reason;
      continue;
    }
    const invocation = resolveResourceMethodInvocation(state.query, step.method, step.arguments);
    const projection = invocation.result.traversal;
    const target = traversalTargetFromProjection(projection);
    steps.push({
      kind: 'method',
      sourceModel: { kind: 'known', model: state.query.model },
      method: step.method,
      arguments: step.arguments,
      access: step.access,
      target,
      cardinality: cardinalityFromProjection(projection),
      result: invocation.result,
    });
    if (projection.kind !== 'rejected') state = stateFromProjection(projection);
    else missing = missing ?? 'method';
  }

  const frozenSteps = Object.freeze(steps);
  if (missing) return { resolution: { kind: 'pending', root, steps: frozenSteps, reason: missing } };
  if (!state) return { resolution: { kind: 'pending', root, steps: frozenSteps, reason: 'root_model' } };
  const value = { target: state.target, semanticType: state.target.semanticType, cardinality: state.cardinality };
  const resolvedSteps = Object.freeze(steps);
  return { resolution: { kind: 'resolved', root, steps: resolvedSteps, value } };
}

function initialState(root: ResourceTraversalRoot, catalog: ResourceBindingModelCatalog): TraversalState | undefined {
  if (root.kind !== 'model') return undefined;
  const model = catalog.resolve(root.model);
  if (model.kind === 'missing') return undefined;
  return {
    query: { kind: 'model_instance', model: model.model },
    target: { kind: 'model', model: model.model, semanticType: ReferenceType.model('', model.model.identity.name.value) },
    cardinality: { kind: 'single' },
  };
}

function resolveMember(
  state: TraversalState,
  step: Extract<ResourceBindingUnresolvedStep, { readonly kind: 'member' }>,
  catalog: ResourceBindingModelCatalog,
): { readonly step: ResourceTraversalStep; readonly state?: TraversalState; readonly reason: 'property' | 'relation' } {
  const property = state.query.model.surface.byName.lookup(step.property);
  if (property.kind === 'missing') {
    return unresolvedPropertyStep(state, step);
  }
  return propertyTraversalHandlers[property.value.traversal.kind](state, step, property.value, catalog);
}

type TraversableProperty = import('../../../../types/upstream/model').ModelSemanticProperty;
type MemberResolution = { readonly step: ResourceTraversalStep; readonly state?: TraversalState; readonly reason: 'property' | 'relation' };

const propertyTraversalHandlers: {
  readonly scalar: (state: TraversalState, step: Extract<ResourceBindingUnresolvedStep, { readonly kind: 'member' }>, property: TraversableProperty, catalog: ResourceBindingModelCatalog) => MemberResolution;
  readonly relation: (state: TraversalState, step: Extract<ResourceBindingUnresolvedStep, { readonly kind: 'member' }>, property: TraversableProperty, catalog: ResourceBindingModelCatalog) => MemberResolution;
} = Object.freeze({
  scalar: (state, step, property) => {
    const target: ResourceTraversalTarget = { kind: 'scalar', semanticType: property.traversal.semanticType };
    return {
      step: { kind: 'property', sourceModel: { kind: 'known', model: state.query.model }, property: step.property, access: step.access, target },
      state: { query: state.query, target, cardinality: { kind: 'single' } },
      reason: 'property',
    };
  },
  relation: (state, step, property, catalog) => {
    const relation = property.traversal;
    const targetModel = catalog.resolve(relation.targetModel);
    const cardinality = relationCardinality[relation.cardinality];
    if (targetModel.kind === 'missing') {
      const target: ResourceTraversalTarget = { kind: 'model', model: state.query.model, semanticType: relation.semanticType };
      return {
        step: { kind: 'relation', sourceModel: { kind: 'known', model: state.query.model }, relation: property.relation, access: step.access, target, cardinality, targetShape: relation.targetShape, traversalTarget: relation.traversalTarget },
        reason: 'relation',
      };
    }
    const target: ResourceTraversalTarget = cardinality.kind === 'collection'
      ? { kind: 'collection', model: targetModel.model, elementType: relation.semanticType, semanticType: relation.semanticType }
      : { kind: 'model', model: targetModel.model, semanticType: relation.semanticType };
    return {
      step: { kind: 'relation', sourceModel: { kind: 'known', model: state.query.model }, relation: property.relation, access: step.access, target, cardinality, targetShape: relation.targetShape, traversalTarget: relation.traversalTarget },
      state: { query: { kind: 'model_instance', model: targetModel.model }, target, cardinality },
      reason: 'relation',
    };
  },
});

function unresolvedPropertyStep(
  state: TraversalState,
  step: Extract<ResourceBindingUnresolvedStep, { readonly kind: 'member' }>,
): MemberResolution {
  const target: ResourceTraversalTarget = { kind: 'scalar', semanticType: new PrimitiveType(PrimitiveKind.UNKNOWN) };
  return {
    step: { kind: 'property', sourceModel: { kind: 'known', model: state.query.model }, property: step.property, access: step.access, target },
    reason: 'property',
  };
}

const relationCardinality: Readonly<Record<'one' | 'many', ResourceTraversalCardinality>> = Object.freeze({ one: { kind: 'single' }, many: { kind: 'collection' } });

function applyTraversalProjection(projection: import('../../../../types/domain/resourceModelMethodSurface').ResourceMethodTraversalProjection, receiver: TraversalState): TraversalState | undefined {
  if (projection.kind === 'rejected') return undefined;
  if (projection.next.kind === 'retain') return { query: receiver.query, target: projection.target, cardinality: projection.cardinality };
  return { query: projection.next, target: projection.target, cardinality: projection.cardinality };
}

function unresolvedStep(step: ResourceBindingUnresolvedStep): ResourceTraversalStep {
  if (step.kind === 'member') return { kind: 'property', sourceModel: { kind: 'unresolved', reason: 'receiver_model' }, property: step.property, access: step.access, target: { kind: 'scalar', semanticType: new PrimitiveType(PrimitiveKind.UNKNOWN) } };
  return { kind: 'method', sourceModel: { kind: 'unresolved', reason: 'receiver_model' }, method: step.method, arguments: step.arguments, access: step.access, target: { kind: 'scalar', semanticType: new PrimitiveType(PrimitiveKind.UNKNOWN) }, cardinality: { kind: 'single' }, result: { kind: 'unresolved', origin: { kind: 'unresolved', method: step.method, reason: 'receiver_model' }, method: step.method, traversal: { kind: 'rejected', reason: 'unresolved' } } };
}

function expandVariableRoot(path: Extract<BindingPath, { kind: 'path' }>, context: readonly ResourceBindingDefinitionContext[], visited: ReadonlySet<string>, catalog: ResourceBindingModelCatalog): Extract<BindingPath, { kind: 'path' }> {
  if (path.root.kind !== 'variable' || path.root.origin.kind !== 'resolved' || path.root.origin.definitions.length !== 1) return path;
  const variable = path.root.variable.value;
  if (visited.has(variable)) return path;
  const definition = path.root.origin.definitions[0];
  const definitionPath = fromModel(definition.expression, context, catalog);
  if (definitionPath.kind === 'unsupported') return path;
  const nextVisited = new Set(visited);
  nextVisited.add(variable);
  const expanded = expandVariableRoot(definitionPath, context, nextVisited, catalog);
  return Object.freeze({ kind: 'path', root: expanded.root, steps: Object.freeze([...expanded.steps, ...path.steps]) });
}

function toTraversalRoot(root: ResourceBindingRoot): ResourceTraversalRoot {
  switch (root.kind) {
    case 'model': return root.model.kind === 'missing' ? { kind: 'unresolved', reason: 'model' } : { kind: 'model', model: root.model.model };
    case 'controller_this': return root;
    case 'resource': return root;
    case 'variable': return { kind: 'variable', variable: root.variable };
  }
}
