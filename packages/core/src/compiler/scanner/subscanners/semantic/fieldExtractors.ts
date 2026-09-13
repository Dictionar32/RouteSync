/**
 * fieldExtractors.ts
 *
 * Pure fail-fast field extractors for resource field nullability, types, and expressions.
 *
 * @module core/compiler/scanner/subscanners/semantic
 */

import {
    type ParsedResource,
    type ResourceFieldDescriptor,
    ResourceFieldExpressionFactory
} from '../../../../types/route';
import { toCamelCase } from '../../../../utils/resource-naming';
import { ScannedResourceFieldDescriptor } from '../../descriptors/resourceDescriptors';
import { resolvePrimitiveKind } from '../typeDeriverUtils';
import type { ResourceFieldExpression } from '../../../../types/domain/expressions';

export function extractFieldNullability(val: unknown): boolean {
    if (!val || typeof val !== 'object') {
        return false;
    }
    const record = val as Record<string, unknown>;
    if (record.nullable === true) {
        return true;
    }
    const expr = record.expression;
    if (expr && typeof expr === 'object' && (expr as Record<string, unknown>).nullable === true) {
        return true;
    }
    const resolved = record.resolved;
    if (resolved && typeof resolved === 'object') {
        const resObj = resolved as Record<string, unknown>;
        if (resObj.nullable === true) {
            return true;
        }
        if (typeof resObj.type === 'string' && resObj.type.toLowerCase().includes('null')) {
            return true;
        }
    }
    return false;
}

export function extractFieldTypeString(val: unknown): string {
    if (!val || typeof val !== 'object') {
        return '';
    }
    const record = val as Record<string, unknown>;
    const resolved = record.resolved;
    if (resolved && typeof resolved === 'object') {
        const rType = (resolved as Record<string, unknown>).type;
        if (typeof rType === 'string' && rType.length > 0) {
            return rType;
        }
    }
    const expr = record.expression;
    if (expr && typeof expr === 'object') {
        const exprObj = expr as Record<string, unknown>;
        const exprResolved = exprObj.resolved;
        if (exprResolved && typeof exprResolved === 'object') {
            const erType = (exprResolved as Record<string, unknown>).type;
            if (typeof erType === 'string' && erType.length > 0) {
                return erType;
            }
        }
        if (typeof exprObj.type === 'string' && exprObj.type.length > 0) {
            return exprObj.type;
        }
    }
    if (typeof record.type === 'string') {
        return record.type;
    }
    return '';
}

export function extractFieldExpression(val: unknown): ResourceFieldExpression {
    if (val && typeof val === 'object') {
        const record = val as Record<string, unknown>;
        if (record.expression && typeof record.expression === 'object') {
            return record.expression as ResourceFieldExpression;
        }
        if (typeof record.kind === 'string') {
            return record as unknown as ResourceFieldExpression;
        }
        if (typeof record.type === 'string') {
            return ResourceFieldExpressionFactory.primitive(record.type);
        }
    }
    return ResourceFieldExpressionFactory.primitive('string');
}

export function extractCollectionTargetResource(fKind: Record<string, unknown>): string {
    const resolved = fKind.resolved;
    if (resolved && typeof resolved === 'object') {
        const res = (resolved as Record<string, unknown>).resource;
        if (typeof res === 'string' && res.length > 0) {
            return res;
        }
    }
    const res = fKind.resource;
    if (typeof res === 'string' && res.length > 0) {
        return res;
    }
    return '';
}

export function normalizeResourceFields(res: ParsedResource): readonly ResourceFieldDescriptor[] {
    const rawFields = res.fields as unknown;
    if (Array.isArray(rawFields)) {
        return rawFields as readonly ResourceFieldDescriptor[];
    }
    if (rawFields && typeof rawFields === 'object') {
        const entries = Object.entries(rawFields as Record<string, unknown>);
        return entries.map(([name, val]: [string, unknown]) => {
            const isNull = extractFieldNullability(val);
            const expr = extractFieldExpression(val);
            const resolvedType = extractFieldTypeString(val);
            const semType = resolvePrimitiveKind(resolvedType);

            return ScannedResourceFieldDescriptor.create({
                name,
                propertyName: toCamelCase(name),
                expression: expr,
                semanticType: semType,
                nullable: isNull
            });
        });
    }
    return [];
}
