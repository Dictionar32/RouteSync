import { readSourceText } from './scannerUtils';
/**
 * RouteScanner.ts
 *
 * Active Consumer Orchestrator for scanning routes/api.php for Route declarations.
 * Consumes route-scanner sub-domain modules to emit canonical ParsedRoute streams.
 *
 * @module core/compiler/scanner/subscanners/RouteScanner
 */

import path from "path";
import * as fs from "node:fs";
import {
    ParsedRoute,
    RouteParameter,
    VoidResponseDescriptor,
    HttpMethod,
} from "../../../types/route";
import type { FormRequestSource } from "../../../types/domain/request";
import type { RouteAst } from "../../../types/upstream/ast";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import { readSourceText } from './scannerUtils';
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
        formRequests: readonly FormRequestSource[] = [],
        existingControllerMap?: Map<string, Map<string, ControllerActionInfo>>
    ): Promise<readonly ParsedRoute[]> {
        const routesFile = path.join(projectRoot, 'routes', 'api.php');
        if (!fs.existsSync(routesFile)) return [];

        const source = await readSourceText(routesFile);
        const tokens = LaravelSourceLexer.tokenize(source);
        const declarations = LaravelSourceLexer.parseRouteDeclarations(tokens);
        const formRequestMap = new Map<string, FormRequestSource>(formRequests.map(r => [r.identity.requestClass.value.value, r]));
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

    /** Canonical syntax-AST boundary. It consumes the lexer AST directly. */
    public static async scanAsts(
        projectRoot: string,
        _formRequests: readonly FormRequestSource[] = [],
        _existingControllerMap?: Map<string, Map<string, ControllerActionInfo>>
    ): Promise<readonly RouteAst[]> {
        const routesFile = path.join(projectRoot, 'routes', 'api.php');
        if (!fs.existsSync(routesFile)) return [];

        const source = await readSourceText(routesFile);
        const tokens = LaravelSourceLexer.tokenize(source);
        const declarations = LaravelSourceLexer.parseRouteDeclarations(tokens);
        return declarations.map((declaration): RouteAst => ({
            kind: 'route_ast',
            declaration,
            source: {
                kind: 'source_span',
                file: { kind: 'source_file', value: { kind: 'string_value', value: routesFile } },
                start: { kind: 'number_value', value: declaration.source.startOffset },
                end: { kind: 'number_value', value: declaration.end.endOffset }
            }
        }));
    }

}
