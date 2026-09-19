import type { ResourceExpressionModel } from '../../../../types/domain/resourceExpressionModel';
import type { ResourceBindingDefinitionContext, ResourceBindingModel, ResourceBindingResolution } from '../../../../types/domain/resourceBindingModel';
import type { ResourceBindingModelCatalog } from '../../../../types/domain/resourceBindingModelReference';
import { buildResourceBindingProvenance } from './resourceBindingProvenanceBuilder';
import { resolveResourceBindingOrigin } from './resourceBindingOriginResolver';
import { createResourceTraversal } from './resourceBindingTraversalBuilder';
import { fromModel } from './resourceBindingPathBuilder';

export type ResourceBindingModelResult =
  | { readonly kind: 'created'; readonly model: ResourceBindingModel }
  | { readonly kind: 'not_bindable'; readonly reason: 'known_expression' | 'unsupported_expression' };

export function createResourceBindingModel(
  source: ResourceExpressionModel,
  context: readonly ResourceBindingDefinitionContext[],
  catalog: ResourceBindingModelCatalog,
): ResourceBindingModelResult {
  const path = fromModel(source, context, catalog);
  if (path.kind === 'unsupported') {
    const reason = source.semantic.kind === 'known' ? 'known_expression' : 'unsupported_expression';
    return Object.freeze({ kind: 'not_bindable', reason });
  }
  const origin = resolveResourceBindingOrigin(source, context);
  const bindingPath = Object.freeze({ root: path.root, steps: path.steps, origin });
  const resolution: ResourceBindingResolution = { kind: 'pending', path: bindingPath };
  const provenance = buildResourceBindingProvenance(source, context);
  const traversal = createResourceTraversal(source, path, context);
  const model = Object.freeze({ source, resolution, provenance, traversal });
  return Object.freeze({ kind: 'created', model });
}
