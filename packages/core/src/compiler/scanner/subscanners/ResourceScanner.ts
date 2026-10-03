import type { SourceProjectIdentity } from "../../../types/upstream/highLevelSourceModel";

import { ResourceModelResolutionOrigin } from './resource/resourceModelKnowledgeDataFlow';
import { readSourceText } from './scannerUtils';
import { relationAsyncFold, relationProject, relationExpand, relationOptionFold, relationAdvanceIndex, relationFirstOption, relationFold, relationIndexOf, relationSlice, relationSome, relationNone } from '../../../semantic/kernel/relationalSequence';
import { relationEqual, relationGate, relationAll, relationAny } from '../../../semantic/kernel/semanticRelations';
import { presenceFold, presenceOf } from '../../../types/upstream/presence';
import { matchLookup } from '../../../types/upstream/collections';
/**
 * ResourceScanner.ts
 *
 * Scans app/Http/Resources/*.php for JsonResource definitions and AST expressions.
 * Active Consumer orchestrating resource collection, relation propagation, and semantic binding.
 *
 * @module core/compiler/scanner/subscanners/ResourceScanner
 */

import path from "path";
import * as fs from "node:fs";
import { ResourceFieldExpression } from "../../../types/route";
import { SemanticValueFactory } from "../../../types/domain/semanticValues";
import { LaravelSourceLexer, PhpAstValue, PhpArrayEntry } from "../LaravelSourceLexer";
import { classifyPhpBlock } from "../lexer/astClassifier";
import { parsePhpMethodOrThrow } from "../lexer/phpMethodParser";
import type { PhpStatement } from "../lexer/phpAstTypes";
import { collectPhpFiles } from "./scannerUtils";
import { createModelSymbolTable, type ModelSymbolTable } from "../symbols/ModelSymbolTable";
import { SemanticResourceBinder } from "../binders/SemanticResourceBinder";
import { resourceProducer } from "./resourceProducer";
import {
    type ResourceRelationEdge,
    resolveInitialModel,
    propagateRelationEdges
} from "./resource/twoPassRelationResolver";
import type { ResourceModelResolutionFact } from "./resource/resourceModelKnowledgeDataFlow";
import { resourceModelResolutionFor } from "./resource/resourceModelKnowledgeDataFlow";
import { resolveAstValueToExpression } from "./resource/resourceAstExpressionMapper";
import { mapResourcePhpAstToUpstream } from "./resource/resourceUpstreamExpressionCanonical";
import { parseModelPropertyAsts } from './model/modelPropertyAstParser';
import type { Expression } from "../../../types/upstream/expression";
import type { ResourceAst } from "../../../types/upstream/ast";
import type { ResourceExpressionModel } from "../../../types/domain/resourceExpressionModel";
import type { ResourceName, SourceFile } from "../../../types/upstream/names";

interface ParsedResourceFile {
    readonly resourceName: ResourceName;
    readonly sourceFile: SourceFile;
    readonly sourceLine: number;
    readonly sourceLength: number;
    readonly entries: readonly PhpArrayEntry[];
    readonly assignments: readonly PhpStatement[];
    readonly method: import('../lexer/phpMethodAstTypes').PhpMethodAst;
    readonly baseClass: import('../../../types/upstream/names').ClassName;
    readonly wrapping: import('../../../types/upstream/resource').ResourceWrapping;
    readonly requestParameter: import('../../../types/upstream/names').VariableName;
    readonly documentationMixins: readonly import('../../../types/upstream/semanticReferences').ModelReference[];
    readonly methods: readonly import('../lexer/phpMethodAstTypes').PhpMethodAst[];
    readonly properties: readonly import('../lexer/phpAstDeclarationTypes').PhpClassPropertyAst[];
    readonly preserveKeys: import('../../../types/upstream/valueObjects').TruthValue;
    readonly forceWrapping: import('../../../types/upstream/valueObjects').TruthValue;
    readonly usesRequestQueryString: import('../../../types/upstream/valueObjects').TruthValue;
    readonly includesPreviouslyLoadedRelationships: import('../../../types/upstream/valueObjects').TruthValue;
    readonly jsonAttributes: readonly PhpArrayEntry[];
    readonly jsonRelationships: readonly PhpArrayEntry[];
}

