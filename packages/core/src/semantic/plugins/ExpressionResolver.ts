/**
 * ExpressionResolver.ts
 *
 * Active Consumer Orchestrator for resolving PHP syntax expressions in SemanticResolutionKernel.
 * Coordinates resolution of literals, binary operations, ternaries, and property access chains.
 *
 * @module semantic/plugins
 */

import type { SemanticResolution } from '../../types/domain/semanticResolution';
import { unknownResolution } from '../semanticResolutionSupport';
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
        const scope = context.scope;

        switch (meta.kind) {
            case 'literal':
                return resolveLiteral(meta);

            case 'binary_expression':
                return resolveBinaryExpression(meta, context, scope);

            case 'ternary':
                return resolveTernary(meta, context, scope);

            case 'property_access':
            case 'nullsafe_property_access':
                return resolvePropertyAccess(meta, context);

            default:
                return unknownResolution(
                    'ExpressionResolver',
                    'Unsupported expression kind',
                    meta.kind,
                    'unsupported_syntax',
                );
        }
    }
}
