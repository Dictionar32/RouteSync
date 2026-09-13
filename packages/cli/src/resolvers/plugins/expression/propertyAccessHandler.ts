/**
 * propertyAccessHandler.ts
 *
 * Property and Nullsafe Property Access resolution for CLI ExpressionResolver.
 *
 * @module cli/resolvers/plugins/expression/propertyAccessHandler
 */

import { SemanticResolution, TraceNode, JsonMemberResolution } from '@routesync/core';
import { ResolutionContext } from '../../types';

export function resolvePropertyAccess(meta: any, context: ResolutionContext): SemanticResolution {
    const currentModel = context.contextModel;
    const prop = meta.property;
    let targetModel = currentModel;
    const trace: TraceNode[] = [];

    if (meta.target) {
        const targetRes = context.kernel.resolve(meta.target, currentModel);
        trace.push(...targetRes.trace);

        if (targetRes.status === 'resolved' && targetRes.type !== 'unknown') {
            // Special framework classes: JSON member access
            if (targetRes.type === 'json-object' || targetRes.type === 'json-member') {
                const accessKind = meta.accessKind || (meta.kind === 'nullsafe_property_access' ? 'optional_access' : 'property_access');
                trace.push({
                    source: 'ExpressionResolver',
                    rule: `JSON member access (${accessKind})`,
                    input: `${targetRes.type}['${prop}']`,
                    output: `json-member(${prop})`
                });
                return {
                    status: 'resolved',
                    type: 'json-member',
                    parent: targetRes,
                    key: prop,
                    accessKind,
                    nullable: meta.kind === 'nullsafe_property_access' ? true : targetRes.nullable,
                    confidence: targetRes.confidence,
                    trace
                } as JsonMemberResolution;
            }

            if (targetRes.type === 'NewAccessToken' && prop === 'plainTextToken') {
                trace.push({
                    source: 'ExpressionResolver',
                    rule: 'Sanctum token string property access',
                    input: 'plainTextToken',
                    output: 'string'
                });
                return {
                    status: 'resolved',
                    type: 'string',
                    confidence: 90,
                    trace
                };
            }

            const targetType = targetRes.type;
            const targetModelName = targetRes.type === 'model' && targetRes.model ? targetRes.model : targetType;
            const typeLower = targetModelName?.toLowerCase();
            const tm = targetModelName && typeLower ? context.models.find((m: any) => m.name === targetModelName || m.name.toLowerCase() === typeLower) : undefined;
            if (tm) {
                targetModel = tm;
            } else {
                return {
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
                };
            }
        } else if (meta.target.kind === 'model') {
            const tm = context.models.find((m: any) => m.name === meta.target.model);
            if (tm) {
                targetModel = tm;
            }
        } else if (meta.target.kind === 'relation') {
            const relName = meta.target.name;
            const rel = currentModel.relations?.[relName];
            if (rel && rel.model) {
                const tm = context.models.find((m: any) => m.name === rel.model);
                if (tm) {
                    targetModel = tm;
                    trace.push({
                        source: 'ExpressionResolver',
                        rule: `Relation target model lookup`,
                        input: `${currentModel.name || ''}.${relName}`,
                        output: tm.name
                    });
                } else {
                    return {
                        status: 'unknown',
                        type: 'unknown',
                        confidence: 0,
                        trace: [
                            { source: 'ExpressionResolver', rule: `Target model ${rel.model} not found for relation ${relName}` },
                            ...trace
                        ]
                    };
                }
            } else {
                return {
                    status: 'unknown',
                    type: 'unknown',
                    confidence: 0,
                    trace: [
                        { source: 'ExpressionResolver', rule: `Relation ${relName} not found on current model` },
                        ...trace
                    ]
                };
            }
        } else {
            return {
                status: 'unknown',
                type: 'unknown',
                confidence: 0,
                trace: [
                    { source: 'ExpressionResolver', rule: `Cannot resolve target of property access: ${meta.target.kind}` },
                    ...trace
                ]
            };
        }
    }

    const innerMeta = { kind: 'model_column', model: targetModel?.name || currentModel?.name, column: prop };
    const innerRes = context.kernel.resolve(innerMeta, targetModel || currentModel);
    trace.push(...innerRes.trace);
    return {
        status: innerRes.status,
        type: innerRes.type,
        model: innerRes.model,
        resource: innerRes.resource,
        collection: innerRes.collection,
        paginated: innerRes.paginated,
        nullable: innerRes.nullable,
        confidence: innerRes.confidence,
        trace
    };
}
