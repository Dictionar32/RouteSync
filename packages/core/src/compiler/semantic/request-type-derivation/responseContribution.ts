/**
 * responseDeriver.ts
 *
 * Response semantics are derived through relation candidates and recursive
 * sequence closure. Presence is represented by RelationOption rather than a
 * host-language absence sentinel.
 */

import type { RouteSemanticFlow } from "../../../types/route";
import type { ResourceAst } from "../../../types/upstream/ast";
import type { Sequence } from "../../../types/upstream/collections";
import { typeExpressionToSemanticType } from "../type-derivation/resourceTypeDeriver";
import type { ResponseData } from "../../artifacts/RequestTypesArtifact";
import type { ResponseContract, ResponseContractField, ResponseValueContract } from "../../../types/domain/responseContracts";
import { createResponseFieldName, createResponseTypeName } from "../../../types/domain/semanticValueFactories";
import { PrimitiveKind, type SemanticType } from "../../../types/domain/semanticType";
import { ScannedObjectProperty } from "../../../types/domain/semanticType";
import {
    relationAny,
    relationEqual,
    relationGate,
    relationOptionFold,
    relationOptionMap,
    relationProject,
    relationVariantFold,
    relationSome,
    relationNone,
    type RelationOption,
} from "../../../semantic/relations/relationalSequence";

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
    return relationVariantFold(type, 'primitive', () => relationVariantFold(
        type,
        'reference',
        () => relationVariantFold(
            type,
            'readonly_collection',
            () => relationVariantFold(
                type,
                'mutable_collection',
                () => relationVariantFold(
                    type,
                    'object',
                    () => relationVariantFold(
                        type,
                        'nullable',
                        () => relationVariantFold(
                            type,
                            'optional',
                            () => ({ kind: 'unresolved_declaration', reason: 'mixed_declaration' }),
                            optional => toResponseValue(optional.innerType),
                        ),
                        nullable => toResponseValue(nullable.innerType),
                    ),
                    object => ({ kind: 'named_type', name: createResponseTypeName(object.name) }),
                ),
                mutableCollection => ({ kind: 'collection', element: toResponseValue(mutableCollection.elementType) }),
            ),
            readonlyCollection => ({ kind: 'collection', element: toResponseValue(readonlyCollection.elementType) }),
        ),
        reference => ({ kind: 'named_type', name: createResponseTypeName(reference.name) }),
    ), primitive => toPrimitiveResponseValue(primitive));
}

function toContractField(field: ScannedObjectProperty): ResponseContractField {
    return {
        name: createResponseFieldName(field.name.value.value),
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
    fields: readonly import("../../../types/upstream/resource").ResourceField[]
): readonly ScannedObjectProperty[] {
    return relationProject(fields, field => ScannedObjectProperty.create({
        name: field.name,
        type: typeExpressionToSemanticType(field.type),
        description: '',
        origin: { kind: 'derived', reason: 'semantic_resolution' },
    }));
}

function responseResource(
    route: RouteSemanticFlow,
    resources: ReadonlyMap<string, ResourceAst>
): RelationOption<ResourceAst> {
    const projection = route.binding.responseProjection;
    switch (projection.kind) {
        case 'controller_method_response': {
            const result = projection.product.result;
            if (result.kind !== 'resource') return relationNone<ResourceAst>();
            const resourceName = result.resource.name.value.value;
            return relationGate(
                resources.has(resourceName),
                () => relationSome(resources.get(resourceName) as ResourceAst),
                () => relationNone<ResourceAst>(),
            );
        }
        case 'controller_response_projection_blocked':
        case 'inline_response':
        case 'redirect_response':
        case 'file_response':
        case 'empty_response':
            return relationNone<ResourceAst>();
        case 'declared_response':
            return relationNone<ResourceAst>();
    }
}

const deriveIntegratedResourceResponseData = (
    route: RouteSemanticFlow,
    resourceIndex: ReadonlyMap<string, ResourceAst>,
): RelationOption<ResponseData> => {
    const projection = route.binding.responseProjection;
    if (projection.kind !== 'controller_method_response') return relationNone<ResponseData>();
    const result = projection.product.result;
    if (result.kind === 'no_content') return relationNone<ResponseData>();
    if (result.kind !== 'resource') return relationNone<ResponseData>();
    return relationOptionMap(responseResource(route, resourceIndex), resource => {
        const fields = toResponseFields(sequenceToArray(resource.definition.fields.items));
        const shape = result.cardinality.kind === 'collection' ? 'collection' as const : 'single' as const;
        return {
            fields,
            contract: toResourceContract(resource.definition.name.value.value, fields, shape),
        };
    });
};

export interface RequestTypeResponseContributionDerivationInterface {
    readonly derive: (
        route: RouteSemanticFlow,
        resourceIndex: ReadonlyMap<string, ResourceAst>,
    ) => RelationOption<ResponseData>;
}

export interface RequestTypeResourceResponseFieldProjectionInterface {
    readonly project: (resource: ResourceAst) => readonly ScannedObjectProperty[];
}

export const requestTypeResponseContributionDerivation: RequestTypeResponseContributionDerivationInterface = Object.freeze({
    derive: (
        route: RouteSemanticFlow,
        resourceIndex: ReadonlyMap<string, ResourceAst>,
    ): RelationOption<ResponseData> => {
        const projection = route.binding.responseProjection;
        switch (projection.kind) {
            case 'controller_method_response':
                return deriveIntegratedResourceResponseData(route, resourceIndex);
            case 'controller_response_projection_blocked':
            case 'declared_response':
            case 'redirect_response':
            case 'file_response':
            case 'empty_response':
            case 'inline_response':
                return relationNone<ResponseData>();
            default: {
                const exhaustive: never = projection;
                return exhaustive;
            }
        }
    },
});

export const requestTypeResourceResponseFieldProjection: RequestTypeResourceResponseFieldProjectionInterface = Object.freeze({
    project: (resource: ResourceAst): readonly ScannedObjectProperty[] =>
        toResponseFields(sequenceToArray(resource.definition.fields.items)),
});

function sequenceToArray<T>(sequence: Sequence<T>, index = 0, output: readonly T[] = []): readonly T[] {
    switch (sequence.kind) {
        case 'cons':
            return sequenceToArray(sequence.tail, index + 1, [...output, sequence.head]);
        case 'empty':
            return output;
    }
}
