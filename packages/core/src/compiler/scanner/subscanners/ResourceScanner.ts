/**
 * ResourceScanner.ts
 *
 * Scans app/Http/Resources/*.php for JsonResource definitions and AST expressions.
 * Active Consumer orchestrating resource collection, relation propagation, and semantic binding.
 *
 * @module core/compiler/scanner/subscanners/ResourceScanner
 */

import path from "path";
import fs from "fs-extra";
import { ParsedResource, ResourceFieldExpression } from "../../../types/route";
import { LaravelSourceLexer, PhpAstValue, PhpArrayEntry } from "../LaravelSourceLexer";
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
import type { ResourceExpressionModel } from "../../../types/domain/resourceExpressionModel";

interface ParsedResourceFile {
    readonly resourceName: string;
    readonly sourceFile: string;
    readonly sourceLine: number;
    readonly entries: readonly PhpArrayEntry[];
}

export class ResourceScanner {
    public static async scan(
        projectRoot: string,
        modelSymbolTable: ModelSymbolTable = new ModelSymbolTable([]),
        controllerDataflowMap?: import("../controller/resourceDataflowAggregator").ControllerResourceDataflow
    ): Promise<readonly ParsedResource[]> {
        const resDir = path.join(projectRoot, 'app', 'Http', 'Resources');
        const files = await collectPhpFiles(resDir);

        const parsedFiles: ParsedResourceFile[] = [];
        const relationEdges: ResourceRelationEdge[] = [];
        const resolvedModels = new Map<string, OriginModelSymbol>();

        for (const fullPath of files) {
            const source = await fs.readFile(fullPath, 'utf-8');
            const tokens = LaravelSourceLexer.tokenize(source);
            const resourceName = path.basename(fullPath, '.php');

            const returnIndex = this.findReturnIndex(tokens);
            const parsedArray = LaravelSourceLexer.parseArray(source, tokens, returnIndex);
            const sourceLine = tokens[returnIndex].line;

            parsedFiles.push({ resourceName, sourceFile: fullPath, sourceLine, entries: parsedArray.entries });
            resolveInitialModel(resourceName, modelSymbolTable, controllerDataflowMap, resolvedModels);

            for (const entry of parsedArray.entries) {
                if (entry.value.kind === 'resource_single' || entry.value.kind === 'resource_collection') {
                    relationEdges.push({
                        parentResource: resourceName,
                        childResource: entry.value.resourceName,
                        relationKey: requireStringArrayKey(entry.key)
                    });
                }
            }
        }

        const relationPropagationMap = propagateRelationEdges(relationEdges, resolvedModels, modelSymbolTable);

        return parsedFiles.map(file => SemanticResourceBinder.bindResource({
            resourceName: file.resourceName,
            entries: file.entries,
            sourceFile: file.sourceFile,
            sourceLine: file.sourceLine,
            modelSymbolTable,
            controllerDataflowMap,
            relationPropagationMap
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


function requireStringArrayKey(key: import('../lexer/phpAstTypes').PhpArrayKey): string {
    if (key.kind === 'string') return key.value;
    throw new Error('Expected a static string PHP array key at this semantic boundary');
}
