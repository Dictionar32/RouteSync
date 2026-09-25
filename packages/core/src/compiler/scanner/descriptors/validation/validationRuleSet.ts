/** Scanner-boundary aggregate for complete validation facts. */
import { createPropertyName } from "../../../../types/upstream/names";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import { RequestFieldMeaningFactory } from "../../../../types/domain/requestFieldMeaning";
import type { RequestField } from '../../../../types/domain/request';
import type { ValidationFieldNode } from '../../../../types/domain/validationFields';
import type {
    RouteValidationRuleEntry,
    ValidationFieldShape,
    ValidationFieldProperty
} from '../../../../types/domain/validationRules';
import type { TypeInterner } from '../../../types/TypeInterner';
import { ObjectType, ReadonlyCollectionType, CollectionKind, type ObjectProperty, type SemanticType } from '../../../types/SemanticType';
import { ScannedScalarFieldNode, ScannedObjectFieldNode, ScannedArrayFieldNode } from './fieldNodes';

export interface RouteValidationRuleSet {
    readonly entries: readonly RouteValidationRuleEntry[];
    readonly fields: readonly RequestField[];
    readonly tree: readonly ValidationFieldNode[];
}

export class ScannedRouteValidationRuleSet implements RouteValidationRuleSet {
    public readonly entries: readonly RouteValidationRuleEntry[];
    public readonly fields: readonly RequestField[];
    public readonly tree: readonly ValidationFieldNode[];

    private constructor(entries: readonly RouteValidationRuleEntry[], fields: readonly RequestField[], tree: readonly ValidationFieldNode[]) {
        this.entries = Object.freeze([...entries]);
        this.fields = Object.freeze([...fields]);
        this.tree = Object.freeze([...tree]);
        Object.freeze(this);
    }

    public static create(entries: readonly RouteValidationRuleEntry[], interner: TypeInterner): ScannedRouteValidationRuleSet {
        const roots = collectRoots(entries);
        const fields = Array.from(roots.values()).map(root => toRequestField(root, interner));
        const tree = Array.from(roots.values()).map(root => toTreeNode(root));
        return new ScannedRouteValidationRuleSet(entries, fields, tree);
    }
}

interface RootValidationField {
    readonly name: import("../../../../types/upstream/names").PropertyName;
    readonly semanticType: SemanticType;
    readonly presence: RouteValidationRuleEntry['presence'];
    readonly requirement: import('../../../../types/domain/request').RequestFieldRequirement;
    readonly validation: RouteValidationRuleEntry['validation'];
    readonly source: RouteValidationRuleEntry['source'];
    readonly shape: ValidationFieldShape;
    readonly properties: readonly ValidationFieldProperty[];
}

function collectRoots(entries: readonly RouteValidationRuleEntry[]): ReadonlyMap<string, RootValidationField> {
    const roots = new Map<string, RootValidationField>();
    for (const entry of entries) {
        const rootName = entry.location.kind === 'root' ? entry.fieldName.value.value : entry.location.collection.value.value;
        const rootPropertyName = entry.location.kind === 'root' ? entry.fieldName : entry.location.collection;
        const existing = roots.get(rootName);
        if (entry.location.kind === 'root') {
            roots.set(rootName, {
                name: rootPropertyName,
                semanticType: entry.semanticType,
                presence: entry.presence,
                requirement: requirementFromValidation(entry.validation),
                validation: entry.validation,
                source: entry.source,
                shape: entry.shape,
                properties: existing?.properties ?? []
            });
            continue;
        }
        const property = leafProperty(entry);
        roots.set(rootName, {
            name: rootPropertyName,
            semanticType: entry.semanticType,
            presence: existing?.presence ?? entry.presence,
            requirement: existing?.requirement ?? requirementFromValidation(entry.validation),
            validation: existing?.validation ?? [],
            source: existing?.source ?? entry.source,
            shape: existing?.shape ?? entry.shape,
            properties: mergeProperty(existing?.properties ?? [], property)
        });
    }
    return roots;
}

function leafProperty(entry: RouteValidationRuleEntry): ValidationFieldProperty {
    const shape = entry.shape;
    if (shape.kind !== 'collection' || shape.element.kind !== 'object' || shape.element.fields.length === 0) {
        return {
            name: entry.fieldName,
            semanticType: entry.semanticType,
            presence: entry.presence,
            validation: entry.validation,
            shape: shape.kind === 'collection' ? shape.element : shape
        };
    }
    return shape.element.fields[0];
}

