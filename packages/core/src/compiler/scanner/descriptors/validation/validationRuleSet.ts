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
    relationOptionFold,
    relationProject,
    relationVariantFold,
    relationGate,
} from '../../../../semantic/foundation/relationalSequence';
import { relationAny, relationEqual } from '../../../../semantic/foundation/semanticRelations';
import type { PropertyName } from '../../../../types/upstream/names';
import type { RelationIndex } from '../../../../semantic/foundation/relationMembership';
import { relationIndexAdd, relationIndexLookup } from '../../../../semantic/foundation/relationMembership';

export interface RouteValidationRuleSet {
    readonly entries: readonly RouteValidationRuleEntry[];
    readonly fields: readonly RequestField[];
    readonly tree: readonly ValidationFieldNode[];
}

const EMPTY_ROOT_INDEX: RelationIndex<PropertyName, RootValidationField> = Object.freeze([]);

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
    readonly name: PropertyName;
    readonly semanticType: SemanticType;
    readonly presence: RouteValidationRuleEntry['presence'];
    readonly requirement: RequestFieldRequirement;
    readonly validation: RouteValidationRuleEntry['validation'];
    readonly source: RouteValidationRuleEntry['source'];
    readonly shape: ValidationFieldShape;
    readonly properties: readonly ValidationFieldProperty[];
}


function rootEntry(entries: RelationIndex<PropertyName, RootValidationField>, key: PropertyName) {
    return relationIndexLookup(entries, key);
}

function collectRoots(entries: readonly RouteValidationRuleEntry[]): RelationIndex<PropertyName, RootValidationField> {
    return relationFold(entries, EMPTY_ROOT_INDEX, (store, entry) => {
        const rootName = relationGateRootName(entry);
        const rootPropertyName = relationGateRootProperty(entry);
        const existing = rootEntry(store, rootName);
        const next = relationVariantFold(
            entry.location,
            'root',
            location => ({
                name: location.collection,
                semanticType: entry.semanticType,
                presence: relationOptionFold(existing, () => entry.presence, value => value.presence),
                requirement: relationOptionFold(existing, () => requirementFromValidation(entry.validation), value => value.requirement),
                validation: relationOptionFold(existing, () => entry.validation, value => value.validation),
                source: relationOptionFold(existing, () => entry.source, value => value.source),
                shape: relationOptionFold(existing, () => entry.shape, value => value.shape),
                properties: mergeProperty(
                    relationOptionFold(existing, () => [], value => value.properties),
                    leafProperty(entry),
                ),
            }),
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
        );
        return relationIndexAdd(store, rootName, next);
    });
}

function relationGateRootName(entry: RouteValidationRuleEntry): PropertyName {
    return relationVariantFold(
        entry.location,
        'root',
        location => location.collection,
        () => entry.fieldName,
    );
}

function relationGateRootProperty(entry: RouteValidationRuleEntry): PropertyName {
    return relationVariantFold(
        entry.location,
        'root',
        location => location.collection,
        () => entry.fieldName,
    );
}

function leafProperty(entry: RouteValidationRuleEntry): ValidationFieldProperty {
    return relationVariantFold(
        entry.shape,
        'collection',
        shape => entryProperty(entry, shape),
        shape => relationVariantFold(
            shape.element,
            'object',
            rest => entryProperty(entry, rest),
            object => relationOptionFold(
                relationFirstOption(object.fields, () => true),
                () => entryProperty(entry, shape.element),
                field => field,
            ),
        ),
    );
}

function entryProperty(entry: RouteValidationRuleEntry, shape: ValidationFieldShape): ValidationFieldProperty {
    return {
        name: entry.fieldName,
        semanticType: entry.semanticType,
        presence: entry.presence,
        validation: entry.validation,
        shape: relationVariantFold(shape, 'collection', nested => nested, collection => collection.element),
        source: entry.source,
    };
}

function mergeProperty(properties: readonly ValidationFieldProperty[], property: ValidationFieldProperty): readonly ValidationFieldProperty[] {
    const existingIndex = relationFirstOption(
        properties,
        candidate => relationEqual(candidate.name.value.value, property.name.value.value),
    );
    return relationOptionFold(
        existingIndex,
        () => Object.freeze([...properties, property]),
        existing => Object.freeze(relationProject(
            properties,
            candidate => relationGate(
                relationEqual(candidate.name.value.value, existing.name.value.value),
                () => mergePropertyShape(candidate, property),
                () => candidate,
            ),
        )),
    );
}

