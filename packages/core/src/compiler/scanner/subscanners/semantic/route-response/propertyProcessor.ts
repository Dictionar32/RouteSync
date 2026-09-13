/**
 * propertyProcessor.ts
 *
 * Recursively converts raw field entries into canonical ObjectProperty instances.
 *
 * @module core/compiler/scanner/subscanners/semantic/route-response
 */

import { DatabaseColumnTypeMapper } from '../../../../../types/route';
import {
    ObjectType,
    type ObjectProperty,
    ScannedObjectProperty,
    PrimitiveType,
    PrimitiveKind,
    NullableType,
    ReadonlyCollectionType,
    CollectionKind,
    ReferenceType,
    type SemanticType
} from '../../../../types/SemanticType';
import {
    toCamelCase,
    toPascalCase,
    extractClassBasename
} from '../../../../../utils/resource-naming';
import { resolvePrimitiveKind } from '../../typeDeriverUtils';
import type { SemanticDerivationContext } from '../SemanticDerivationContext';
import {
    extractFieldTypeString,
    extractFieldNullability
} from '../fieldExtractors';

export function processResponseProperties(
    entries: readonly unknown[],
    context: SemanticDerivationContext,
    prefix = ''
): ObjectProperty[] {
    const properties: ObjectProperty[] = [];
    const interner = context.interner;

    for (const item of entries) {
        const name = Array.isArray(item) ? (item[0] as string) : (item as { name: string }).name;
        const val = Array.isArray(item) ? item[1] : item;
        const camelKey = toCamelCase(name);
        const propName = prefix ? `${prefix}${camelKey.charAt(0).toUpperCase()}${camelKey.slice(1)}` : camelKey;

        const valRecord = (val && typeof val === 'object') ? (val as Record<string, unknown>) : null;
        const valExpr = (valRecord && 'expression' in valRecord && valRecord.expression)
            ? valRecord.expression
            : val;
        const valExprRecord = (valExpr && typeof valExpr === 'object')
            ? (valExpr as Record<string, unknown>)
            : null;

        if (valExprRecord && (valExprRecord.kind === 'object' || valExprRecord.fields)) {
            const childFieldsUnknown = valExprRecord.fields as unknown;
            const childEntries = Array.isArray(childFieldsUnknown)
                ? (childFieldsUnknown as readonly unknown[])
                : Object.entries((childFieldsUnknown as Record<string, unknown>) || {});
            properties.push(...processResponseProperties(childEntries, context, propName));
        } else if (valExprRecord && (valExprRecord.kind === 'collection' || valExprRecord.kind === 'array' || valExprRecord.collection || valExprRecord.elementType)) {
            const elem = valExprRecord.elementType
                ? (valExprRecord.elementType as Record<string, unknown>)
                : (valExprRecord.element as Record<string, unknown> | undefined);
            let elemType: SemanticType = new PrimitiveType(PrimitiveKind.STRING);

            if (elem && typeof elem.model === 'string') {
                const foundModel = context.modelsByName.get(elem.model);
                if (foundModel && foundModel.columns) {
                    const modelProps: ObjectProperty[] = foundModel.columns.map(c => {
                        const primKind = c.semanticType
                            ? c.semanticType
                            : DatabaseColumnTypeMapper.toPrimitiveKind(c.type);
                        let pType: SemanticType = new PrimitiveType(primKind);
                        if (c.nullable) {
                            pType = new NullableType(pType);
                        }
                        return ScannedObjectProperty.create({
                            name: toCamelCase(c.name),
                            type: interner.intern(pType),
                            nullable: Boolean(c.nullable),
                            required: true
                        });
                    });
                    const modelBaseName = extractClassBasename(elem.model);
                    elemType = new ObjectType({ name: toCamelCase(elem.model), baseName: modelBaseName, properties: modelProps });
                } else {
                    elemType = new ReferenceType('', `${toPascalCase(elem.model)}Transformed`);
                }
            } else if (elem && typeof elem.name === 'string') {
                elemType = new ReferenceType('', elem.name);
            }
            properties.push(ScannedObjectProperty.create({
                name: propName,
                type: interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, elemType)),
                nullable: false,
                required: true
            }));
        } else {
            const vType = extractFieldTypeString(valExpr);
            const isUnknown = (valExprRecord && valExprRecord.kind === 'unknown') || String(vType).toLowerCase() === 'unknown';
            const isNull = extractFieldNullability(val) || extractFieldNullability(valExpr) || String(vType).toLowerCase().includes('null');
            const valSemType = valRecord && typeof valRecord.semanticType === 'string' ? valRecord.semanticType : undefined;
            const prim = isUnknown ? PrimitiveKind.UNKNOWN : resolvePrimitiveKind(valSemType ? valSemType : vType);
            let propType: SemanticType = new PrimitiveType(prim);
            if (isNull) {
                propType = new NullableType(propType);
            }
            properties.push(ScannedObjectProperty.create({
                name: propName,
                type: interner.intern(propType),
                nullable: isNull,
                required: true
            }));
        }
    }

    return properties;
}
