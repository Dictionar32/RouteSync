import type { SourceProjectIdentity } from "../../../types/upstream/highLevelSourceModel";

import { readSourceText } from './scannerUtils';
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
import { ParsedResource, ResourceFieldExpression } from "../../../types/route";
import { SemanticValueFactory } from "../../../types/domain/semanticValues";
import { LaravelSourceLexer, PhpAstValue, PhpArrayEntry } from "../LaravelSourceLexer";
import { classifyPhpBlock } from "../lexer/astClassifier";
import { parsePhpMethod } from "../lexer/phpMethodParser";
import type { PhpStatement } from "../lexer/phpAstTypes";
import { collectPhpFiles } from "./scannerUtils";
import { ModelSymbolTable, OriginModelSymbol } from "../symbols/ModelSymbolTable";
import { SemanticResourceBinder } from "../binders/SemanticResourceBinder";
import { resourceProducer } from "./resourceProducer";
import {
    ResourceRelationEdge,
    resolveInitialModel,
    propagateRelationEdges
} from "./resource/twoPassRelationResolver";
import { mapAstValueToExpression } from "./resource/resourceAstExpressionMapper";
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
    readonly resource: ParsedResource;
    readonly file: ParsedResourceFile;
}

export class ResourceScanner {
    private static async scanResourceFiles(
        sourceProject: SourceProjectIdentity,
        modelSymbolTable: ModelSymbolTable = new ModelSymbolTable([]),
        controllerDataflowMap?: import("../controller/resourceDataflowAggregator").ControllerResourceDataflow
    ): Promise<readonly BoundResourceFile[]> {
        const sourceRoot = sourceProject.root.value.value;
        const resDir = path.join(sourceRoot, 'app', 'Http', 'Resources');
        const files = await collectPhpFiles(resDir);

        const parsedFiles: ParsedResourceFile[] = [];
        const relationEdges: ResourceRelationEdge[] = [];
        const resolvedModels = new Map<ResourceName, OriginModelSymbol>();

        for (const fullPath of files) {
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
            const requestParameter = method.parameters.find(parameter => parameter.name === 'request')?.name ?? 'request';
            const documentationMixins = parseResourceDocumentationMixins(source);

            parsedFiles.push({
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
            });
            resolveInitialModel(resourceNameValue, modelSymbolTable, controllerDataflowMap, resolvedModels);

            for (const entry of parsedArray.entries) {
                if (entry.value.kind === 'resource_single' || entry.value.kind === 'resource_collection') {
                    relationEdges.push({
                        parentResource: resourceNameValue,
                        childResource: SemanticValueFactory.resourceName(entry.value.resourceName),
                        relationKey: SemanticValueFactory.relationName(requireStringArrayKey(entry.kind === 'keyed' ? entry.key : { kind: 'expression', value: entry.value }))
                    });
                }
            }
        }

        const relationPropagationMap = propagateRelationEdges(relationEdges, resolvedModels, modelSymbolTable);
        return parsedFiles.map(file => ({
            file,
            resource: SemanticResourceBinder.bindResource({
                resourceName: file.resourceName,
                entries: file.entries,
                sourceFile: file.sourceFile,
                sourceLine: file.sourceLine,
                modelSymbolTable,
                controllerDataflowMap,
                relationPropagationMap,
                assignments: file.assignments
            })
        }));
    }

    private static async scanResources(
        sourceProject: SourceProjectIdentity,
        modelSymbolTable: ModelSymbolTable = new ModelSymbolTable([]),
        controllerDataflowMap?: import("../controller/resourceDataflowAggregator").ControllerResourceDataflow
    ): Promise<readonly ParsedResource[]> {
        const files = await ResourceScanner.scanResourceFiles(sourceProject, modelSymbolTable, controllerDataflowMap);
        return files.map(item => item.resource);
    }

    public static async scan(
        sourceProject: SourceProjectIdentity,
        modelSymbolTable: ModelSymbolTable = new ModelSymbolTable([]),
        controllerDataflowMap?: import("../controller/resourceDataflowAggregator").ControllerResourceDataflow
    ): Promise<readonly ParsedResource[]> {
        return ResourceScanner.scanResources(sourceProject, modelSymbolTable, controllerDataflowMap);
    }

