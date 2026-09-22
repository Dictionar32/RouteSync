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
import type { SourceProjectIdentity } from "../../../types/upstream/highLevelSourceModel";

import {
    ParsedRoute,
    RouteParameter,
    VoidResponseDescriptor,
    HttpMethod,
} from "../../../types/route";
import type { FormRequestSource } from "../../../types/domain/request";
import type { RouteAst } from "../../../types/upstream/ast";
import type { RouteDefinition, RouteMethod, RouteTarget, RouteAuthentication } from "../../../types/upstream/route";
import type { RouteMethods, RouteParameters, RouteMiddlewares } from "../../../types/upstream/collections";
import type { EndpointRequestBinding } from "../../../types/upstream/endpointBindings";
import { matchRouteHandler } from "../../../types/domain/routeHandlers";
import { SemanticValueFactory } from "../../../types/domain/semanticValues";
import { createActionName, createControllerName, createPropertyName } from "../../../types/upstream/names";
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

    private static async scanSource(
        sourceProject: SourceProjectIdentity,
        formRequests: readonly FormRequestSource[] = [],
        existingControllerMap?: Map<string, Map<string, ControllerActionInfo>>
    ): Promise<{ readonly declarations: readonly import("../lexer/routeAst").RouteDeclarationAst[]; readonly routes: readonly ParsedRoute[]; readonly routesFile: string }> {
        const sourceRoot = sourceProject.root.value.value;
        const routesFile = path.join(sourceRoot, 'routes', 'api.php');
        if (!fs.existsSync(routesFile)) return { declarations: [], routes: [], routesFile };

        const source = await readSourceText(routesFile);
        const tokens = LaravelSourceLexer.tokenize(source);
        const declarations = LaravelSourceLexer.parseRouteDeclarations(tokens);
        const formRequestMap = new Map<string, FormRequestSource>(formRequests.map(r => [r.identity.requestClass.value.value, r]));
        const controllerMap = existingControllerMap ?? await ControllerScanner.scanCanonicalBundle(sourceProject, formRequestMap).then(result => result.controllerMap);
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
                    controllerName === undefined ? undefined : createControllerName(controllerName),
                    controllerMap,
                    unresolvedResponse,
                    isAuth,
                    middlewares.map(value => createPropertyName(value)),
                    SemanticValueFactory.sourceFilePath(routesFile)
                ));
                continue;
            }

            const target: StandardRouteTarget = actionInfo
                ? { kind: 'controller_action', action: actionInfo }
                : controllerName
                    ? {
                        kind: 'controller_reference',
                        controllerName: createControllerName(controllerName),
                        actionName: createActionName(actionName),
                        response: unresolvedResponse
                    }
                    : {
                        kind: 'closure',
                        actionName: createActionName(actionName),
                        response: unresolvedResponse
                    };

            routes.push(...emitStandardRoutes(
                declaration.targetMethods.map(resolveRouteHttpMethod),
                resolvedPath,
                resolvedPath.resourceName,
                target,
                isAuth,
                middlewares.map(value => createPropertyName(value)),
                SemanticValueFactory.sourceFilePath(routesFile)
            ));
        }

        return { declarations, routes, routesFile };
    }

    public static async scan(
        sourceProject: SourceProjectIdentity,
        formRequests: readonly FormRequestSource[] = [],
        existingControllerMap?: Map<string, Map<string, ControllerActionInfo>>
    ): Promise<readonly ParsedRoute[]> {
        return (await RouteScanner.scanSource(sourceProject, formRequests, existingControllerMap)).routes;
    }

    /** Canonical syntax + semantic AST boundary. The source is interpreted once and the existing ParsedRoute is elevated into RouteDefinition. */
    public static async scanAsts(
        sourceProject: SourceProjectIdentity,
        formRequests: readonly FormRequestSource[] = [],
        existingControllerMap?: Map<string, Map<string, ControllerActionInfo>>
    ): Promise<readonly RouteAst[]> {
        const scanned = await RouteScanner.scanSource(sourceProject, formRequests, existingControllerMap);
        return scanned.routes.map((route): RouteAst => {
            const declaration = scanned.declarations.find(item => {
                const declarationPath = resolveRoutePath(item.path, item.prefix).path.value.value;
                if (declarationPath !== route.identity.coordinates.path.value.value) return false;
                const methodMatches = item.targetMethods.some(method => method.toUpperCase() === route.identity.coordinates.method);
                if (methodMatches) return true;
                return item.method === 'apiResource';
            });
            if (!declaration) {
                throw new Error(`Route semantic producer could not preserve declaration provenance for ${route.identity.coordinates.path.value.value}.`);
            }
            const sourceSpan = {
                kind: 'source_span' as const,
                file: SemanticValueFactory.sourceFilePath(scanned.routesFile),
                start: { kind: 'number_value' as const, value: declaration.source.startOffset },
                end: { kind: 'number_value' as const, value: declaration.end.endOffset }
            };
            return {
                kind: 'route_ast',
                declaration,
                definition: RouteScanner.routeDefinitionFromParsedRoute(route, sourceSpan),
                source: sourceSpan
            };
        });
    }

    private static routeDefinitionFromParsedRoute(
        route: ParsedRoute,
        source: import("../../../types/upstream/provenance").SourceSpan
    ): RouteDefinition {
        const method: RouteMethod = (() => {
            switch (route.identity.coordinates.method) {
                case HttpMethod.GET: return { kind: 'get' };
                case HttpMethod.POST: return { kind: 'post' };
                case HttpMethod.PUT: return { kind: 'put' };
                case HttpMethod.PATCH: return { kind: 'patch' };
                case HttpMethod.DELETE: return { kind: 'delete' };
                case HttpMethod.OPTIONS: return { kind: 'options' };
                case HttpMethod.HEAD: return { kind: 'head' };
            }
        })();
        const methods: RouteMethods = { kind: 'route_methods', items: { kind: 'cons', head: method, tail: { kind: 'empty' } } };
        const target: RouteTarget = matchRouteHandler(route.binding.operation.handler, {
            controllerAction: handler => ({
                kind: 'controller',
                controller: { kind: 'controller_reference', name: SemanticValueFactory.controllerName(handler.controllerName.value.value), action: handler.actionName }
            }),
            invokableController: handler => ({
                kind: 'controller',
                controller: { kind: 'controller_reference', name: SemanticValueFactory.controllerName(handler.controllerName.value.value), action: handler.actionName }
            }),
            closure: handler => ({ kind: 'closure', action: handler.actionName })
        });
        const middlewareItems = route.capability.middleware.reduceRight<RouteMiddlewares['items']>(
            (tail, name) => ({
                kind: 'cons',
                head: { kind: 'middleware', name: { kind: 'middleware_name', value: name.value } },
                tail
            }),
            { kind: 'empty' }
        );
        const middleware: RouteMiddlewares = { kind: 'route_middlewares', items: middlewareItems };
        const request: EndpointRequestBinding = route.binding.request.kind === 'form_request'
            ? { kind: 'form_request', request: { kind: 'request_reference', name: route.binding.request.identity.source.requestClass } }
            : { kind: 'no_input' };
        const authentication: RouteAuthentication = route.capability.auth ? { kind: 'authenticated' } : { kind: 'public' };
        const parameters: RouteParameters = { kind: 'route_parameters', items: route.identity.parameters.all.reduceRight<RouteParameters['items']>((tail, parameter) => ({ kind: 'cons', head: parameter, tail }), { kind: 'empty' }) };
        return {
            kind: 'route',
            name: route.identity.coordinates.name,
            method,
            methods,
            path: route.identity.coordinates.path,
            target,
            domain: route.identity.domain.domain,
            auth: authentication,
            middleware,
            parameters,
            request,
            response: { kind: 'response_reference', name: route.binding.response.responseTypeName() },
            capability: route.capability,
            source: SemanticValueFactory.sourceFilePath(route.provenance.sourceFile.value),
            span: source
        };
    }

}
