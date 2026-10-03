/** Canonical route validation fact produced at the scanner boundary. */
import type { PropertyName } from "../../../../types/domain/semanticValues";
import type {
    ValidationFieldShape,
    ValidationRuleNode,
    RouteValidationRuleEntry,
    ValidationFieldLocation
} from "../../../../types/domain/validationRules";
import {
    PrimitiveKind,
    PrimitiveType,
    ReadonlyCollectionType,
    CollectionKind,
    type SemanticType,
    ObjectType
} from "../../../types/SemanticType";
import { RequestFieldPresenceFactory, type RequestFieldPresence } from "../../../../types/domain/requestFieldPresence";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import { ValidationRuleParser } from "../../../../types/domain/validationRules";
import type { SourceSpan } from "../../../../types/upstream/provenance";
import {
    relationGate,
    relationIndexOf,
    relationProject,
    relationFirstOption,
    relationOptionFold,
    relationAnyMatch,
    relationRange,
} from "../../../../semantic/kernel/relationalSequence";

export interface ScannedRouteValidationRuleParams {
    readonly fieldName: PropertyName;
    readonly sourceField: PropertyName;
    readonly location: ValidationFieldLocation;
    readonly shape: ValidationFieldShape;
    readonly semanticType: SemanticType;
    readonly presence: RequestFieldPresence;
    readonly validation: readonly ValidationRuleNode[];
    readonly source: SourceSpan;
}

export type CanonicalRouteValidationRuleEntry = RouteValidationRuleEntry;

const createCanonicalRouteValidationRuleEntry = (params: ScannedRouteValidationRuleParams): CanonicalRouteValidationRuleEntry => Object.freeze({
    fieldName: params.fieldName,
    sourceField: params.sourceField,
    location: params.location,
    shape: params.shape,
    semanticType: params.semanticType,
    presence: params.presence,
    validation: Object.freeze([...params.validation]),
    source: params.source
});

export const CanonicalRouteValidationRuleEntry = Object.freeze({
    create: (
        fieldName: string,
        rules: readonly string[],
        validation: readonly ValidationRuleNode[] = ValidationRuleParser.parseAll(rules),
        source: SourceSpan = { kind: 'source_span', file: SemanticValueFactory.sourceFilePath('<validation>'), start: { kind: 'number_value', value: 0 }, end: { kind: 'number_value', value: 0 } }
    ): CanonicalRouteValidationRuleEntry => {
        const sourceField = SemanticValueFactory.propertyName(fieldName);
        const semanticType = resolveSemanticType(validation);
        const presence = resolvePresence(validation);
        const location = resolveLocation(fieldName);
        return createCanonicalRouteValidationRuleEntry({
            fieldName: canonicalFieldName(fieldName, location),
            sourceField,
            location,
            shape: resolveShape(fieldName, semanticType, validation, source),
            semanticType,
            presence,
            validation,
            source
        });
    }
});

function canonicalFieldName(fieldName: string, location: ValidationFieldLocation): PropertyName {
    return relationGate(Object.is(location.kind, 'root'), () => SemanticValueFactory.propertyName(fieldName), () => location.collection);
}

function resolveLocation(fieldName: string): ValidationFieldLocation {
    const parts = fieldName.split('.');
    const wildcardIndex = relationIndexOf(parts, part => Object.is(part, '*'));
    return relationGate(Object.is(wildcardIndex, -1),
        () => ({ kind: 'root' as const }),
        () => ({
            kind: 'collection_element' as const,
            collection: SemanticValueFactory.propertyName(relationRange(parts, 0, wildcardIndex).join('.')),
            path: Object.freeze(relationProject(relationRange(parts, wildcardIndex + 1, parts.length), SemanticValueFactory.propertyName))
        }));
}

function resolveShape(fieldName: string, semanticType: SemanticType, validation: readonly ValidationRuleNode[], source: SourceSpan): ValidationFieldShape {
    const parts = fieldName.split('.');
    const wildcardIndex = relationIndexOf(parts, part => Object.is(part, '*'));
    return relationGate(Object.is(wildcardIndex, -1),
        () => relationGate(isCollection(semanticType),
            () => ({ kind: 'collection' as const, elementType: collectionElementType(semanticType), element: { kind: 'scalar' as const } }),
            () => ({ kind: 'scalar' as const })),
        () => {
            const tail = relationProject(relationRange(parts, wildcardIndex + 1, parts.length), SemanticValueFactory.propertyName);
            const element = buildNestedObjectShape(tail, semanticType, validation, source);
            return {
                kind: 'collection' as const,
                elementType: objectTypeForShape(relationRange(parts, 0, wildcardIndex).join('.'), element),
                element
            };
        });
}