interface BoundResourceFile {
    readonly resource: ResourceAst;
    readonly file: ParsedResourceFile;
}

export class ResourceScanner {
    private static async scanResourceFiles(
        sourceProject: SourceProjectIdentity,
        modelSymbolTable: ModelSymbolTable = createModelSymbolTable([]),
        controllerDataflowMap?: import("../controller/resourceDataflowAggregator").ControllerResourceDataflow
    ): Promise<readonly BoundResourceFile[]> {
        const sourceRoot = sourceProject.root.value.value;
        const resDir = path.join(sourceRoot, 'app', 'Http', 'Resources');
        const files = await collectPhpFiles(resDir);

        const state = await relationAsyncFold(
            files,
            { parsedFiles: [] as ParsedResourceFile[], relationEdges: [] as ResourceRelationEdge[], initialResolutions: [] as ResourceModelResolutionFact[] },
            async (state, fullPath) => {
                const source = await readSourceText(fullPath);
                const tokens = LaravelSourceLexer.tokenize(source);
                const resourceName = path.basename(fullPath, '.php');
                const resourceNameValue = SemanticValueFactory.resourceName(resourceName);
                const returnIndex = this.findReturnIndex(tokens);
                const parsedArray = LaravelSourceLexer.parseArray(source, tokens, returnIndex);
                const sourceLine = tokens[returnIndex].line;
                const method = parseToArrayMethod(tokens);
                const baseClass = parseResourceBaseClass(tokens);
                const wrapping = parseResourceWrapping(tokens);
                const requestParameter = relationOptionFold(
                    relationFirstOption(method.parameters, parameter => relationEqual(parameter.name, 'request')),
                    () => 'request',
                    parameter => parameter.name,
                );
                const documentationMixins = parseResourceDocumentationMixins(source);
                const parsedFile: ParsedResourceFile = {
                    resourceName: resourceNameValue,
                    sourceFile: SemanticValueFactory.sourceFilePath(fullPath),
                    sourceLine,
                    sourceLength: source.length,
                    entries: parsedArray.entries,
                    assignments: parseMethodAssignments(tokens, returnIndex),
                    method,
                    baseClass: { kind: 'class_name', value: { kind: 'string_value', value: baseClass } },
                    wrapping,
                    requestParameter: { kind: 'variable_name', value: { kind: 'string_value', value: requestParameter } },
                    documentationMixins
                };
                const initialResolution = resolveInitialModel(resourceNameValue, modelSymbolTable, presenceOf(controllerDataflowMap));
                const nextInitialResolutions = relationExpand([initialResolution], resolution =>
                    relationGate(relationEqual(resolution.kind, 'present'), () => [resolution.value], () => []),
                );
                const nextEdges = relationExpand(parsedArray.entries, entry => relationGate(
                    relationAny([relationEqual(entry.value.kind, 'resource_single'), relationEqual(entry.value.kind, 'resource_collection')]),
                    () => [{
                        parentResource: resourceNameValue,
                        childResource: SemanticValueFactory.resourceName(entry.value.resourceName),
                        relationKey: SemanticValueFactory.relationName(requireStringArrayKey(relationGate(relationEqual(entry.kind, 'keyed'), () => entry.key, () => ({ kind: 'expression', value: entry.value })))),
                    }],
                    () => [],
                ));
                return {
                    parsedFiles: [...state.parsedFiles, parsedFile],
                    relationEdges: [...state.relationEdges, ...nextEdges],
                    initialResolutions: [...state.initialResolutions, ...nextInitialResolutions],
                };
            },
        );

        const { parsedFiles, relationEdges, initialResolutions } = state;
        const knowledgeDataFlow = propagateRelationEdges(relationEdges, initialResolutions, modelSymbolTable);
        return relationProject(parsedFiles, file => ({
            file,
            resource: SemanticResourceBinder.bindResourceAst({
                resourceName: file.resourceName,
                entries: file.entries,
                source: {
                    kind: 'source_span',
                    file: file.sourceFile,
                    start: { kind: 'number_value', value: 0 },
                    end: { kind: 'number_value', value: file.sourceLength },
                },
                modelSymbolTable,
                knowledgeDataFlow,
                assignments: file.assignments,
                method: file.method,
                baseClass: file.baseClass,
                wrapping: file.wrapping,
                requestParameter: file.requestParameter,
                documentationMixins: file.documentationMixins,
            })
        }));
    }

