/** Resolves instance Eloquent methods from an already verified target. */
import type { SemanticResolution } from '../../../types/domain/semanticResolution';
import { indeterminate } from './instanceMethodSupport';
import type { ResolutionContext, ResolverMeta } from '../../types';
import { resolveVerifiedInstanceMethod } from './instanceMethodResolution';
import { resolveInScope } from '../../kernel/resolveInScope';
import { relationOptionFold, relationRefine } from '../../kernel/relationalSequence';
import { relationAny, relationEqual } from '../../kernel/semanticRelations';

type MethodMeta = Extract<ResolverMeta, { kind: 'method_call' }>;
type MethodTarget = Extract<SemanticResolution, { kind: 'model' | 'query_projection' }>;
const isMethodMeta = (meta: ResolverMeta): meta is MethodMeta => relationEqual(meta.kind, 'method_call');
const isMethodTarget = (value: SemanticResolution): value is MethodTarget => relationAny([relationEqual(value.kind, 'model'), relationEqual(value.kind, 'query_projection')]);

export function resolveInstanceMethodCall(meta: ResolverMeta, context: ResolutionContext, sourceName = 'EloquentMethodResolver'): SemanticResolution {
  return relationOptionFold(
    relationRefine(meta, isMethodMeta),
    () => indeterminate(sourceName, 'Invalid method metadata'),
    value => {
      const methodName = value.name.value;
      const target = resolveInScope(context.kernel, value.target, context.scope);
      return relationOptionFold(
        relationRefine(target, isMethodTarget),
        () => indeterminate(sourceName, 'Method target is not a verified model or query projection'),
        verifiedTarget => resolveVerifiedInstanceMethod(value, verifiedTarget, methodName, sourceName),
      );
    },
  );
}