function buildNestedObjectShape(
    path: readonly PropertyName[],
    leafType: SemanticType,
    validation: readonly ValidationRuleNode[],
    source: SourceSpan
): ValidationFieldShape {
    return relationGate(Object.is(path.length, 0),
        () => ({ kind: 'scalar' as const }),
        () => {
            const head = path[0];
            const tail = relationRange(path, 1, path.length);
            const childShape = relationGate(Object.is(tail.length, 0),
                () => ({ kind: 'scalar' as const }),
                () => buildNestedObjectShape(tail, leafType, validation, source));
            const childType = relationGate(Object.is(tail.length, 0),
                () => leafType,
                () => objectTypeForShape(head.value.value, childShape));
            const childPresence = relationGate(Object.is(tail.length, 0),
                () => resolvePresence(validation),
                () => RequestFieldPresenceFactory.unspecified());
            const childValidation = relationGate(Object.is(tail.length, 0),
                () => validation,
                () => Object.freeze([] as readonly ValidationRuleNode[]));
            return {
                kind: 'object' as const,
                fields: Object.freeze([{
                    name: head,
                    semanticType: childType,
                    presence: childPresence,
                    validation: childValidation,
                    shape: childShape,
                    source
                }])
            };
        });
}

function objectTypeForShape(name: string, shape: ValidationFieldShape): ObjectType {
    return relationGate(Object.is(shape.kind, 'object'),
        () => ObjectType({
            name,
            baseName: name,
            properties: relationProject(shape.fields, field => ({
                name: field.name,
                type: field.semanticType,
                description: '',
                origin: { kind: 'validation_field' as const, field: field.name.value.value }
            })),
            role: 'plain'
        }),
        () => ObjectType({ name, baseName: name, properties: [], role: 'plain' }));
}

function isCollection(type: SemanticType): boolean {
    return relationAnyMatch([type.kind], kind => relationAnyMatch(['readonly_collection', 'mutable_collection'], candidate => Object.is(candidate, kind)));
}

function collectionElementType(type: SemanticType): SemanticType {
    return relationGate(isCollection(type),
        () => (type as ReadonlyCollectionType).elementType,
        () => primitiveType(PrimitiveKind.UNSPECIFIED));
}

function resolveSemanticType(validation: readonly ValidationRuleNode[]): SemanticType {
    const explicit = relationFirstOption(validation, rule => relationAnyMatch(
        ['string', 'number', 'boolean', 'array', 'date', 'file', 'image'],
        kind => Object.is(kind, rule.kind)
    ));
    return relationOptionFold(explicit,
        () => primitiveType(PrimitiveKind.UNSPECIFIED),
        rule => relationGate(Object.is(rule.kind, 'number'),
            () => primitiveType(PrimitiveKind.NUMBER),
            () => relationGate(Object.is(rule.kind, 'boolean'),
                () => primitiveType(PrimitiveKind.BOOLEAN),
                () => relationGate(Object.is(rule.kind, 'date'),
                    () => primitiveType(PrimitiveKind.DATETIME),
                    () => relationGate(relationAnyMatch(['file', 'image'], kind => Object.is(kind, rule.kind)),
                        () => primitiveType(PrimitiveKind.FILE),
                        () => relationGate(Object.is(rule.kind, 'array'),
                            () => {
                                const element = rule.elementType;
                                return ReadonlyCollectionType(CollectionKind.ARRAY,
                                    relationGate(Object.is(element.kind, 'specified'), () => element.type, () => primitiveType(PrimitiveKind.UNSPECIFIED)));
                            },
                            () => primitiveType(PrimitiveKind.STRING)))))));
}

function resolvePresence(validation: readonly ValidationRuleNode[]): RequestFieldPresence {
    const required = relationAnyMatch(validation, rule => Object.is(rule.kind, 'required'));
    const conditional = relationAnyMatch(validation, rule => relationAnyMatch(
        ['required_with', 'required_with_all', 'required_without', 'required_without_all', 'required_if', 'required_unless'],
        kind => Object.is(kind, rule.kind)
    ));
    const nullable = relationAnyMatch(validation, rule => Object.is(rule.kind, 'nullable'));
    return relationGate(required,
        () => RequestFieldPresenceFactory.required(nullable),
        () => relationGate(conditional,
            () => RequestFieldPresenceFactory.unspecified(),
            () => RequestFieldPresenceFactory.optional(nullable)));
}
