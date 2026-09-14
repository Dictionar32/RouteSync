/**
 * singleFieldResolver.ts
 *
 * Resolves an individual resource field definition to ResolvedField using
 * priority-based resolution (manual override -> primitive -> raw_code / resource/model -> sql column -> defensive ternary guard -> fallback unknown).
 *
 * @module cli/generators/semantic/resource-field
 */

import { camelCase, ResourceNamingConvention } from '@routesync/core';
import {
    wrapNullableTs,
    wrapNullableZod,
    mapSqlTypeToMapping
} from '../../canonical-names';
import type { ResolvedField } from '../semanticTypes';
import {
    extractThisPropertyAccess,
    isNullableTernaryGuard,
    type SemanticResolutionContext
} from '../SemanticResolutionContext';
import { FieldTypeMapper } from '../FieldTypeMapper';

export function resolveSingleResourceField(
    fieldName: string,
    fieldDef: Record<string, unknown>,
    context: SemanticResolutionContext,
    resourceName: string,
    fieldPath: string
): ResolvedField {
    const camelCaseName = camelCase(fieldName);
    const base = (extra: Partial<ResolvedField>): ResolvedField => ({
        name: camelCaseName,
        sourceSnakeCase: fieldName,
        type: 'unknown',
        nullable: false,
        zodType: 'z.unknown()',
        tsType: 'unknown',
        sourceType: 'unknown',
        sourceValue: fieldPath,
        ...extra,
    });

    // Prioritas 1: override manual terverifikasi
    const override = FieldTypeMapper.KNOWN_FIELD_TYPE_OVERRIDES[fieldPath];
    if (override) {
        return base({
            type: FieldTypeMapper.parseTypeFromString(override.tsType),
            nullable: override.nullable,
            zodType: override.zodType,
            tsType: override.tsType,
            sourceType: 'unknown',
        });
    }

    // Prioritas 2: primitive langsung
    if (fieldDef.kind === 'primitive') {
        const t = typeof fieldDef.type === 'string' ? fieldDef.type : undefined;
        const mapping = FieldTypeMapper.mapPrimitiveType(t);
        return base({ ...mapping, sourceType: 'json' });
    }

    // Prioritas 2b: kind 'raw_code' dengan resolved.type sudah tersedia
    const resolvedRaw = fieldDef.resolved;
    if (resolvedRaw && typeof resolvedRaw === 'object') {
        const resolved = resolvedRaw as {
            type?: string;
            resource?: string;
            model?: string;
            collection?: boolean;
            nullable?: boolean;
        };
        if (resolved.type === 'resource' && typeof resolved.resource === 'string') {
            const known = context.resourcesByName.has(resolved.resource);
            if (known) {
                const nullableSuffix = resolved.nullable === true ? ' | null' : '';
                const tsType = resolved.collection === true ? `${resolved.resource}Transformed[]` : `${resolved.resource}Transformed${nullableSuffix}`;
                let zodType = resolved.collection === true ? `z.array(${resolved.resource}Schema)` : `${resolved.resource}Schema`;
                if (!resolved.collection && resolved.nullable === true) zodType = wrapNullableZod(zodType, true);
                return base({ type: 'object', zodType, tsType, sourceType: 'unknown' });
            }
        }
        if (resolved.type === 'model' && typeof resolved.model === 'string') {
            const known = context.modelsByName.has(resolved.model);
            if (known) {
                const nullableSuffix = resolved.nullable === true ? ' | null' : '';
                const tsType = resolved.collection === true ? `${resolved.model}Transformed[]` : `${resolved.model}Transformed${nullableSuffix}`;
                let zodType = resolved.collection === true ? `z.array(${resolved.model}Schema)` : `${resolved.model}Schema`;
                if (!resolved.collection && resolved.nullable === true) zodType = wrapNullableZod(zodType, true);
                return base({ type: 'object', zodType, tsType, sourceType: 'unknown' });
            }
        }
        if (typeof resolved.type === 'string') {
            const mapping = FieldTypeMapper.mapPrimitiveType(resolved.type);
            if (mapping.zodType !== 'z.unknown()') {
                const isNullable = resolved.nullable === true;
                return base({
                    ...mapping,
                    nullable: isNullable,
                    zodType: isNullable ? wrapNullableZod(mapping.zodType, true) : mapping.zodType,
                    tsType: isNullable ? wrapNullableTs(mapping.tsType, true) : mapping.tsType,
                    sourceType: 'unknown',
                });
            }
        }
    }

    // Prioritas 3: model-hint LANGSUNG
    const propertyName = extractThisPropertyAccess(fieldDef);
    if (propertyName !== null) {
        const modelHint = ResourceNamingConvention.stripSuffix(resourceName);
        const hintedModel = context.modelsByName.get(modelHint);
        if (hintedModel !== undefined) {
            const column = hintedModel.columnsByName.get(propertyName);
            if (column !== undefined) {
                const cast = hintedModel.casts.get(column.name);
                const mapping = mapSqlTypeToMapping(column.type, cast);
                const zodType = column.nullable ? wrapNullableZod(mapping.zodType, true) : mapping.zodType;
                const tsType = column.nullable ? wrapNullableTs(mapping.tsType, true) : mapping.tsType;
                return base({
                    type: FieldTypeMapper.parseTypeFromString(mapping.tsType),
                    nullable: column.nullable,
                    zodType,
                    tsType,
                    sourceType: 'sql',
                    sourceValue: column.type,
                });
            }
        }
    }

    // Prioritas 4: pola ternary defensive-null-guard
    if (isNullableTernaryGuard(fieldDef.parsed_ast)) {
        return base({ zodType: 'z.unknown().nullable()', tsType: 'unknown | null', nullable: true });
    }

    // Prioritas 5: fallback unknown
    return base({});
}
