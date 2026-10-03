import { scannerSemanticType } from '../../../semanticTypeConstructionRelations';
/**
 * collectionArrayBinders.ts
 *
 * Declarative binders over resource collections and nested arrays.
 *
 * @module core/compiler/scanner/binders/resource/composite
 */

import type { OriginModelSymbol, ModelSymbolTable } from "../../../symbols/ModelSymbolTable";
import type { PhpAstValue } from "../../../lexer/PhpAst";
import { ResourceFieldExpressionFactory } from "../../../../../types/route";
import { BoundSemanticFactory } from "../../../../../types/domain/boundAst";
import { SemanticValueFactory } from "../../../../../types/domain/semanticValues";
import { ResourceFieldSemanticBinding } from "../../../../../types/domain/resourceFieldSemanticBinding";
import type { ResourceFieldSemanticBinding as ResourceFieldSemanticBindingType } from "../../../../../types/domain/resourceFieldSemanticBinding";
import { ObjectType, ReferenceType, ReadonlyCollectionType, CollectionKind } from "../../../../types/SemanticType";
import { toCamelCase } from "../../../../../utils/resource-naming";
import type { BoundResourceFieldResult } from "../../SemanticResourceBinder";
import { matchLookup } from "../../../../../types/upstream/collections";
import { requireResourceFieldType } from "../../../../../types/domain/resourceFieldSemantic";
import { resolveAstValueToExpression } from "../../../subscanners/resource/resourceAstExpressionMapper";
import { createRelationName } from "../../../../../types/upstream/names";
import { relationEqual } from "../../../../../semantic/kernel/semanticRelations";
import { relationGate, relationFold, relationOptionFold, relationProject, relationSelect, relationSome, relationNone } from "../../../../../semantic/kernel/relationalSequence";

export function bindResourceCollectionField(
    key: string,
    value: Extract<PhpAstValue, { kind: 'resource_single' | 'resource_collection' }>,
    modelSymbol: OriginModelSymbol
): BoundResourceFieldResult {
    const isCollection = relationEqual(value.kind, 'resource_collection');
    const rel = matchLookup(modelSymbol.relation(createRelationName(key)), {
        missing: () => relationNone(),
        found: ({ value: relation }) => relationSome(relation)
    });
    const cardinality = relationGate(isCollection, () => ({ kind: 'collection' as const }), () => ({ kind: 'single' as const }));
    const boundAst = relationOptionFold(rel,
        () => BoundSemanticFactory.unsupported('unresolved_relation'),
        relation => BoundSemanticFactory.relation({
            sourceModel: SemanticValueFactory.modelName(modelSymbol.name.value.value),
            relationName: SemanticValueFactory.relationName(key),
            relationType: relation.type,
            targetModel: relation.targetModel,
            cardinality,
            nullability: { kind: 'non_nullable' },
            semanticType: relation.semanticType,
        }));

    const expression = ResourceFieldExpressionFactory.resource(
        SemanticValueFactory.resourceName(value.resourceName),
        cardinality
    );
    const descriptor = ResourceFieldSemanticBinding.fromExpression(
        key,
        expression,
        relationGate(isCollection,
            () => scannerSemanticType.collection(CollectionKind.ARRAY, scannerSemanticType.resource('', value.resourceName)),
            () => ReferenceType.resource('', value.resourceName)),
        toCamelCase(key),
        boundAst
    );

    return { descriptor, boundAst };
}

const EMPTY_RESOURCE_FIELD_BINDINGS: readonly ResourceFieldSemanticBindingType[] = Object.freeze([]);

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
    const childFields = relationFold(value.entries, EMPTY_RESOURCE_FIELD_BINDINGS, (fields, childEntry, index) => {
        const childKey = relationGate(relationEqual(childEntry.kind, 'keyed'),
            () => relationGate(relationEqual(childEntry.key.kind, 'string'), () => childEntry.key.value, () => String(index)),
            () => String(index));
        const childResult = bindFieldFn({ key: childKey, value: childEntry.value, modelSymbol, modelSymbolTable });
        return Object.freeze([...fields, childResult.binding]);
    });

    const resultingType = scannerSemanticType.object({ name: 'InlineObject', baseName: 'InlineObject', properties: [], role: 'plain' });
    const boundAst = BoundSemanticFactory.propertyChain({
        rootModel: SemanticValueFactory.modelName(modelSymbol.name.value.value),
        steps: [],
        resultingType,
        nullability: { kind: 'non_nullable' },
    });

    const expressionFields = relationProject(value.entries, (entry, index) => {
        const childKey = relationGate(relationEqual(entry.kind, 'keyed'),
            () => relationGate(relationEqual(entry.key.kind, 'string'), () => entry.key.value, () => String(index)),
            () => String(index));
        const field = childFields[index];
        return {
            name: SemanticValueFactory.responseFieldName(childKey),
            propertyName: field.propertyName,
            value: resolveAstValueToExpression(entry.value)
        };
    });
    const expression = ResourceFieldExpressionFactory.object(expressionFields);
    const verifiedFields = relationSelect(childFields, field => relationEqual(field.semantic.kind, 'verified'));
    const objectProperties = relationProject(verifiedFields, field => {
        const type = requireResourceFieldType(field.semantic);
        return { name: field.propertyName, type, description: "", origin: { kind: 'derived' as const, reason: 'nested_object' as const } };
    });
    const descriptor = ResourceFieldSemanticBinding.fromExpression(
        key,
        expression,
        scannerSemanticType.object({ name: "InlineObject", baseName: "InlineObject", properties: objectProperties, role: "plain" }),
        toCamelCase(key),
        boundAst
    );

    return { descriptor, boundAst };
}
