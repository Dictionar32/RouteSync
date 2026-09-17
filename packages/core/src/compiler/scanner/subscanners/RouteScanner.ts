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
    VoidResponseDescriptor,
    HttpMethod,
} from "../../../types/route";
import { RequestType } from "../../artifacts/RequestTypesArtifact";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import { ControllerScanner } from "./ControllerScanner";
import { ControllerActionInfo } from "../descriptors/requestDescriptors";
import {
    extractPathParams,
    resolveRoutePath,
    emitApiResourceRoutes,
    emitStandardRoutes,
    type StandardRouteTarget
} from "./route-scanner";

function resolveRouteHttpMethod(rawMethod: string): HttpMethod {
    switch (rawMethod.toUpperCase()) {
        case HttpMethod.GET: return HttpMethod.GET;
        case HttpMethod.POST: return HttpMethod.POST;
        case HttpMethod.PUT: return HttpMethod.PUT;
        case HttpMethod.PATCH: return HttpMethod.PATCH;
        case HttpMethod.DELETE: return HttpMethod.DELETE;
        case HttpMethod.OPTIONS: return HttpMethod.OPTIONS;
        case HttpMethod.HEAD: return HttpMethod.HEAD;
        default:
            throw new Error(`Unsupported HTTP method in Route::match(): ${rawMethod}`);
    }
}

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
        const declarations = LaravelSourceLexer.parseRouteDeclarations(tokens);
        const formRequestMap = new Map<string, RequestType>(requestTypes.map(r => [r.formTypeName, r]));
        const controllerMap = existingControllerMap ?? await ControllerScanner.scan(projectRoot, formRequestMap);
        const routes: ParsedRoute[] = [];

        for (const declaration of declarations) {
            const resolvedPath = resolveRoutePath(declaration.path, declaration.prefix);
            const controllerName = declaration.target.kind === 'closure' ? undefined : declaration.target.controller;
            const actionName = declaration.target.kind === 'controller_action'
                ? declaration.target.action
                : declaration.target.kind === 'controller_invokable' ? '__invoke' : declaration.target.action;
            const controllerActions = controllerName ? controllerMap.get(controllerName) : undefined;
            const actionInfo = controllerActions && actionName
                ? controllerActions.get(actionName)
                : undefined;
            const unresolvedResponse = new VoidResponseDescriptor();
            const middlewares = [...declaration.middleware];
            const isAuth = middlewares.some(middleware => middleware.startsWith('auth'));

            if (declaration.method === 'apiResource') {
                routes.push(...emitApiResourceRoutes(
                    resolvedPath,
                    resolvedPath.resourceName,
                    controllerName,
                    controllerMap,
                    unresolvedResponse,
                    isAuth,
                    middlewares,
                    routesFile
                ));
                continue;
            }

            const target: StandardRouteTarget = actionInfo
                ? { kind: 'controller_action', action: actionInfo }
                : controllerName
                    ? {
                        kind: 'controller_reference',
                        controllerName,
                        actionName,
                        response: unresolvedResponse
                    }
                    : {
                        kind: 'closure',
                        actionName,
                        response: unresolvedResponse
                    };

            routes.push(...emitStandardRoutes(
                declaration.targetMethods.map(resolveRouteHttpMethod),
                resolvedPath,
                resolvedPath.resourceName,
                target,
                isAuth,
                middlewares,
                routesFile
            ));
        }

        return routes;
    }

}
