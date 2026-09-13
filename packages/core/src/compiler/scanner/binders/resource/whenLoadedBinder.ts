/**
 * whenLoadedBinder.ts
 *
 * Binds whenLoaded conditional relation expressions directly to Model Symbols and Bound AST.
 *
 * @module core/compiler/scanner/binders/resource/whenLoadedBinder
 */

import type { OriginModelSymbol } from "../../symbols/ModelSymbolTable";
import { ResourceFieldExpressionFactory } from "../../../../types/route";
import { BoundSemanticFactory } from "../../../../types/domain/boundAst";
import { ScannedResourceFieldDescriptor } from "../../descriptors/resourceDescriptors";
import { PrimitiveKind } from "../../../types/SemanticType";
import { toCamelCase } from "../../../../utils/resource-naming";
import type { BoundResourceFieldResult } from "../SemanticResourceBinder";

/**
 * Binds whenLoaded method calls into conditional bound AST nodes.
 */
export function bindWhenLoadedField(
    key: string,
    rawExpression: string,
    modelSymbol?: OriginModelSymbol
): BoundResourceFieldResult {
    const match = /whenLoaded\s*\(\s*['"]([^'"]+)['"]/i.exec(rawExpression);
    const relationName = match ? match[1] : '';
    const rel = relationName && modelSymbol ? modelSymbol.relation(relationName) : undefined;
    const targetModel = rel ? rel.targetModel : relationName;
    const isCollection = rel ? rel.isCollection : false;

    const innerRelationNode = BoundSemanticFactory.relation({
        sourceModel: modelSymbol ? modelSymbol.name : '',
        relationName: relationName || 'unknown',
        relationType: rel ? rel.type : 'hasOne',
        targetModel: targetModel || 'unknown',
        isCollection,
        nullable: true
    });

    const boundAst = BoundSemanticFactory.conditional({
        wrapper: 'whenLoaded',
        conditionExpression: `whenLoaded('${relationName}')`,
        target: innerRelationNode,
        relationModel: targetModel || null,
        isOptional: true
    });

    const expression = ResourceFieldExpressionFactory.resource(targetModel || 'unknown', isCollection);
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key,
        expression,
        true,
        toCamelCase(key),
        PrimitiveKind.STRING,
        boundAst
    );

    return { descriptor, boundAst };
}
