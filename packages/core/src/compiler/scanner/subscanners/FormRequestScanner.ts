import { readSourceText, collectPhpFiles } from './scannerUtils';
/**
 * FormRequestScanner.ts
 *
 * Scans FormRequest sources under app/Http/Requests/*.php validation rules and nested structures.
 *
 * @module core/compiler/scanner/subscanners/FormRequestScanner
 */

import path from "path";
import type { FormRequestSource } from "../../../types/domain/request";
import type { RequestAst } from "../../../types/upstream/ast";
import type { SourceProjectIdentity } from "../../../types/upstream/highLevelSourceModel";
import type { RequestAsts, Sequence } from "../../../types/upstream/collections";
import type { SourceSpan } from "../../../types/upstream/provenance";
import type { NumberValue } from "../../../types/upstream/valueObjects";
import { requestProducer } from "./requestProducer";
import { TypeInterner } from "../../types/TypeInterner";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import { parsePhpMethodOrThrow } from "../lexer/phpMethodParser";
import { parseModelPropertyAsts } from "./model/modelPropertyAstParser";
import { SemanticValueFactory } from "../../../types/domain/semanticValues";
import { readFileSync } from "node:fs";
import { partitionValidationRules } from "./form-request";
import {
    relationAsyncFold,
    relationFold,
    relationFirstOption,
    relationOptionFold,
    relationProject,
    relationResolve,
} from "../../../semantic/kernel/relationalSequence";
import { relationAll, relationEqual } from "../../../semantic/kernel/semanticRelations";

export class FormRequestScanner {
    private static async scanSources(
        sourceProject: SourceProjectIdentity,
        interner: TypeInterner = TypeInterner.create(),
        includeLegacyFields = true
    ): Promise<readonly FormRequestSource[]> {
        const sourceRoot = sourceProject.root.value.value;
        const reqDir = path.join(sourceRoot, 'app', 'Http', 'Requests');
        const files = await collectPhpFiles(reqDir);
        const sources = await relationAsyncFold(
            files,
            [] as readonly FormRequestSource[],
            async (accumulator, fullPath) => {
                const source = await readSourceText(fullPath);
                const tokens = LaravelSourceLexer.tokenize(source);
                const reqName = path.basename(fullPath, '.php');
                const rulesIndex = resolveRulesArrayIndex(tokens);
                const parsedArray = LaravelSourceLexer.parseArray(source, tokens, rulesIndex);
                const methods = parseRequestMethods(tokens);
                const authorize = relationOptionFold(
                    relationFirstOption(methods, method => relationEqual(method.name.value, 'authorize')),
                    () => { throw Error(`FormRequest ${reqName} must declare authorize()`); },
                    method => method,
                );

                return [
                    ...accumulator,
                    Object.freeze({
                        identity: Object.freeze({
                            requestClass: SemanticValueFactory.className(reqName),
                            formType: SemanticValueFactory.formTypeNameFromRequestClass(SemanticValueFactory.className(reqName)),
                        }),
                        sourceFile: SemanticValueFactory.sourceFilePath(fullPath),
                        source: requestSourceSpan(fullPath, source.length),
                        authorization: parseAuthorization(tokens),
                        fields: relationResolve(
                            includeLegacyFields,
                            () => Object.freeze([...partitionValidationRules(parsedArray.entries, interner, fullPath).fields]),
                            () => Object.freeze([]),
                        ),
                    }),
                ];
            },
        );
        return Object.freeze(sources);
    }