    private static async scanResources(
        sourceProject: SourceProjectIdentity,
        modelSymbolTable: ModelSymbolTable = createModelSymbolTable([]),
        controllerDataflowMap?: import("../controller/resourceDataflowAggregator").ControllerResourceDataflow
    ): Promise<readonly ResourceAst[]> {
        const files = await ResourceScanner.scanResourceFiles(sourceProject, modelSymbolTable, controllerDataflowMap);
        return relationProject(files, item => item.resource);
    }

    public static async scan(
        sourceProject: SourceProjectIdentity,
        modelSymbolTable: ModelSymbolTable = createModelSymbolTable([]),
        controllerDataflowMap?: import("../controller/resourceDataflowAggregator").ControllerResourceDataflow
    ): Promise<readonly ResourceAst[]> {
        return ResourceScanner.scanResources(sourceProject, modelSymbolTable, controllerDataflowMap);
    }

    /** Canonical upstream boundary: the same parsed source entries used for semantic binding construct ResourceAst. */
    public static async scanAsts(
        sourceProject: SourceProjectIdentity,
        modelSymbolTable: ModelSymbolTable = createModelSymbolTable([]),
    ): Promise<readonly ResourceAst[]> {
        const sourceRoot = sourceProject.root.value.value;
        const resDir = path.join(sourceRoot, 'app', 'Http', 'Resources');
        const files = await collectPhpFiles(resDir);
        const state = await relationAsyncFold(
            files,
            { parsedFiles: [] as ParsedResourceFile[], resolutionFacts: [] as ResourceModelResolutionFact[] },
            async (state, fullPath) => {
                const source = await readSourceText(fullPath);
                const tokens = LaravelSourceLexer.tokenize(source);
                const resourceName = path.basename(fullPath, '.php');
                const resourceNameValue = SemanticValueFactory.resourceName(resourceName);
                const returnIndex = this.findReturnIndex(tokens);
                const parsedArray = LaravelSourceLexer.parseArray(source, tokens, returnIndex);
                const sourceLine = tokens[returnIndex].line;
                const method = parseToArrayMethod(tokens);
                const baseClass = parseResourceBaseClass(tokens);
                const wrapping = parseResourceWrapping(tokens);
                const requestParameter = relationOptionFold(relationFirstOption(method.parameters, parameter => relationEqual(parameter.name, 'request')), () => 'request', parameter => parameter.name);
                const documentationMixins = parseResourceDocumentationMixins(source);
                const methods = parseResourceMethods(tokens);
                const properties = parseModelPropertyAsts(tokens);
                const jsonAttributes = parseClassArrayProperty(source, tokens, 'attributes');
                const jsonRelationships = parseClassArrayProperty(source, tokens, 'relationships');
                const preserveKeys = parseBooleanProperty(tokens, 'preserveKeys');
                const forceWrapping = parseBooleanProperty(tokens, 'forceWrapping');
                const usesRequestQueryString = parseBooleanProperty(tokens, 'usesRequestQueryString');
                const includesPreviouslyLoadedRelationships = parseBooleanProperty(tokens, 'includesPreviouslyLoadedRelationships');
                const collectsResource = parseCollectsResource(tokens);
                const parsedFile: ParsedResourceFile = { resourceName: resourceNameValue, sourceFile: SemanticValueFactory.sourceFilePath(fullPath), sourceLine, sourceLength: source.length, entries: parsedArray.entries, assignments: parseMethodAssignments(tokens, returnIndex), method, baseClass: { kind: 'class_name', value: { kind: 'string_value', value: baseClass } }, wrapping, requestParameter: { kind: 'variable_name', value: { kind: 'string_value', value: requestParameter } }, documentationMixins, methods, properties, preserveKeys, forceWrapping, usesRequestQueryString, includesPreviouslyLoadedRelationships, jsonAttributes, jsonRelationships, collectsResource };
                const conventionLookup = modelSymbolTable.findForResource(resourceNameValue);
                const resolutionFacts = relationExpand([conventionLookup], lookup =>
                    relationGate(relationEqual(lookup.kind, 'found'), () => [{ kind: 'resource_model_resolution', resource: resourceNameValue, model: lookup.value.identity.name, origin: ResourceModelResolutionOrigin.convention, viaRelation: { kind: 'absent' } }], () => []),
                );
                return { parsedFiles: [...state.parsedFiles, parsedFile], resolutionFacts: [...state.resolutionFacts, ...resolutionFacts] };
            },
        );
        const parsedFiles = state.parsedFiles;
        const resolutionFacts = state.resolutionFacts;
        return relationProject(parsedFiles, file => {
            const resolution = resourceModelResolutionFor({
                kind: 'resource_model_knowledge_data_flow',
                relations: [],
                resolutions: resolutionFacts,
            }, file.resourceName);
            return presenceFold(resolution,
                () => { throw Error(`Resource '${file.resourceName.value.value}' has no model from upstream model producer.`); },
                resolved => {
                    const modelLookup = modelSymbolTable.get(resolved.model);
                    matchLookup(modelLookup, {
                        missing: () => { throw Error(`Resource '${file.resourceName.value.value}' resolved to an unknown model.`); },
                        found: ({ value: model }) => resourceProducer.produce({
                            resourceName: file.resourceName, entries: file.entries,
                            source: { kind: 'source_span', file: file.sourceFile, start: { kind: 'number_value', value: 0 }, end: { kind: 'number_value', value: file.sourceLength } },
                            model, assignments: file.assignments, method: file.method, baseClass: file.baseClass, wrapping: file.wrapping, requestParameter: file.requestParameter, documentationMixins: file.documentationMixins, methods: file.methods, properties: file.properties, preserveKeys: file.preserveKeys, forceWrapping: file.forceWrapping, usesRequestQueryString: file.usesRequestQueryString, includesPreviouslyLoadedRelationships: file.includesPreviouslyLoadedRelationships, jsonAttributes: file.jsonAttributes, jsonRelationships: file.jsonRelationships, collectsResource: file.collectsResource,
                        }),
                    });
                },
            );

        });
    }

