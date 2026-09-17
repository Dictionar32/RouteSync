/**
 * validationArrayPropLowerer.ts
 *
 * Assembles array properties and nested object forms from wildcard validation rules.
 *
 * @module core/compiler/scanner/subscanners/validationArrayPropLowerer
 */

import type { RequestField } from "../../../types/domain/request";
import {
    ObjectType,
    ObjectProperty,
    PrimitiveType,
    ReadonlyCollectionType,
    CollectionKind,
    SemanticType
} from "../../types/SemanticType";
import { TypeInterner } from "../../types/TypeInterner";
import { toCamelCase } from "../../../utils/resource-naming";
import { ScannedFormFieldDescriptor } from "../descriptors/requestDescriptors";
import { resolvePrimitiveKind } from "./typeDeriverUtils";

export function buildRegularField(
    key: string,
    ruleStr: string,
    arrayProps: ReadonlyMap<string, ObjectProperty[]>,
    primitiveArrayProps: ReadonlyMap<string, SemanticType>,
    interner: TypeInterner
): RequestField {
    if (arrayProps.has(key)) {
        const childProperties = arrayProps.get(key)!;
        const childObjectType = new ObjectType({ name: key, baseName: key, properties: childProperties, role: 'plain' });
        const arrayType = interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, childObjectType));
        return ScannedFormFieldDescriptor.create({
            name: key,
            originalName: key,
            type: arrayType,
            required: ruleStr.includes('required') || !ruleStr.includes('sometimes'),
            nullable: ruleStr.includes('nullable')
        });
    }

    if (primitiveArrayProps.has(key)) {
        return ScannedFormFieldDescriptor.create({
            name: key,
            originalName: key,
            type: primitiveArrayProps.get(key)!,
            required: ruleStr.includes('required') || !ruleStr.includes('sometimes'),
            nullable: ruleStr.includes('nullable')
        });
    }

    const primKind = resolvePrimitiveKind(ruleStr);
    const semanticType = interner.intern(new PrimitiveType(primKind));
    return ScannedFormFieldDescriptor.create({
        name: key,
        originalName: key,
        type: semanticType,
        required: ruleStr.includes('required') || !ruleStr.includes('sometimes'),
        nullable: ruleStr.includes('nullable')
    });
}

export function appendUnprocessedArrayProps(
    fields: RequestField[],
    arrayProps: ReadonlyMap<string, ObjectProperty[]>,
    primitiveArrayProps: ReadonlyMap<string, SemanticType>,
    processedKeys: Set<string>,
    interner: TypeInterner
): void {
    for (const [parentKey, childProperties] of arrayProps.entries()) {
        if (!processedKeys.has(parentKey)) {
            processedKeys.add(parentKey);
            const childObjectType = new ObjectType({ name: toCamelCase(parentKey), baseName: toCamelCase(parentKey), properties: childProperties, role: 'plain' });
            const arrayType = interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, childObjectType));
            fields.push(ScannedFormFieldDescriptor.create({
                name: parentKey,
                originalName: parentKey,
                type: arrayType,
                required: true,
                nullable: false
            }));
        }
    }

    for (const [baseKey, arrayType] of primitiveArrayProps.entries()) {
        if (!processedKeys.has(baseKey)) {
            processedKeys.add(baseKey);
            fields.push(ScannedFormFieldDescriptor.create({
                name: baseKey,
                originalName: baseKey,
                type: arrayType,
                required: false,
                nullable: false
            }));
        }
    }
}
