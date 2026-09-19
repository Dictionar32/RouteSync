/**
 * ValidationRuleFieldLowerer.ts
 *
 * Lowers raw route validation rules into structured RequestField[] descriptors.
 * Active Consumer orchestrating rule parsing, wildcard accumulation, and field emission.
 *
 * @module core/compiler/scanner/subscanners/ValidationRuleFieldLowerer
 */

import { ParsedRoute } from "../../../types/route";
import type { RequestField } from "../../../types/domain/request";
import {
    ObjectProperty,
    ScannedObjectProperty,
    PrimitiveType,
    ReadonlyCollectionType,
    CollectionKind,
    SemanticType
} from "../../types/SemanticType";
import { TypeInterner } from "../../types/TypeInterner";
import { resolvePrimitiveKind } from "./typeDeriverUtils";
import { warnIfTypeNotExplicit } from "./validationRuleChecker";
import {
    buildRegularField,
    appendUnprocessedArrayProps
} from "./validationArrayPropLowerer";

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

        const routeActionDesc = route.action || route.actionName || route.resourceName || '';
        const rawRules = route.schema.rules;
        const ruleEntries: readonly [string, string][] = Array.isArray(rawRules)
            ? (rawRules as readonly any[]).map(r => [String(r.fieldName || r.field || ''), Array.isArray(r.rules) ? r.rules.join('|') : String(r.rules || '')])
            : Object.entries((rawRules as any) || {}).map(([key, val]) => [String(key || ''), Array.isArray(val) ? val.join('|') : String(val || '')]);

        for (const [key, ruleStr] of ruleEntries) {
            warnIfTypeNotExplicit(key, ruleStr, route.path, routeActionDesc);

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
                    nullable: ruleStr.includes('nullable'),
                    origin: { kind: 'validation_field', field: childKey }
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
            fields.push(buildRegularField(key, ruleStr, arrayProps, primitiveArrayProps, interner));
        }

        appendUnprocessedArrayProps(fields, arrayProps, primitiveArrayProps, processedKeys, interner);
        return fields;
    }
}
