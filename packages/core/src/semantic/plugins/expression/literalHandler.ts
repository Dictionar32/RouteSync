/**
 * literalHandler.ts
 *
 * Resolves literal expressions (number, boolean, null, string).
 *
 * @module semantic/plugins/expression/literalHandler
 */

import type { SemanticResolution } from '../../../types/contract';
import type { SemanticType } from '../../../types/semantic';
import type { ResolverMeta } from '../../types';

export function resolveLiteral(meta: ResolverMeta): SemanticResolution {
    const v = meta.value;
    const t: SemanticType = typeof v === 'number'
        ? 'number'
        : typeof v === 'boolean'
            ? 'boolean'
            : v === null
                ? 'unknown'
                : 'string';

    return {
        status: v === null ? 'unknown' : 'resolved',
        type: t,
        nullable: v === null ? true : undefined,
        confidence: 100,
        trace: [{
            source: 'ExpressionResolver',
            rule: 'Literal type mapping',
            input: String(v),
            output: t
        }]
    };
}
