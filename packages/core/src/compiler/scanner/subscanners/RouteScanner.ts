/**
 * RouteScanner.ts
 *
 * Scans routes/api.php for Route::get/post/put/delete/apiResource declarations and route groups.
 *
 * @module core/compiler/scanner/subscanners/RouteScanner
 */

import path from "path";
import fs from "fs-extra";
import {
    ParsedRoute,
    HttpMethod,
    HTTP_METHOD_REGISTRY,
    RouteActionKind,
    RouteParameter,
    ResponseDescriptor,
    ResourceResponseDescriptor,
    RouteSchemaPayload
} from "../../../types/route";
import { RequestType } from "../../artifacts/RequestTypesArtifact";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import { ControllerScanner } from "./ControllerScanner";
import { ControllerActionInfo } from "../descriptors/requestDescriptors";
import {
    ScannedRouteDescriptor,
    ScannedRouteParameterDescriptor
} from "../descriptors/routeDescriptors";
import {
    ScannedRouteSchemaPayload,
    ScannedRouteValidationRuleEntry
} from "../descriptors/validationDescriptors";

export class RouteScanner {
    public static extractPathParams(routePath: string): readonly RouteParameter[] {
        const matches = [...routePath.matchAll(/\{([^}]+)\}/g)];
        return matches.map(m => ScannedRouteParameterDescriptor.fromPathSegment(m[1]));
    }

    public static async scan(projectRoot: string, requestTypes: readonly RequestType[] = [], existingControllerMap?: Map<string, Map<string, ControllerActionInfo>>): Promise<readonly ParsedRoute[]> {
        const routesFile = path.join(projectRoot, 'routes', 'api.php');
        if (!fs.existsSync(routesFile)) return [];

        const source = await fs.readFile(routesFile, 'utf-8');
        const tokens = LaravelSourceLexer.tokenize(source);
        const routes: ParsedRoute[] = [];
        const prefixStack: string[] = [];
        let pendingPrefix: string | null = null;
        const middlewareStack: string[][] = [];
        let pendingMiddleware: string[] = [];

        const controllerMap = existingControllerMap ?? await ControllerScanner.scan(projectRoot);

        const mapMethodDetails = (method: string): { method: HttpMethod; actionKind: RouteActionKind; isMutating: boolean } => {
            const m = method.toUpperCase() as HttpMethod;
            const spec = HTTP_METHOD_REGISTRY[m] ?? HTTP_METHOD_REGISTRY.GET;
            return { method: spec.method, actionKind: spec.actionKind, isMutating: spec.isMutating };
        };

        for (let i = 0; i < tokens.length; i++) {
            // Track Route::prefix('v1')->group(...)
            if (tokens[i].value === 'prefix' && tokens[i + 1]?.value === '(' && tokens[i + 2]?.type === 'STRING') {
                pendingPrefix = tokens[i + 2].value.replace(/^\/+|\/+$/g, '');
            }

            // Track Route::middleware(...)
            if (tokens[i].value === 'middleware' && tokens[i + 1]?.value === '(') {
                pendingMiddleware = [];
                let mIdx = i + 2;
                if (tokens[mIdx]?.type === 'STRING') {
                    pendingMiddleware.push(tokens[mIdx].value);
                } else if (tokens[mIdx]?.value === '[') {
                    mIdx++;
                    while (mIdx < tokens.length && tokens[mIdx].value !== ']') {
                        if (tokens[mIdx].type === 'STRING') {
                            pendingMiddleware.push(tokens[mIdx].value);
                        }
                        mIdx++;
                    }
                }
            }

            // Group open/close for middleware and prefix stacks
            if (tokens[i].value === 'group' && tokens[i + 1]?.value === '(') {
                middlewareStack.push([...pendingMiddleware]);
                pendingMiddleware = [];
                if (pendingPrefix !== null) {
                    prefixStack.push(pendingPrefix);
                    pendingPrefix = null;
                } else {
                    prefixStack.push('');
                }
            }
            if (tokens[i].value === '}' && middlewareStack.length > 0) {
                middlewareStack.pop();
                if (prefixStack.length > 0) {
                    prefixStack.pop();
                }
            }

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
                        const rawPath = pathToken.value.replace(/^\/+|\/+$/g, '');
                        const combinedPrefix = prefixStack.filter(Boolean).join('/');
                        const fullPath = combinedPrefix ? `/${combinedPrefix}/${rawPath}` : `/${rawPath}`;
                        const normalizedPath = fullPath.startsWith('/api') ? fullPath : `/api${fullPath}`;

                        const segments = normalizedPath.split('/').filter(s => s && s !== 'api' && !s.startsWith('{'));
                        const resourceName = segments[0] || 'general';

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
                                        // Invokable Controller: Route::get('/me', ProfileController::class);
                                        actionName = '__invoke';
                                    }
                                }
                            }
                        }

                        const currentMiddlewares = middlewareStack.flat();
                        const isAuth = currentMiddlewares.some(m => m.startsWith('auth'));
                        const actionInfo = controllerName && actionName ? (controllerMap.get(controllerName)?.get(actionName) ?? controllerMap.get(controllerName)?.get('__invoke')) : undefined;
                        const resolvedResponse = actionInfo?.response
                            || new ResourceResponseDescriptor({ resourceName: `${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)}Resource`, shape: 'single' });

                        // Build route schema
                        let routeSchema: RouteSchemaPayload | undefined;
                        if (actionInfo?.formRequestName) {
                            const matchedReq = requestTypes.find(r => r.formTypeName === actionInfo.formRequestName);
                            if (matchedReq && matchedReq.actions[0]?.fields.length > 0) {
                                routeSchema = ScannedRouteSchemaPayload.fromRules(
                                    matchedReq.actions[0].fields.map(f => ScannedRouteValidationRuleEntry.create(
                                        f.originalName,
                                        [f.required ? 'required' : 'nullable'],
                                        f.transformedName
                                    ))
                                );
                            }
                        }
                        if (!routeSchema && actionInfo?.schemaRules && actionInfo.schemaRules.length > 0) {
                            routeSchema = ScannedRouteSchemaPayload.fromRules(actionInfo.schemaRules);
                        }

                        if (httpMethod === 'apiresource') {
                            routes.push(
                                ScannedRouteDescriptor.create({ method: 'GET', path: normalizedPath, resourceName, actionName: 'index', actionKind: 'read', isMutating: false, parameters: RouteScanner.extractPathParams(normalizedPath), auth: isAuth, middleware: currentMiddlewares, response: resolvedResponse, sourceFile: actionInfo?.sourceFile, sourceLine: actionInfo?.sourceLine, controllerName, schema: routeSchema }),
                                ScannedRouteDescriptor.create({ method: 'POST', path: normalizedPath, resourceName, actionName: 'store', actionKind: 'create', isMutating: true, parameters: RouteScanner.extractPathParams(normalizedPath), auth: isAuth, middleware: currentMiddlewares, response: resolvedResponse, sourceFile: actionInfo?.sourceFile, sourceLine: actionInfo?.sourceLine, controllerName, schema: routeSchema }),
                                ScannedRouteDescriptor.create({ method: 'GET', path: `${normalizedPath}/{id}`, resourceName, actionName: 'show', actionKind: 'read', isMutating: false, parameters: RouteScanner.extractPathParams(`${normalizedPath}/{id}`), auth: isAuth, middleware: currentMiddlewares, response: resolvedResponse, sourceFile: actionInfo?.sourceFile, sourceLine: actionInfo?.sourceLine, controllerName, schema: routeSchema }),
                                ScannedRouteDescriptor.create({ method: 'PUT', path: `${normalizedPath}/{id}`, resourceName, actionName: 'update', actionKind: 'update', isMutating: true, parameters: RouteScanner.extractPathParams(`${normalizedPath}/{id}`), auth: isAuth, middleware: currentMiddlewares, response: resolvedResponse, sourceFile: actionInfo?.sourceFile, sourceLine: actionInfo?.sourceLine, controllerName, schema: routeSchema }),
                                ScannedRouteDescriptor.create({ method: 'DELETE', path: `${normalizedPath}/{id}`, resourceName, actionName: 'destroy', actionKind: 'delete', isMutating: true, parameters: RouteScanner.extractPathParams(`${normalizedPath}/{id}`), auth: isAuth, middleware: currentMiddlewares, response: resolvedResponse, sourceFile: actionInfo?.sourceFile, sourceLine: actionInfo?.sourceLine, controllerName, schema: routeSchema })
                            );
                        } else {
                            for (const method of targetMethods) {
                                const { method: canonicalMethod, actionKind, isMutating } = mapMethodDetails(method);
                                routes.push(ScannedRouteDescriptor.create({
                                    method: canonicalMethod,
                                    path: normalizedPath,
                                    resourceName,
                                    actionName: actionName || actionKind,
                                    actionKind,
                                    isMutating,
                                    parameters: RouteScanner.extractPathParams(normalizedPath),
                                    auth: isAuth,
                                    middleware: currentMiddlewares,
                                    response: resolvedResponse,
                                    sourceFile: actionInfo?.sourceFile,
                                    sourceLine: actionInfo?.sourceLine,
                                    controllerName,
                                    schema: routeSchema
                                }));
                            }
                        }
                    }
                }
            }
        }

        return routes;
    }
}
