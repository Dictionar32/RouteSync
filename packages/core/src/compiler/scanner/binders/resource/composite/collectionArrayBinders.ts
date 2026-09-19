/**
 * collectionArrayBinders.ts
 *
 * Binders for resource collections and nested arrays.
 *
 * @module core/compiler/scanner/binders/resource/composite
 */

import type { OriginModelSymbol, ModelSymbolTable } from "../../../symbols/ModelSymbolTable";
import type { PhpAstValue } from "../../../lexer/PhpAst";
import {
    type ResourceFieldDescriptor,
    ResourceFieldExpressionFactory
} from "../../../../../types/route";
import { BoundSemanticFactory } from "../../../../../types/domain/boundAst";
import { SemanticValueFactory } from "../../../../../types/domain/semanticValues";
import { ScannedResourceFieldDescriptor } from "../../../descriptors/resourceDescriptors";
import { ObjectType, ReferenceType, ReadonlyCollectionType, CollectionKind } from "../../../../types/SemanticType";
import { toCamelCase } from "../../../../../utils/resource-naming";
import type { BoundResourceFieldResult } from "../../SemanticResourceBinder";

export function bindResourceCollectionField(
    key: string,
    value: Extract<PhpAstValue, { kind: 'resource_single' | 'resource_collection' }>,
    modelSymbol?: OriginModelSymbol
): BoundResourceFieldResult {
    const isCollection = value.kind === 'resource_collection';
    const rel = modelSymbol ? modelSymbol.relation(key) : undefined;
    const targetModel = rel ? rel.targetModel.value : value.resourceName;
    const cardinality = isCollection
        ? { kind: 'collection' as const }
        : { kind: 'single' as const };
    const boundAst = rel
        ? BoundSemanticFactory.relation({
            sourceModel: SemanticValueFactory.modelName(modelSymbol!.name),
            relationName: SemanticValueFactory.relationName(key),
            relationType: rel.type,
            targetModel: rel.targetModel,
            cardinality,
            nullability: { kind: 'non_nullable' }
        })
        : BoundSemanticFactory.unsupported('unresolved_relation');

    const expression = ResourceFieldExpressionFactory.resource(
        { kind: 'resource_name', value: value.resourceName },
        cardinality
    );
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key,
        expression,
        isCollection
            ? new ReadonlyCollectionType(CollectionKind.ARRAY, new ReferenceType('', value.resourceName))
            : new ReferenceType('', value.resourceName),
        toCamelCase(key),
        boundAst
    );

    return { descriptor, boundAst };
}

export function bindNestedArrayField(
    key: string,
    value: Extract<PhpAstValue, { kind: 'nested_array' }>,
    modelSymbol: OriginModelSymbol | undefined,
    modelSymbolTable: ModelSymbolTable,
    bindFieldFn: (params: {
        readonly key: string;
        readonly value: PhpAstValue;
        readonly modelSymbol?: OriginModelSymbol;
        readonly modelSymbolTable: ModelSymbolTable;
    }) => BoundResourceFieldResult
): BoundResourceFieldResult {
    const childFields: ResourceFieldDescriptor[] = [];
    for (const childEntry of value.entries) {
        const childResult = bindFieldFn({
            key: childEntry.key,
            value: childEntry.value,
            modelSymbol,
            modelSymbolTable
        });
        childFields.push(childResult.descriptor);
    }

    const boundAst = modelSymbol
        ? BoundSemanticFactory.propertyChain({
            rootModel: SemanticValueFactory.modelName(modelSymbol.name),
            steps: [],
            resultingType: new ObjectType({ name: 'InlineObject', baseName: 'InlineObject', properties: [], role: 'plain' }),
            nullability: { kind: 'non_nullable' }
        })
        : BoundSemanticFactory.unsupported('invalid_boundary_input');

    const expression = ResourceFieldExpressionFactory.object(childFields);
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key,
        expression,
        new ObjectType({ name: "InlineObject", baseName: "InlineObject", properties: childFields.map(field => ({ name: field.name, type: field.semantic.type, required: true, nullable: field.semantic.type.isNullable(), description: "", origin: { kind: 'derived', reason: 'nested_object' } })), role: "plain" }),
        toCamelCase(key),
        boundAst
    );

    return { descriptor, boundAst };
}
