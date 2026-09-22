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
import { matchLookup } from "../../../../../types/upstream/collections";
import { requireResourceFieldType } from "../../../../../types/domain/resourceFieldSemantic";
import { mapAstValueToExpression } from "../../../subscanners/resource/resourceAstExpressionMapper";
import { createRelationName } from "../../../../../types/upstream/names";

export function bindResourceCollectionField(
    key: string,
    value: Extract<PhpAstValue, { kind: 'resource_single' | 'resource_collection' }>,
    modelSymbol: OriginModelSymbol
): BoundResourceFieldResult {
    const isCollection = value.kind === 'resource_collection';
    const rel = matchLookup(modelSymbol.relation(createRelationName(key)), {
        missing: () => undefined,
        found: ({ value: relation }) => relation
    });
    const targetModel = rel ? rel.targetModel.value.value : value.resourceName;
    const cardinality = isCollection
        ? { kind: 'collection' as const }
        : { kind: 'single' as const };
    const boundAst = rel
        ? BoundSemanticFactory.relation({
            sourceModel: SemanticValueFactory.modelName(modelSymbol.name.value.value),
            relationName: SemanticValueFactory.relationName(key),
            relationType: rel.type,
            targetModel: rel.targetModel,
            cardinality,
            nullability: { kind: 'non_nullable' },
            semanticType: rel.semanticType,
        })
        : BoundSemanticFactory.unsupported('unresolved_relation');

    const expression = ResourceFieldExpressionFactory.resource(
        SemanticValueFactory.resourceName(value.resourceName),
        cardinality
    );
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key,
        expression,
        isCollection
            ? new ReadonlyCollectionType(CollectionKind.ARRAY, ReferenceType.resource('', value.resourceName))
            : ReferenceType.resource('', value.resourceName),
        toCamelCase(key),
        boundAst
    );

    return { descriptor, boundAst };
}

export function bindNestedArrayField(
    key: string,
    value: Extract<PhpAstValue, { kind: 'nested_array' }>,
    modelSymbol: OriginModelSymbol,
    modelSymbolTable: ModelSymbolTable,
    bindFieldFn: (params: {
        readonly key: string;
        readonly value: PhpAstValue;
        readonly modelSymbol: OriginModelSymbol;
        readonly modelSymbolTable: ModelSymbolTable;
    }) => BoundResourceFieldResult
): BoundResourceFieldResult {
    const childFields: ResourceFieldDescriptor[] = [];
    for (const [index, childEntry] of value.entries.entries()) {
        const childKey = childEntry.kind === 'keyed'
            ? childEntry.key.kind === 'string' ? childEntry.key.value : String(index)
            : String(index);
        const childResult = bindFieldFn({
            key: childKey,
            value: childEntry.value,
            modelSymbol,
            modelSymbolTable
        });
        childFields.push(childResult.descriptor);
    }

    const resultingType = new ObjectType({ name: 'InlineObject', baseName: 'InlineObject', properties: [], role: 'plain' });
    const boundAst = BoundSemanticFactory.propertyChain({
        rootModel: SemanticValueFactory.modelName(modelSymbol.name.value.value),
        steps: [],
        resultingType,
        nullability: { kind: 'non_nullable' },
    });

    const expressionFields = value.entries.map((entry, index) => {
        const childKey = entry.kind === 'keyed'
            ? entry.key.kind === 'string' ? entry.key.value : String(index)
            : String(index);
        const field = childFields[index];
        return {
            name: SemanticValueFactory.responseFieldName(childKey),
            propertyName: field.propertyName,
            value: mapAstValueToExpression(entry.value)
        };
    });
    const expression = ResourceFieldExpressionFactory.object(expressionFields);
    const verifiedFields = childFields.filter(field => field.semantic.kind === 'verified');
    const objectProperties = verifiedFields.map(field => {
        const type = requireResourceFieldType(field.semantic);
        return { name: field.propertyName, type, description: "", origin: { kind: 'derived' as const, reason: 'nested_object' as const } };
    });
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key,
        expression,
        new ObjectType({ name: "InlineObject", baseName: "InlineObject", properties: objectProperties, role: "plain" }),
        toCamelCase(key),
        boundAst
    );

    return { descriptor, boundAst };
}
