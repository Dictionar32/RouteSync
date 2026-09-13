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
import { collectPhpFiles } from "./scannerUtils";
import { scanControllerAction } from "./controller";

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

            for (let i = 0; i < tokens.length; i++) {
                if (tokens[i].value === 'function' && tokens[i + 1]?.type === 'IDENTIFIER') {
                    const result = scanControllerAction(
                        source,
                        tokens,
                        i,
                        controllerName,
                        fullPath,
                        formRequestMap
                    );
                    if (result) {
                        actionMap.set(result.actionName, result.descriptor);
                    }
                }
            }
            controllerMap.set(controllerName, actionMap);
        }

        return controllerMap;
    }
}
