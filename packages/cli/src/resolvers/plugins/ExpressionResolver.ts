/**
 * ExpressionResolver.ts
 *
 * Active Consumer Orchestrator for CLI Expression Resolution.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`), explicit named exports only.
 *
 * @module cli/resolvers/plugins/ExpressionResolver
 */

import { SemanticResolution } from '@routesync/core';
import { ResolverPlugin, ResolutionContext } from '../types';
import {
    resolveVariable,
    resolveLiteral,
    resolveTypeCast,
    resolveBinaryOperation,
    resolvePropertyAccess
} from './expression';

export {
    resolveVariable,
    resolveLiteral,
    resolveTypeCast,
    resolveBinaryOperation,
    resolvePropertyAccess
};

export class ExpressionResolver implements ResolverPlugin {
  canResolve(meta: any): boolean {
    return meta && (
      meta.kind === 'literal' ||
      meta.kind === 'type_cast' ||
      meta.kind === 'property_access' ||
      meta.kind === 'binary_operation' ||
      meta.kind === 'variable'
    );
  }

  resolve(meta: any, context: ResolutionContext): SemanticResolution {
    if (meta.kind === 'variable') {
      return resolveVariable(meta, context);
    }

    if (meta.kind === 'literal') {
      return resolveLiteral(meta);
    }

    if (meta.kind === 'binary_operation') {
      return resolveBinaryOperation(meta, context);
    }

    if (meta.kind === 'type_cast') {
      return resolveTypeCast(meta, context);
    }

    if (meta.kind === 'property_access') {
      return resolvePropertyAccess(meta, context);
    }

    return {
      status: 'unknown',
      type: 'unknown',
      confidence: 0,
      trace: [{
        source: 'ExpressionResolver',
        rule: 'Unsupported expression kind',
        input: meta.kind
      }]
    };
  }
}
