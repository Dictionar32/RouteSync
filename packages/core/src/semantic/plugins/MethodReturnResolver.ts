/**
 * MethodReturnResolver.ts
 *
 * Active Consumer: Resolves static and instance method calls via semantic plugins.
 *
 * @module core/semantic/plugins/MethodReturnResolver
 */

import type { SemanticResolution } from '../../types/domain/semanticResolution';
import { unknownResolution } from '../semanticResolutionSupport';
import type { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';
import { resolveStaticMethodCall, resolveInstanceMethodCall } from './method-return';

export class MethodReturnResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    return !!meta && (meta.kind === 'method_call' || meta.kind === 'static_method_call');
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    if (meta.kind === 'static_method_call') {
      return resolveStaticMethodCall(meta, context);
    }

    if (meta.kind === 'method_call') {
      return resolveInstanceMethodCall(meta, context);
    }

    return unknownResolution('MethodReturnResolver', 'Unsupported method metadata', meta.kind, 'unsupported_syntax');
  }
}
