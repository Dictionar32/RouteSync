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
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import { ScannedResourceFieldDescriptor } from "../../descriptors/resourceDescriptors";
import { ReferenceType, ReadonlyCollectionType, CollectionKind } from "../../../types/SemanticType";
import { toCamelCase } from "../../../../utils/resource-naming";
import type { BoundResourceFieldResult } from "../SemanticResourceBinder";
import type { PhpAstValue } from "../../lexer/PhpAst";

/**
 * Binds whenLoaded method calls into conditional bound AST nodes.
 */
export function bindWhenLoadedField(
    key: string,
    argumentsAst: readonly PhpAstValue[],
    modelSymbol?: OriginModelSymbol
): BoundResourceFieldResult {
    const relationName = readRelationName(argumentsAst);
    const relation = modelSymbol ? modelSymbol.relation(relationName) : undefined;
    const targetModel = relation ? relation.targetModel.value : relationName;
    const isCollection = relation ? relation.cardinality === 'many' : false;

    const innerRelationNode = BoundSemanticFactory.relation({
        sourceModel: SemanticValueFactory.modelName(modelSymbol ? modelSymbol.name : targetModel),
        relationName: SemanticValueFactory.relationName(relationName),
        relationType: relation ? relation.type : 'hasOne',
        targetModel: SemanticValueFactory.modelName(targetModel),
        cardinality: relation ? (relation.cardinality === 'many' ? { kind: 'collection' } : { kind: 'single' }) : { kind: 'single' },
        nullability: { kind: 'nullable' }
    });

    const boundAst = BoundSemanticFactory.conditional({
        wrapper: 'whenLoaded',
        conditionExpression: SemanticValueFactory.conditionExpression(relationName),
        target: innerRelationNode,
        relationModel: { kind: 'model', name: SemanticValueFactory.modelName(targetModel) },
        semanticType: isCollection
            ? new ReadonlyCollectionType(CollectionKind.ARRAY, new ReferenceType('', targetModel))
            : new ReferenceType('', targetModel),
        isOptional: true
    });

    const expression = ResourceFieldExpressionFactory.resource({ kind: 'resource_name', value: targetModel }, isCollection ? { kind: 'collection' } : { kind: 'single' });
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key,
        expression,
        isCollection
            ? new ReadonlyCollectionType(CollectionKind.ARRAY, new ReferenceType('', targetModel))
            : new ReferenceType('', targetModel),
        boundAst
    );

    return { descriptor, boundAst };
}

function readRelationName(argumentsAst: readonly PhpAstValue[]): string {
    const argument = argumentsAst[0];
    if (!argument || argument.kind !== 'literal' || argument.literalType !== 'string') {
        throw new Error('whenLoaded requires a string relation argument');
    }
    return argument.value;
}
