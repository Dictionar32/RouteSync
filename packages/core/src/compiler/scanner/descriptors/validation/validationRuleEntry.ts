import { scannerSemanticType } from '../../semanticTypeConstructionRelations';
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
    relationEqual,
    relationFirstOption,
    relationGate,
    relationIndexOf,
    relationOptionFold,
    relationProject,
    relationRange,
    relationResolve,
} from "../../../../semantic/kernel/relationalSequence";
import { solveCandidate } from "../../../../semantic/kernel/semanticDecisionRewriteEngine";

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

export interface ScannedRouteValidationRuleEntry extends RouteValidationRuleEntry {}

export const ScannedRouteValidationRuleEntry = Object.freeze({
    create(
        fieldName: string,
        rules: readonly string[],
        validation: readonly ValidationRuleNode[] = ValidationRuleParser.parseAll(rules),
        source: SourceSpan = { kind: 'source_span', file: SemanticValueFactory.sourceFilePath('<validation>'), start: { kind: 'number_value', value: 0 }, end: { kind: 'number_value', value: 0 } }
    ): ScannedRouteValidationRuleEntry {
        const sourceField = SemanticValueFactory.propertyName(fieldName);
        const semanticType = resolveSemanticType(validation);
        const presence = resolvePresence(validation);
        const location = resolveLocation(fieldName);
        return Object.freeze({
            fieldName: canonicalFieldName(fieldName, location),
            sourceField,
            location,
            shape: resolveShape(fieldName, semanticType, validation, source),
            semanticType,
            presence,
            validation: Object.freeze([...validation]),
            source
        });
    }
});

function canonicalFieldName(fieldName: string, location: ValidationFieldLocation): PropertyName {
    return relationGate(
        relationEqual(location.kind, 'root'),
        () => SemanticValueFactory.propertyName(fieldName),
        () => location.collection,
    );
}

function resolveLocation(fieldName: string): ValidationFieldLocation {
    const parts = fieldName.split('.');
    const wildcardIndex = relationIndexOf(parts, part => relationEqual(part, '*'));
    return relationGate(
        relationEqual(wildcardIndex, -1),
        () => ({ kind: 'root' as const }),
        () => {
            const collectionParts = relationRange(parts, 0, wildcardIndex);
            const pathParts = relationRange(parts, wildcardIndex + 1, parts.length);
            const collection = collectionParts.join('.');
            const path = relationProject(pathParts, part => SemanticValueFactory.propertyName(part));
            return {
                kind: 'collection_element' as const,
                collection: SemanticValueFactory.propertyName(collection),
                path: Object.freeze(path)
            };
        },
    );
}

function resolveShape(
    fieldName: string,
    semanticType: SemanticType,
    validation: readonly ValidationRuleNode[],
    source: SourceSpan,
): ValidationFieldShape {
    const parts = fieldName.split('.');
    const wildcardIndex = relationIndexOf(parts, part => relationEqual(part, '*'));
    return relationGate(
        relationEqual(wildcardIndex, -1),
        () => relationGate(
            isCollection(semanticType),
            () => ({
                kind: 'collection' as const,
                elementType: collectionElementType(semanticType),
                element: { kind: 'scalar' as const }
            }),
            () => ({ kind: 'scalar' as const }),
        ),
        () => {
            const tail = relationProject(
                relationRange(parts, wildcardIndex + 1, parts.length),
                part => SemanticValueFactory.propertyName(part),
            );
            const element = buildNestedObjectShape(tail, semanticType, validation, source);
            const collectionName = relationRange(parts, 0, wildcardIndex).join('.');
            const elementType = objectTypeForShape(collectionName, element);
            return {
                kind: 'collection' as const,
                elementType,
                element
            };
        },
    );
}

