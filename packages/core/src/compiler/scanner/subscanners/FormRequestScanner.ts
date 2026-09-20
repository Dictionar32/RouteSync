/**
 * FormRequestScanner.ts
 *
 * Scans app/Http/Requests/*.php for FormRequest validation rules and nested structures.
 *
 * @module core/compiler/scanner/subscanners/FormRequestScanner
 */

import path from "path";
import fs from "fs-extra";
import type { FormRequestSource } from "../../../types/domain/request";
import { TypeInterner } from "../../types/TypeInterner";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import { SemanticValueFactory } from "../../../types/domain/semanticValues";


import { collectPhpFiles } from "./scannerUtils";
import { partitionValidationRules } from "./form-request";

export class FormRequestScanner {
    public static async scan(
        projectRoot: string,
        interner: TypeInterner = new TypeInterner()
    ): Promise<readonly FormRequestSource[]> {
        const reqDir = path.join(projectRoot, 'app', 'Http', 'Requests');
        const files = await collectPhpFiles(reqDir);
        const sources: FormRequestSource[] = [];

        for (const fullPath of files) {
            const source = await fs.readFile(fullPath, 'utf-8');
            const tokens = LaravelSourceLexer.tokenize(source);
            const reqName = path.basename(fullPath, '.php');

            let rulesIndex = 0;
            const rulesIdx = tokens.findIndex((t, idx) => t.value === 'rules' && tokens[idx - 1]?.value === 'function');
            if (rulesIdx !== -1) {
                const retIdx = tokens.findIndex((t, idx) => idx > rulesIdx && t.value === 'return');
                if (retIdx !== -1) rulesIndex = retIdx;
            }
            const parsedArray = LaravelSourceLexer.parseArray(source, tokens, rulesIndex);
            const partitioned = partitionValidationRules(parsedArray.entries, interner);

            sources.push(Object.freeze({
                identity: Object.freeze({
                    requestClass: SemanticValueFactory.className(reqName),
                    formType: SemanticValueFactory.formTypeNameFromRequestClass(SemanticValueFactory.className(reqName)),
                }),
                sourceFile: SemanticValueFactory.sourceFilePath(fullPath),
                fields: Object.freeze([...partitioned.fields]),
            }));
        }

        return Object.freeze(sources);
    }
}
