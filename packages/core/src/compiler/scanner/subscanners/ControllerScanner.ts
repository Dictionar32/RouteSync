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
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { collectPhpFiles } from "./scannerUtils";
import { scanControllerAction } from "./controller";
import type { ModelSymbolTable } from "../symbols/ModelSymbolTable";
import { extractResourceDataflow } from "./controller/resourceDataflowAggregator";
import { controllerAstFromMethod } from "./controller/controllerAstCanonical";

export class ControllerScanner {
    private static async scanOnce(
        projectRoot: string,
        formRequestMap: ReadonlyMap<string, FormRequestSource>
    ): Promise<{ readonly asts: readonly ControllerAst[]; readonly controllerMap: Map<string, Map<string, ControllerActionInfo>> }> {
        const controllerMap = new Map<string, Map<string, ControllerActionInfo>>();
        const asts: ControllerAst[] = [];
        const controllerDir = path.join(projectRoot, 'app', 'Http', 'Controllers');
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

            for (const method of declaration.methods) {
                asts.push(controllerAstFromMethod(method, controllerName, fullPath));
                const result = scanControllerAction(
                    method,
                    controllerName,
                    fullPath,
                    formRequestMap,
                    projectRoot
                );
                actionMap.set(result.actionName, result.descriptor);
            }
            controllerMap.set(controllerName, actionMap);
        }

        return { asts: Object.freeze(asts), controllerMap };
    }

    public static async scan(
        projectRoot: string,
        formRequestMap: ReadonlyMap<string, FormRequestSource> = new Map()
    ): Promise<Map<string, Map<string, ControllerActionInfo>>> {
        const result = await ControllerScanner.scanOnce(projectRoot, formRequestMap);
        return result.controllerMap;
    }

    public static async scanCanonicalAsts(
        projectRoot: string,
        formRequestMap: ReadonlyMap<string, FormRequestSource> = new Map()
    ): Promise<readonly ControllerAst[]> {
        const result = await ControllerScanner.scanOnce(projectRoot, formRequestMap);
        return result.asts;
    }

    public static async scanCanonicalBundle(
        projectRoot: string,
        formRequestMap: ReadonlyMap<string, FormRequestSource> = new Map()
    ): Promise<{ readonly asts: readonly ControllerAst[]; readonly controllerMap: Map<string, Map<string, ControllerActionInfo>> }> {
        return ControllerScanner.scanOnce(projectRoot, formRequestMap);
    }

    public static extractResourceDataflow(
        controllerMap: ReadonlyMap<string, ReadonlyMap<string, ControllerActionInfo>>,
    ): import("./controller/resourceDataflowAggregator").ControllerResourceDataflow {
        return extractResourceDataflow(controllerMap);
    }
}
