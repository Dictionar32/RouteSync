import type { ResourceExpressionModel } from '../../../../types/domain/resourceExpressionModel';
import type { ResourceBindingDefinitionContext, ResourceBindingRoot, ResourceBindingUnresolvedStep } from '../../../../types/domain/resourceBindingModel';
import type { ResourceTraversalModel, ResourceTraversalRoot, ResourceTraversalStep, ResourceTraversalTarget, ResourceTraversalCardinality } from '../../../../types/domain/resourceTraversalModel';
import { resolveResourceMethodInvocation, type ResourceQueryState, type ResourceMethodResult } from '../../../../types/domain/resourceModelMethodSurface';
import { PrimitiveKind, PrimitiveType } from '../../../types/SemanticType';

type BindingPath = { readonly kind: 'path'; readonly root: ResourceBindingRoot; readonly steps: readonly ResourceBindingUnresolvedStep[] } | { readonly kind: 'unsupported' };

function createTraversal(
  source: ResourceExpressionModel,
  path: BindingPath,
  context: readonly ResourceBindingDefinitionContext[] = [],
): ResourceTraversalModel {
  if (path.kind === 'unsupported') return { resolution: { kind: 'rejected', reason: 'unsupported_expression' } };
  const expanded = expandVariableRoot(path, context, new Set<string>());
  const root = toTraversalRoot(expanded.root);
  const state: ResourceQueryState | undefined = undefined;
  const steps: ResourceTraversalStep[] = [];
  let missing: 'root_model' | 'property' | 'relation' | 'method' | undefined;

  for (const step of expanded.steps) {
    if (step.kind === 'member') {
      const sourceModel = state ? { kind: 'known' as const, model: state.model } : { kind: 'unresolved' as const, reason: 'receiver_model' as const };
      steps.push({ kind: 'property', sourceModel, property: step.property, access: step.access, target: { kind: 'unresolved', reason: 'property' } });
      missing = missing ?? 'property';
      continue;
    }
    const sourceModel = state ? { kind: 'known' as const, model: state.model } : { kind: 'unresolved' as const, reason: 'receiver_model' as const };
    const invocation: import('../../../../types/domain/resourceModelMethodSurface').ResourceMethodInvocation | undefined = state
      ? resolveResourceMethodInvocation(state, step.method, step.arguments)
      : undefined;
    const target: import('../../../../types/domain/resourceModelMethodSurface').ResourceMethodResult = invocation ? invocation.result : { kind: 'unresolved' as const, origin: { kind: 'unresolved' as const, method: step.method, reason: 'receiver_model' as const }, method: step.method };
    const resolvedTarget = traversalTarget(target);
    if (resolvedTarget.kind === 'rejected') {
      missing = missing ?? 'method';
      steps.push({
        kind: 'method',
        sourceModel,
        method: step.method,
        arguments: step.arguments,
        access: step.access,
        target: resolvedTarget.target,
        cardinality: { kind: 'single' },
        result: target
      });
      void target;
      continue;
    }
    const traversalTarget = resolvedTarget.target;
    const cardinality = resolvedTarget.cardinality;
    steps.push({ kind: 'method', sourceModel, method: step.method, arguments: step.arguments, access: step.access, target: traversalTarget, cardinality, result: target });
    if (target.kind === 'query_builder' || target.kind === 'single_model' || target.kind === 'model_collection' || target.kind === 'paginated_collection') {
      void target;
    } else {
      missing = missing ?? 'method';
      void target;
    }
  }

  if (missing) return { resolution: { kind: 'pending', root, steps: Object.freeze(steps), reason: missing } };
  const finalState = state;
  if (!finalState) return { resolution: { kind: 'pending', root, steps: Object.freeze(steps), reason: 'root_model' } };
  const finalTarget = finalState.kind === 'query_builder'
    ? { kind: 'query' as const, model: finalState.model, semanticType: new ReferenceType('', finalState.model.identity.name.value) }
    : { kind: 'model' as const, model: finalState.model, semanticType: new ReferenceType('', finalState.model.identity.name.value) };
  const finalCardinality: ResourceTraversalCardinality = finalState.kind === 'query_builder' ? { kind: 'query' } : { kind: 'single' };
  const value = { target: finalTarget, semanticType: finalTarget.semanticType, cardinality: finalCardinality };
  return { resolution: { kind: 'resolved', root, steps: Object.freeze(steps.map(step => ({ step, sourceModel: step.sourceModel.kind === 'known' ? step.sourceModel.model : root.kind === 'model' ? root.model : root.kind === 'resource' ? root.resource : root.kind === 'variable' ? root.variable : root.model, target: step.target, semanticType: step.target.semanticType, cardinality: step.kind === 'method' ? step.cardinality : step.kind === 'relation' ? step.cardinality : { kind: 'single' } }))), value } };
}


function traversalTarget(result: ResourceMethodResult):
  | { readonly kind: 'resolved'; readonly target: ResourceTraversalTarget; readonly cardinality: ResourceTraversalCardinality }
  | { readonly kind: 'rejected'; readonly target: ResourceTraversalTarget } {
  switch (result.kind) {
    case 'query_builder':
      return { kind: 'resolved', target: { kind: 'query', model: result.model, semanticType: result.semanticType }, cardinality: { kind: 'query' } };
    case 'single_model':
      return { kind: 'resolved', target: { kind: 'model', model: result.model, semanticType: result.semanticType }, cardinality: { kind: 'single' } };
    case 'model_collection':
      return { kind: 'resolved', target: { kind: 'collection', model: result.model, elementType: result.elementType, semanticType: result.semanticType }, cardinality: { kind: 'collection' } };
    case 'paginated_collection':
      return { kind: 'resolved', target: { kind: 'collection', model: result.model, elementType: result.elementType, semanticType: result.semanticType }, cardinality: { kind: 'paginated_collection' } };
    case 'scalar':
      return { kind: 'resolved', target: { kind: 'scalar', semanticType: result.semanticType }, cardinality: { kind: 'single' } };
    case 'value_collection':
      return { kind: 'rejected', target: { kind: 'scalar', semanticType: new PrimitiveType(PrimitiveKind.UNKNOWN) } };
    case 'unsupported':
      return { kind: 'rejected', target: { kind: 'scalar', semanticType: new PrimitiveType(PrimitiveKind.UNKNOWN) } };
    case 'unresolved':
      return { kind: 'rejected', target: { kind: 'scalar', semanticType: new PrimitiveType(PrimitiveKind.UNKNOWN) } };
  }
}

