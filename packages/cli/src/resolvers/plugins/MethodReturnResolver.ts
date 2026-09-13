/**
 * MethodReturnResolver.ts
 *
 * Active Consumer: Resolves return types from method calls and resolved methods.
 *
 * @module cli/resolvers/plugins/MethodReturnResolver
 */

import type { SemanticResolution } from '@routesync/core';
import type { ResolverPlugin, ResolutionContext } from '../types';
import { resolveResolvedMethod, resolveMethodCall } from './method-return';

export class MethodReturnResolver implements ResolverPlugin {
  canResolve(meta: any): boolean {
    return meta && (meta.kind === 'resolved_method' || meta.kind === 'method_call');
  }

  resolve(meta: any, context: ResolutionContext): SemanticResolution {
    if (meta.kind === 'resolved_method') {
      return resolveResolvedMethod(meta, context);
    }

    if (meta.kind === 'method_call') {
      return resolveMethodCall(meta, context);
    }

    return {
      status: 'unknown',
      type: 'unknown',
      confidence: 0,
      trace: [{
        source: 'MethodReturnResolver',
        rule: 'Unsupported method kind'
      }]
    };
  }
}
