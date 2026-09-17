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
import {
    findCastForColumn,
    resolveColumnSemanticType,
    extractModelAccessors
} from './modelExtractors';

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

            const columns = model.columns;
            for (const col of columns) {
                if (model.hidden.some(name => name.value === col.name.value)) {
                    continue;
                }
                const propName = toCamelCase(col.name.value);
                seenPropNames.add(propName);

                const cast = findCastForColumn(model.casts, col.name.value);
                let propType: SemanticType = resolveColumnSemanticType(col, cast);
                if (col.nullability.kind === 'nullable') {
                    propType = new NullableType(propType);
                }
                properties.push(ScannedObjectProperty.create({
                    name: propName,
                    type: interner.intern(propType),
                    required: true
                }));
            }

            const extractedAccessors = extractModelAccessors(model.accessors);

            for (const acc of extractedAccessors) {
                if (seenPropNames.has(acc.propertyName.value)) {
                    continue;
                }
                seenPropNames.add(acc.propertyName.value);

                properties.push(ScannedObjectProperty.create({
                    name: acc.propertyName.value,
                    type: interner.intern(acc.semanticType),
                    required: true
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
