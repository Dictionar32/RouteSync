import { sourceFileAcquisition } from './sourceFiles';
/**
 * LaravelFormRequestScanner.ts
 *
 * Scans FormRequest sources under app/Http/Requests/*.php validation rules and nested structures.
 *
 * @module core/compiler/scanner/laravelFormRequestScanner
 */

import path from "path";
import type { FormRequestSource } from "../../types/domain/request";
import type { RequestAst } from "../../types/upstream/ast";
import { createRequestName } from "../../types/upstream/names";
import type { SourceProjectIdentity } from "../../types/upstream/highLevelSourceModel";
import type { LaravelFormRequestScanArtifact, LaravelFormRequestScanInput, LaravelFormRequestScannerInterface } from "../../types/upstream/laravelFormRequestScannerInterface";
import type { RequestAsts, Sequence } from "../../types/upstream/collections";
import type { SourceSpan } from "../../types/upstream/provenance";
import type { NumberValue } from "../../types/upstream/valueObjects";
import { requestProducer } from "./operations/requestProducer";
import type { RequestProducerResult } from "../../types/upstream/requestProducerInterface";
import { TypeInterner } from "../types/TypeInterner";
import { LaravelSourceLexer } from "./LaravelSourceLexer";
import { parsePhpMethodOrThrow } from "./lexer/phpMethodParser";
import { sourceAstSyntaxParser } from "../semantic/sourceAstSyntaxParser";
import { SemanticValueFactory } from "../../types/domain/semanticValues";
import { readFileSync } from "node:fs";

export class LaravelFormRequestScanner {
    private static async scanSources(
        sourceProject: SourceProjectIdentity,
    ): Promise<readonly FormRequestSource[]> {
        const sourceRoot = sourceProject.root.value.value;
        const reqDir = path.join(sourceRoot, 'app', 'Http', 'Requests');
        const files = await sourceFileAcquisition.collectPhpFiles(reqDir);
        const sources: FormRequestSource[] = [];
        for (const fullPath of files) {
            const source = await sourceFileAcquisition.readSourceText(fullPath);
            const tokens = LaravelSourceLexer.tokenize(source);
            const reqName = path.basename(fullPath, '.php');
            const methods = parseRequestMethods(tokens);
            const authorize = methods.find(method => method.name === 'authorize');
            if (authorize === undefined) {
                throw Error(`FormRequest ${reqName} must declare authorize()`);
            }
            sources.push(Object.freeze({
                identity: Object.freeze({
                    requestClass: SemanticValueFactory.className(reqName),
                    formType: SemanticValueFactory.formTypeNameFromRequestClass(SemanticValueFactory.className(reqName)),
                }),
                sourceFile: SemanticValueFactory.sourceFilePath(fullPath),
                source: requestSourceSpan(fullPath, source.length),
                authorization: parseAuthorization(tokens),
                fields: Object.freeze([]),
            }));
        }
        return Object.freeze(sources);
    }

    private static async scanOnce(
        sourceProject: SourceProjectIdentity,
        interner: TypeInterner
    ): Promise<{ readonly sources: readonly FormRequestSource[]; readonly artifacts: readonly LaravelFormRequestScanArtifact[]; readonly asts: readonly RequestAst[]; readonly definitions: readonly import('../../types/upstream/request').RequestDefinition[] }> {
        const sources = await LaravelFormRequestScanner.scanSources(sourceProject);
        const results: Readonly<{ readonly source: FormRequestSource; readonly result: RequestProducerResult }>[] = [];
        for (const source of sources) {
            const sourceName = source.identity.requestClass.value.value;
            const sourceText = readSourceForProducer(source.sourceFile.value.value);
            const tokens = LaravelSourceLexer.tokenize(sourceText);
            const methods = parseRequestMethods(tokens);
            const rulesMethod = methods.find(method => method.name === 'rules');
            if (rulesMethod === undefined) {
                continue;
            }
            const authorizeMethod = methods.find(method => method.name === 'authorize');
            if (authorizeMethod === undefined) {
                throw Error(`FormRequest ${sourceName} is missing rules()/authorize()`);
            }
            const rulesIndex = resolveRulesReturnIndex(tokens, rulesMethod.name);
            const rulesEntries = LaravelSourceLexer.parseArray(sourceText, tokens, rulesIndex).entries;
            const result = requestProducer.produceResult({
                requestName: createRequestName(sourceName),
                formType: source.identity.formType,
                source: source.source,
                rules: rulesEntries,
                authorize: authorizeMethod,
                methods,
                properties: sourceAstSyntaxParser.parseProperties(tokens),
                sourceFile: source.sourceFile,
                interner,
            });
            results.push(Object.freeze({ source, result }));
        }
        const artifacts: readonly LaravelFormRequestScanArtifact[] = Object.freeze(results.map(entry => Object.freeze({
            kind: 'laravel_form_request_scan_artifact',
            source: entry.source,
            ast: entry.result.ast,
            definition: entry.result.definition,
        } satisfies LaravelFormRequestScanArtifact)));
        return {
            sources,
            artifacts,
            asts: Object.freeze(artifacts.map(artifact => artifact.ast)),
            definitions: Object.freeze(artifacts.map(artifact => artifact.definition)),
        };
    }

