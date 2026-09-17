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
        const modelTypeName = `${toPascalCase(model.name)}Transformed`;
        const modelBaseName = toPascalCase(model.name);
        if (!seenNames.has(modelTypeName)) {
            seenNames.add(modelTypeName);
            const properties: ObjectProperty[] = [];
            const seenPropNames = new Set<string>();

            const columns = model.columns;
            for (const col of columns) {
                if (model.hidden.includes(col.name)) {
                    continue;
                }
                const propName = toCamelCase(col.name);
                seenPropNames.add(propName);

                const cast = findCastForColumn(model.casts, col.name);
                let propType: SemanticType = resolveColumnSemanticType(col, cast);
                if (col.nullability.kind === 'nullable') {
                    propType = new NullableType(propType);
                }
                properties.push(ScannedObjectProperty.create({
                    name: propName,
                    type: interner.intern(propType),
                    nullable: propType.isNullable(),
                    required: true
                }));
            }

            const extractedAccessors = extractModelAccessors(model.accessors);

            for (const acc of extractedAccessors) {
                if (seenPropNames.has(acc.propertyName)) {
                    continue;
                }
                seenPropNames.add(acc.propertyName);

                properties.push(ScannedObjectProperty.create({
                    name: acc.propertyName,
                    type: interner.intern(acc.semanticType),
                    nullable: acc.semanticType.isNullable(),
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
