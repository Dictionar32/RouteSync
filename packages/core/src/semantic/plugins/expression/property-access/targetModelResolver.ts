/**
 * targetModelResolver.ts
 *
 * Target model resolution logic for property access.
 *
 * @module semantic/plugins/expression/property-access
 */

import type { SemanticResolution, TraceNode } from '../../../../types/contract';
import type { ResolutionContext, ResolverMeta, ModelNode } from '../../../types';

export function isModelNode(obj: unknown): obj is ModelNode {
    return typeof obj === 'object' && obj !== null && 'name' in obj;
}

export interface ResolvedTargetModelResult {
    readonly targetModel?: ModelNode;
    readonly errorResolution?: SemanticResolution;
}

export function resolveTargetModelForPropertyAccess(
    meta: ResolverMeta,
    context: ResolutionContext,
    targetRes: SemanticResolution,
    trace: TraceNode[]
): ResolvedTargetModelResult {
    if (targetRes.status === 'resolved' && targetRes.type !== 'unknown') {
        const targetType = targetRes.type;
        const targetModelName = targetRes.type === 'model' && targetRes.model ? targetRes.model : targetType;
        const typeLower = targetModelName?.toLowerCase();
        const tm = (targetModelName ? context.symbolTable.get(targetModelName) : undefined)
            || (typeLower ? context.symbolTable.getCaseInsensitive(typeLower) : undefined);
        if (tm) {
            return { targetModel: tm.node };
        } else {
            return {
                errorResolution: {
                    status: 'unknown',
                    type: 'unknown',
                    confidence: 0,
                    trace: [
                        {
                            source: 'ExpressionResolver',
                            rule: `Property access target model not found`,
                            input: targetModelName,
                            output: 'unknown'
                        },
                        ...trace
                    ]
                }
            };
        }
    } else if (meta.target && meta.target.kind === 'model') {
        const targetModelName = meta.target.model || '';
        const tm = context.symbolTable.get(targetModelName);
        if (tm) {
            return { targetModel: tm.node };
        }
        return {};
    } else {
        return {
            errorResolution: {
                status: 'unknown',
                type: 'unknown',
                confidence: 0,
                trace: [
                    { source: 'ExpressionResolver', rule: `Cannot resolve target of property access: ${meta.target?.kind}` },
                    ...trace
                ]
            }
        };
    }
}
