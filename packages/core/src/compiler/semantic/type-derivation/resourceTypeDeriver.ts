/**
 * Derives canonical resource ObjectTypes from already-bound semantic fields.
 * No unknown-shape probing and no type-string reclassification.
 */
import type { ResourceAst } from '../../../types/upstream/ast';
import type { ResourceField } from '../../../types/upstream/resource';
import type { TypeExpression } from '../../../types/upstream/typeVocabulary';
import {
    ObjectType,
    type ObjectProperty,
} from '../../../types/domain/semanticType';
import { ScannedObjectProperty } from '../../../types/domain/semanticType';
import { toCamelCase } from '../../../utils/resource-naming';
import type { SemanticDerivationContext } from './SemanticDerivationContext';
import { stringValue } from '../../../types/upstream/valueObjects';

export function deriveResourceTypes(
    context: SemanticDerivationContext,
    seenNames: RelationMembership<string>
): readonly ObjectType[] {
    return Object.freeze(context.resources.map(resource => deriveResource(resource, seenNames)));
}

function emptyObjectProperties(): ObjectProperty[] {
    return [];
}

function deriveResource(
    resource: ResourceAst,
    seenNames: RelationMembership<string>,
): ObjectType {
    const definition = resource.definition;
    const properties = context.relations.fold(
        context.relations.sequenceToArray(definition.fields.items),
        emptyObjectProperties(),
        (current, field) => [...current, ...deriveFieldProperties(field, '')],
    );
    const originalName = definition.name.value.value;
    const baseName = context.relations.gate(
        originalName.endsWith('Transformed'),
        () => originalName.replace(/Transformed$/, ''),
        () => originalName,
    );
    const typeName = originalName;
    seenNames = context.relations.insert(seenNames, typeName);
    return ObjectType({
        name: typeName,
        baseName,
        properties,
        role: 'resource'
    });
}

function deriveFieldProperties(field: ResourceField, prefix: string): readonly ObjectProperty[] {
    const name = qualifiedName(prefix, field.name.value.value);
    return context.relations.variantFold(
        field.type,
        'object',
        () => [createProperty(name, field.type, 'semantic_resolution')],
        objectType => context.relations.fold(
            context.relations.sequenceToArray(objectType.properties.items),
            emptyObjectProperties(),
            (current, child) => [...current, ...deriveTypeProperties(child.name.value.value, child.type, name)],
        ),
    );
}

function deriveTypeProperties(
    fieldName: string,
    type: TypeExpression,
    prefix: string,
): readonly ObjectProperty[] {
    const name = qualifiedName(prefix, fieldName);
    return context.relations.variantFold(
        type,
        'object',
        () => [createProperty(name, type, 'nested_object')],
        objectType => context.relations.fold(
            context.relations.sequenceToArray(objectType.properties.items),
            emptyObjectProperties(),
            (current, child) => [...current, ...deriveTypeProperties(child.name.value.value, child.type, name)],
        ),
    );
}

function createProperty(
    name: string,
    type: TypeExpression,
    reason: 'semantic_resolution' | 'nested_object',
): ObjectProperty {
    return ScannedObjectProperty.create({
        name: { kind: 'property_name', value: stringValue.create(name) },
        type: typeExpressionToSemanticType(type),
        description: '',
        origin: { kind: 'derived', reason }
    });
}

export { typeExpressionToSemanticType } from '../../domain/common/typeExpressionSemanticType';
import { typeExpressionToSemanticType } from '../../domain/common/typeExpressionSemanticType';

function qualifiedName(prefix: string, fieldName: string): string {
    const camel = toCamelCase(fieldName);
    return context.relations.gate(
        context.relations.equal(prefix.length, 0),
        () => camel,
        () => `${prefix}${camel.charAt(0).toUpperCase()}${context.relations.textSlice(camel, 1)}`,
    );
}