    /** Canonical upstream boundary: the same parsed source entries used for semantic binding construct ResourceAst. */
    public static async scanAsts(
        sourceProject: SourceProjectIdentity,
        modelSymbolTable: ModelSymbolTable = new ModelSymbolTable([]),
    ): Promise<readonly ResourceAst[]> {
        const sourceRoot = sourceProject.root.value.value;
        const resDir = path.join(sourceRoot, 'app', 'Http', 'Resources');
        const files = await collectPhpFiles(resDir);
        const parsedFiles: ParsedResourceFile[] = [];
        const resolvedModels = new Map<ResourceName, OriginModelSymbol>();
        for (const fullPath of files) {
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
            const requestParameter = method.parameters.find(parameter => parameter.name === 'request')?.name ?? 'request';
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
            parsedFiles.push({ resourceName: resourceNameValue, sourceFile: SemanticValueFactory.sourceFilePath(fullPath), sourceLine, sourceLength: source.length, entries: parsedArray.entries, assignments: parseMethodAssignments(tokens, returnIndex), method, baseClass: { kind: 'class_name', value: { kind: 'string_value', value: baseClass } }, wrapping, requestParameter: { kind: 'variable_name', value: { kind: 'string_value', value: requestParameter } }, documentationMixins, methods, properties, preserveKeys, forceWrapping, usesRequestQueryString, includesPreviouslyLoadedRelationships, jsonAttributes, jsonRelationships, collectsResource });
            const conventionLookup = modelSymbolTable.findForResource(resourceNameValue);
            const conventionModel = conventionLookup.kind === 'found' ? conventionLookup.value : undefined;
            if (conventionModel !== undefined) resolvedModels.set(resourceNameValue, conventionModel);
        }
        return parsedFiles.map(file => {
            const model = resolvedModels.get(file.resourceName);
            if (model === undefined) throw new Error(`Resource '${file.resourceName.value.value}' has no model from upstream model producer.`);
            return resourceProducer.produce({
            resourceName: file.resourceName,
            entries: file.entries,
            source: {
                kind: 'source_span',
                file: file.sourceFile,
                start: { kind: 'number_value', value: 0 },
                end: { kind: 'number_value', value: file.sourceLength },
            },
            model,
            assignments: file.assignments,
            method: file.method,
            baseClass: file.baseClass,
            wrapping: file.wrapping,
            requestParameter: file.requestParameter,
            documentationMixins: file.documentationMixins,
            methods: file.methods,
            properties: file.properties,
            preserveKeys: file.preserveKeys,
            forceWrapping: file.forceWrapping,
            usesRequestQueryString: file.usesRequestQueryString,
            includesPreviouslyLoadedRelationships: file.includesPreviouslyLoadedRelationships,
            jsonAttributes: file.jsonAttributes,
            jsonRelationships: file.jsonRelationships,
            collectsResource: file.collectsResource
            });
        });
    }

    public static mapAstValueToExpression(
        value: PhpAstValue,
        raw = '<scanner>'
    ): ResourceExpressionModel {
        return mapAstValueToExpression(value, raw);
    }

    public static mapAstValueToUpstreamExpression(value: PhpAstValue, sourceFile: string): Expression {
        return mapResourcePhpAstToUpstream(value, sourceFile);
    }

    private static findReturnIndex(tokens: readonly { readonly value: string; readonly type?: string }[]): number {
        const toArrayIdx = tokens.findIndex((t, idx) => t.value === 'toArray' && tokens[idx - 1]?.value === 'function');
        if (toArrayIdx !== -1) {
            const retIdx = tokens.findIndex((t, idx) => idx > toArrayIdx && t.value === 'return');
            if (retIdx !== -1) return retIdx;
        }
        const retIdx = tokens.findIndex(t => t.value === 'return');
        if (retIdx === -1) {
            throw new Error('Resource source must contain a return statement at the semantic boundary');
        }
        return retIdx;
    }
}


function parseCollectsResource(tokens: readonly import('../lexer/PhpAst').TokenDescriptor[]): import('../../../types/upstream/resource').ResourceCollectionFeatures['collects'] {
    const propertyIndex = tokens.findIndex(token => token.value === '$collects' || token.value === 'collects');
    if (propertyIndex < 0) return { kind: 'collection_resource_inference' };
    const equalsIndex = tokens.findIndex((token, index) => index > propertyIndex && token.value === '=');
    if (equalsIndex < 0) return { kind: 'collection_resource_inference' };
    const nameIndex = equalsIndex + 1;
    const name = tokens[nameIndex];
    if (name?.type !== 'IDENTIFIER') return { kind: 'collection_resource_inference' };
    return { kind: 'resource_reference', name: { kind: 'resource_name', value: { kind: 'string_value', value: name.value } } };
}

function parseResourceMethods(tokens: readonly import('../lexer/PhpAst').TokenDescriptor[]): readonly import('../lexer/phpMethodAstTypes').PhpMethodAst[] {
    const methods: import('../lexer/phpMethodAstTypes').PhpMethodAst[] = [];
    let depth = 0;
    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        if (token.value === '{') depth += 1;
        if (token.value === '}') depth -= 1;
        if (token.value !== 'function' || depth !== 1) continue;
        const parsed = parsePhpMethod('', tokens, index);
        if (parsed !== undefined) methods.push(parsed);
    }
    return methods;
}