    public static resolveAstValueToExpression(
        value: PhpAstValue,
        raw = '<scanner>'
    ): ResourceExpressionModel {
        return resolveAstValueToExpression(value, raw);
    }

    public static mapAstValueToUpstreamExpression(value: PhpAstValue, sourceFile: string): Expression {
        return mapResourcePhpAstToUpstream(value, sourceFile);
    }

    private static findReturnIndex(tokens: readonly { readonly value: string; readonly type?: string }[]): number {
        const toArrayIdx = relationIndexOf(tokens, (token, idx) => relationAll([
            relationEqual(token.value, 'toArray'),
            relationEqual(tokens[relationAdvanceIndex(idx, -1)]?.value, 'function'),
        ]));
        const returnAfterToArray = relationFirstOption(tokens, (token, idx) => relationAll([
            idx > toArrayIdx,
            relationEqual(token.value, 'return'),
        ]));
        const returnAny = relationFirstOption(tokens, token => relationEqual(token.value, 'return'));
        return relationOptionFold(
            relationGate(toArrayIdx >= 0, () => returnAfterToArray, () => relationNone()),
            () => relationOptionFold(returnAny, () => { throw Error('Resource source must contain a return statement at the semantic boundary'); }, (_, index = relationIndexOf(tokens, token => relationEqual(token.value, 'return'))) => index),
            token => relationIndexOf(tokens, candidate => relationEqual(candidate, token)),
        );
    }

}


