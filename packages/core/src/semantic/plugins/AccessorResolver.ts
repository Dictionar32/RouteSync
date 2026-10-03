import type { SemanticResolution, SemanticTraceNode } from '../../types/domain/semanticResolution';
import { indeterminateResolution, resolutionLabel } from '../semanticResolutionSupport';
import type { ResolverPlugin, ResolutionContext, ResolverMeta, ModelNode } from '../types';
import type { ModelSemanticAccessor } from '../../types/upstream/model';
import { modelScope } from '../resolutionScope';
import { resolveInScope } from '../kernel/resolveInScope';
import { matchLookup } from '../../types/upstream/collections';
import { relationEqual, relationResolve } from '../kernel/semanticRelations';
import { relationOptionFold, relationRefine } from '../kernel/relationalSequence';

type AccessorMeta = Extract<ResolverMeta, { kind: 'model_accessor' }>;
type ExpressionComputation = Extract<ModelSemanticAccessor['computation'], { kind: 'expression' }>;
const isAccessorMeta = (meta: ResolverMeta): meta is AccessorMeta => relationEqual(meta.kind, 'model_accessor');
const isExpressionComputation = (computation: ModelSemanticAccessor['computation']): computation is ExpressionComputation => relationEqual(computation.kind, 'expression');

const resolveAccessor = (acc: ModelSemanticAccessor, currentModel: ModelNode, context: ResolutionContext): SemanticResolution =>
  relationOptionFold(
    relationRefine(acc.computation, isExpressionComputation),
    () => indeterminateResolution('AccessorResolver', 'Accessor computation is rejected or has no return expression', currentModel.name, 'unsupported_syntax'),
    computation => resolveInScope(context.kernel, computation.expression, modelScope(currentModel)),
  );

const resolveWithCycle = (acc: ModelSemanticAccessor, currentModel: ModelNode, context: ResolutionContext): SemanticResolution => {
  const nodeId = `${currentModel.definition.identity.name.value}.${acc.property.value}`;
  return relationResolve(
    context.cycleDetector.enter(nodeId),
    () => {
      const resolved = resolveAccessor(acc, currentModel, context);
      context.cycleDetector.leave(nodeId);
      const trace: SemanticTraceNode[] = [{
        source: 'AccessorResolver',
        rule: `Accessor lookup: ${currentModel.definition.identity.name.value}.${acc.property.value}`,
        input: acc.property.value,
        output: resolutionLabel(resolved),
      }, ...resolved.trace];
      return { ...resolved, trace };
    },
    () => indeterminateResolution('AccessorResolver', `Cycle detected at accessor ${nodeId}`, nodeId, 'invalid_boundary_input'),
  );
};

export const AccessorResolver: ResolverPlugin = Object.freeze({
  canResolve: (meta: ResolverMeta): boolean => relationOptionFold(
    relationRefine(meta, isAccessorMeta),
    () => false,
    () => true,
  ),
  resolve: (meta: ResolverMeta, context: ResolutionContext): SemanticResolution => relationOptionFold(
    relationRefine(meta, isAccessorMeta),
    () => indeterminateResolution('AccessorResolver', 'Unsupported accessor metadata', 'model_accessor', 'invalid_boundary_input'),
    value => matchLookup(context.symbolTable.lookup(value.model), {
      missing: () => indeterminateResolution('AccessorResolver', `Model ${value.model} not found in manifest`, value.model, 'unresolved_symbol'),
      found: symbol => matchLookup(symbol.accessor(value.column), {
        missing: () => indeterminateResolution('AccessorResolver', `Accessor ${value.column} not found on model ${symbol.name}`, value.column, 'unresolved_property'),
        found: accessor => resolveWithCycle(accessor, symbol.node, context),
      }),
    }),
  ),
});
