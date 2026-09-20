/**
 * Derives canonical resource ObjectTypes from already-bound semantic fields.
 * No unknown-shape probing and no type-string reclassification.
 */
import type { ResourceFieldDescriptor, ParsedResource } from '../../../../types/route';
import { ObjectType, type ObjectProperty, ScannedObjectProperty, type SemanticType } from '../../../types/SemanticType';
import { toCamelCase } from '../../../../utils/resource-naming';
import type { SemanticDerivationContext } from './SemanticDerivationContext';

export function deriveResourceTypes(
    context: SemanticDerivationContext,
    seenNames: Set<string>
): readonly ObjectType[] {
    return context.resources.map(resource => deriveResource(resource, seenNames, context));
}

function deriveResource(
    resource: ParsedResource,
    seenNames: Set<string>,
    context: SemanticDerivationContext
): ObjectType {
    const properties: ObjectProperty[] = [];
    for (const field of resource.fields) {
        appendField(properties, field, '');
    }

    const baseName = resource.name.endsWith('Transformed')
        ? resource.name.replace(/Transformed$/, '')
        : resource.name;
    const typeName = resource.typeName;
    seenNames.add(typeName);
    const objectType = new ObjectType({
        name: typeName,
        baseName,
        properties,
        role: 'resource'
    });
    return context.interner.intern(objectType) as ObjectType;
}

function appendField(
    properties: ObjectProperty[],
    field: ResourceFieldDescriptor,
    prefix: string
): void {
    const name = qualifiedName(prefix, field.name.value);
    if (field.expression.kind === 'object') {
        for (const child of field.expression.fields) {
            appendField(properties, child, name);
        }
        return;
    }
    properties.push(ScannedObjectProperty.create({
        name,
        type: field.semantic.type,
        description: '',
        origin: { kind: 'bound_expression', bound: field.semantic.bound },
    }));
}

function qualifiedName(prefix: string, fieldName: string): string {
    const camel = toCamelCase(fieldName);
    return prefix.length === 0
        ? camel
        : `${prefix}${camel.charAt(0).toUpperCase()}${camel.slice(1)}`;
}
