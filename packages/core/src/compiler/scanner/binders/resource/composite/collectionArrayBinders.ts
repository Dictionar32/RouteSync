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
import { ScannedResourceFieldDescriptor } from "../../../descriptors/resourceDescriptors";
import { PrimitiveKind } from "../../../../types/SemanticType";
import { toCamelCase } from "../../../../../utils/resource-naming";
import type { BoundResourceFieldResult } from "../../SemanticResourceBinder";

export function bindResourceCollectionField(
    key: string,
    value: Extract<PhpAstValue, { kind: 'resource_single' | 'resource_collection' }>,
    modelSymbol?: OriginModelSymbol
): BoundResourceFieldResult {
    const isCollection = value.kind === 'resource_collection';
    const boundAst = BoundSemanticFactory.relation({
        sourceModel: modelSymbol ? modelSymbol.name : '',
        relationName: key,
        relationType: isCollection ? 'hasMany' : 'hasOne',
        targetModel: value.resourceName,
        isCollection,
        nullable: false
    });

    const expression = ResourceFieldExpressionFactory.resource(value.resourceName, isCollection);
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key,
        expression,
        false,
        toCamelCase(key),
        PrimitiveKind.STRING,
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
        readonly rawExpression: string;
        readonly modelSymbol?: OriginModelSymbol;
        readonly modelSymbolTable: ModelSymbolTable;
    }) => BoundResourceFieldResult
): BoundResourceFieldResult {
    const childFields: ResourceFieldDescriptor[] = [];
    for (const childEntry of value.entries) {
        const childResult = bindFieldFn({
            key: childEntry.key,
            value: childEntry.value,
            rawExpression: childEntry.rawExpression,
            modelSymbol,
            modelSymbolTable
        });
        childFields.push(childResult.descriptor);
    }

    const boundAst = BoundSemanticFactory.propertyChain({
        rootModel: modelSymbol ? modelSymbol.name : 'nested',
        steps: [],
        resultingType: 'object',
        nullable: false,
        invalidationTags: modelSymbol ? [modelSymbol.name] : []
    });

    const expression = ResourceFieldExpressionFactory.object(childFields);
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key,
        expression,
        false,
        toCamelCase(key),
        PrimitiveKind.STRING,
        boundAst
    );

    return { descriptor, boundAst };
}
