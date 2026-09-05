/**
 * FormRequestScanner.ts
 *
 * Scans app/Http/Requests/*.php for FormRequest validation rules and nested structures.
 *
 * @module core/compiler/scanner/subscanners/FormRequestScanner
 */

import path from "path";
import fs from "fs-extra";
import { ValidationRuleNode, ValidationRuleParser } from "../../../types/route";
import { RequestType, RequestField } from "../../artifacts/RequestTypesArtifact";
import {
    ObjectType,
    ObjectProperty,
    ScannedObjectProperty,
    PrimitiveType,
    PrimitiveKind,
    ReadonlyCollectionType,
    CollectionKind,
    SemanticType
} from "../../types/SemanticType";
import { TypeInterner } from "../../types/TypeInterner";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import { toCamelCase, toPascalCase } from "../../../utils/resource-naming";
import {
    ScannedFormFieldDescriptor,
    ScannedFormActionDescriptor,
    ScannedRequestTypeDescriptor
} from "../descriptors/requestDescriptors";
import { collectPhpFiles } from "./scannerUtils";

export class FormRequestScanner {
    public static async scan(projectRoot: string, interner: TypeInterner = new TypeInterner()): Promise<readonly RequestType[]> {
        const reqDir = path.join(projectRoot, 'app', 'Http', 'Requests');
        const files = await collectPhpFiles(reqDir);
        const groups = new Map<string, RequestType>();

        for (const fullPath of files) {
            const source = await fs.readFile(fullPath, 'utf-8');
            const tokens = LaravelSourceLexer.tokenize(source);
            const reqName = path.basename(fullPath, '.php');

            let rulesIndex = 0;
            const rulesIdx = tokens.findIndex((t, idx) => t.value === 'rules' && tokens[idx - 1]?.value === 'function');
            if (rulesIdx !== -1) {
                const retIdx = tokens.findIndex((t, idx) => idx > rulesIdx && t.value === 'return');
                if (retIdx !== -1) {
                    rulesIndex = retIdx;
                }
            }
            const parsedArray = LaravelSourceLexer.parseArray(source, tokens, rulesIndex);
            const fields: RequestField[] = [];

            const arrayProps = new Map<string, ObjectProperty[]>();
            const primitiveArrayProps = new Map<string, SemanticType>();
            const regularRules: Array<{ key: string; ruleStr: string; validationAst: readonly ValidationRuleNode[]; isRequired: boolean; isNullable: boolean }> = [];

            for (const entry of parsedArray.entries) {
                const ruleStr = entry.value.kind === 'literal' && entry.value.literalType === 'string'
                    ? entry.value.value
                    : (entry.value.kind === 'nested_array'
                        ? entry.value.entries.map(e => e.rawExpression).join('|')
                        : entry.rawExpression);

                const rulesList = (ruleStr || '').split('|').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
                const validationAst = ValidationRuleParser.parseAll(rulesList);

                const isNum = ruleStr.includes('numeric') || ruleStr.includes('integer') || ruleStr.includes('decimal');
                const isBool = ruleStr.includes('boolean');
                const isRequired = ruleStr.includes('required') || !ruleStr.includes('sometimes');
                const isNullable = ruleStr.includes('nullable');

                if (entry.key.includes('.*.')) {
                    const [parentKey, childKey] = entry.key.split('.*.');
                    if (!arrayProps.has(parentKey)) {
                        arrayProps.set(parentKey, []);
                    }
                    let primKind = PrimitiveKind.STRING;
                    if (isNum) {
                        primKind = PrimitiveKind.NUMBER;
                    } else if (isBool) {
                        primKind = PrimitiveKind.BOOLEAN;
                    }
                    const semanticType = interner.intern(new PrimitiveType(primKind));

                    arrayProps.get(parentKey)!.push(ScannedObjectProperty.create({
                        name: childKey,
                        type: semanticType,
                        required: isRequired,
                        nullable: isNullable
                    }));
                } else if (entry.key.endsWith('.*')) {
                    const baseKey = entry.key.slice(0, -2);
                    let primKind = PrimitiveKind.STRING;
                    if (isNum) {
                        primKind = PrimitiveKind.NUMBER;
                    } else if (isBool) {
                        primKind = PrimitiveKind.BOOLEAN;
                    }
                    const semanticType = interner.intern(new PrimitiveType(primKind));
                    const arrayType = interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, semanticType));
                    primitiveArrayProps.set(baseKey, arrayType);
                } else {
                    regularRules.push({ key: entry.key, ruleStr, validationAst, isRequired, isNullable });
                }
            }

