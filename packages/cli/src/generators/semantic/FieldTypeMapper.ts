/**
 * @file FieldTypeMapper.ts
 * @description Sub-domain for SQL type mapping, primitive type resolution, and manual overrides
 *
 * @module cli/generators/semantic/FieldTypeMapper
 */

import { camelCase } from '@routesync/core';
import {
    wrapNullableTs,
    wrapNullableZod,
    mapSqlTypeToMapping
} from '../canonical-names';

import type {
    ResolvedField,
    FieldResolutionMeta
} from './semanticTypes';

export class FieldTypeMapper {
    public static readonly KNOWN_FIELD_TYPE_OVERRIDES: Record<string, { zodType: string; tsType: string; nullable: boolean }> = {
        'PaymentResource.gateway.name': { zodType: 'z.string().nullable()', tsType: 'string | null', nullable: true },
        'PaymentResource.gateway.order_id': { zodType: 'z.string().nullable()', tsType: 'string | null', nullable: true },
        'PaymentResource.gateway.token': { zodType: 'z.string().nullable()', tsType: 'string | null', nullable: true },
        'PaymentResource.gateway.redirect_url': { zodType: 'z.string().nullable()', tsType: 'string | null', nullable: true },
        'PaymentResource.gateway_status': { zodType: 'z.string()', tsType: 'string', nullable: false },
        'PaymentResource.amount_minor': { zodType: 'z.number()', tsType: 'number', nullable: false },
        'PaymentResource.provider_txn_id': { zodType: 'z.string().nullable()', tsType: 'string | null', nullable: true },
        'PaymentResource.provider': { zodType: 'z.string().nullable()', tsType: 'string | null', nullable: true },
        'PaymentResource.refund_amount_minor': { zodType: 'z.number().nullable()', tsType: 'number | null', nullable: true },
    };

    public static resolveField(
        fieldName: string,
        meta: FieldResolutionMeta
    ): ResolvedField {
        const sourceSnakeCase = fieldName;
        const camelCaseName = camelCase(fieldName);
        const mapping = mapSqlTypeToMapping(meta.type, meta.cast);
        const sourceType: ResolvedField['sourceType'] = meta.cast !== undefined ? 'cast' : 'sql';
        const sourceValue = meta.cast !== undefined ? meta.cast : meta.type;

        return {
            name: camelCaseName,
            sourceSnakeCase,
            type: this.parseTypeFromString(mapping.tsType),
            nullable: meta.nullable,
            zodType: wrapNullableZod(mapping.zodType, meta.nullable),
            tsType: wrapNullableTs(mapping.tsType, meta.nullable),
            sourceType,
            sourceValue,
        };
    }

    public static mapPrimitiveType(type: string | undefined): { type: ResolvedField['type']; zodType: string; tsType: string } {
        switch (type) {
            case 'string':
                return { type: 'string', zodType: 'z.string()', tsType: 'string' };
            case 'number':
            case 'integer':
            case 'bigint':
            case 'float':
            case 'double':
                return { type: 'number', zodType: 'z.number()', tsType: 'number' };
            case 'boolean':
            case 'bool':
                return { type: 'boolean', zodType: 'z.boolean()', tsType: 'boolean' };
            case 'array':
                return { type: 'array', zodType: 'z.array(z.unknown())', tsType: 'unknown[]' };
            case 'object':
                return { type: 'object', zodType: 'z.record(z.string(), z.unknown())', tsType: 'Record<string, unknown>' };
            default:
                return { type: 'unknown', zodType: 'z.unknown()', tsType: 'unknown' };
        }
    }

    public static parseTypeFromString(
        typeStr: string
    ): 'string' | 'number' | 'boolean' | 'null' | 'unknown' | 'object' | 'array' {
        const lower = typeStr.toLowerCase();
        if (lower.includes('string')) return 'string';
        if (lower.includes('number')) return 'number';
        if (lower.includes('boolean')) return 'boolean';
        if (lower.includes('[]') || lower.includes('array')) return 'array';
        if (lower.includes('record') || lower.includes('object')) return 'object';
        if (lower === 'null') return 'null';
        return 'unknown';
    }
}
