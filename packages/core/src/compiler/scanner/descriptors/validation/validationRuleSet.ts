/** Scanner-boundary aggregate of complete validation facts. */
import { createPropertyName } from "../../../../types/upstream/names";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import { RequestFieldMeaningFactory } from "../../../../types/domain/requestFieldMeaning";
import type { RequestField, RequestFieldRequirement } from '../../../../types/domain/request';
import type { ValidationFieldNode } from '../../../../types/domain/validationFields';
import type {
    RouteValidationRuleEntry,
    ValidationFieldShape,
    ValidationFieldProperty,
    ValidationRuleNode,
} from '../../../../types/domain/validationRules';
import type { TypeInterner } from '../../../types/TypeInterner';
import { ObjectType, ReadonlyCollectionType, CollectionKind, type ObjectProperty, type SemanticType } from '../../../types/SemanticType';
import { createScalarValidationFieldNode, createObjectValidationFieldNode, createArrayValidationFieldNode } from '../../../../types/domain/validationFields';
import {
    relationFold,
    relationFirstOption,
    relationIndexOf,
    relationOptionFold,
    relationOptionMap,
    relationProject,
    relationResolve,
    relationGate,
} from '../../../../semantic/kernel/relationalSequence';
import { relationAll, relationAny, relationEqual } from '../../../../semantic/kernel/semanticRelations';
import type { RelationIndex } from '../../../../semantic/kernel/relationMembership';
import { relationIndexAdd } from '../../../../semantic/kernel/relationMembership';

export interface RouteValidationRuleSet {
    readonly entries: readonly RouteValidationRuleEntry[];
    readonly fields: readonly RequestField[];
    readonly tree: readonly ValidationFieldNode[];
}

export const RouteSemanticFlowValidationRuleSet = Object.freeze({
    create: (entries: readonly RouteValidationRuleEntry[], interner: TypeInterner): RouteValidationRuleSet => {
        const roots = collectRoots(entries);
        const rootValues = relationProject(roots, ([, value]) => value);
        const fields = relationProject(rootValues, root => toRequestField(root, interner));
        const tree = relationProject(rootValues, root => toTreeNode(root));
        return Object.freeze({ entries: Object.freeze([...entries]), fields: Object.freeze([...fields]), tree: Object.freeze([...tree]) });
    }
});

interface RootValidationField {
    readonly name: import("../../../../types/upstream/names").PropertyName;
    readonly semanticType: SemanticType;
    readonly presence: RouteValidationRuleEntry['presence'];
    readonly requirement: RequestFieldRequirement;
    readonly validation: RouteValidationRuleEntry['validation'];
    readonly source: RouteValidationRuleEntry['source'];
    readonly shape: ValidationFieldShape;
    readonly properties: readonly ValidationFieldProperty[];
}

type RootEntry = readonly [string, RootValidationField];

function rootEntry(entries: RelationIndex<string, RootValidationField>, key: string): import('../../../../semantic/kernel/relationalSequence').RelationOption<RootValidationField> {
    return relationOptionMap(
        relationFirstOption(entries as readonly RootEntry[], entry => relationEqual(entry[0], key)),
        entry => entry[1],
    );
}

function collectRoots(entries: readonly RouteValidationRuleEntry[]): RelationIndex<string, RootValidationField> {
    const roots: RelationIndex<string, RootValidationField> = [];
    return relationFold(entries, roots, (store, entry) => {
        const rootName = relationGateRootName(entry);
        const rootPropertyName = relationGateRootProperty(entry);
        const existing = rootEntry(store, rootName);
        const next = relationGate(
            relationEqual(entry.location.kind, 'root'),
            () => ({
                name: rootPropertyName,
                semanticType: entry.semanticType,
                presence: entry.presence,
                requirement: requirementFromValidation(entry.validation),
                validation: entry.validation,
                source: entry.source,
                shape: entry.shape,
                properties: relationOptionFold(existing, () => [], value => value.properties),
            }),
            () => {
                const property = leafProperty(entry);
                return {
                    name: rootPropertyName,
                    semanticType: entry.semanticType,
                    presence: relationOptionFold(existing, () => entry.presence, value => value.presence),
                    requirement: relationOptionFold(existing, () => requirementFromValidation(entry.validation), value => value.requirement),
                    validation: relationOptionFold(existing, () => [], value => value.validation),
                    source: relationOptionFold(existing, () => entry.source, value => value.source),
                    shape: relationOptionFold(existing, () => entry.shape, value => value.shape),
                    properties: mergeProperty(relationOptionFold(existing, () => [], value => value.properties), property),
                };
            },
        );
        return relationIndexAdd(store, rootName, next);
    });
}

function relationGateRootName(entry: RouteValidationRuleEntry): string {
    return relationGate(
        relationEqual(entry.location.kind, 'root'),
        () => entry.fieldName.value.value,
        () => entry.location.collection.value.value,
    );
}

function relationGateRootProperty(entry: RouteValidationRuleEntry): RootValidationField['name'] {
    return relationGate(
        relationEqual(entry.location.kind, 'root'),
        () => entry.fieldName,
        () => entry.location.collection,
    );
}