function parseCollectsResource(tokens: readonly import('../lexer/PhpAst').TokenDescriptor[]): import('../../../types/upstream/resource').ResourceCollectionFeatures['collects'] {
    const propertyIndex = relationIndexOf(tokens, token => relationAny([relationEqual(token.value, '$collects'), relationEqual(token.value, 'collects')]));
    const equalsIndex = relationIndexOf(tokens, (token, index) => relationAll([index > propertyIndex, relationEqual(token.value, '=')]));
    const name = relationGate(equalsIndex >= 0, () => relationSome(tokens[relationAdvanceIndex(equalsIndex, 1)]), () => relationNone());
    return relationOptionFold(name,
        () => ({ kind: 'collection_resource_inference' }),
        value => relationGate(relationEqual(value.type, 'IDENTIFIER'), () => ({ kind: 'resource_reference', name: { kind: 'resource_name', value: { kind: 'string_value', value: value.value } } }), () => ({ kind: 'collection_resource_inference' })));
}

function parseResourceMethods(tokens: readonly import('../lexer/PhpAst').TokenDescriptor[]): readonly import('../lexer/phpMethodAstTypes').PhpMethodAst[] {
    const state = relationFold(tokens, { depth: 0, methods: [] as import('../lexer/phpMethodAstTypes').PhpMethodAst[] }, (current, token, index) => {
        const nextDepth = relationGate(relationEqual(token.value, '{'), () => current.depth + 1, () => relationGate(relationEqual(token.value, '}'), () => current.depth - 1, () => current.depth));
        const isMethod = relationAll([relationEqual(token.value, 'function'), relationEqual(current.depth, 1)]);
        return relationGate(isMethod, () => ({ ...current, depth: nextDepth, methods: [...current.methods, parsePhpMethodOrThrow('', tokens, index)] }), () => ({ ...current, depth: nextDepth }));
    });
    return state.methods;
}

function parseBooleanProperty(tokens: readonly import('../lexer/PhpAst').TokenDescriptor[], name: string): import('../../../types/upstream/valueObjects').TruthValue {
    const propertyIndex = relationIndexOf(tokens, token => relationAny([relationEqual(token.value, '$' + name), relationEqual(token.value, name)]));
    const equalsIndex = relationIndexOf(tokens, (token, index) => relationAll([index > propertyIndex, relationEqual(token.value, '=')]));
    const value = relationGate(equalsIndex >= 0, () => relationSome(tokens[relationAdvanceIndex(equalsIndex, 1)]), () => relationNone());
    return { kind: 'truth_value', value: relationOptionFold(value, () => false, token => relationEqual(token.value, 'true')) };
}

function parseClassArrayProperty(source: string, tokens: readonly import('../lexer/PhpAst').TokenDescriptor[], name: string): readonly PhpArrayEntry[] {
    const propertyIndex = relationIndexOf(tokens, token => relationAny([relationEqual(token.value, '$' + name), relationEqual(token.value, name)]));
    const arrayIndex = relationIndexOf(tokens, (token, index) => relationAll([index > propertyIndex, relationEqual(token.value, '[')]));
    return relationGate(arrayIndex < 0, () => [], () => LaravelSourceLexer.parseArray(source, tokens, arrayIndex).entries);
}

function parseToArrayMethod(tokens: readonly import('../lexer/PhpAst').TokenDescriptor[]): import('../lexer/phpMethodAstTypes').PhpMethodAst {
    const functionIndex = relationIndexOf(tokens, (token, index) => relationAll([relationEqual(token.value, 'function'), relationEqual(tokens[relationAdvanceIndex(index, 1)]?.value, 'toArray')]));
    return relationGate(functionIndex < 0, () => { throw Error('Resource source must contain toArray() at the AST boundary'); }, () => parsePhpMethodOrThrow('', tokens, functionIndex));
}

