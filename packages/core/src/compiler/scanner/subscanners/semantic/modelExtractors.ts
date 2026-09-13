/**
 * modelExtractors.ts
 *
 * Extractors for Eloquent model column types, casts, and accessors.
 *
 * @module core/compiler/scanner/subscanners/semantic
 */

import { toCamelCase } from '../../../../utils/resource-naming';
import type { ParsedCast, ParsedAccessor } from '../../../../types/domain/eloquentTypes';

export function resolveModelColumnTypeString(
    col: { semanticType?: string; type?: string },
    cast: string | undefined
): string {
    if (cast && cast.length > 0) {
        return cast;
    }
    if (col.semanticType && col.semanticType.length > 0) {
        return col.semanticType;
    }
    if (col.type && col.type.length > 0) {
        return col.type;
    }
    return '';
}

export function findCastForColumn(casts: unknown, columnName: string): string | undefined {
    if (!casts) {
        return undefined;
    }
    if (Array.isArray(casts)) {
        const found = (casts as readonly ParsedCast[]).find(c => c && c.column === columnName);
        return found ? found.targetType : undefined;
    }
    if (typeof casts === 'object') {
        const record = casts as Record<string, unknown>;
        const val = record[columnName];
        return typeof val === 'string' ? val : undefined;
    }
    return undefined;
}

export interface ExtractedAccessorInfo {
    readonly propName: string;
    readonly typeStr: string;
}

export function extractModelAccessors(
    accessors: unknown,
    appends: readonly string[]
): readonly ExtractedAccessorInfo[] {
    const results: ExtractedAccessorInfo[] = [];
    const seen = new Set<string>();

    if (Array.isArray(accessors)) {
        for (const acc of (accessors as readonly ParsedAccessor[])) {
            if (acc && acc.name) {
                const prop = acc.propertyName ? acc.propertyName : toCamelCase(acc.name);
                seen.add(prop);
                results.push({ propName: prop, typeStr: acc.type ? acc.type : 'string' });
            }
        }
    } else if (accessors && typeof accessors === 'object') {
        const record = accessors as Record<string, unknown>;
        for (const [key, val] of Object.entries(record)) {
            const prop = toCamelCase(key);
            seen.add(prop);
            let typeStr = 'string';
            if (val && typeof val === 'object') {
                const valObj = val as Record<string, unknown>;
                const sem = valObj.semantic;
                if (sem && typeof sem === 'object' && typeof (sem as Record<string, unknown>).type === 'string') {
                    typeStr = (sem as Record<string, unknown>).type as string;
                }
            }
            results.push({ propName: prop, typeStr });
        }
    }

    for (const app of appends) {
        const prop = toCamelCase(app);
        if (!seen.has(prop)) {
            seen.add(prop);
            results.push({ propName: prop, typeStr: 'string' });
        }
    }

    return results;
}
