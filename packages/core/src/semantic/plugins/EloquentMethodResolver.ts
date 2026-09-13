/**
 * EloquentMethodResolver.ts
 *
 * Active Consumer: Resolves static and instance Eloquent method return types.
 *
 * @module core/semantic/plugins/EloquentMethodResolver
 */

import type { SemanticResolution } from '../../types/contract';
import type { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';
import {
  resolveStaticMethodCall,
  resolveInstanceMethodCall
} from './method-return';

export class EloquentMethodResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    return !!meta && (meta.kind === 'method_call' || meta.kind === 'static_method_call');
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    if (meta.kind === 'static_method_call') {
      return resolveStaticMethodCall(meta, context, 'EloquentMethodResolver');
    }

    if (meta.kind === 'method_call') {
      return resolveInstanceMethodCall(meta, context, 'EloquentMethodResolver');
    }

    return { status: 'unknown', type: 'unknown', confidence: 0, trace: [] };
  }
}
