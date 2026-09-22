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

export class ScannedRouteValidationRuleEntry implements RouteValidationRuleEntry {
    public readonly fieldName: PropertyName;
    public readonly sourceField: PropertyName;
    public readonly location: ValidationFieldLocation;
    public readonly shape: ValidationFieldShape;
    public readonly semanticType: SemanticType;
    public readonly presence: RequestFieldPresence;
    public readonly validation: readonly ValidationRuleNode[];
    public readonly source: SourceSpan;

    constructor(params: ScannedRouteValidationRuleParams) {
        this.fieldName = params.fieldName;
        this.sourceField = params.sourceField;
        this.location = params.location;
        this.shape = params.shape;
        this.semanticType = params.semanticType;
        this.presence = params.presence;
        this.validation = Object.freeze([...params.validation]);
        this.source = params.source;
        Object.freeze(this);
    }

    public static create(
        fieldName: string,
        rules: readonly string[],
        validation: readonly ValidationRuleNode[] = ValidationRuleParser.parseAll(rules),
        source: SourceSpan = { kind: 'source_span', file: SemanticValueFactory.sourceFilePath('<validation>'), start: { kind: 'number_value', value: 0 }, end: { kind: 'number_value', value: 0 } }
    ): ScannedRouteValidationRuleEntry {
        const sourceField = SemanticValueFactory.propertyName(fieldName);
        const semanticType = resolveSemanticType(validation);
        const presence = resolvePresence(validation);
        const location = resolveLocation(fieldName);
        return new ScannedRouteValidationRuleEntry({
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
}

function canonicalFieldName(fieldName: string, location: ValidationFieldLocation): PropertyName {
    return location.kind === 'root' ? SemanticValueFactory.propertyName(fieldName) : location.collection;
}

function resolveLocation(fieldName: string): ValidationFieldLocation {
    const parts = fieldName.split('.');
    const wildcardIndex = parts.indexOf('*');
    if (wildcardIndex === -1) return { kind: 'root' };
    const collection = parts.slice(0, wildcardIndex).join('.');
    const path = parts.slice(wildcardIndex + 1).map(SemanticValueFactory.propertyName);
    return {
        kind: 'collection_element',
        collection: SemanticValueFactory.propertyName(collection),
        path: Object.freeze(path)
    };
}

function resolveShape(fieldName: string, semanticType: SemanticType, validation: readonly ValidationRuleNode[], source: SourceSpan): ValidationFieldShape {
    const parts = fieldName.split('.');
    const wildcardIndex = parts.indexOf('*');
    if (wildcardIndex === -1) {
        if (isCollection(semanticType)) {
            return {
                kind: 'collection',
                elementType: collectionElementType(semanticType),
                element: { kind: 'scalar' }
            };
        }
        return { kind: 'scalar' };
    }

    const tail = parts.slice(wildcardIndex + 1).map(SemanticValueFactory.propertyName);
    const element = buildNestedObjectShape(tail, semanticType, validation, source);
    const elementType = objectTypeForShape(parts.slice(0, wildcardIndex).join('.'), element);
    return {
        kind: 'collection',
        elementType,
        element
    };
}

function buildNestedObjectShape(
    path: readonly PropertyName[],
    leafType: SemanticType,
    validation: readonly ValidationRuleNode[],
    source: SourceSpan
): ValidationFieldShape {
    if (path.length === 0) return { kind: 'scalar' };

    const [head, ...tail] = path;
    const childShape = tail.length === 0
        ? { kind: 'scalar' as const }
        : buildNestedObjectShape(tail, leafType, validation, source);
    const childType = tail.length === 0
        ? leafType
        : objectTypeForShape(head.value.value, childShape);
    const childPresence = tail.length === 0
        ? resolvePresence(validation)
        : RequestFieldPresenceFactory.unspecified();
    const childValidation = tail.length === 0 ? validation : Object.freeze([]);

    return {
        kind: 'object',
        fields: Object.freeze([{
            name: head,
            semanticType: childType,
            presence: childPresence,
            validation: childValidation,
            shape: childShape,
            source
        }])
    };
}

function objectTypeForShape(name: string, shape: ValidationFieldShape): ObjectType {
    if (shape.kind !== 'object') {
        return new ObjectType({ name, baseName: name, properties: [], role: 'plain' });
    }
    return new ObjectType({
        name,
        baseName: name,
        properties: shape.fields.map(field => ({
            name: field.name,
            type: field.semanticType,
            description: '',
            origin: { kind: 'validation_field', field: field.name.value.value }
        })),
        role: 'plain'
    });
}

function isCollection(type: SemanticType): boolean {
    return type.kind === 'readonly_collection' || type.kind === 'mutable_collection';
}

function collectionElementType(type: SemanticType): SemanticType {
    if (type.kind !== 'readonly_collection' && type.kind !== 'mutable_collection') return new PrimitiveType(PrimitiveKind.UNKNOWN);
    return type.elementType;
}

function resolveSemanticType(validation: readonly ValidationRuleNode[]): SemanticType {
    const explicit = validation.find(rule =>
        rule.kind === 'string' || rule.kind === 'number' || rule.kind === 'boolean' ||
        rule.kind === 'array' || rule.kind === 'date' || rule.kind === 'file' || rule.kind === 'image'
    );
    if (!explicit) return new PrimitiveType(PrimitiveKind.UNKNOWN);
    if (explicit.kind === 'number') return new PrimitiveType(PrimitiveKind.NUMBER);
    if (explicit.kind === 'boolean') return new PrimitiveType(PrimitiveKind.BOOLEAN);
    if (explicit.kind === 'date') return new PrimitiveType(PrimitiveKind.DATETIME);
    if (explicit.kind === 'file' || explicit.kind === 'image') return new PrimitiveType(PrimitiveKind.FILE);
    if (explicit.kind === 'array') {
        const element = explicit.elementType;
        return new ReadonlyCollectionType(
            CollectionKind.ARRAY,
            element.kind === 'specified' ? element.type : new PrimitiveType(PrimitiveKind.UNSPECIFIED)
        );
    }
    return new PrimitiveType(PrimitiveKind.STRING);
}

function resolvePresence(validation: readonly ValidationRuleNode[]): RequestFieldPresence {
    const required = validation.some(rule => rule.kind === 'required');
    const nullable = validation.some(rule => rule.kind === 'nullable');
    return required
        ? RequestFieldPresenceFactory.required(nullable)
        : RequestFieldPresenceFactory.optional(nullable);
}