function buildNestedObjectShape(
    path: readonly PropertyName[],
    leafType: SemanticType,
    validation: readonly ValidationRuleNode[],
    source: SourceSpan,
): ValidationFieldShape {
    return relationGate(
        relationEqual(path.length, 0),
        () => ({ kind: 'scalar' as const }),
        () => {
            const head = path[0];
            const tail = relationRange(path, 1, path.length);
            const childShape = buildNestedObjectShape(tail, leafType, validation, source);
            const childType = relationGate(
                relationEqual(tail.length, 0),
                () => leafType,
                () => objectTypeForShape(head.value.value, childShape),
            );
            const childPresence = relationGate(
                relationEqual(tail.length, 0),
                () => resolvePresence(validation),
                () => RequestFieldPresenceFactory.unspecified(),
            );
            const childValidation = relationGate(
                relationEqual(tail.length, 0),
                () => validation,
                () => Object.freeze([] as readonly ValidationRuleNode[]),
            );
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
        },
    );
}

function objectTypeForShape(name: string, shape: ValidationFieldShape): ObjectType {
    return relationGate(
        relationEqual(shape.kind, 'object'),
        () => scannerSemanticType.object({
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
        () => scannerSemanticType.object({ name, baseName: name, properties: [], role: 'plain' }),
    );
}

function isCollection(type: SemanticType): boolean {
    return relationGate(relationEqual(type.kind, 'readonly_collection'), () => true, () => relationEqual(type.kind, 'mutable_collection'));
}

function collectionElementType(type: SemanticType): SemanticType {
    return relationGate(
        relationGate(relationEqual(type.kind, 'readonly_collection'), () => true, () => relationEqual(type.kind, 'mutable_collection')),
        () => type.elementType,
        () => scannerSemanticType.unspecified(),
    );
}

function resolveSemanticType(validation: readonly ValidationRuleNode[]): SemanticType {
    const explicit = relationFirstOption(
        validation,
        rule => relationGate(relationEqual(rule.kind, 'string'), () => true, () => relationGate(relationEqual(rule.kind, 'number'), () => true, () => relationGate(relationEqual(rule.kind, 'boolean'), () => true, () => relationGate(relationEqual(rule.kind, 'array'), () => true, () => relationGate(relationEqual(rule.kind, 'date'), () => true, () => relationGate(relationEqual(rule.kind, 'file'), () => true, () => relationEqual(rule.kind, 'image'))))))),
    );
    return relationOptionFold(
        explicit,
        () => scannerSemanticType.unspecified(),
        rule => relationOptionFold(
            solveCandidate([
                { id: 'number', value: scannerSemanticType.number(), requirements: [{ id: 'kind', satisfied: relationEqual(rule.kind, 'number') }] },
                { id: 'boolean', value: scannerSemanticType.boolean(), requirements: [{ id: 'kind', satisfied: relationEqual(rule.kind, 'boolean') }] },
                { id: 'date', value: scannerSemanticType.datetime(), requirements: [{ id: 'kind', satisfied: relationEqual(rule.kind, 'date') }] },
                { id: 'file', value: scannerSemanticType.file(), requirements: [{ id: 'kind', satisfied: relationGate(relationEqual(rule.kind, 'file'), () => true, () => relationEqual(rule.kind, 'image')) }] },
                { id: 'array', value: relationGate(
                    relationEqual(rule.kind, 'array'),
                    () => scannerSemanticType.collection(
                        CollectionKind.ARRAY,
                        relationGate(
                            relationEqual(rule.elementType.kind, 'specified'),
                            () => rule.elementType.type,
                            () => scannerSemanticType.unspecified(),
                        ),
                    ),
                    () => scannerSemanticType.string(),
                ), requirements: [{ id: 'kind', satisfied: relationEqual(rule.kind, 'array') }] },
                { id: 'string', value: scannerSemanticType.string(), requirements: [{ id: 'kind', satisfied: relationEqual(rule.kind, 'string') }] },
            ]),
            () => scannerSemanticType.unspecified(),
            result => result,
        ),
    );
}

function resolvePresence(validation: readonly ValidationRuleNode[]): RequestFieldPresence {
    const required = relationResolve(relationEqual(relationIndexOf(validation, rule => relationEqual(rule.kind, 'required')), -1), () => false, () => true);
    const nullable = relationResolve(relationEqual(relationIndexOf(validation, rule => relationEqual(rule.kind, 'nullable')), -1), () => false, () => true);
    return relationGate(
        required,
        () => RequestFieldPresenceFactory.required(nullable),
        () => RequestFieldPresenceFactory.optional(nullable),
    );
}
