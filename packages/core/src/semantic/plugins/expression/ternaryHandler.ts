/**
 * ternaryHandler.ts
 *
 * Resolves ternary conditional expressions with nullability propagation and Bound AST construction.
 *
 * @module semantic/plugins/expression/ternaryHandler
 */

import type { SemanticResolution, TraceNode } from '../../../types/contract';
import type { ResolutionContext, ResolverMeta, ModelNode } from '../../types';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';

export function resolveTernary(
    meta: ResolverMeta,
    context: ResolutionContext,
    currentModel?: ModelNode
): SemanticResolution {
    const fallbackRes: SemanticResolution = { status: 'unknown', type: 'unknown', confidence: 0, trace: [] };
    const conditionRes = meta.condition ? context.kernel.resolve(meta.condition, currentModel) : null;
    const truthyRes = meta.truthy ? context.kernel.resolve(meta.truthy, currentModel) : fallbackRes;
    const falsyRes = meta.falsy ? context.kernel.resolve(meta.falsy, currentModel) : fallbackRes;

    const trace: TraceNode[] = [
        {
            source: 'ExpressionResolver',
            rule: 'Ternary expression resolution',
            input: `condition: ${conditionRes?.type || 'unknown'}`
        },
        ...(conditionRes?.trace || []),
        ...(truthyRes.trace || []),
        ...(falsyRes.trace || [])
    ];

    // Determine if one branch resolves to null (PHP: null literal or 'null' type)
    const truthyIsNull = truthyRes.type === 'null' || truthyRes.type === 'unknown';
    const falsyIsNull = falsyRes.type === 'null' || falsyRes.type === 'unknown';

    const conditionNode = conditionRes?.boundAst || BoundSemanticFactory.unknown({
        rawText: typeof meta.condition === 'string' ? meta.condition : 'condition',
        invalidationTags: []
    });
    const truthyNode = truthyRes.boundAst || BoundSemanticFactory.unknown({
        rawText: typeof meta.truthy === 'string' ? meta.truthy : 'truthy',
        invalidationTags: []
    });
    const falsyNode = falsyRes.boundAst || BoundSemanticFactory.unknown({
        rawText: typeof meta.falsy === 'string' ? meta.falsy : 'falsy',
        invalidationTags: []
    });

    if (truthyRes.status === 'resolved' && !truthyIsNull) {
        const isNullable = falsyIsNull ? true : (truthyRes.nullable ?? false);
        const boundAst = BoundSemanticFactory.ternary({
            condition: conditionNode,
            truthy: truthyNode,
            falsy: falsyNode,
            resultingType: truthyRes.type,
            nullable: isNullable
        });
        return {
            ...truthyRes,
            nullable: isNullable,
            boundAst,
            trace: [...trace, ...(truthyRes.trace || [])]
        };
    }
    if (falsyRes.status === 'resolved' && !falsyIsNull) {
        const isNullable = truthyIsNull ? true : (falsyRes.nullable ?? false);
        const boundAst = BoundSemanticFactory.ternary({
            condition: conditionNode,
            truthy: truthyNode,
            falsy: falsyNode,
            resultingType: falsyRes.type,
            nullable: isNullable
        });
        return {
            ...falsyRes,
            nullable: isNullable,
            boundAst,
            trace: [...trace, ...(falsyRes.trace || [])]
        };
    }

    return {
        status: 'unknown',
        type: 'unknown',
        confidence: 0,
        trace
    };
}
