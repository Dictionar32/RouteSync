/**
 * resourceAstExpressionMapper.ts
 *
 * Maps PHP AST expression values to RouteSync ResourceFieldExpression objects.
 * Pure Catamorphic Mapper: 0 'switch', 0 type assertions.
 *
 * @module core/compiler/scanner/subscanners/resource/resourceAstExpressionMapper
 */

import {
    ResourceFieldDescriptor,
    ResourceFieldExpression,
    ResourceFieldExpressionFactory
} from "../../../../types/route";
import { type PhpAstValue, matchPhpAstValue } from "../../LaravelSourceLexer";
import { ScannedResourceFieldDescriptor } from "../../descriptors/resourceDescriptors";

function mapPropertyType(prop: string, nullsafe: boolean): { expression: ResourceFieldExpression; nullable: boolean } {
    const lower = prop.toLowerCase();
    const isNumeric = lower.endsWith('_id') || lower === 'id' || lower.endsWith('_count') || lower.endsWith('_amount') || lower.endsWith('_minor') || lower === 'qty' || lower === 'harga' || lower === 'subtotal';
    const isBool = lower.startsWith('is_') || lower.startsWith('has_');
    const primitiveType = isNumeric ? 'int' : isBool ? 'boolean' : 'string';
    return { expression: ResourceFieldExpressionFactory.primitive(primitiveType), nullable: nullsafe };
}

function mapRawFallback(raw: string): { expression: ResourceFieldExpression; nullable: boolean } {
    const cleanRaw = (raw || '').trim();
    if (cleanRaw.includes("['") || cleanRaw.includes('["') || cleanRaw.includes('$detail[') || cleanRaw.includes('$gateway[')) {
        return { expression: ResourceFieldExpressionFactory.unknown(), nullable: true };
    }
    if (cleanRaw.startsWith('(int)') || cleanRaw.startsWith('(float)') || /\b(int|float)\b/.test(cleanRaw) || /[+\-*\/]/.test(cleanRaw)) {
        return { expression: ResourceFieldExpressionFactory.primitive('int'), nullable: cleanRaw.includes('null') };
    }
    if (cleanRaw.startsWith('(bool)')) {
        return { expression: ResourceFieldExpressionFactory.primitive('boolean'), nullable: false };
    }
    return { expression: ResourceFieldExpressionFactory.primitive('string'), nullable: false };
}

/**
 * Maps a PhpAstValue node into a ResourceFieldExpression with nullability.
 */
export function mapAstValueToExpression(
    value: PhpAstValue,
    raw: string
): { expression: ResourceFieldExpression; nullable: boolean } {
    return matchPhpAstValue(value, {
        resourceCollection: (v) => ({ expression: ResourceFieldExpressionFactory.resource(v.resourceName, true), nullable: false }),
        resourceSingle: (v) => ({ expression: ResourceFieldExpressionFactory.resource(v.resourceName, false), nullable: false }),
        nestedArray: (v) => {
            const childFields: ResourceFieldDescriptor[] = v.entries.map(e => {
                const mappedChild = mapAstValueToExpression(e.value, e.rawExpression);
                return ScannedResourceFieldDescriptor.fromExpression(e.key, mappedChild.expression, mappedChild.nullable);
            });
            return { expression: ResourceFieldExpressionFactory.object(childFields), nullable: false };
        },
        methodChain: (v) => mapPropertyType(v.property, v.nullsafe),
        propertyAccess: (v) => mapPropertyType(v.property, v.nullsafe),
        literal: (v) => {
            const primitiveType = v.literalType === 'number' ? 'int' : v.literalType === 'boolean' ? 'boolean' : 'string';
            return { expression: ResourceFieldExpressionFactory.primitive(primitiveType), nullable: v.literalType === 'null' };
        },
        variableReference: (v) => {
            const varName = v.name.toLowerCase();
            const isNumeric = varName.endsWith('_id') || varName === 'id' || varName.endsWith('_minor') || varName === 'qty' || varName === 'harga' || varName === 'subtotal';
            return { expression: ResourceFieldExpressionFactory.primitive(isNumeric ? 'int' : 'string'), nullable: false };
        },
        ternaryExpression: () => ({ expression: ResourceFieldExpressionFactory.primitive('string'), nullable: true }),
        rawExpression: (v) => mapRawFallback(v.raw || raw)
    });
}
