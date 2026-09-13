/**
 * literalHandler.ts
 *
 * Literal, Type Cast, and Binary Operation handlers for CLI ExpressionResolver.
 *
 * @module cli/resolvers/plugins/expression/literalHandler
 */

import { SemanticResolution, TraceNode } from '@routesync/core';
import { ResolutionContext } from '../../types';

export function resolveLiteral(meta: any): SemanticResolution {
    let t = 'string';
    if (meta.type === 'number') {
        t = 'number';
    } else if (meta.type === 'boolean') {
        t = 'boolean';
    }
    return {
        status: 'resolved',
        type: t,
        confidence: 100,
        trace: [{
            source: 'ExpressionResolver',
            rule: 'Literal type mapping',
            input: String(meta.value),
            output: t
        }]
    };
}

export function resolveTypeCast(meta: any, context: ResolutionContext): SemanticResolution {
    const currentModel = context.contextModel;
    let t = 'string';
    if (meta.type === 'number') {
        t = 'number';
    } else if (meta.type === 'boolean') {
        t = 'boolean';
    }
    const trace: TraceNode[] = [{
        source: 'ExpressionResolver',
        rule: `Type cast to ${meta.type}`,
        input: meta.type,
        output: t
    }];
    if (meta.argument) {
        const argRes = context.kernel.resolve(meta.argument, currentModel);
        trace.push(...argRes.trace);
    }
    return {
        status: 'resolved',
        type: t,
        confidence: 100,
        trace
    };
}

export function resolveBinaryOperation(meta: any, context: ResolutionContext): SemanticResolution {
    const currentModel = context.contextModel;
    const leftRes = context.kernel.resolve(meta.left, currentModel);
    const rightRes = context.kernel.resolve(meta.right, currentModel);

    const trace: TraceNode[] = [
        {
            source: 'ExpressionResolver',
            rule: `Binary operation: ${meta.operator}`,
            input: `${leftRes.type} ${meta.operator} ${rightRes.type}`
        },
        ...leftRes.trace,
        ...rightRes.trace
    ];

    let resolvedType = 'number'; // defaults to number for math operators
    if (meta.operator === '.') {
        resolvedType = 'string'; // string concatenation in PHP
    } else if (leftRes.type === 'string' || rightRes.type === 'string') {
        if (meta.operator === '+') {
            resolvedType = 'string';
        }
    }

    return {
        status: 'resolved',
        type: resolvedType,
        confidence: 90,
        trace
    };
}