function mergePropertyShape(existing: ValidationFieldProperty, incoming: ValidationFieldProperty): ValidationFieldProperty {
    const shape = mergeValidationFieldShape(existing.shape, incoming.shape);
    return {
        name: existing.name,
        semanticType: mergedSemanticType(existing.name, shape),
        presence: existing.presence,
        validation: existing.validation,
        source: existing.source,
        shape,
    };
}

function mergeValidationFieldShape(existing: ValidationFieldShape, incoming: ValidationFieldShape): ValidationFieldShape {
    return relationVariantFold<ValidationFieldShape, 'object', ValidationFieldShape>(
        existing,
        'object',
        existingRest => relationVariantFold<ValidationFieldShape, 'object', ValidationFieldShape>(
            incoming,
            'object',
            incomingRest => mergeNonObjectShapes(existingRest, incomingRest),
            incomingObject => incomingObject,
        ),
        existingObject => relationVariantFold<ValidationFieldShape, 'object', ValidationFieldShape>(
            incoming,
            'object',
            incomingRest => mergeObjectWithNonObject(existingObject, incomingRest),
            incomingObject => ({
                kind: 'object',
                fields: relationFold(
                    incomingObject.fields,
                    existingObject.fields,
                    (accumulator, field) => mergeProperty(accumulator, field),
                ),
            }),
        ),
    );
}

function mergeNonObjectShapes(
    existing: Exclude<ValidationFieldShape, { readonly kind: 'object' }>,
    incoming: Exclude<ValidationFieldShape, { readonly kind: 'object' }>,
): ValidationFieldShape {
    return relationVariantFold<Exclude<ValidationFieldShape, { readonly kind: 'object' }>, 'collection', ValidationFieldShape>(
        existing,
        'collection',
        existingScalar => relationVariantFold<Exclude<ValidationFieldShape, { readonly kind: 'object' }>, 'collection', ValidationFieldShape>(
            incoming,
            'collection',
            incomingScalar => ({ kind: 'scalar', semanticType: incomingScalar.semanticType }),
            incomingCollection => incomingCollection,
        ),
        existingCollection => relationVariantFold<Exclude<ValidationFieldShape, { readonly kind: 'object' }>, 'collection', ValidationFieldShape>(
            incoming,
            'collection',
            incomingScalar => existingCollection,
            incomingCollection => ({
                kind: 'collection',
                elementType: incomingCollection.elementType,
                element: mergeValidationFieldShape(existingCollection.element, incomingCollection.element),
            }),
        ),
    );
}

function mergeObjectWithNonObject(
    existing: Extract<ValidationFieldShape, { readonly kind: 'object' }>,
    incoming: Exclude<ValidationFieldShape, { readonly kind: 'object' }>,
): ValidationFieldShape {
    return relationVariantFold<Exclude<ValidationFieldShape, { readonly kind: 'object' }>, 'collection', ValidationFieldShape>(
        incoming,
        'collection',
        incomingScalar => ({ kind: 'object', fields: existing.fields }),
        incomingCollection => ({
            kind: 'object',
            fields: existing.fields,
        }),
    );
}

function mergedSemanticType(name: PropertyName, shape: ValidationFieldShape): SemanticType {
    return relationVariantFold<ValidationFieldShape, 'scalar', SemanticType>(
        shape,
        'scalar',
        rest => relationVariantFold<Exclude<ValidationFieldShape, { readonly kind: 'scalar' }>, 'collection', SemanticType>(
            rest,
            'collection',
            object => objectType(name, object.fields),
            collection => collection.elementType,
        ),
        scalar => scalar.semanticType,
    );
}

