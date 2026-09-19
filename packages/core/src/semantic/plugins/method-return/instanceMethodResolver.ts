/** Resolves instance Eloquent methods from an already verified target. */
import type { SemanticResolution } from '../../../types/domain/semanticResolution';
import { unknown } from './instanceMethodSupport';
import type { ResolutionContext, ResolverMeta } from '../../types';
import { resolveSelectRawProjection } from './selectRawProjection';
import { resolveVerifiedInstanceMethod } from './instanceMethodResolution';
import { resolveInScope } from '../../kernel/resolveInScope';


export function resolveInstanceMethodCall(meta: ResolverMeta, context: ResolutionContext, sourceName = 'EloquentMethodResolver'): SemanticResolution {
  if (meta.kind !== 'method_call') return unknown(sourceName, 'Invalid method metadata');

  const methodName = meta.name.value;
  const target = resolveInScope(context.kernel, meta.target, context.scope);
  if (target.kind !== 'model' && target.kind !== 'query_projection') {
    return unknown(sourceName, 'Method target is not a verified model or query projection');
  }

  return resolveVerifiedInstanceMethod(meta, target, methodName, sourceName);

}