            const processedKeys = new Set<string>();
            for (const { key, ruleStr, validationAst, isRequired, isNullable } of regularRules) {
                processedKeys.add(key);
                if (arrayProps.has(key)) {
                    const childProperties = arrayProps.get(key)!;
                    const childObjectType = new ObjectType({ name: key, baseName: key, properties: childProperties });
                    const arrayType = interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, childObjectType));

                    fields.push(ScannedFormFieldDescriptor.create({
                        name: key,
                        originalName: key,
                        type: arrayType,
                        required: isRequired,
                        nullable: isNullable,
                        validationAst
                    }));
                } else if (primitiveArrayProps.has(key)) {
                    fields.push(ScannedFormFieldDescriptor.create({
                        name: key,
                        originalName: key,
                        type: primitiveArrayProps.get(key)!,
                        required: isRequired,
                        nullable: isNullable,
                        validationAst
                    }));
                } else {
                    const isArrayRule = ruleStr.includes('array');
                    const isNum = ruleStr.includes('numeric') || ruleStr.includes('integer') || ruleStr.includes('decimal');
                    const isBool = ruleStr.includes('boolean');
                    let semanticType: SemanticType;
                    if (isArrayRule) {
                        const unknownType = interner.intern(new PrimitiveType(PrimitiveKind.UNKNOWN));
                        semanticType = interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, unknownType));
                    } else {
                        let primKind = PrimitiveKind.STRING;
                        if (isNum) {
                            primKind = PrimitiveKind.NUMBER;
                        } else if (isBool) {
                            primKind = PrimitiveKind.BOOLEAN;
                        }
                        semanticType = interner.intern(new PrimitiveType(primKind));
                    }

                    fields.push(ScannedFormFieldDescriptor.create({
                        name: key,
                        originalName: key,
                        type: semanticType,
                        required: isRequired,
                        nullable: isNullable,
                        validationAst
                    }));
                }
            }

            for (const [parentKey, childProperties] of arrayProps.entries()) {
                if (!processedKeys.has(parentKey)) {
                    const childObjectType = new ObjectType({ name: toCamelCase(parentKey), baseName: toCamelCase(parentKey), properties: childProperties });
                    const arrayType = interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, childObjectType));
                    fields.push(ScannedFormFieldDescriptor.create({
                        name: parentKey,
                        originalName: parentKey,
                        type: arrayType,
                        required: false,
                        nullable: false
                    }));
                }
            }

            const rawResource = reqName.replace(/Request$/, '').replace(/^(Store|Update|Create)/, '');
            const resKey = toCamelCase(rawResource);
            const actionName: 'create' | 'update' = (reqName.startsWith('Store') || reqName.startsWith('Create')) ? 'create' : 'update';
            const action = new ScannedFormActionDescriptor({
                name: actionName,
                fields
            });

            if (groups.has(resKey)) {
                const existing = groups.get(resKey)!;
                groups.set(resKey, ScannedRequestTypeDescriptor.create({
                    resourceName: existing.resourceName,
                    formTypeName: existing.formTypeName,
                    actions: [...existing.actions, action],
                    responseData: existing.responseData
                }));
            } else {
                groups.set(resKey, ScannedRequestTypeDescriptor.create({
                    resourceName: resKey,
                    formTypeName: `${toPascalCase(rawResource)}Form`,
                    actions: [action]
                }));
            }
        }

        return Array.from(groups.values());
    }
}