function mergeProperty(properties: readonly ValidationFieldProperty[], property: ValidationFieldProperty): readonly ValidationFieldProperty[] {
    const existingIndex = properties.findIndex(candidate => candidate.name.value === property.name.value);
    if (existingIndex === -1) return Object.freeze([...properties, property]);

    const existing = properties[existingIndex];
    const merged = mergePropertyShape(existing, property);
    return Object.freeze(properties.map((candidate, index) => index === existingIndex ? merged : candidate));
}

function mergePropertyShape(
    existing: ValidationFieldProperty,
    incoming: ValidationFieldProperty
): ValidationFieldProperty {
    if (existing.shape.kind !== 'object' || incoming.shape.kind !== 'object') return incoming;

    const fields = incoming.shape.fields.reduce(
        (accumulator, field) => mergeProperty(accumulator, field),
        existing.shape.fields
    );
    const shape: ValidationFieldShape = {
        kind: 'object',
        fields
    };
    return {
        name: existing.name,
        semanticType: objectType(existing.name.value.value, fields),
        presence: existing.presence,
        validation: existing.validation,
        source: existing.source,
        shape
    };
}

function requirementFromValidation(validation: readonly import('../../../../types/domain/validationRules').ValidationRuleNode[]): import('../../../../types/domain/request').RequestFieldRequirement {
    const rule = validation.find(item => item.kind === 'required_with');
    if (rule?.kind === 'required_with') {
        return { kind: 'required_with', fields: Object.freeze([...rule.fields]) };
    }
    return { kind: 'unconditional' };
}

function toRequestField(root: RootValidationField, interner: TypeInterner): RequestField {
    const type = root.properties.length > 0
        ? interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, objectType(root.name, root.properties)))
        : root.semanticType;
    return {
        name: SemanticValueFactory.requestFieldName(root.name.value.value),
        sourceName: root.name,
        meaning: RequestFieldMeaningFactory.fromSemanticType(type),
        presence: root.presence,
        requirement: root.requirement,
        validation: Object.freeze([...root.validation]),
        fileConstraints: Object.freeze([]),
        source: root.source
    };
}

function objectType(name: import("../../../../types/upstream/names").PropertyName, properties: readonly ValidationFieldProperty[]): ObjectType {
    const objectProperties: ObjectProperty[] = properties.map(property => ({
        name: property.name,
        type: property.semanticType,
        description: '',
        origin: { kind: 'validation_field', field: property.name.value.value }
    }));
    return new ObjectType({ name: name.value.value, baseName: name.value.value, properties: objectProperties, role: 'plain' });
}

function toTreeNode(root: RootValidationField): ValidationFieldNode {
    if (root.properties.length > 0) {
        const element = ScannedObjectFieldNode.create(
            root.name,
            objectType(root.name, root.properties),
            root.presence,
            root.properties.map(propertyToTreeNode)
        );
        return ScannedArrayFieldNode.create(
            root.name,
            new ReadonlyCollectionType(CollectionKind.ARRAY, element.semanticType),
            root.presence,
            element,
            root.validation
        );
    }
    if (root.semanticType.kind === 'readonly_collection' || root.semanticType.kind === 'mutable_collection') {
        return ScannedArrayFieldNode.create(
            root.name,
            root.semanticType,
            root.presence,
            ScannedScalarFieldNode.create(
                createPropertyName(`${root.name.value.value}.*`),
                root.semanticType.elementType,
                RequestFieldPresenceFactory.unspecified()
            ),
            root.validation
        );
    }
    return ScannedScalarFieldNode.create(root.name, root.semanticType, root.presence, root.validation);
}

function propertyToTreeNode(property: ValidationFieldProperty): ValidationFieldNode {
    if (property.shape.kind === 'object') {
        return ScannedObjectFieldNode.create(
            property.name,
            property.semanticType,
            property.presence,
            property.shape.fields.map(propertyToTreeNode)
        );
    }
    if (property.shape.kind === 'collection') {
        return ScannedArrayFieldNode.create(
            property.name,
            property.semanticType,
            property.presence,
            ScannedScalarFieldNode.create(
                createPropertyName(`${property.name.value.value}.*`),
                property.shape.elementType,
                property.presence
            ),
            property.validation
        );
    }
    return ScannedScalarFieldNode.create(
        property.name,
        property.semanticType,
        property.presence,
        property.validation
    );
}
