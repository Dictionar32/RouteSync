/**
 * fieldMapBuilder.ts
 *
 * Helper to build a resolved field map from arbitrary field metadata.
 *
 * @module cli/generators/semantic/resource-field
 */

import type { ResolvedField } from '../semanticTypes';
import { toFieldResolutionMeta } from '../semanticTypes';
import { FieldTypeMapper } from '../FieldTypeMapper';

export function buildFieldMap(meta: unknown): Map<string, ResolvedField> {
    const fields = new Map<string, ResolvedField>();
    if (!meta || typeof meta !== 'object') {
        return fields;
    }

    const metaObj = meta as Record<string, unknown>;
    if (!metaObj.fields || typeof metaObj.fields !== 'object') {
        return fields;
    }

    for (const [fieldName, rawMeta] of Object.entries(metaObj.fields as Record<string, unknown>)) {
        try {
            const fieldMeta = toFieldResolutionMeta(rawMeta as any);
            const resolved = FieldTypeMapper.resolveField(fieldName, fieldMeta);
            fields.set(fieldName, resolved);
        } catch (error) {
            console.warn(`Failed to resolve field ${fieldName}:`, error);
        }
    }

    return fields;
}
