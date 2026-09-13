/**
 * variableHandler.ts
 *
 * Variable and 'this' scope resolution for CLI ExpressionResolver.
 *
 * @module cli/resolvers/plugins/expression/variableHandler
 */

import { SemanticResolution } from '@routesync/core';
import { ResolutionContext } from '../../types';

export function resolveVariable(meta: any, context: ResolutionContext): SemanticResolution {
    const currentModel = context.contextModel;

    if (meta.name === 'this') {
        let modelName = '';
        if (currentModel) {
            if (currentModel.name) {
                modelName = currentModel.name;
            } else if (currentModel.layer === 'resource') {
                modelName = currentModel.fileName?.replace(/Resource$/, '') || '';
            } else if (currentModel.layer === 'model') {
                modelName = currentModel.fileName || '';
            }
        }
        if (modelName) {
            return {
                status: 'resolved',
                type: 'model',
                model: modelName,
                confidence: 100,
                trace: [{
                    source: 'ExpressionResolver',
                    rule: 'this variable contexts model mapping',
                    input: 'this',
                    output: `model: ${modelName}`
                }]
            };
        }
    }

    // Check resolvedAssignments
    if (currentModel && currentModel.resolvedAssignments && currentModel.resolvedAssignments[meta.name]) {
        const resolvedVar = currentModel.resolvedAssignments[meta.name];
        return {
            ...resolvedVar,
            trace: [
                {
                    source: 'ExpressionResolver',
                    rule: `Variable lookup from resolved assignments`,
                    input: meta.name,
                    output: `${resolvedVar.type} (${resolvedVar.model || resolvedVar.resource || ''})`
                },
                ...resolvedVar.trace
            ]
        };
    }

    // Check raw assignments
    if (currentModel && currentModel.assignments && currentModel.assignments[meta.name]) {
        const assignedExpr = currentModel.assignments[meta.name];
        const nodeId = `var:${context.fileName || 'global'}:${meta.name}`;
        if (!context.cycleDetector.enter(nodeId)) {
            return {
                status: 'unknown',
                type: 'unknown',
                confidence: 0,
                trace: [{
                    source: 'ExpressionResolver',
                    rule: `Cycle detected at variable ${nodeId}`,
                    input: meta.name,
                    output: 'unknown'
                }]
            };
        }
        const res = context.kernel.resolve(assignedExpr, currentModel);
        context.cycleDetector.leave(nodeId);
        return {
            ...res,
            trace: [
                {
                    source: 'ExpressionResolver',
                    rule: `Variable lookup from raw assignments`,
                    input: meta.name,
                    output: `${res.type} (${res.model || res.resource || ''})`
                },
                ...res.trace
            ]
        };
    }

    return {
        status: 'unknown',
        type: 'unknown',
        confidence: 0,
        trace: [{
            source: 'ExpressionResolver',
            rule: 'Unknown variable',
            input: meta.name
        }]
    };
}
