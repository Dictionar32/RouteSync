/**
 * resourceTypeDeriver.ts
 *
 * Derives canonical ObjectType instances for scanned Laravel Resources.
 *
 * @module core/compiler/scanner/subscanners/semantic
 */

import type { ResourceFieldDescriptor } from '../../../../types/route';
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
} from '../../../types/SemanticType';
import {
    toCamelCase,
    toPascalCase
} from '../../../../utils/resource-naming';
import { ScannedResourceFieldDescriptor } from '../../descriptors/resourceDescriptors';
import { resolvePrimitiveKind } from '../typeDeriverUtils';
import type { SemanticDerivationContext } from './SemanticDerivationContext';
import {
    extractFieldTypeString,
    extractFieldExpression,
    extractCollectionTargetResource,
    normalizeResourceFields
} from './fieldExtractors';

export function deriveResourceTypes(
    context: SemanticDerivationContext,
    seenNames: Set<string>
): readonly ObjectType[] {
    const types: ObjectType[] = [];
    const interner = context.interner;

    for (const res of context.resources) {
        const rawFields = normalizeResourceFields(res);
        const properties: ObjectProperty[] = [];

        const processField = (field: ResourceFieldDescriptor, prefix = '', isNullable = false): void => {
            const camelKey = toCamelCase(field.name);
            const propName = prefix ? `${prefix}${camelKey.charAt(0).toUpperCase()}${camelKey.slice(1)}` : camelKey;
            const fKind = field.expression as unknown;

            if (fKind && typeof fKind === 'object') {
                const fKindRecord = fKind as Record<string, unknown>;
                if (fKindRecord.kind === 'object' || fKindRecord.fields) {
                    const rawChildUnknown = fKindRecord.fields as unknown;
                    const rawChild = Array.isArray(rawChildUnknown)
                        ? (rawChildUnknown as readonly unknown[])
                        : Object.entries((rawChildUnknown as Record<string, unknown>) || {});

                    for (const cf of rawChild) {
                        const cName = Array.isArray(cf) ? (cf[0] as string) : (cf as { name: string }).name;
                        const cVal = Array.isArray(cf) ? cf[1] : cf;
                        const childTypeStr = extractFieldTypeString(cVal);
                        const childSemType = resolvePrimitiveKind(childTypeStr);

                        const childDesc: ResourceFieldDescriptor = (cVal && typeof cVal === 'object' && 'expression' in cVal)
                            ? (cVal as ResourceFieldDescriptor)
                            : ScannedResourceFieldDescriptor.create({
                                name: cName,
                                propertyName: toCamelCase(cName),
                                expression: extractFieldExpression(cVal),
                                semanticType: childSemType,
                                nullable: isNullable || Boolean(fKindRecord.nullable)
                            });
                        processField(childDesc, propName, isNullable || Boolean(fKindRecord.nullable));
                    }
                    return;
                }
            }

            const fKindObj = (fKind && typeof fKind === 'object') ? (fKind as Record<string, unknown>) : null;
            const resolvedType = field.semanticType
                ? field.semanticType
                : (fKindObj ? extractFieldTypeString(fKindObj) : '');
            const primKind = resolvePrimitiveKind(resolvedType);
            let propType: SemanticType = new PrimitiveType(primKind);
            const fKindNullable = fKindObj ? Boolean(fKindObj.nullable) : false;
            const fieldNullable = isNullable || field.nullable || fKindNullable || String(resolvedType).toLowerCase().includes('null');

            if (fKindObj && (fKindObj.kind === 'array' || fKindObj.collection)) {
                const targetRes = extractCollectionTargetResource(fKindObj);
                const elemType = targetRes.length > 0
                    ? new ReferenceType('', `${toPascalCase(targetRes)}Transformed`)
                    : new PrimitiveType(PrimitiveKind.STRING);
                propType = new ReadonlyCollectionType(CollectionKind.ARRAY, elemType);
            }

            if (fieldNullable) {
                propType = new NullableType(propType);
            }
            const internedType = interner.intern(propType);

            properties.push(ScannedObjectProperty.create({
                name: propName,
                type: internedType,
                required: true,
                nullable: Boolean(fieldNullable)
            }));
        };

        for (const f of rawFields) {
            processField(f, '', Boolean(f.nullable));
        }
        const baseName = res.name.endsWith('Transformed') ? res.name.replace(/Transformed$/, '') : res.name;
        const typeName = res.typeName
            ? res.typeName
            : (res.name.endsWith('Transformed') ? res.name : `${res.name}Transformed`);
        seenNames.add(typeName);
        const objType = new ObjectType({ name: typeName, baseName, properties });
        types.push(interner.intern(objType) as ObjectType);
    }

    return types;
}