function parseResourceBaseClass(tokens: readonly import('../lexer/PhpAst').TokenDescriptor[]): string {
    const classIndex = relationIndexOf(tokens, token => relationEqual(token.value, 'class'));
    const extendsIndex = relationIndexOf(tokens, (token, index) => relationAll([index > classIndex, relationEqual(token.value, 'extends')]));
    const base = relationGate(extendsIndex >= 0, () => relationSome(tokens[relationAdvanceIndex(extendsIndex, 1)]), () => relationNone());
    return relationOptionFold(base, () => { throw Error('Resource class must declare its Laravel resource base class'); }, token => relationGate(relationEqual(token.type, 'IDENTIFIER'), () => token.value, () => { throw Error('Resource class base must be an identifier'); }));
}

function parseResourceWrapping(tokens: readonly import('../lexer/PhpAst').TokenDescriptor[]): import('../../../types/upstream/resource').ResourceWrapping {
    const wrapIndex = relationIndexOf(tokens, token => relationEqual(token.value, '$wrap'));
    const equalsIndex = relationIndexOf(tokens, (token, index) => relationAll([index > wrapIndex, relationEqual(token.value, '=')]));
    const value = relationGate(equalsIndex >= 0, () => relationSome(tokens[relationAdvanceIndex(equalsIndex, 1)]), () => relationNone());
    return relationGate(wrapIndex < 0, () => ({ kind: 'framework_default' }), () => relationOptionFold(value, () => { throw Error('Resource $wrap declaration could not be resolved at the AST boundary'); }, token => relationGate(relationEqual(token.value, 'null'), () => ({ kind: 'unwrapped' }), () => ({ kind: 'wrapped', key: { kind: 'string_value', value: token.value.replace(/^['"]|['"]$/g, '') } }))));
}

function parseResourceDocumentationMixins(source: string): readonly import('../../../types/upstream/semanticReferences').ModelReference[] {
    const pattern = /@mixin\s+\\?App\\Models\\([A-Za-z_][A-Za-z0-9_]*)/g;
    return relationProject(Array.from(source.matchAll(pattern)), match => ({ kind: 'model_reference', name: { kind: 'model_name', value: { kind: 'string_value', value: match[1] } } }));
}

function parseMethodAssignments(tokens: readonly import('../lexer/PhpAst').TokenDescriptor[], returnIndex: number): readonly PhpStatement[] {
    const prefix = relationSlice(tokens, 0, returnIndex);
    const functionIndex = relationIndexOf(prefix, (token, index) => relationAll([relationEqual(token.value, 'function'), relationEqual(prefix[relationAdvanceIndex(index, 1)]?.value, 'toArray')]));
    const bodySearch = relationSlice(prefix, relationAdvanceIndex(functionIndex, 1));
    const bodyOffset = relationIndexOf(bodySearch, token => relationEqual(token.value, '{'));
    const bodyStart = relationGate(bodyOffset >= 0, () => relationAdvanceIndex(functionIndex, relationAdvanceIndex(bodyOffset, 1)), () => -1);
    const body = relationGate(bodyStart >= 0, () => relationSlice(tokens, relationAdvanceIndex(bodyStart, 1), returnIndex), () => []);
    const state = relationFold(body, { depth: 0, close: -1 }, (current, token, index) => {
        const depth = relationGate(relationEqual(token.value, '{'), () => current.depth + 1, () => relationGate(relationEqual(token.value, '}'), () => current.depth - 1, () => current.depth));
        const close = relationGate(relationAll([current.close < 0, relationEqual(depth, 0)]), () => index, () => current.close);
        return { depth, close };
    });
    return relationGate(relationAny([functionIndex < 0, bodyStart < 0, state.close < 0]), () => [], () => classifyPhpBlock(relationSlice(body, 0, state.close)).statements);
}


function requireStringArrayKey(key: import('../lexer/phpAstTypes').PhpArrayKey): string {
    return relationGate(relationEqual(key.kind, 'string'), () => key.value, () => { throw Error('Expected a static string PHP array key at this semantic boundary'); });
}
