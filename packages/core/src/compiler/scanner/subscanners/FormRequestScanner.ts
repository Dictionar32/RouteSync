import { readSourceText } from './scannerUtils';
/**
 * FormRequestScanner.ts
 *
 * Scans app/Http/Requests/*.php for FormRequest validation rules and nested structures.
 *
 * @module core/compiler/scanner/subscanners/FormRequestScanner
 */

import path from "path";
import * as fs from "node:fs";
import type { FormRequestSource } from "../../../types/domain/request";
import type { RequestAst } from "../../../types/upstream/ast";
import type { SourceProjectIdentity } from "../../../types/upstream/highLevelSourceModel";
import type { RequestAsts, Sequence } from "../../../types/upstream/collections";
import type { SourceSpan } from "../../../types/upstream/provenance";
import type { NumberValue } from "../../../types/upstream/valueObjects";
import { requestAstFromSource } from "./requestAstCanonical";
import { TypeInterner } from "../../types/TypeInterner";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import { SemanticValueFactory } from "../../../types/domain/semanticValues";


import { collectPhpFiles } from "./scannerUtils";
import { partitionValidationRules } from "./form-request";

export class FormRequestScanner {
    private static async scanSources(
        sourceProject: SourceProjectIdentity,
        interner: TypeInterner = new TypeInterner()
    ): Promise<readonly FormRequestSource[]> {
        const sourceRoot = sourceProject.root.value.value;
        const reqDir = path.join(sourceRoot, 'app', 'Http', 'Requests');
        const files = await collectPhpFiles(reqDir);
        const sources: FormRequestSource[] = [];

        for (const fullPath of files) {
            const source = await readSourceText(fullPath);
            const tokens = LaravelSourceLexer.tokenize(source);
            const reqName = path.basename(fullPath, '.php');

            let rulesIndex = 0;
            const rulesIdx = tokens.findIndex((t, idx) => t.value === 'rules' && tokens[idx - 1]?.value === 'function');
            if (rulesIdx !== -1) {
                const retIdx = tokens.findIndex((t, idx) => idx > rulesIdx && t.value === 'return');
                if (retIdx !== -1) rulesIndex = retIdx;
            }
            const parsedArray = LaravelSourceLexer.parseArray(source, tokens, rulesIndex);
            const partitioned = partitionValidationRules(parsedArray.entries, interner, fullPath);

            sources.push(Object.freeze({
                identity: Object.freeze({
                    requestClass: SemanticValueFactory.className(reqName),
                    formType: SemanticValueFactory.formTypeNameFromRequestClass(SemanticValueFactory.className(reqName)),
                }),
                sourceFile: SemanticValueFactory.sourceFilePath(fullPath),
                source: requestSourceSpan(fullPath, source.length),
                authorization: parseAuthorization(tokens),
                fields: Object.freeze([...partitioned.fields]),
            }));
        }

        return Object.freeze(sources);
    }
    private static async scanOnce(
        sourceProject: SourceProjectIdentity,
        interner: TypeInterner
    ): Promise<{ readonly sources: readonly FormRequestSource[]; readonly asts: readonly RequestAst[] }> {
        const sources = await FormRequestScanner.scanSources(sourceProject, interner);
        return {
            sources,
            asts: Object.freeze(sources.map(requestAstFromSource))
        };
    }

    public static async scan(
        sourceProject: SourceProjectIdentity,
        interner: TypeInterner = new TypeInterner()
    ): Promise<readonly FormRequestSource[]> {
        return (await FormRequestScanner.scanOnce(sourceProject, interner)).sources;
    }

    /** Upstream AST boundary. The legacy result is intentionally not widened here. */
    public static async scanAsts(
        sourceProject: SourceProjectIdentity,
        interner: TypeInterner = new TypeInterner()
    ): Promise<readonly RequestAst[]> {
        return (await FormRequestScanner.scanOnce(sourceProject, interner)).asts;
    }

    public static async scanCanonicalBundle(
        sourceProject: SourceProjectIdentity,
        interner: TypeInterner = new TypeInterner()
    ): Promise<{ readonly sources: readonly FormRequestSource[]; readonly asts: readonly RequestAst[] }> {
        return FormRequestScanner.scanOnce(sourceProject, interner);
    }

    public static async scanAstCollection(
        sourceProject: SourceProjectIdentity,
        interner: TypeInterner = new TypeInterner()
    ): Promise<RequestAsts> {
        const requests = (await FormRequestScanner.scanOnce(sourceProject, interner)).asts;
        const items: Sequence<RequestAst> = requests.reduceRight<Sequence<RequestAst>>(
            (tail, request) => ({ kind: 'cons', head: request, tail }),
            { kind: 'empty' }
        );
        const result = discoveryFromSequence(items);
        return { kind: 'request_asts', items: { kind: 'scanned', result } };
    }
}

function parseAuthorization(tokens: readonly import('../lexer/LaravelSourceLexer').TokenDescriptor[]): FormRequestSource['authorization'] {
    const authorizeIndex = tokens.findIndex((token, index) => token.value === 'authorize' && tokens[index - 1]?.value === 'function');
    if (authorizeIndex === -1) throw new Error('FormRequest authorization boundary requires an explicit authorize() method');
    const returnIndex = tokens.findIndex((token, index) => index > authorizeIndex && token.value === 'return');
    if (returnIndex === -1) throw new Error('FormRequest authorize() method has no return expression');
    const value = tokens[returnIndex + 1]?.value;
    if (value === 'true') return { kind: 'authorized' };
    if (value === 'false') return { kind: 'denied' };
    throw new Error(`Unsupported FormRequest authorize() return expression: ${value ?? '<missing>'}`);
}


function discoveryFromSequence<T>(items: Sequence<T>):
    | { readonly kind: 'discovered_empty' }
    | { readonly kind: 'discovered_many'; readonly items: Sequence<T> } {
    switch (items.kind) {
        case 'empty': return { kind: 'discovered_empty' };
        case 'cons': return { kind: 'discovered_many', items };
    }
}

function requestSourceSpan(file: string, length: number): SourceSpan {
    const numberValue = (value: number): NumberValue => ({ kind: 'number_value', value });
    return {
        kind: 'source_span',
        file: { kind: 'source_file', value: { kind: 'string_value', value: file } },
        start: numberValue(0),
        end: numberValue(length),
    };
}
