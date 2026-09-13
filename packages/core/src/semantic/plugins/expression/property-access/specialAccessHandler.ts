/**
 * specialAccessHandler.ts
 *
 * Handles special property access patterns: object fields, JSON members, and Sanctum tokens.
 *
 * @module semantic/plugins/expression/property-access
 */

import type {
    SemanticResolution,
    TraceNode,
    JsonMemberResolution,
    AccessKind
} from '../../../../types/contract';
import type { ResolverMeta } from '../../../types';

interface HasFields {
    fields: Record<string, unknown>;
}

function hasFields(obj: unknown): obj is HasFields {
    return !!(obj && typeof obj === 'object' && 'fields' in obj);
}

interface TypedFieldVal {
    type: string;
    nullable?: boolean;
}

function isTypedFieldVal(val: unknown): val is TypedFieldVal {
    return typeof val === 'object' && val !== null && 'type' in val;
}

export function tryResolveSpecialPropertyAccess(
    prop: string,
    meta: ResolverMeta,
    targetRes: SemanticResolution,
    trace: TraceNode[]
): SemanticResolution | null {
    // 1. Special framework classes / Sanctum / createToken object
    if (targetRes.type === 'object' && hasFields(targetRes) && targetRes.fields[prop]) {
        const fieldVal = targetRes.fields[prop];
        let fieldType = 'unknown';
        let isNullable = false;
        if (isTypedFieldVal(fieldVal)) {
            fieldType = fieldVal.type;
            isNullable = !!fieldVal.nullable;
        } else if (typeof fieldVal === 'string') {
            fieldType = fieldVal;
        }
        trace.push({
            source: 'ExpressionResolver',
            rule: `Field lookup from resolved object type fields.${prop}`,
            input: prop,
            output: fieldType
        });
        return {
            status: 'resolved',
            type: fieldType,
            nullable: isNullable || undefined,
            confidence: targetRes.confidence,
            trace
        };
    }

    // 2. JSON member access: target already resolved to a json-object or json-member
    if (targetRes.type === 'json-object' || targetRes.type === 'json-member') {
        const accessKind: AccessKind = (meta.kind === 'property_access' ? meta.accessKind : undefined)
            || (meta.kind === 'nullsafe_property_access' ? 'optional_access' : 'property_access');

        trace.push({
            source: 'ExpressionResolver',
            rule: `JSON member access (${accessKind})`,
            input: `${targetRes.type}['${prop}']`,
            output: `json-member(${prop})`
        });

        const memberRes: JsonMemberResolution = {
            status: 'resolved',
            type: 'json-member',
            parent: targetRes,
            key: prop,
            accessKind,
            nullable: meta.kind === 'nullsafe_property_access' ? true : targetRes.nullable,
            confidence: targetRes.confidence,
            trace
        };
        return memberRes;
    }

    // 3. Sanctum plainTextToken
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

    return null;
}