    private static async scanOnce(
        sourceProject: SourceProjectIdentity,
        interner: TypeInterner
    ): Promise<{ readonly sources: readonly FormRequestSource[]; readonly asts: readonly RequestAst[] }> {
        const sources = await FormRequestScanner.scanSources(sourceProject, interner, false);
        const asts = await relationAsyncFold(
            sources,
            [] as readonly RequestAst[],
            async (accumulator, source) => {
                const sourceName = source.identity.requestClass.value.value;
                const sourceText = readSourceForProducer(source.sourceFile.value);
                const tokens = LaravelSourceLexer.tokenize(sourceText);
                const methods = parseRequestMethods(tokens);
                const rulesMethod = relationFirstOption(methods, method => relationEqual(method.name.value, 'rules'));
                const authorizeMethod = relationFirstOption(methods, method => relationEqual(method.name.value, 'authorize'));
                return relationOptionFold(
                    relationOptionFold(
                        rulesMethod,
                        () => { throw Error(`FormRequest ${sourceName} is missing rules()/authorize()`); },
                        rules => relationOptionFold(
                            authorizeMethod,
                            () => { throw Error(`FormRequest ${sourceName} is missing rules()/authorize()`); },
                            authorize => {
                                const rulesIndex = resolveRulesReturnIndex(tokens, rules.name.value);
                                const rulesEntries = LaravelSourceLexer.parseArray(sourceText, tokens, rulesIndex).entries;
                                const ast = requestProducer.produce({
                                    requestName: { kind: 'request_name', value: { kind: 'string_value', value: sourceName } },
                                    formType: source.identity.formType,
                                    source: source.source,
                                    rules: rulesEntries,
                                    authorize,
                                    methods,
                                    properties: parseModelPropertyAsts(tokens),
                                    sourceFile: source.sourceFile.value,
                                    interner
                                });
                                return [...accumulator, ast];
                            },
                        ),
                    ),
                    () => accumulator,
                    next => next,
                );
            },
        );
        return { sources, asts: Object.freeze(asts) };
    }

    public static async scan(
        sourceProject: SourceProjectIdentity,
        interner: TypeInterner = TypeInterner.create()
    ): Promise<readonly FormRequestSource[]> {
        return (await FormRequestScanner.scanOnce(sourceProject, interner)).sources;
    }

    /** Upstream AST boundary. The legacy result is intentionally not widened here. */
    public static async scanAsts(
        sourceProject: SourceProjectIdentity,
        interner: TypeInterner = TypeInterner.create()
    ): Promise<readonly RequestAst[]> {
        return (await FormRequestScanner.scanOnce(sourceProject, interner)).asts;
    }

    public static async scanCanonicalBundle(
        sourceProject: SourceProjectIdentity,
        interner: TypeInterner = TypeInterner.create()
    ): Promise<{ readonly sources: readonly FormRequestSource[]; readonly asts: readonly RequestAst[] }> {
        return FormRequestScanner.scanOnce(sourceProject, interner);
    }

    public static async scanAstCollection(
        sourceProject: SourceProjectIdentity,
        interner: TypeInterner = TypeInterner.create()
    ): Promise<RequestAsts> {
        const requests = (await FormRequestScanner.scanOnce(sourceProject, interner)).asts;
        const items = sequenceFromRequests(requests);
        const result = discoveryFromSequence(items);
        return { kind: 'request_asts', items: { kind: 'scanned', result } };
    }
}

type LexerToken = import('../lexer/LaravelSourceLexer').TokenDescriptor;
type PhpToken = import('../lexer/PhpAst').TokenDescriptor;
type PhpMethod = import('../lexer/phpMethodAstTypes').PhpMethodAst;

function parseAuthorization(tokens: readonly LexerToken[]): FormRequestSource['authorization'] {
    const authorizeIndex = relationFirstOption(
        relationProject(tokens, (token, index) => ({ token, index })),
        entry => relationAll([
            relationEqual(entry.token.value, 'authorize'),
            relationResolve(entry.index > 0, () => relationEqual(tokens[entry.index - 1].value, 'function'), () => false),
        ]),
    );
    return relationOptionFold(
        authorizeIndex,
        () => { throw Error('FormRequest authorization boundary requires an explicit authorize() method'); },
        entry => {
            const returnIndex = relationFirstOption(
                relationProject(tokens, (token, index) => ({ token, index })),
                candidate => relationAll([
                    candidate.index > entry.index,
                    relationEqual(candidate.token.value, 'return'),
                ]),
            );
            return relationOptionFold(
                returnIndex,
                () => { throw Error('FormRequest authorize() method has no return expression'); },
                result => {
                    const value = relationResolve(
                        result.index + 1 < tokens.length,
                        () => tokens[result.index + 1].value,
                        () => '<missing>',
                    );
                    return relationOptionFold(
                        relationFirstOption(
                            [
                                { value, authorization: { kind: 'authorized' as const }, matches: relationEqual(value, 'true') },
                                { value, authorization: { kind: 'denied' as const }, matches: relationEqual(value, 'false') },
                            ],
                            candidate => candidate.matches,
                        ),
                        () => { throw Error(`Unsupported FormRequest authorize() return expression: ${value}`); },
                        candidate => candidate.authorization,
                    );
                },
            );
        },
    );
}

