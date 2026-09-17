/**
 * ControllerScanner.ts
 *
 * Scans app/Http/Controllers/*.php for controller action returns, form requests, and inline validation.
 *
 * @module core/compiler/scanner/subscanners/ControllerScanner
 */

import path from "path";
import fs from "fs-extra";
import type { RequestType } from "../../artifacts/RequestTypesArtifact";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import type { ControllerActionInfo } from "../descriptors/requestDescriptors";
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { collectPhpFiles } from "./scannerUtils";
import { scanControllerAction } from "./controller";
import type { ModelSymbolTable } from "../symbols/ModelSymbolTable";
import { extractResourceDataflow } from "./controller/resourceDataflowAggregator";

export class ControllerScanner {
    public static async scan(
        projectRoot: string,
        formRequestMap: Map<string, RequestType> = new Map()
    ): Promise<Map<string, Map<string, ControllerActionInfo>>> {
        const controllerMap = new Map<string, Map<string, ControllerActionInfo>>();
        const controllerDir = path.join(projectRoot, 'app', 'Http', 'Controllers');
        const files = await collectPhpFiles(controllerDir);

        for (const fullPath of files) {
            const controllerName = path.basename(fullPath, '.php');
            const source = await fs.readFile(fullPath, 'utf-8');
            const tokens = LaravelSourceLexer.tokenize(source);
            const actionMap = new Map<string, ControllerActionInfo>();
            const declaration = LaravelSourceLexer.parseControllerDeclaration(
                source,
                tokens,
                createAstIdentifier(controllerName)
            );

            for (const method of declaration.methods) {
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

        return controllerMap;
    }

    public static extractResourceDataflow(
        controllerMap: ReadonlyMap<string, ReadonlyMap<string, ControllerActionInfo>>,
    ): import("./controller/resourceDataflowAggregator").ControllerResourceDataflow {
        return extractResourceDataflow(controllerMap);
    }
}
