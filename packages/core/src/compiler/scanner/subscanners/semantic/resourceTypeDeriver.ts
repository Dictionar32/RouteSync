/**
 * Derives canonical resource ObjectTypes from already-bound semantic fields.
 * No unknown-shape probing and no type-string reclassification.
 */
import type { ResourceAst } from '../../../../types/upstream/ast';
import type { ResourceField } from '../../../../types/upstream/resource';
import type { TypeExpression } from '../../../../types/upstream/typeVocabulary';
import {
    ObjectType,
    type ObjectProperty,
} from '../../../types/SemanticType';
import { ScannedObjectProperty } from '../../../types/SemanticType';
import { toCamelCase } from '../../../../utils/resource-naming';
import type { SemanticDerivationContext } from './SemanticDerivationContext';
import { relationEqual, relationFold, relationGate, relationProject, relationTextSlice } from '../../../../semantic/kernel/relationalSequence';
import { relationContains, relationInsert, type RelationMembership } from '../../../../semantic/kernel/relationMembership';

export function deriveResourceTypes(
    context: SemanticDerivationContext,
    seenNames: RelationMembership<string>
): readonly ObjectType[] {
    return Object.freeze(relationProject(context.resources, resource => deriveResource(resource, seenNames, context)));
}

function deriveResource(
    resource: ResourceAst,
    seenNames: RelationMembership<string>,
    context: SemanticDerivationContext
): ObjectType {
    const definition = resource.definition;
    const properties = relationFold(
        sequenceToArray(definition.fields.items),
        [] as ObjectProperty[],
        (current, field) => [...current, ...deriveFieldProperties(field, '')],
    );
    const originalName = definition.name.value.value;
    const baseName = relationGate(
        originalName.endsWith('Transformed'),
        () => originalName.replace(/Transformed$/, ''),
        () => originalName,
    );
    const typeName = originalName;
    seenNames = relationInsert(seenNames, typeName);
    return ObjectType({
        name: typeName,
        baseName,
        properties,
        role: 'resource'
    });
}

function deriveFieldProperties(field: ResourceField, prefix: string): readonly ObjectProperty[] {
    const name = qualifiedName(prefix, field.name.value.value);
    return relationGate(
        relationEqual(field.type.kind, 'object'),
        () => relationFold(
            sequenceToArray(field.type.properties.items),
            [] as ObjectProperty[],
            (current, child) => [...current, ...deriveTypeProperties(child.name.value.value, child.type, name)],
        ),
        () => [createProperty(name, field.type, 'semantic_resolution')],
    );
}

function deriveTypeProperties(
    fieldName: string,
    type: TypeExpression,
    prefix: string,
): readonly ObjectProperty[] {
    const name = qualifiedName(prefix, fieldName);
    return relationGate(
        relationEqual(type.kind, 'object'),
        () => relationFold(
            sequenceToArray(type.properties.items),
            [] as ObjectProperty[],
            (current, child) => [...current, ...deriveTypeProperties(child.name.value.value, child.type, name)],
        ),
        () => [createProperty(name, type, 'nested_object')],
    );
}

function createProperty(
    name: string,
    type: TypeExpression,
    reason: 'semantic_resolution' | 'nested_object',
): ObjectProperty {
    return ScannedObjectProperty.create({
        name: { kind: 'property_name', value: name },
        type: typeExpressionToSemanticType(type),
        description: '',
        origin: { kind: 'derived', reason }
    });
}

export { typeExpressionToSemanticType } from '../../../domain/common/typeExpressionSemanticType';
import { typeExpressionToSemanticType } from '../../../domain/common/typeExpressionSemanticType';

function sequenceToArray<T>(items: import('../../../../types/upstream/collections').Sequence<T>): readonly T[] {
    return relationGate(
        relationEqual(items.kind, 'cons'),
        () => [items.head, ...sequenceToArray(items.tail)],
        () => [],
    );
}

function qualifiedName(prefix: string, fieldName: string): string {
    const camel = toCamelCase(fieldName);
    return relationGate(
        relationEqual(prefix.length, 0),
        () => camel,
        () => `${prefix}${camel.charAt(0).toUpperCase()}${relationTextSlice(camel, 1)}`,
    );
}

