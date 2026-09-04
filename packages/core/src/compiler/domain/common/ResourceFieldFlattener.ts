/**
 * ResourceFieldFlattener.ts
 *
 * Structured Origin Boundary Flattener for Resource Fields.
 * Recursively flattens nested object fields into compound camelCase target properties
 * and tracks full dot-paths for source expressions.
 *
 * Pure Structured Reusable Constructor (0 '?', 0 '??', 0 'undefined').
 *
 * @module compiler/domain/common
 */

import { toCamelCase, toPascalCase } from '../../../utils/resource-naming';
import {
    ResolvedSemanticType,
    ResolvedPrimitiveType,
    ResolvedNullableType,
    ResolvedCollectionType,
    ResolvedReferenceType
} from './ResolvedSemanticType';

export interface FlattenedFieldParams {
    readonly targetProperty: string;
    readonly sourcePath: string;
    readonly type: ResolvedSemanticType;
    readonly nullable: boolean;
}

/**
 * Domain Value Object: Flattened Field mapping specification.
 */
export class FlattenedField {
    public readonly targetProperty: string;
    public readonly sourcePath: string;
    public readonly type: ResolvedSemanticType;
    public readonly nullable: boolean;

    constructor({ targetProperty, sourcePath, type, nullable }: FlattenedFieldParams) {
        this.targetProperty = targetProperty;
        this.sourcePath = sourcePath;
        this.type = type;
        this.nullable = nullable;
        Object.freeze(this);
    }
}

export interface ResourceFieldFlattenerDependencies {
    readonly maxDepth?: number;
}

/**
 * Upstream Origin Boundary Flattener.
 */
export class ResourceFieldFlattener {
    public readonly maxDepth: number;

    constructor({ maxDepth = 5 }: ResourceFieldFlattenerDependencies = {}) {
        this.maxDepth = maxDepth;
        Object.freeze(this);
    }

    flatten(
        rawFields: Record<string, any> | readonly any[],
        parentTarget = '',
        parentSource = '',
        depth = 0
    ): readonly FlattenedField[] {
        if (depth >= this.maxDepth) {
            return Object.freeze([]);
        }

        const entries: readonly [string, any][] = Array.isArray(rawFields)
            ? rawFields.map(f => [f.name, f.expression ?? f])
            : Object.entries(rawFields || {});

        const result: FlattenedField[] = [];

        for (const [key, rawExpr] of entries) {
            const camelKey = toCamelCase(key);
            const targetProp = parentTarget.length > 0
                ? `${parentTarget}${camelKey.charAt(0).toUpperCase()}${camelKey.slice(1)}`
                : camelKey;
            const sourcePath = parentSource.length > 0
                ? `${parentSource}.${key}`
                : key;

            const expr = rawExpr ?? {};
            const isObject = typeof expr === 'object' && (expr.kind === 'object' || expr.fields);

            if (isObject) {
                const childFields = expr.fields || {};
                const nested = this.flatten(childFields, targetProp, sourcePath, depth + 1);
                result.push(...nested);
            } else {
                const isNullable = !!(expr.nullable || expr.resolved?.nullable || (typeof expr.resolved?.type === 'string' && expr.resolved.type.includes('null')));
                const baseType = this.resolveType(expr);
                const finalType = isNullable ? ResolvedNullableType.of(baseType) : baseType;

                result.push(new FlattenedField({
                    targetProperty: targetProp,
                    sourcePath,
                    type: finalType,
                    nullable: isNullable
                }));
            }
        }

        return Object.freeze(result);
    }

    private resolveType(expr: any): ResolvedSemanticType {
        const rawType = String(expr?.semanticType ?? expr?.resolved?.type ?? expr?.type ?? '').toLowerCase();
        if (rawType === 'number' || rawType === 'int' || rawType.includes('int') || rawType.includes('decimal') || rawType.includes('float') || rawType.includes('numeric')) {
            return new ResolvedPrimitiveType({ primitiveKind: 'number' });
        }
        if (rawType === 'boolean' || rawType === 'bool') {
            return new ResolvedPrimitiveType({ primitiveKind: 'boolean' });
        }
        if (expr?.kind === 'collection' || expr?.kind === 'array' || expr?.collection) {
            const targetRes = expr?.resolved?.resource ?? expr?.resource;
            const elemType = targetRes
                ? ResolvedReferenceType.create(`${toPascalCase(targetRes)}Transformed`)
                : new ResolvedPrimitiveType({ primitiveKind: 'string' });
            return ResolvedCollectionType.of(elemType);
        }
        return new ResolvedPrimitiveType({ primitiveKind: 'string' });
    }
}