function requirementFromValidation(validation: readonly ValidationRuleNode[]): RequestFieldRequirement {
    return relationOptionFold(
        relationFirstOption(validation, item => relationAny([
            relationEqual(item.kind, 'required_with'),
            relationEqual(item.kind, 'required_with_all'),
            relationEqual(item.kind, 'required_without'),
            relationEqual(item.kind, 'required_without_all'),
            relationEqual(item.kind, 'required_if'),
            relationEqual(item.kind, 'required_unless'),
        ])),
        () => ({ kind: 'unconditional' }),
        item => relationVariantFold<ValidationRuleNode, 'required_with', RequestFieldRequirement>(
            item,
            'required_with',
            rest => relationVariantFold<ValidationRuleNode, 'required_with_all', RequestFieldRequirement>(
                rest,
                'required_with_all',
                restAll => relationVariantFold<ValidationRuleNode, 'required_without', RequestFieldRequirement>(
                    restAll,
                    'required_without',
                    restWithout => relationVariantFold<ValidationRuleNode, 'required_without_all', RequestFieldRequirement>(
                        restWithout,
                        'required_without_all',
                        restWithoutAll => relationVariantFold<ValidationRuleNode, 'required_if', RequestFieldRequirement>(
                            restWithoutAll,
                            'required_if',
                            restIf => relationVariantFold<ValidationRuleNode, 'required_unless', RequestFieldRequirement>(
                                restIf,
                                'required_unless',
                                () => ({ kind: 'unconditional' }),
                                presentUnless => ({ kind: 'required_unless', field: presentUnless.field, values: presentUnless.values }),
                            ),
                            presentIf => ({ kind: 'required_if', field: presentIf.field, values: presentIf.values }),
                        ),
                        presentWithoutAll => ({ kind: 'required_without_all', fields: presentWithoutAll.fields }),
                    ),
                    presentWithout => ({ kind: 'required_without', fields: presentWithout.fields }),
                ),
                presentAll => ({ kind: 'required_with_all', fields: presentAll.fields }),
            ),
            presentWith => ({ kind: 'required_with', fields: presentWith.fields }),
        ),
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

function validationFieldOrigin(field: string): ObjectProperty['origin'] {
    return { kind: 'validation_field', field };
}

function objectType(name: PropertyName, properties: readonly ValidationFieldProperty[]): ObjectType {
    const objectProperties: ObjectProperty[] = [...relationProject(properties, property => ({
        name: property.name,
        type: property.semanticType,
        description: '',
        origin: validationFieldOrigin(property.name.value.value),
    }))];
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
        () => relationVariantFold<SemanticType, 'readonly_collection', ValidationFieldNode>(
            root.semanticType,
            'readonly_collection',
            rest => relationVariantFold<SemanticType, 'mutable_collection', ValidationFieldNode>(
                rest,
                'mutable_collection',
                scalar => createScalarValidationFieldNode(root.name, scalar, root.presence, root.validation),
                collection => createArrayValidationFieldNode(
                    root.name,
                    root.semanticType,
                    root.presence,
                    createScalarValidationFieldNode(
                        createPropertyName(`${root.name.value.value}.*`),
                        collection.elementType,
                        root.presence,
                    ),
                    root.validation,
                ),
            ),
            collection => createArrayValidationFieldNode(
                root.name,
                root.semanticType,
                root.presence,
                createScalarValidationFieldNode(
                    createPropertyName(`${root.name.value.value}.*`),
                    collection.elementType,
                    root.presence,
                ),
                root.validation,
            ),
        ),
    );
}

function propertyToTreeNode(property: ValidationFieldProperty): ValidationFieldNode {
    return relationVariantFold<ValidationFieldShape, 'scalar', ValidationFieldNode>(
        property.shape,
        'scalar',
        rest => relationVariantFold<Exclude<ValidationFieldShape, { readonly kind: 'scalar' }>, 'collection', ValidationFieldNode>(
            rest,
            'collection',
            object => createObjectValidationFieldNode(
                property.name,
                property.semanticType,
                property.presence,
                relationProject(object.fields, propertyToTreeNode),
            ),
            collection => createArrayValidationFieldNode(
                property.name,
                property.semanticType,
                property.presence,
                createScalarValidationFieldNode(
                    createPropertyName(`${property.name.value.value}.*`),
                    collection.elementType,
                    property.presence,
                ),
                property.validation,
            ),
        ),
        scalar => createScalarValidationFieldNode(property.name, scalar.semanticType, property.presence, property.validation),
    );
}
