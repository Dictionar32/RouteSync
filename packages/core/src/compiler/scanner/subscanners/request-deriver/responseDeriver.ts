/**
 * responseDeriver.ts
 *
 * Response semantics are derived through relation candidates and recursive
 * sequence closure. Presence is represented by RelationOption rather than a
 * host-language absence sentinel.
 */

import type { RouteSemanticFlow } from "../../../../types/route";
import type { ResourceAst } from "../../../../types/upstream/ast";
import type { Sequence } from "../../../../types/upstream/collections";
import { typeExpressionToSemanticType } from "../semantic/resourceTypeDeriver";
import type { ResponseData } from "../../../artifacts/RequestTypesArtifact";
import type { ResponseContract, ResponseContractField, ResponseValueContract } from "../../../../types/domain/responseContracts";
import { createResponseFieldName, createResponseTypeName } from "../../../../types/domain/semanticValueFactories";
import { PrimitiveKind, type SemanticType } from "../../../types/SemanticType";
import { ScannedObjectProperty } from "../../../types/SemanticType";
import {
    relationAny,
    relationEqual,
    relationGate,
    relationOptionFold,
    relationOptionMap,
    relationProject,
    relationSome,
    relationNone,
    type RelationOption,
} from "../../../../semantic/kernel/relationalSequence";

const isCollectionShape = (shape: string): boolean =>
    relationAny([relationEqual(shape, 'collection'), relationEqual(shape, 'paginated')]);

const toPrimitiveResponseValue = (type: Extract<SemanticType, { kind: 'primitive' }>): ResponseValueContract =>
    relationGate(
        relationAny([
            relationEqual(type.type, PrimitiveKind.STRING),
            relationEqual(type.type, PrimitiveKind.DATETIME),
            relationEqual(type.type, PrimitiveKind.FILE),
        ]),
        () => ({ kind: 'scalar', value: { kind: 'textual' } }),
        () => relationGate(
            relationEqual(type.type, PrimitiveKind.NUMBER),
            () => ({ kind: 'scalar', value: { kind: 'decimal_number' } }),
            () => relationGate(
                relationEqual(type.type, PrimitiveKind.BOOLEAN),
                () => ({ kind: 'scalar', value: { kind: 'boolean_flag' } }),
                () => ({ kind: 'unresolved_declaration', reason: 'mixed_declaration' }),
            ),
        ),
    );

function toResponseValue(type: SemanticType): ResponseValueContract {
    return relationGate(
        relationEqual(type.kind, 'primitive'),
        () => toPrimitiveResponseValue(type as Extract<SemanticType, { kind: 'primitive' }>),
        () => relationGate(
            relationEqual(type.kind, 'reference'),
            () => ({ kind: 'named_type', name: createResponseTypeName((type as Extract<SemanticType, { kind: 'reference' }>).name) }),
            () => relationGate(
                relationAny([relationEqual(type.kind, 'readonly_collection'), relationEqual(type.kind, 'mutable_collection')]),
                () => ({ kind: 'collection', element: toResponseValue((type as Extract<SemanticType, { kind: 'readonly_collection' | 'mutable_collection' }>).elementType) }),
                () => relationGate(
                    relationAny([relationEqual(type.kind, 'object')]),
                    () => ({ kind: 'named_type', name: createResponseTypeName((type as Extract<SemanticType, { kind: 'object' }>).name) }),
                    () => relationGate(
                        relationAny([relationEqual(type.kind, 'nullable'), relationEqual(type.kind, 'optional')]),
                        () => toResponseValue((type as Extract<SemanticType, { kind: 'nullable' | 'optional' }>).innerType),
                        () => ({ kind: 'unresolved_declaration', reason: 'mixed_declaration' }),
                    ),
                ),
            ),
        ),
    );
}

function toContractField(field: ScannedObjectProperty): ResponseContractField {
    return {
        name: createResponseFieldName(field.name),
        value: toResponseValue(field.type),
        nullability: relationGate(field.type.isNullable(), () => ({ kind: 'nullable' }), () => ({ kind: 'required' })),
        evidence: { kind: 'declared' },
    };
}

function toResourceContract(
    name: string,
    fields: readonly ScannedObjectProperty[],
    shape: 'single' | 'collection'
): ResponseContract {
    return {
        kind: 'object',
        name: createResponseTypeName(name),
        shape,
        fields: relationProject(fields, field => toContractField(field)),
    };
}

function toResponseFields(
    fields: readonly import("../../../../types/upstream/resource").ResourceField[]
): readonly ScannedObjectProperty[] {
    return relationProject(fields, field => ScannedObjectProperty.create({
        name: field.name,
        type: typeExpressionToSemanticType(field.type),
        description: '',
        origin: { kind: 'derived', reason: 'resource_ast_field' },
    }));
}

function responseResource(
    route: RouteSemanticFlow,
    resources: ReadonlyMap<string, ResourceAst>
): RelationOption<ResourceAst> {
    const response = route.binding.response;
    return relationGate(
        relationEqual(response.kind, 'resource'),
        () => {
            const resourceName = response.resourceName.value;
            return relationGate(
                resources.has(resourceName),
                () => relationSome(resources.get(resourceName) as ResourceAst),
                () => relationNone<ResourceAst>(),
            );
        },
        () => relationNone<ResourceAst>(),
    );
}

export function deriveActionResponseData(
    route: RouteSemanticFlow,
    resourceIndex: ReadonlyMap<string, ResourceAst>
): RelationOption<ResponseData> {
    const response = route.binding.response;
    return relationGate(
        relationEqual(response.kind, 'void'),
        () => relationNone<ResponseData>(),
        () => relationGate(
            relationEqual(response.kind, 'inline'),
            () => relationSome({
                fields: toResponseFields(response.fields),
                contract: {
                    kind: 'object',
                    name: createResponseTypeName(response.typeName.value),
                    shape: relationGate(isCollectionShape(response.shape), () => 'collection' as const, () => 'single' as const),
                    fields: relationProject(response.fields, field => ({
                        name: createResponseFieldName(field.propertyName.value),
                        value: toResponseValue(field.semantic.type),
                        nullability: relationGate(field.type.isNullable(), () => ({ kind: 'nullable' as const }), () => ({ kind: 'required' as const })),
                        evidence: { kind: 'declared' as const },
                    })),
                },
            }),
            () => relationOptionMap(
                responseResource(route, resourceIndex),
                resource => ({
                    fields: toResponseFields(sequenceToArray(resource.definition.fields.items)),
                    contract: toResourceContract(
                        resource.definition.name.value.value,
                        toResponseFields(sequenceToArray(resource.definition.fields.items)),
                        relationGate(isCollectionShape(response.shape), () => 'collection' as const, () => 'single' as const),
                    ),
                }),
            ),
        ),
    );
}

export function extractResourceResponseFields(
    resource: ResourceAst
): readonly ScannedObjectProperty[] {
    return toResponseFields(sequenceToArray(resource.definition.fields.items));
}

function sequenceToArray<T>(sequence: Sequence<T>, index = 0, output: readonly T[] = []): readonly T[] {
    return relationGate(
        relationEqual(sequence.kind, 'cons'),
        () => sequenceToArray(sequence.tail, index + 1, [...output, sequence.head]),
        () => output,
    );
}