function leafProperty(entry: RouteValidationRuleEntry): ValidationFieldProperty {
    const shape = entry.shape;
    return relationGate(
        relationAll([
            relationEqual(shape.kind, 'collection'),
            relationEqual(shape.element.kind, 'object'),
            shape.element.fields.length > 0,
        ]),
        () => shape.element.fields[0],
        () => ({
            name: entry.fieldName,
            semanticType: entry.semanticType,
            presence: entry.presence,
            validation: entry.validation,
            shape: relationGate(relationEqual(shape.kind, 'collection'), () => shape.element, () => shape),
        }),
    );
}

function mergeProperty(properties: readonly ValidationFieldProperty[], property: ValidationFieldProperty): readonly ValidationFieldProperty[] {
    const existingIndex = relationIndexOf(properties, candidate => relationEqual(candidate.name.value, property.name.value));
    return relationGate(
        relationEqual(existingIndex, -1),
        () => Object.freeze([...properties, property]),
        () => {
            const existing = properties[existingIndex];
            const merged = mergePropertyShape(existing, property);
            return Object.freeze(relationProject(properties, (candidate, index) => relationGate(relationEqual(index, existingIndex), () => merged, () => candidate)));
        },
    );
}

function mergePropertyShape(
    existing: ValidationFieldProperty,
    incoming: ValidationFieldProperty
): ValidationFieldProperty {
    return relationGate(
        relationAll([relationEqual(existing.shape.kind, 'object'), relationEqual(incoming.shape.kind, 'object')]),
        () => {
            const fields = relationFold(
                incoming.shape.fields,
                existing.shape.fields,
                (accumulator, field) => mergeProperty(accumulator, field),
            );
            const shape: ValidationFieldShape = { kind: 'object', fields };
            return {
                name: existing.name,
                semanticType: objectType(existing.name.value.value, fields),
                presence: existing.presence,
                validation: existing.validation,
                source: existing.source,
                shape,
            };
        },
        () => incoming,
    );
}

function requirementFromValidation(validation: readonly ValidationRuleNode[]): RequestFieldRequirement {
    return relationOptionFold(
        relationFirstOption(validation, item => relationEqual(item.kind, 'required_with')),
        () => ({ kind: 'unconditional' }),
        rule => ({ kind: 'required_with', fields: Object.freeze([...rule.fields]) }),
    );
}

function toRequestField(root: RootValidationField, interner: TypeInterner): RequestField {
    const type = relationGate(
        root.properties.length > 0,
        () => interner.intern(ReadonlyCollectionType(CollectionKind.ARRAY, objectType(root.name, root.properties))),
        () => root.semanticType,
    );
    return {
        name: SemanticValueFactory.requestFieldName(root.name.value.value),
        sourceName: root.name,
        meaning: RequestFieldMeaningFactory.fromSemanticType(type),
        presence: root.presence,
        requirement: root.requirement,
        validation: Object.freeze([...root.validation]),
        fileConstraints: Object.freeze([]),
        source: root.source,
    };
}

function objectType(name: import("../../../../types/upstream/names").PropertyName, properties: readonly ValidationFieldProperty[]): ObjectType {
    const objectProperties: ObjectProperty[] = relationProject(properties, property => ({
        name: property.name,
        type: property.semanticType,
        description: '',
        origin: { kind: 'validation_field', field: property.name.value.value },
    }));
    return ObjectType({ name: name.value.value, baseName: name.value.value, properties: objectProperties, role: 'plain' });
}

function toTreeNode(root: RootValidationField): ValidationFieldNode {
    return relationGate(
        root.properties.length > 0,
        () => {
            const element = createObjectValidationFieldNode(
                root.name,
                objectType(root.name, root.properties),
                root.presence,
                relationProject(root.properties, propertyToTreeNode),
            );
            return createArrayValidationFieldNode(
                root.name,
                ReadonlyCollectionType(CollectionKind.ARRAY, element.semanticType),
                root.presence,
                element,
                root.validation,
            );
        },
        () => relationGate(
            relationAny([relationEqual(root.semanticType.kind, 'readonly_collection'), relationEqual(root.semanticType.kind, 'mutable_collection')]),
            () => createArrayValidationFieldNode(
                root.name,
                root.semanticType,
                root.presence,
                createScalarValidationFieldNode(
                    createPropertyName(`${root.name.value.value}.*`),
                    root.semanticType.elementType,
                    root.presence,
                ),
                root.validation,
            ),
            () => createScalarValidationFieldNode(root.name, root.semanticType, root.presence, root.validation),
        ),
    );
}

function propertyToTreeNode(property: ValidationFieldProperty): ValidationFieldNode {
    return relationGate(
        relationEqual(property.shape.kind, 'object'),
        () => createObjectValidationFieldNode(
            property.name,
            property.semanticType,
            property.presence,
            relationProject(property.shape.fields, propertyToTreeNode),
        ),
        () => relationGate(
            relationEqual(property.shape.kind, 'collection'),
            () => createArrayValidationFieldNode(
                property.name,
                property.semanticType,
                property.presence,
                createScalarValidationFieldNode(
                    createPropertyName(`${property.name.value.value}.*`),
                    property.shape.elementType,
                    property.presence,
                ),
                property.validation,
            ),
            () => createScalarValidationFieldNode(property.name, property.semanticType, property.presence, property.validation),
        ),
    );
}
