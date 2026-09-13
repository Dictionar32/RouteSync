/**
 * ExpressionResolver.ts
 *
 * Active Consumer Orchestrator for resolving PHP syntax expressions in SemanticResolutionKernel.
 * Coordinates resolution of literals, binary operations, ternaries, and property access chains.
 *
 * @module semantic/plugins
 */

import type { SemanticResolution } from '../../types/contract';
import type { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';
import {
    resolveLiteral,
    resolveBinaryExpression,
    resolveTernary,
    resolvePropertyAccess
} from './expression';

// Explicit named re-exports (Rule 14: 0 wildcard re-exports)
export {
    resolveLiteral,
    resolveBinaryExpression,
    resolveTernary,
    resolvePropertyAccess
};

export class ExpressionResolver implements ResolverPlugin {
    canResolve(meta: ResolverMeta): boolean {
        return !!(meta && (
            meta.kind === 'literal' ||
            meta.kind === 'binary_expression' ||
            meta.kind === 'ternary' ||
            meta.kind === 'property_access' ||
            meta.kind === 'nullsafe_property_access'
        ));
    }

    resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
        const currentModel = context.contextModel;

        switch (meta.kind) {
            case 'literal':
                return resolveLiteral(meta);

            case 'binary_expression':
                return resolveBinaryExpression(meta, context, currentModel);

            case 'ternary':
                return resolveTernary(meta, context, currentModel);

            case 'property_access':
            case 'nullsafe_property_access':
                return resolvePropertyAccess(meta, context, currentModel);

            default:
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
}
