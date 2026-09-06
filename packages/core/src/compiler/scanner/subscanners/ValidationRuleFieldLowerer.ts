/**
 * ValidationRuleFieldLowerer.ts
 *
 * Lowers raw route validation rules into structured RequestField[] descriptors.
 * Handles nested wildcards (.*.), primitive arrays (.*), and standard form fields.
 *
 * @module core/compiler/scanner/subscanners/ValidationRuleFieldLowerer
 */

import { ParsedRoute } from "../../../types/route";
import { RequestField } from "../../artifacts/RequestTypesArtifact";
import {
    ObjectType,
    ObjectProperty,
    ScannedObjectProperty,
    PrimitiveType,
    ReadonlyCollectionType,
    CollectionKind,
    SemanticType
} from "../../types/SemanticType";
import { TypeInterner } from "../../types/TypeInterner";
import { toCamelCase } from "../../../utils/resource-naming";
import { ScannedFormFieldDescriptor } from "../descriptors/requestDescriptors";
import { resolvePrimitiveKind } from "./typeDeriverUtils";

export class ValidationRuleFieldLowerer {
    /**
     * Lowers route validation rules into RequestField[] AST nodes.
     */
    public static lower(
        route: ParsedRoute,
        interner: TypeInterner = new TypeInterner()
    ): RequestField[] {
        const fields: RequestField[] = [];
        if (!route.schema?.rules) {
            return fields;
        }

        const arrayProps = new Map<string, ObjectProperty[]>();
        const primitiveArrayProps = new Map<string, SemanticType>();
        const regularRules: [string, string][] = [];

        const routeActionDesc = (route as any).action || route.actionName || route.resourceName || (route as any).controllerAction || '';
        const rawRules = route.schema.rules;
        const ruleEntries: readonly [string, string][] = Array.isArray(rawRules)
            ? (rawRules as readonly any[]).map(r => [String(r.fieldName || r.field || ''), Array.isArray(r.rules) ? r.rules.join('|') : String(r.rules || '')])
            : Object.entries((rawRules as any) || {}).map(([key, val]) => [String(key || ''), Array.isArray(val) ? val.join('|') : String(val || '')]);

        for (const [key, ruleStr] of ruleEntries) {
            if (key.includes('.*')) {
                const hasExplicitType = ruleStr.includes('string') || ruleStr.includes('integer') || ruleStr.includes('numeric') || ruleStr.includes('boolean') || ruleStr.includes('file') || ruleStr.includes('image');
                if (!hasExplicitType) {
                    console.warn(`[RouteSync Compiler Warning] Tipe elemen untuk wildcard '${key}' pada route ${route.path} (${routeActionDesc}) belum eksplisit.`);
                }
            } else {
                const hasExplicitType = ruleStr.includes('string') || ruleStr.includes('integer') || ruleStr.includes('numeric') || ruleStr.includes('boolean') || ruleStr.includes('array') || ruleStr.includes('file') || ruleStr.includes('image');
                if (!hasExplicitType) {
                    console.warn(`[RouteSync Compiler Warning] Tipe field untuk '${key}' pada route ${route.path} (${routeActionDesc}) belum eksplisit.`);
                }
            }

            if (key.includes('.*.')) {
                const [parentKey, childKey] = key.split('.*.');
                if (!arrayProps.has(parentKey)) {
                    arrayProps.set(parentKey, []);
                }
                const primKind = resolvePrimitiveKind(ruleStr);
                const semanticType = interner.intern(new PrimitiveType(primKind));

                arrayProps.get(parentKey)!.push(ScannedObjectProperty.create({
                    name: childKey,
                    type: semanticType,
                    required: ruleStr.includes('required'),
                    nullable: ruleStr.includes('nullable')
                }));
            } else if (key.endsWith('.*')) {
                const baseKey = key.slice(0, -2);
                const primKind = resolvePrimitiveKind(ruleStr);
                const semanticType = interner.intern(new PrimitiveType(primKind));
                const arrayType = interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, semanticType));
                primitiveArrayProps.set(baseKey, arrayType);
            } else {
                regularRules.push([key, ruleStr]);
            }
        }

        const processedKeys = new Set<string>();
        for (const [key, ruleStr] of regularRules) {
            processedKeys.add(key);
            if (arrayProps.has(key)) {
                const childProperties = arrayProps.get(key)!;
                const childObjectType = new ObjectType({ name: key, baseName: key, properties: childProperties });
                const arrayType = interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, childObjectType));

                fields.push(ScannedFormFieldDescriptor.create({
                    name: key,
                    originalName: key,
                    type: arrayType,
                    required: ruleStr.includes('required') || !ruleStr.includes('sometimes'),
                    nullable: ruleStr.includes('nullable')
                }));
            } else if (primitiveArrayProps.has(key)) {
                fields.push(ScannedFormFieldDescriptor.create({
                    name: key,
                    originalName: key,
                    type: primitiveArrayProps.get(key)!,
                    required: ruleStr.includes('required') || !ruleStr.includes('sometimes'),
                    nullable: ruleStr.includes('nullable')
                }));
            } else {
                const primKind = resolvePrimitiveKind(ruleStr);
                const semanticType = interner.intern(new PrimitiveType(primKind));

                fields.push(ScannedFormFieldDescriptor.create({
                    name: key,
                    originalName: key,
                    type: semanticType,
                    required: ruleStr.includes('required') || !ruleStr.includes('sometimes'),
                    nullable: ruleStr.includes('nullable')
                }));
            }
        }

        for (const [parentKey, childProperties] of arrayProps.entries()) {
            if (!processedKeys.has(parentKey)) {
                processedKeys.add(parentKey);
                const childObjectType = new ObjectType({ name: toCamelCase(parentKey), baseName: toCamelCase(parentKey), properties: childProperties });
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

        return fields;
    }
}
