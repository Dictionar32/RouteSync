/**
 * binaryHandler.ts
 *
 * Resolves binary expressions (??, ., +, and arithmetic operators) with Bound AST construction.
 *
 * @module semantic/plugins/expression/binaryHandler
 */

import type { SemanticResolution, TraceNode } from '../../../types/contract';
import type { SemanticType } from '../../../types/semantic';
import type { ResolutionContext, ResolverMeta, ModelNode } from '../../types';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';

export function resolveBinaryExpression(
    meta: ResolverMeta,
    context: ResolutionContext,
    currentModel?: ModelNode
): SemanticResolution {
    const leftRes = meta.left
        ? context.kernel.resolve(meta.left, currentModel)
        : { status: 'unknown' as const, type: 'unknown', confidence: 0, trace: [] };
    const rightRes = meta.right
        ? context.kernel.resolve(meta.right, currentModel)
        : { status: 'unknown' as const, type: 'unknown', confidence: 0, trace: [] };

    const trace: TraceNode[] = [
        {
            source: 'ExpressionResolver',
            rule: `Binary operation: ${meta.operator || ''}`,
            input: `${leftRes.type} ${meta.operator || ''} ${rightRes.type}`
        },
        ...(leftRes.trace || []),
        ...(rightRes.trace || [])
    ];

    if (meta.operator === '??') {
        const rightIsNullish = meta.right?.kind === 'literal' && meta.right.value === null;
        const leftNode = leftRes.boundAst ? leftRes.boundAst : BoundSemanticFactory.primitive(leftRes.type);
        const rightNode = rightRes.boundAst ? rightRes.boundAst : BoundSemanticFactory.primitive(rightRes.type);
        const boundAst = BoundSemanticFactory.binary({
            operator: meta.operator || '??',
            left: leftNode,
            right: rightNode,
            resultingType: leftRes.type !== 'unknown' ? leftRes.type : rightRes.type,
            nullable: rightIsNullish || (leftRes.nullable ?? false)
        });

        if (leftRes.status === 'resolved' && leftRes.type !== 'unknown') {
            if (rightIsNullish) {
                return { ...leftRes, nullable: true, boundAst, trace };
            }
            return { ...leftRes, boundAst, trace };
        }
        if (rightRes.status === 'resolved' && rightRes.type !== 'unknown') {
            return { ...rightRes, boundAst, trace };
        }
        return {
            status: 'unknown',
            type: 'unknown',
            confidence: 0,
            boundAst,
            trace
        };
    }

    let resolvedType: SemanticType = 'number'; // defaults to number for math operators
    if (meta.operator === '.') {
        resolvedType = 'string'; // string concatenation in PHP
    } else if (leftRes.type === 'string' || rightRes.type === 'string') {
        if (meta.operator === '+') {
            resolvedType = 'string';
        }
    }

    const leftNode = leftRes.boundAst ? leftRes.boundAst : BoundSemanticFactory.primitive(leftRes.type);
    const rightNode = rightRes.boundAst ? rightRes.boundAst : BoundSemanticFactory.primitive(rightRes.type);
    const boundAst = BoundSemanticFactory.binary({
        operator: meta.operator || '+',
        left: leftNode,
        right: rightNode,
        resultingType: resolvedType,
        nullable: false
    });

    return {
        status: 'resolved',
        type: resolvedType,
        confidence: Math.max(leftRes.confidence || 90, rightRes.confidence || 90),
        boundAst,
        trace
    };
}
