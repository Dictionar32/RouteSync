import type { SemanticResolution, SemanticTraceNode } from '../../../../types/domain/semanticResolution';
import type { ResolutionContext, ResolverMeta, ModelNode } from '../../../types';
import { BoundSemanticFactory } from '../../../../types/domain/boundAst';
import { SemanticResolutionFactory } from '../../../../types/domain/semanticResolutionFactory';

export type ResolvedTargetModelResult =
  | { readonly kind: 'resolved'; readonly targetModel: ModelNode }
  | { readonly kind: 'error'; readonly resolution: SemanticResolution };

export function resolveTargetModelForPropertyAccess(
  _meta: ResolverMeta,
  context: ResolutionContext,
  targetRes: SemanticResolution,
  trace: readonly SemanticTraceNode[],
): ResolvedTargetModelResult {
  if (targetRes.kind !== 'model') return error('Property target does not resolve to a model', trace);
  const symbol = context.symbolTable.get(targetRes.model.value);
  if (symbol !== undefined) return { kind: 'resolved', targetModel: symbol.node };
  return error(`Property access target model not found: ${targetRes.model.value}`, trace);
}

function error(rule: string, trace: readonly SemanticTraceNode[]): ResolvedTargetModelResult {
  return {
    kind: 'error',
    resolution: SemanticResolutionFactory.unknown({
      status: 'unknown',
      confidence: 0,
      trace: [...trace, { source: 'TargetModelResolver', rule, input: 'property_access', output: 'unknown' }],
      boundAst: BoundSemanticFactory.unsupported('unresolved_symbol'),
    }),
  };
}
