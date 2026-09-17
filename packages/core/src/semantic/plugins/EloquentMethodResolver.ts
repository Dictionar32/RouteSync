/** Eloquent method resolver: strict semantic boundary for method results. */
import type { SemanticResolution } from '../../types/domain/semanticResolution';
import type { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';
import { BoundSemanticFactory } from '../../types/domain/boundAst';
import { SemanticResolutionFactory } from '../../types/domain/semanticResolutionFactory';
import { resolveStaticMethodCall, resolveInstanceMethodCall } from './method-return';

export class EloquentMethodResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    return meta.kind === 'method_call' || meta.kind === 'static_method_call';
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    switch (meta.kind) {
      case 'static_method_call':
        return resolveStaticMethodCall(meta, context, 'EloquentMethodResolver');
      case 'method_call':
        return resolveInstanceMethodCall(meta, context, 'EloquentMethodResolver');
      default:
        return SemanticResolutionFactory.unknown({
          status: 'unknown', confidence: 0,
          trace: [],
          boundAst: BoundSemanticFactory.unsupported('unsupported_syntax'),
        });
    }
  }
}
