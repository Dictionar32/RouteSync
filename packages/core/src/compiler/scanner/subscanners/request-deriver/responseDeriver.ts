/**
 * responseDeriver.ts
 *
 * Carries verified response semantics from the scanner boundary.
 * No raw expression conversion and no fallback response inference.
 */

import type { ParsedResource, ParsedRoute } from "../../../../types/route";
import type { ResponseData } from "../../../artifacts/RequestTypesArtifact";
import type { ResponseContract, ResponseContractField, ResponseValueContract } from "../../../../types/domain/responseContracts";
import { createResponseFieldName, createResponseTypeName } from "../../../../types/domain/semanticValueFactories";
import { PrimitiveKind, type SemanticType } from "../../../types/SemanticType";
import { ScannedObjectProperty } from "../../../types/SemanticType";

function toResponseValue(type: SemanticType): ResponseValueContract {
    switch (type.kind) {
        case 'primitive':
            switch (type.type) {
                case PrimitiveKind.STRING:
                case PrimitiveKind.DATETIME:
                case PrimitiveKind.FILE:
                    return { kind: 'scalar', value: { kind: 'textual' } };
                case PrimitiveKind.NUMBER:
                    return { kind: 'scalar', value: { kind: 'decimal_number' } };
                case PrimitiveKind.BOOLEAN:
                    return { kind: 'scalar', value: { kind: 'boolean_flag' } };
                case PrimitiveKind.UNKNOWN:
                case PrimitiveKind.UNSPECIFIED:
                    return { kind: 'unresolved_declaration', reason: 'mixed_declaration' };
            }
        case 'reference':
            return { kind: 'named_type', name: createResponseTypeName(type.name) };
        case 'readonly_collection':
        case 'mutable_collection':
            return { kind: 'collection', element: toResponseValue(type.elementType) };
        case 'object':
            return { kind: 'named_type', name: createResponseTypeName(type.name) };
        case 'nullable':
            return toResponseValue(type.innerType);
        case 'optional':
            return toResponseValue(type.innerType);
        case 'never':
        case 'error':
        case 'union':
        case 'intersection':
        case 'generic':
            return { kind: 'unresolved_declaration', reason: 'mixed_declaration' };
    }
}

function toContractField(field: ScannedObjectProperty): ResponseContractField {
    return {
        name: createResponseFieldName(field.name),
        value: toResponseValue(field.type),
        nullability: field.type.isNullable() ? { kind: 'nullable' } : { kind: 'required' },
        evidence: { kind: 'declared' }
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
        fields: fields.map(toContractField)
    };
}

function toResponseFields(
    fields: readonly ParsedResource["fields"][number][]
): readonly ScannedObjectProperty[] {
    return fields.map(field => ScannedObjectProperty.create({
        name: field.propertyName,
        type: field.semantic.type,
        description: '',
        origin: { kind: 'bound_expression', bound: field.semantic.bound },
    }));
}

function responseResource(
    route: ParsedRoute,
    resources: ReadonlyMap<string, ParsedResource>
): ParsedResource | undefined {
    const response = route.binding.response;
    switch (response.kind) {
        case 'resource':
            return resources.get(response.resourceName.value);
        case 'model':
        case 'inline':
        case 'void':
            return undefined;
    }
}

export function deriveActionResponseData(
    route: ParsedRoute,
    resourceIndex: ReadonlyMap<string, ParsedResource>
): ResponseData | undefined {
    const response = route.binding.response;
    if (response.kind === 'void') return undefined;

    if (response.kind === 'inline') {
        return {
            fields: toResponseFields(response.fields),
            contract: {
                kind: 'object',
                name: createResponseTypeName(response.typeName.value),
                shape: response.shape === 'collection' || response.shape === 'paginated' ? 'collection' : 'single',
                fields: response.fields.map(field => ({
                    name: createResponseFieldName(field.propertyName.value),
                    value: toResponseValue(field.semantic.type),
                    nullability: field.type.isNullable() ? { kind: 'nullable' } : { kind: 'required' },
        evidence: { kind: 'declared' }
                }))
            }
        };
    }

    const resource = responseResource(route, resourceIndex);
    if (resource === undefined) return undefined;

    return {
        fields: toResponseFields(resource.fields),
        contract: toResourceContract(
            resource.name.value,
            toResponseFields(resource.fields),
            response.shape === 'collection' || response.shape === 'paginated' ? 'collection' : 'single'
        )
    };
}

export function extractResourceResponseFields(
    resource: ParsedResource
): readonly ScannedObjectProperty[] {
    return toResponseFields(resource.fields);
}