function parseBooleanProperty(tokens: readonly import('../lexer/PhpAst').TokenDescriptor[], name: string): import('../../../types/upstream/valueObjects').TruthValue {
    const propertyIndex = tokens.findIndex(token => token.value === '$' + name || token.value === name);
    if (propertyIndex < 0) return { kind: 'truth_value', value: false };
    const equalsIndex = tokens.findIndex((token, index) => index > propertyIndex && token.value === '=');
    const value = equalsIndex >= 0 ? tokens[equalsIndex + 1]?.value : undefined;
    return { kind: 'truth_value', value: value === 'true' };
}

function parseClassArrayProperty(source: string, tokens: readonly import('../lexer/PhpAst').TokenDescriptor[], name: string): readonly PhpArrayEntry[] {
    const propertyIndex = tokens.findIndex((token, index) => token.value === '$' + name || token.value === name);
    if (propertyIndex < 0) return [];
    const arrayIndex = tokens.findIndex((token, index) => index > propertyIndex && token.value === '[');
    if (arrayIndex < 0) return [];
    return LaravelSourceLexer.parseArray(source, tokens, arrayIndex).entries;
}

function parseToArrayMethod(tokens: readonly import('../lexer/PhpAst').TokenDescriptor[]): import('../lexer/phpMethodAstTypes').PhpMethodAst {
    const functionIndex = tokens.findIndex((token, index) => token.value === 'function' && tokens[index + 1]?.value === 'toArray');
    if (functionIndex < 0) throw new Error('Resource source must contain toArray() at the AST boundary');
    const method = parsePhpMethod('', tokens, functionIndex);
    if (!method) throw new Error('Resource toArray() could not be parsed at the AST boundary');
    return method;
}

function parseResourceBaseClass(tokens: readonly import('../lexer/PhpAst').TokenDescriptor[]): string {
    const classIndex = tokens.findIndex(token => token.value === 'class');
    const extendsIndex = tokens.findIndex((token, index) => index > classIndex && token.value === 'extends');
    const base = extendsIndex >= 0 ? tokens[extendsIndex + 1]?.value : undefined;
    if (!base) throw new Error('Resource class must declare its Laravel resource base class');
    return base;
}

function parseResourceWrapping(tokens: readonly import('../lexer/PhpAst').TokenDescriptor[]): import('../../../types/upstream/resource').ResourceWrapping {
    const wrapIndex = tokens.findIndex(token => token.value === '$wrap');
    if (wrapIndex < 0) return { kind: 'framework_default' };
    const equalsIndex = tokens.findIndex((token, index) => index > wrapIndex && token.value === '=');
    const value = equalsIndex >= 0 ? tokens[equalsIndex + 1]?.value : undefined;
    if (value === 'null') return { kind: 'unwrapped' };
    if (value) return { kind: 'wrapped', key: { kind: 'string_value', value: value.replace(/^['"]|['"]$/g, '') } };
    throw new Error('Resource $wrap declaration could not be resolved at the AST boundary');
}


function parseResourceDocumentationMixins(source: string): readonly import('../../../types/upstream/semanticReferences').ModelReference[] {
    const values: import('../../../types/upstream/semanticReferences').ModelReference[] = [];
    const pattern = /@mixin\s+\\?App\\Models\\([A-Za-z_][A-Za-z0-9_]*)/g;
    let match: RegExpExecArray | null = pattern.exec(source);
    while (match) {
        values.push({ kind: 'model_reference', name: { kind: 'model_name', value: { kind: 'string_value', value: match[1] } } });
        match = pattern.exec(source);
    }
    return values;
}


function parseMethodAssignments(tokens: readonly import('../lexer/PhpAst').TokenDescriptor[], returnIndex: number): readonly PhpStatement[] {
    let functionIndex = -1;
    for (let index = returnIndex - 1; index >= 0; index -= 1) {
        if (tokens[index].value === 'function' && tokens[index + 1]?.value === 'toArray') {
            functionIndex = index;
            break;
        }
    }
    if (functionIndex < 0) return [];
    let bodyStart = -1;
    for (let index = functionIndex + 1; index < returnIndex; index += 1) {
        if (tokens[index].value === '{') {
            bodyStart = index;
            break;
        }
    }
    if (bodyStart < 0) return [];
    let depth = 0;
    for (let index = bodyStart; index < returnIndex; index += 1) {
        if (tokens[index].value === '{') depth += 1;
        if (tokens[index].value === '}') depth -= 1;
        if (depth === 0) return classifyPhpBlock(tokens.slice(bodyStart + 1, index)).statements;
    }
    return [];
}


function requireStringArrayKey(key: import('../lexer/phpAstTypes').PhpArrayKey): string {
    if (key.kind === 'string') return key.value;
    throw new Error('Expected a static string PHP array key at this semantic boundary');
}
