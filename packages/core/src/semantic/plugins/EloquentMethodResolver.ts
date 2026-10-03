/** Eloquent method resolver: strict semantic boundary for method results. */
import type { SemanticResolution } from '../../types/domain/semanticResolution';
import type { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';
import { BoundSemanticFactory } from '../../types/domain/boundAst';
import { SemanticResolutionFactory } from '../../types/domain/semanticResolutionFactory';
import { resolveStaticMethodCall, resolveInstanceMethodCall } from './method-return';
import { dispatchValue } from '../authority/declarativeDispatch';
import { relationAny, relationEqual } from '../kernel/semanticRelations';

const canResolve = (meta: ResolverMeta): boolean => relationAny([relationEqual(meta.kind, 'method_call'), relationEqual(meta.kind, 'static_method_call')]);

const resolve = (meta: ResolverMeta, context: ResolutionContext): SemanticResolution => {
    const fallback = () => SemanticResolutionFactory.indeterminate({
      status: 'indeterminate', confidence: 0,
      trace: [],
      boundAst: BoundSemanticFactory.unsupported('unsupported_syntax'),
    });
    const handlers: Readonly<Record<string, () => SemanticResolution>> = Object.freeze({
      static_method_call: () => resolveStaticMethodCall(meta, context, 'EloquentMethodResolver'),
      method_call: () => resolveInstanceMethodCall(meta, context, 'EloquentMethodResolver'),
    });
    return dispatchValue(handlers, meta.kind, fallback)();
};

export const EloquentMethodResolver: ResolverPlugin = Object.freeze({ canResolve, resolve });
