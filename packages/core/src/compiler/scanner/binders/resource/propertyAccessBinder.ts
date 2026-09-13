/**
 * propertyAccessBinder.ts
 *
 * Binds property access and method chains directly to Model Symbols (columns, relations, accessors).
 *
 * @module core/compiler/scanner/binders/resource/propertyAccessBinder
 */

import type { OriginModelSymbol } from "../../symbols/ModelSymbolTable";
import { ResourceFieldExpressionFactory } from "../../../../types/route";
import { BoundSemanticFactory } from "../../../../types/domain/boundAst";
import { ScannedResourceFieldDescriptor } from "../../descriptors/resourceDescriptors";
import { PrimitiveKind } from "../../../types/SemanticType";
import { toCamelCase } from "../../../../utils/resource-naming";
import type { BoundResourceFieldResult } from "../SemanticResourceBinder";

/**
 * Binds a property access or regular method chain to Model Symbols or convention heuristics.
 */
export function bindPropertyAccessField(
    key: string,
    prop: string,
    isNullsafe: boolean,
    modelSymbol?: OriginModelSymbol
): BoundResourceFieldResult {
    if (modelSymbol) {
        const binding = modelSymbol.resolveProperty(prop);
        if (binding) {
            if (binding.kind === 'column') {
                const primKind = binding.type === 'number'
                    ? PrimitiveKind.NUMBER
                    : binding.type === 'boolean'
                        ? PrimitiveKind.BOOLEAN
                        : PrimitiveKind.STRING;

                const boundAst = BoundSemanticFactory.modelColumn({
                    model: modelSymbol.name,
                    column: prop,
                    dbType: '',
                    castType: binding.cast || null,
                    semanticType: binding.type,
                    nullable: binding.nullable || isNullsafe
                });

                const expression = ResourceFieldExpressionFactory.primitive(binding.type);
                const descriptor = ScannedResourceFieldDescriptor.fromExpression(
                    key,
                    expression,
                    binding.nullable || isNullsafe,
                    toCamelCase(key),
                    primKind,
                    boundAst
                );

                return { descriptor, boundAst };
            }

            if (binding.kind === 'relation') {
                const targetModel = binding.targetModel || prop;
                const isCollection = !!binding.isCollection;

                const boundAst = BoundSemanticFactory.relation({
                    sourceModel: modelSymbol.name,
                    relationName: prop,
                    relationType: isCollection ? 'hasMany' : 'belongsTo',
                    targetModel,
                    isCollection,
                    nullable: isNullsafe
                });

                const expression = ResourceFieldExpressionFactory.resource(targetModel, isCollection);
                const descriptor = ScannedResourceFieldDescriptor.fromExpression(
                    key,
                    expression,
                    isNullsafe,
                    toCamelCase(key),
                    PrimitiveKind.STRING,
                    boundAst
                );

                return { descriptor, boundAst };
            }

            if (binding.kind === 'accessor') {
                const primKind = binding.type === 'number'
                    ? PrimitiveKind.NUMBER
                    : binding.type === 'boolean'
                        ? PrimitiveKind.BOOLEAN
                        : PrimitiveKind.STRING;

                const boundAst = BoundSemanticFactory.methodCall({
                    targetModel: modelSymbol.name,
                    methodName: prop,
                    returnType: binding.type,
                    nullable: binding.nullable || isNullsafe
                });

                const expression = ResourceFieldExpressionFactory.primitive(binding.type);
                const descriptor = ScannedResourceFieldDescriptor.fromExpression(
                    key,
                    expression,
                    binding.nullable || isNullsafe,
                    toCamelCase(key),
                    primKind,
                    boundAst
                );

                return { descriptor, boundAst };
            }
        }
    }

    // Fallback heuristic if not indexed in Model
    const propLower = prop.toLowerCase();
    const isNumeric = propLower.endsWith('_id') || propLower === 'id' || propLower.endsWith('_count') || propLower.endsWith('_amount') || propLower.endsWith('_minor') || propLower === 'qty' || propLower === 'harga' || propLower === 'subtotal';
    const isBool = propLower.startsWith('is_') || propLower.startsWith('has_');
    const fallbackType = isNumeric ? 'number' : isBool ? 'boolean' : 'string';
    const primKind = isNumeric ? PrimitiveKind.NUMBER : isBool ? PrimitiveKind.BOOLEAN : PrimitiveKind.STRING;

    const boundAst = BoundSemanticFactory.primitive(fallbackType, null, isNullsafe);
    const expression = ResourceFieldExpressionFactory.primitive(fallbackType);
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key,
        expression,
        isNullsafe,
        toCamelCase(key),
        primKind,
        boundAst
    );

    return { descriptor, boundAst };
}