    public static async scan(
        sourceProject: SourceProjectIdentity,
        interner: TypeInterner = TypeInterner.create()
    ): Promise<readonly FormRequestSource[]> {
        return (await LaravelFormRequestScanner.scanOnce(sourceProject, interner)).sources;
    }

    /** Upstream AST boundary. The legacy result is intentionally not widened here. */
    public static async scanAsts(
        sourceProject: SourceProjectIdentity,
        interner: TypeInterner = TypeInterner.create()
    ): Promise<readonly RequestAst[]> {
        return (await LaravelFormRequestScanner.scanOnce(sourceProject, interner)).asts;
    }

    public static async scanCanonicalBundle(
        sourceProject: SourceProjectIdentity,
        interner: TypeInterner = TypeInterner.create()
    ): Promise<{ readonly sources: readonly FormRequestSource[]; readonly artifacts: readonly LaravelFormRequestScanArtifact[]; readonly asts: readonly RequestAst[]; readonly definitions: readonly import('../../types/upstream/request').RequestDefinition[] }> {
        return LaravelFormRequestScanner.scanOnce(sourceProject, interner);
    }

    public static async scanAstCollection(
        sourceProject: SourceProjectIdentity,
        interner: TypeInterner = TypeInterner.create()
    ): Promise<RequestAsts> {
        const requests = (await LaravelFormRequestScanner.scanOnce(sourceProject, interner)).asts;
        const items = sequenceFromRequests(requests);
        const result = discoveryFromSequence(items);
        return { kind: 'request_asts', items: { kind: 'scanned', result } };
    }
}

type LexerToken = import('./LaravelSourceLexer').TokenDescriptor;
type PhpToken = import('./lexer/PhpAst').TokenDescriptor;
type PhpMethod = import('./lexer/phpMethodAstTypes').PhpMethodAst;

function parseAuthorization(tokens: readonly LexerToken[]): FormRequestSource['authorization'] {
    const authorizeIndex = tokens.findIndex((token, index) =>
        token.value === 'authorize' && index > 0 && tokens[index - 1].value === 'function');
    if (authorizeIndex < 0) {
        throw Error('FormRequest authorization boundary requires an explicit authorize() method');
    }
    const returnIndex = tokens.findIndex((token, index) => index > authorizeIndex && token.value === 'return');
    if (returnIndex < 0) {
        throw Error('FormRequest authorize() method has no return expression');
    }
    const value = tokens[returnIndex + 1]?.value ?? '<missing>';
    const judgments = [
        { value: 'true', authorization: { kind: 'authorized' as const } },
        { value: 'false', authorization: { kind: 'denied' as const } },
    ];
    const judgment = judgments.find(candidate => candidate.value === value);
    if (judgment === undefined) {
        throw Error(`Unsupported FormRequest authorize() return expression: ${value}`);
    }
    return judgment.authorization;
}

function discoveryFromSequence<T>(items: Sequence<T> | { readonly kind: 'empty' }):
    | { readonly kind: 'discovered_empty' }
    | { readonly kind: 'discovered_many'; readonly items: Sequence<T> } {
    return items.kind === 'cons'
        ? { kind: 'discovered_many', items }
        : { kind: 'discovered_empty' };
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

function readSourceForProducer(file: string): string {
    return readFileSync(file, 'utf8');
}

function parseRequestMethods(tokens: readonly PhpToken[]): readonly PhpMethod[] {
    let depth = 0;
    const methods: PhpMethod[] = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        if (token.value === 'function' && depth === 1) {
            methods.push(parsePhpMethodOrThrow('', tokens, index));
        }
        if (token.value === '{') {
            depth += 1;
        }
        if (token.value === '}') {
            depth -= 1;
        }
    }
    return Object.freeze(methods);
}

function resolveRulesReturnIndex(tokens: readonly LexerToken[], methodName: string, methodIndex = 0): number {
    const methodTokenIndex = tokens.findIndex((token, index) =>
        token.value === methodName && index > 0 && tokens[index - 1].value === 'function');
    const anchor = methodTokenIndex < 0 ? methodIndex : methodTokenIndex;
    const returnIndex = tokens.findIndex((token, index) => index > anchor && token.value === 'return');
    return returnIndex < 0 ? anchor : returnIndex;
}

function sequenceFromRequests<T>(requests: readonly T[]): Sequence<T> {
    return requests.reduce<Sequence<T>>(
        (tail, head) => ({ kind: 'cons', head, tail }),
        { kind: 'empty' },
    );
}


/** Interface-first owner for the active Laravel FormRequest scan boundary. */
export const laravelFormRequestScanner: LaravelFormRequestScannerInterface = Object.freeze({
    kind: 'laravel_form_request_scanner',
    closed: true,
    contractVersion: 3,
    scan: async (input: LaravelFormRequestScanInput) => {
        const bundle = await LaravelFormRequestScanner.scanCanonicalBundle(input.sourceProject);
        return Object.freeze({
            kind: 'laravel_form_request_scan_judgment',
            contractVersion: 3,
            sources: bundle.sources,
            requests: bundle.artifacts,
        });
    },
});
