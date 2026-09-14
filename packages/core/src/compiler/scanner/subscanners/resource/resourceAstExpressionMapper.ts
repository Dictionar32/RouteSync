/**
 * resourceAstExpressionMapper.ts
 *
 * Maps PHP AST expression values to RouteSync ResourceFieldExpression objects.
 *
 * @module core/compiler/scanner/subscanners/resource/resourceAstExpressionMapper
 */

import {
    ResourceFieldDescriptor,
    ResourceFieldExpression,
    ResourceFieldExpressionFactory
} from "../../../../types/route";
import type { PhpAstValue } from "../../LaravelSourceLexer";
import { ScannedResourceFieldDescriptor } from "../../descriptors/resourceDescriptors";

/**
 * Maps a PhpAstValue node into a ResourceFieldExpression with nullability.
 */
export function mapAstValueToExpression(
    value: PhpAstValue,
    raw: string
): { expression: ResourceFieldExpression; nullable: boolean } {
    switch (value.kind) {
        case 'resource_collection':
            return { expression: ResourceFieldExpressionFactory.resource(value.resourceName, true), nullable: false };
        case 'resource_single':
            return { expression: ResourceFieldExpressionFactory.resource(value.resourceName, false), nullable: false };
        case 'nested_array': {
            const childFields: ResourceFieldDescriptor[] = value.entries.map(e => {
                const mappedChild = mapAstValueToExpression(e.value, e.rawExpression);
                return ScannedResourceFieldDescriptor.fromExpression(
                    e.key,
                    mappedChild.expression,
                    mappedChild.nullable
                );
            });
            return { expression: ResourceFieldExpressionFactory.object(childFields), nullable: false };
        }
        case 'method_chain':
        case 'property_access': {
            const prop = value.property.toLowerCase();
            const isNumeric = prop.endsWith('_id') || prop === 'id' || prop.endsWith('_count') || prop.endsWith('_amount') || prop.endsWith('_minor') || prop === 'qty' || prop === 'harga' || prop === 'subtotal';
            const isBool = prop.startsWith('is_') || prop.startsWith('has_');
            let primitiveType = 'string';
            if (isNumeric) {
                primitiveType = 'int';
            } else if (isBool) {
                primitiveType = 'boolean';
            }
            return { expression: ResourceFieldExpressionFactory.primitive(primitiveType), nullable: value.nullsafe };
        }
        case 'literal': {
            let primitiveType = 'string';
            if (value.literalType === 'number') {
                primitiveType = 'int';
            } else if (value.literalType === 'boolean') {
                primitiveType = 'boolean';
            }
            return { expression: ResourceFieldExpressionFactory.primitive(primitiveType), nullable: value.literalType === 'null' };
        }
        case 'variable_reference': {
            const varName = value.name.toLowerCase();
            const isNumeric = varName.endsWith('_id') || varName === 'id' || varName.endsWith('_minor') || varName === 'qty' || varName === 'harga' || varName === 'subtotal';
            return { expression: ResourceFieldExpressionFactory.primitive(isNumeric ? 'int' : 'string'), nullable: false };
        }
        case 'ternary_expression':
            return { expression: ResourceFieldExpressionFactory.primitive('string'), nullable: true };
        default: {
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
    }
}
