/**
 * modelTypeDeriver.ts
 *
 * Derives canonical ObjectType instances for scanned Eloquent Models.
 *
 * @module core/compiler/scanner/subscanners/semantic
 */

import {
    ObjectType,
    type ObjectProperty,
    ScannedObjectProperty,
    NullableType,
    type SemanticType
} from '../../../types/SemanticType';
import {
    toCamelCase,
    toPascalCase
} from '../../../../utils/resource-naming';
import type { SemanticDerivationContext } from './SemanticDerivationContext';

function sequenceToArray<T>(items: import('../../../../types/upstream/collections').Sequence<T>): T[] {
    const result: T[] = [];
    let current = items;
    while (current.kind === 'cons') { result.push(current.head); current = current.tail; }
    return result;
}

export function deriveModelTypes(
    context: SemanticDerivationContext,
    seenNames: Set<string>
): readonly ObjectType[] {
    const types: ObjectType[] = [];
    const interner = context.interner;

    for (const model of context.models) {
        const modelTypeName = `${toPascalCase(model.definition.identity.name.value.value)}Transformed`;
        const modelBaseName = toPascalCase(model.definition.identity.name.value.value);
        if (!seenNames.has(modelTypeName)) {
            seenNames.add(modelTypeName);
            const properties: ObjectProperty[] = [];
            const seenPropNames = new Set<string>();

            const sourceProperties = sequenceToArray(model.definition.surface.properties.items);
            for (const property of sourceProperties) {
                const propName = property.name.value.value;
                seenPropNames.add(propName);
                properties.push(ScannedObjectProperty.create({
                    name: { kind: 'property_name', value: propName },
                    type: interner.intern(property.type),
                    description: '',
                    origin: property.origin.kind === 'column'
                        ? { kind: 'model_column', model: model.definition.identity.name, property: property.name }
                        : property.origin.kind === 'computed'
                            ? { kind: 'model_accessor', model: model.definition.identity.name, property: property.name }
                            : { kind: 'model_relation', model: model.definition.identity.name, property: property.name }
                }));
            }

            types.push(interner.intern(new ObjectType({
                name: modelTypeName,
                baseName: modelBaseName,
                properties,
                role: 'model'
            })) as ObjectType);
        }
    }

    return types;
}
