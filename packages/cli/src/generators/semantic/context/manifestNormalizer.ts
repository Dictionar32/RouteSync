/**
 * manifestNormalizer.ts
 *
 * Normalizes models and resources from RouteManifest into immutable maps.
 *
 * @module cli/generators/semantic/context
 */

import type { NormalizedColumnInfo, NormalizedModelInfo } from '../semanticTypes';

export function normalizeModelsFromManifest(models: readonly any[]): Map<string, NormalizedModelInfo> {
    const modelsByName = new Map<string, NormalizedModelInfo>();
    for (const m of models) {
        if (!m || typeof m !== 'object') continue;
        const modelName = typeof m.name === 'string' ? m.name : '';
        if (modelName.length === 0) continue;

        const castMap = new Map<string, string>();
        if (Array.isArray(m.casts)) {
            for (const c of m.casts) {
                if (c && typeof c === 'object' && typeof c.column === 'string' && typeof c.targetType === 'string') {
                    castMap.set(c.column, c.targetType);
                }
            }
        } else if (m.casts && typeof m.casts === 'object') {
            for (const [col, target] of Object.entries(m.casts)) {
                if (typeof target === 'string') {
                    castMap.set(col, target);
                }
            }
        }

        const columnsList: NormalizedColumnInfo[] = [];
        const columnsByName = new Map<string, NormalizedColumnInfo>();
        if (Array.isArray(m.columns)) {
            for (const c of m.columns) {
                if (c && typeof c === 'object' && typeof c.name === 'string') {
                    const colType = typeof c.type === 'string' ? c.type : 'unknown';
                    const colNullable = c.nullable === true;
                    const colInfo: NormalizedColumnInfo = Object.freeze({
                        name: c.name,
                        type: colType,
                        nullable: colNullable,
                    });
                    columnsList.push(colInfo);
                    columnsByName.set(c.name, colInfo);
                }
            }
        }

        modelsByName.set(modelName, Object.freeze({
            name: modelName,
            columns: Object.freeze(columnsList),
            columnsByName,
            casts: castMap,
        }));
    }
    return modelsByName;
}

export function normalizeResourcesFromManifest(resources: readonly any[]): Map<string, any> {
    const resourcesByName = new Map<string, any>();
    for (const r of resources) {
        if (r && typeof r === 'object' && typeof r.name === 'string') {
            resourcesByName.set(r.name, r);
        }
    }
    return resourcesByName;
}
