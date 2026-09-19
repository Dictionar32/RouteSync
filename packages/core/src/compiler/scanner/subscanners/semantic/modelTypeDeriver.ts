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

export function deriveModelTypes(
    context: SemanticDerivationContext,
    seenNames: Set<string>
): readonly ObjectType[] {
    const types: ObjectType[] = [];
    const interner = context.interner;

    for (const model of context.models) {
        const modelTypeName = `${toPascalCase(model.name.value)}Transformed`;
        const modelBaseName = toPascalCase(model.name.value);
        if (!seenNames.has(modelTypeName)) {
            seenNames.add(modelTypeName);
            const properties: ObjectProperty[] = [];
            const seenPropNames = new Set<string>();

            for (const property of model.semantic.surface.properties) {
                const propName = property.property.value;
                seenPropNames.add(propName);
                properties.push(ScannedObjectProperty.create({
                    name: propName,
                    type: interner.intern(property.type),
                    required: true,
                    origin: property.kind === 'column'
                        ? { kind: 'model_column', model: model.name, property: property.property }
                        : property.kind === 'accessor'
                            ? { kind: 'model_accessor', model: model.name, property: property.property }
                            : { kind: 'model_relation', model: model.name, property: property.property }
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
