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
import type { PhpStatement } from "../lexer/phpAstTypes";
import { collectPhpFiles } from "./scannerUtils";
import { ModelSymbolTable, OriginModelSymbol } from "../symbols/ModelSymbolTable";
import { SemanticResourceBinder } from "../binders/SemanticResourceBinder";
import {
    ResourceRelationEdge,
    resolveInitialModel,
    propagateRelationEdges
} from "./resource/twoPassRelationResolver";
import { mapAstValueToExpression } from "./resource/resourceAstExpressionMapper";
import { mapResourcePhpAstToUpstream } from "./resource/resourceUpstreamExpressionCanonical";
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

            parsedFiles.push({
                resourceName: resourceNameValue,
                sourceFile: SemanticValueFactory.sourceFilePath(fullPath),
                sourceLine,
                sourceLength: source.length,
                entries: parsedArray.entries,
                assignments: parseMethodAssignments(tokens, returnIndex)
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
        controllerDataflowMap?: import("../controller/resourceDataflowAggregator").ControllerResourceDataflow
    ): Promise<readonly ResourceAst[]> {
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
            parsedFiles.push({ resourceName: resourceNameValue, sourceFile: SemanticValueFactory.sourceFilePath(fullPath), sourceLine, sourceLength: source.length, entries: parsedArray.entries, assignments: parseMethodAssignments(tokens, returnIndex) });
            resolveInitialModel(resourceNameValue, modelSymbolTable, controllerDataflowMap, resolvedModels);
            for (const entry of parsedArray.entries) {
                if (entry.value.kind === 'resource_single' || entry.value.kind === 'resource_collection') {
                    relationEdges.push({ parentResource: resourceNameValue, childResource: SemanticValueFactory.resourceName(entry.value.resourceName), relationKey: SemanticValueFactory.relationName(requireStringArrayKey(entry.kind === 'keyed' ? entry.key : { kind: 'expression', value: entry.value })) });
                }
            }
        }
        const relationPropagationMap = propagateRelationEdges(relationEdges, resolvedModels, modelSymbolTable);
        return parsedFiles.map(file => SemanticResourceBinder.bindResourceAst({
            resourceName: file.resourceName,
            entries: file.entries,
            sourceFile: file.sourceFile,
            sourceLine: file.sourceLine,
            sourceLength: file.sourceLength,
            modelSymbolTable,
            controllerDataflowMap,
            relationPropagationMap,
            assignments: file.assignments
        }));
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


function parseMethodAssignments(tokens: readonly { readonly value: string; readonly type?: string }[], returnIndex: number): readonly PhpStatement[] {
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
