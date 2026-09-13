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
    PrimitiveType,
    NullableType,
    type SemanticType
} from '../../../types/SemanticType';
import {
    toCamelCase,
    toPascalCase
} from '../../../../utils/resource-naming';
import { resolvePrimitiveKind } from '../typeDeriverUtils';
import type { SemanticDerivationContext } from './SemanticDerivationContext';
import {
    findCastForColumn,
    resolveModelColumnTypeString,
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

            const columns = model.columns ? model.columns : [];
            for (const col of columns) {
                if (model.hidden && model.hidden.includes(col.name)) {
                    continue;
                }
                const propName = toCamelCase(col.name);
                seenPropNames.add(propName);

                const cast = findCastForColumn(model.casts, col.name);
                const colTypeStr = resolveModelColumnTypeString(col, cast);
                const primKind = resolvePrimitiveKind(colTypeStr);

                let propType: SemanticType = new PrimitiveType(primKind);
                if (col.nullable) {
                    propType = new NullableType(propType);
                }
                properties.push(ScannedObjectProperty.create({
                    name: propName,
                    type: interner.intern(propType),
                    nullable: Boolean(col.nullable),
                    required: true
                }));
            }

            const appends = model.appends ? model.appends : [];
            const extractedAccessors = extractModelAccessors(model.accessors, appends);

            for (const acc of extractedAccessors) {
                if (seenPropNames.has(acc.propName)) {
                    continue;
                }
                seenPropNames.add(acc.propName);

                const primKind = resolvePrimitiveKind(acc.typeStr);
                properties.push(ScannedObjectProperty.create({
                    name: acc.propName,
                    type: interner.intern(new PrimitiveType(primKind)),
                    nullable: false,
                    required: true
                }));
            }

            types.push(interner.intern(new ObjectType({
                name: modelTypeName,
                baseName: modelBaseName,
                properties
            })) as ObjectType);
        }
    }

    return types;
}
