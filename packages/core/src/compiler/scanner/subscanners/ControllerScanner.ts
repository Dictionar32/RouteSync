import type { SourceProjectIdentity } from "../../../types/upstream/highLevelSourceModel";

import { createControllerName, createSourceFile } from '../../../types/upstream/names';
import { readSourceText } from './scannerUtils';
/**
 * ControllerScanner.ts
 *
 * Scans app/Http/Controllers/*.php for controller action returns, form requests, and inline validation.
 *
 * @module core/compiler/scanner/subscanners/ControllerScanner
 */

import path from "path";
import * as fs from "node:fs";
import type { FormRequestSource } from "../../../types/domain/request";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import type { ControllerActionInfo } from "../descriptors/requestDescriptors";
import type { ControllerAst } from "../../../types/upstream/ast";
import type { ControllerResponse } from "../../../types/upstream/controller";
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { collectPhpFiles } from "./scannerUtils";
import { scanControllerAction } from "./controller";
import type { ModelSymbolTable } from "../symbols/ModelSymbolTable";
import { extractResourceDataflow } from "./controller/resourceDataflowAggregator";
import { controllerProducer } from "./controller/controllerProducer";

export class ControllerScanner {
    private static async scanOnce(
        sourceProject: SourceProjectIdentity,
        formRequestMap: ReadonlyMap<string, FormRequestSource>
    ): Promise<{ readonly asts: readonly ControllerAst[]; readonly controllerMap: Map<string, Map<string, ControllerActionInfo>> }> {
        const controllerMap = new Map<string, Map<string, ControllerActionInfo>>();
        const asts: ControllerAst[] = [];
        const sourceRoot = sourceProject.root.value.value;
        const controllerDir = path.join(sourceRoot, 'app', 'Http', 'Controllers');
        const files = await collectPhpFiles(controllerDir);

        for (const fullPath of files) {
            const controllerName = path.basename(fullPath, '.php');
            const source = await readSourceText(fullPath);
            const tokens = LaravelSourceLexer.tokenize(source);
            const declaration = LaravelSourceLexer.parseControllerDeclaration(
                source,
                tokens,
                createAstIdentifier(controllerName)
            );
            const actionMap = new Map<string, ControllerActionInfo>();
            const controllerMethods: { readonly method: typeof declaration.methods[number]; readonly response: ControllerResponse }[] = [];

            for (const method of declaration.methods) {
                const result = scanControllerAction(
                    method,
                    createControllerName(controllerName),
                    createSourceFile(fullPath),
                    formRequestMap,
                    sourceProject
                );
                const response = {
                    kind: 'response_present' as const,
                    response: {
                        kind: 'response_reference' as const,
                        name: result.descriptor.response.responseTypeName()
                    }
                };
                controllerMethods.push({ method, response });
                actionMap.set(result.actionName.value.value, result.descriptor);
            }
            if (controllerMethods.length > 0) {
                asts.push(controllerProducer.produce({
                    methods: controllerMethods,
                    controller: createControllerName(controllerName),
                    file: createSourceFile(fullPath),
                    source: {
                        kind: 'source_span',
                        file: createSourceFile(fullPath),
                        start: { kind: 'number_value', value: declaration.source.startOffset },
                        end: { kind: 'number_value', value: declaration.source.endOffset },
                    },
                }));
            }
            controllerMap.set(controllerName, actionMap);
        }

        return { asts: Object.freeze(asts), controllerMap };
    }

    public static async scan(
        sourceProject: SourceProjectIdentity,
        formRequestMap: ReadonlyMap<string, FormRequestSource> = new Map()
    ): Promise<Map<string, Map<string, ControllerActionInfo>>> {
        return (await ControllerScanner.scanOnce(sourceProject, formRequestMap)).controllerMap;
    }

    public static async scanCanonicalAsts(
        sourceProject: SourceProjectIdentity,
        formRequestMap: ReadonlyMap<string, FormRequestSource> = new Map()
    ): Promise<readonly ControllerAst[]> {
        const result = await ControllerScanner.scanOnce(sourceProject, formRequestMap);
        return result.asts;
    }

    public static async scanCanonicalBundle(
        sourceProject: SourceProjectIdentity,
        formRequestMap: ReadonlyMap<string, FormRequestSource> = new Map()
    ): Promise<{ readonly asts: readonly ControllerAst[]; readonly controllerMap: Map<string, Map<string, ControllerActionInfo>> }> {
        return ControllerScanner.scanOnce(sourceProject, formRequestMap);
    }

    public static extractResourceDataflow(
        controllerMap: ReadonlyMap<string, ReadonlyMap<string, ControllerActionInfo>>,
    ): import("./controller/resourceDataflowAggregator").ControllerResourceDataflow {
        return extractResourceDataflow(controllerMap);
    }
}