function discoveryFromSequence<T>(items: Sequence<T> | { readonly kind: 'empty' }):
    | { readonly kind: 'discovered_empty' }
    | { readonly kind: 'discovered_many'; readonly items: Sequence<T> } {
    return relationOptionFold(
        relationFirstOption([items], candidate => relationEqual(candidate.kind, 'cons')),
        () => ({ kind: 'discovered_empty' as const }),
        candidate => ({ kind: 'discovered_many' as const, items: candidate }),
    );
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
    const state = relationFold(
        tokens,
        { depth: 0, methods: [] as readonly PhpMethod[] },
        (state, token, index) => {
            const depthAfterOpen = relationResolve(relationEqual(token.value, '{'), () => state.depth + 1, () => state.depth);
            const depthAfterClose = relationResolve(relationEqual(token.value, '}'), () => depthAfterOpen - 1, () => depthAfterOpen);
            const method = relationResolve(
                relationAll([relationEqual(token.value, 'function'), relationEqual(depthAfterClose, 1)]),
                () => relationSomeMethod(parsePhpMethodOrThrow('', tokens, index)),
                () => relationNoneMethod(),
            );
            return {
                depth: depthAfterClose,
                methods: relationOptionFold(method, () => state.methods, parsed => [...state.methods, parsed]),
            };
        },
    );
    return Object.freeze(state.methods);
}

function relationSomeMethod(value: PhpMethod): { readonly kind: 'some'; readonly value: PhpMethod } {
    return { kind: 'some', value };
}

function relationNoneMethod(): { readonly kind: 'none' } {
    return { kind: 'none' };
}

function resolveRulesArrayIndex(tokens: readonly LexerToken[]): number {
    return relationOptionFold(
        relationFirstOption(
            relationProject(tokens, (token, index) => ({ token, index })),
            entry => relationAll([
                relationEqual(entry.token.value, 'rules'),
                relationResolve(entry.index > 0, () => relationEqual(tokens[entry.index - 1].value, 'function'), () => false),
            ]),
        ),
        () => 0,
        entry => resolveRulesReturnIndex(tokens, 'rules', entry.index),
    );
}

function resolveRulesReturnIndex(tokens: readonly LexerToken[], methodName: string, methodIndex = 0): number {
    const anchor = relationOptionFold(
        relationFirstOption(
            relationProject(tokens, (token, index) => ({ token, index })),
            entry => relationAll([
                relationEqual(entry.token.value, methodName),
                relationResolve(entry.index > 0, () => relationEqual(tokens[entry.index - 1].value, 'function'), () => false),
            ]),
        ),
        () => methodIndex,
        entry => entry.index,
    );
    return relationOptionFold(
        relationFirstOption(
            relationProject(tokens, (token, index) => ({ token, index })),
            entry => relationAll([entry.index > anchor, relationEqual(entry.token.value, 'return')]),
        ),
        () => anchor,
        entry => entry.index,
    );
}

function sequenceFromRequests<T>(requests: readonly T[], index = requests.length - 1, tail: Sequence<T> = { kind: 'empty' }): Sequence<T> {
    return relationResolve(
        index < 0,
        () => tail,
        () => sequenceFromRequests(requests, index - 1, { kind: 'cons', head: requests[index], tail }),
    );
}

