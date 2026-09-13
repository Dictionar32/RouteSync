/**
 * RouteScanner.ts
 *
 * Active Consumer Orchestrator for scanning routes/api.php for Route declarations.
 * Consumes route-scanner sub-domain modules to emit canonical ParsedRoute streams.
 *
 * @module core/compiler/scanner/subscanners/RouteScanner
 */

import path from "path";
import fs from "fs-extra";
import {
    ParsedRoute,
    RouteParameter,
    ResourceResponseDescriptor
} from "../../../types/route";
import { RequestType } from "../../artifacts/RequestTypesArtifact";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import { ControllerScanner } from "./ControllerScanner";
import { ControllerActionInfo } from "../descriptors/requestDescriptors";
import {
    extractPathParams,
    normalizeRoutePath,
    RouteContextTracker,
    emitApiResourceRoutes,
    emitStandardRoutes
} from "./route-scanner";

export class RouteScanner {
    public static extractPathParams(routePath: string): readonly RouteParameter[] {
        return extractPathParams(routePath);
    }

    public static async scan(
        projectRoot: string,
        requestTypes: readonly RequestType[] = [],
        existingControllerMap?: Map<string, Map<string, ControllerActionInfo>>
    ): Promise<readonly ParsedRoute[]> {
        const routesFile = path.join(projectRoot, 'routes', 'api.php');
        if (!fs.existsSync(routesFile)) return [];

        const source = await fs.readFile(routesFile, 'utf-8');
        const tokens = LaravelSourceLexer.tokenize(source);
        const routes: ParsedRoute[] = [];

        const tracker = new RouteContextTracker();
        const formRequestMap = new Map<string, RequestType>(requestTypes.map(r => [r.formTypeName, r]));
        const controllerMap = existingControllerMap ?? await ControllerScanner.scan(projectRoot, formRequestMap);

        for (let i = 0; i < tokens.length; i++) {
            tracker.handleToken(tokens, i);

            if (tokens[i].value === 'Route' && tokens[i + 1]?.value === '::') {
                const methodToken = tokens[i + 2];
                if (!methodToken) continue;

                const httpMethod = methodToken.value.toLowerCase();
                if (['get', 'post', 'put', 'patch', 'delete', 'apiresource', 'match', 'any'].includes(httpMethod)) {
                    let j = i + 3;
                    while (j < tokens.length && tokens[j].value !== '(') j++;
                    j++; // Skip '('

                    let targetMethods: string[] = [httpMethod];
                    let pathIndex = j;

                    if (httpMethod === 'match') {
                        targetMethods = [];
                        while (j < tokens.length && tokens[j].value !== '[') j++;
                        if (j < tokens.length && tokens[j].value === '[') j++;
                        while (j < tokens.length && tokens[j].value !== ']') {
                            if (tokens[j].type === 'STRING') {
                                targetMethods.push(tokens[j].value.toLowerCase());
                            }
                            j++;
                        }
                        if (j < tokens.length && tokens[j].value === ']') j++;
                        while (j < tokens.length && tokens[j].value !== ',') j++;
                        if (j < tokens.length && tokens[j].value === ',') j++;
                        pathIndex = j;
                    } else if (httpMethod === 'any') {
                        targetMethods = ['get', 'post', 'put', 'patch', 'delete'];
                    }

                    while (pathIndex < tokens.length && tokens[pathIndex].type !== 'STRING') {
                        pathIndex++;
                    }

                    const pathToken = tokens[pathIndex];
                    if (pathToken && pathToken.type === 'STRING') {
                        const { normalizedPath, resourceName } = normalizeRoutePath(pathToken.value, tracker.prefixStack);

                        // Extract controller and action
                        let controllerName: string | undefined;
                        let actionName: string | undefined;
                        let hIdx = pathIndex + 1;
                        while (hIdx < tokens.length && tokens[hIdx].value !== ',' && tokens[hIdx].value !== ')') hIdx++;
                        if (tokens[hIdx]?.value === ',') {
                            hIdx++;
                            const isArrayForm = tokens[hIdx]?.value === '[' || tokens[hIdx + 1]?.value === '[';
                            while (hIdx < tokens.length && (tokens[hIdx].value === '[' || tokens[hIdx].value === '(')) {
                                hIdx++;
                            }
                            if (tokens[hIdx]?.type === 'IDENTIFIER') {
                                controllerName = tokens[hIdx].value;
                                if (tokens[hIdx + 1]?.value === '::' && tokens[hIdx + 2]?.value === 'class') {
                                    if (isArrayForm && tokens[hIdx + 3]?.value === ',' && tokens[hIdx + 4]?.type === 'STRING') {
                                        actionName = tokens[hIdx + 4].value;
                                    } else if (!isArrayForm) {
                                        actionName = '__invoke';
                                    }
                                }
                            }
                        }

                        const currentMiddlewares = tracker.getCurrentMiddlewares();
                        const isAuth = tracker.isCurrentAuth();
                        const actionInfo = controllerName && actionName
                            ? (controllerMap.get(controllerName)?.get(actionName) ?? controllerMap.get(controllerName)?.get('__invoke'))
                            : undefined;
                        const resolvedResponse = actionInfo?.response
                            || new ResourceResponseDescriptor({ resourceName: `${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)}Resource`, shape: 'single' });

                        if (httpMethod === 'apiresource') {
                            routes.push(...emitApiResourceRoutes(
                                normalizedPath,
                                resourceName,
                                controllerName,
                                controllerMap,
                                resolvedResponse,
                                isAuth,
                                currentMiddlewares,
                                routesFile
                            ));
                        } else {
                            routes.push(...emitStandardRoutes(
                                targetMethods,
                                normalizedPath,
                                resourceName,
                                actionName,
                                controllerName,
                                actionInfo,
                                resolvedResponse,
                                isAuth,
                                currentMiddlewares,
                                routesFile
                            ));
                        }
                    }
                }
            }
        }

        return routes;
    }
}
