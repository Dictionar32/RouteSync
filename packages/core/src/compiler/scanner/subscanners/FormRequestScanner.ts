/**
 * FormRequestScanner.ts
 *
 * Scans app/Http/Requests/*.php for FormRequest validation rules and nested structures.
 *
 * @module core/compiler/scanner/subscanners/FormRequestScanner
 */

import path from "path";
import fs from "fs-extra";
import type { RequestType, RequestField } from "../../artifacts/RequestTypesArtifact";
import { TypeInterner } from "../../types/TypeInterner";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import { toCamelCase, toPascalCase } from "../../../utils/resource-naming";
import {
    ScannedFormActionDescriptor,
    ScannedRequestTypeDescriptor
} from "../descriptors/requestDescriptors";
import { collectPhpFiles } from "./scannerUtils";
import { partitionValidationRules, assembleFormFields } from "./form-request";

export class FormRequestScanner {
    public static async scan(
        projectRoot: string,
        interner: TypeInterner = new TypeInterner()
    ): Promise<readonly RequestType[]> {
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

            const partitioned = partitionValidationRules(parsedArray.entries, interner);
            const fields: RequestField[] = assembleFormFields(partitioned, interner);

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
