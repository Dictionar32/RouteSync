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
import type { RouteDeclarationAst } from "../lexer/routeAst";
import type { RouteDefinition, RouteMethod, RouteTarget, RouteAuthentication, RouteSpecialKind, RouteGroupContext, RouteSecurityContract, RouteDefaults, RouteTransportContract, RouteDomain } from "../../../types/upstream/route";
import type { RouteMethods, RouteParameters, RouteMiddlewares } from "../../../types/upstream/collections";
import { controllerReturnSemanticFromValues } from './controller/controllerAstCanonical';
import type { EndpointRequestBinding, EndpointResponseBinding, EndpointResponseStatus, ResponseCardinality } from "../../../types/upstream/endpointBindings";
import { matchRouteHandler } from "../../../types/domain/routeHandlers";
import { SemanticValueFactory } from "../../../types/domain/semanticValues";
import { createActionName, createControllerName, createPropertyName, createRequestName, createRoutePath, type RoutePath } from "../../../types/upstream/names";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import { readSourceText } from './scannerUtils';
import { ControllerScanner } from "./ControllerScanner";
import { ControllerActionInfo } from "../descriptors/requestDescriptors";
import type { ScannedRouteDescriptor } from "../descriptors/routeDescriptors";
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
        return extractPathParams(createRoutePath(routePath));
    }

    private static async scanSource(
        sourceProject: SourceProjectIdentity,
        formRequests: readonly FormRequestSource[] = [],
        existingControllerMap?: Map<string, Map<string, ControllerActionInfo>>
    ): Promise<{ readonly declarations: readonly RouteDeclarationAst[]; readonly routes: readonly ScannedRouteDescriptor[]; readonly routeOrigins: readonly { readonly route: ScannedRouteDescriptor; readonly declaration: RouteDeclarationAst; readonly sourceFile: string }[] }> {
        const sourceRoot = sourceProject.root.value.value;
        const routeFiles = ['api.php', 'web.php'].map(file => path.join(sourceRoot, 'routes', file));
        const declarations: RouteDeclarationAst[] = [];
        const routes: ScannedRouteDescriptor[] = [];
        const routeOrigins: { readonly route: ScannedRouteDescriptor; readonly declaration: RouteDeclarationAst; readonly sourceFile: string }[] = [];

        for (const routesFile of routeFiles) {
            if (!fs.existsSync(routesFile)) continue;
            const source = await readSourceText(routesFile);
            const tokens = LaravelSourceLexer.tokenize(source);
            const fileDeclarations = LaravelSourceLexer.parseRouteDeclarations(tokens);
            declarations.push(...fileDeclarations);

            const controllerMap = existingControllerMap;
            for (const declaration of fileDeclarations) {
                const resolvedPath = resolveRoutePath(declaration.path, declaration.prefix);
                const controllerName = declaration.target.kind === 'controller_action' || declaration.target.kind === 'controller_invokable'
                    ? declaration.target.controller
                    : undefined;
                const actionName = declaration.target.kind === 'controller_action'
                    ? declaration.target.action
                    : declaration.target.kind === 'controller_invokable'
                        ? '__invoke'
                        : `closure_${declaration.source.startOffset}`;
                const controllerActions = controllerName !== undefined && controllerMap ? controllerMap.get(controllerName) : undefined;
                const actionInfo = controllerActions && actionName ? controllerActions.get(actionName) : undefined;
                const unresolvedResponse = new VoidResponseDescriptor();
                const middlewares = [...declaration.middleware];
                const isAuth = middlewares.some(middleware => middleware.startsWith('auth'));

                if (declaration.method === 'apiResource') {
                    const emittedRoutes = emitApiResourceRoutes(
                        resolvedPath,
                        resolvedPath.resourceName,
                        controllerName === undefined ? undefined : createControllerName(controllerName),
                        controllerMap,
                        unresolvedResponse,
                        isAuth,
                        middlewares.map(value => createPropertyName(value)),
                        SemanticValueFactory.sourceFilePath(routesFile),
                        declaration.source.line
                    );
                    routes.push(...emittedRoutes);
                    routeOrigins.push(...emittedRoutes.map(route => ({ route, declaration, sourceFile: routesFile })));
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
                            response: unresolvedResponse,
                            semanticReturn: declaration.target.kind === 'closure'
                                ? controllerReturnSemanticFromValues(declaration.target.returns, routesFile)
                                : { kind: 'absent' as const }
                        };

                const emittedRoutes = emitStandardRoutes(
                    declaration.targetMethods.map(resolveRouteHttpMethod),
                    resolvedPath,
                    resolvedPath.resourceName,
                    target,
                    isAuth,
                    middlewares.map(value => createPropertyName(value)),
                    SemanticValueFactory.sourceFilePath(routesFile),
                    declaration.source.line
                );
                routes.push(...emittedRoutes);
                routeOrigins.push(...emittedRoutes.map(route => ({ route, declaration, sourceFile: routesFile })));
            }
        }

        return { declarations, routes, routeOrigins };
    }

    public static async scan(
        sourceProject: SourceProjectIdentity,
        formRequests: readonly FormRequestSource[] = [],
        existingControllerMap?: Map<string, Map<string, ControllerActionInfo>>
    ): Promise<readonly ParsedRoute[]> {
        return (await RouteScanner.scanSource(sourceProject, formRequests, existingControllerMap)).routes;
    }

    /** Canonical syntax + semantic AST boundary. Declaration provenance is retained from the producer; ParsedRoute is only an intermediate compatibility representation. */
    public static async scanAsts(
        sourceProject: SourceProjectIdentity,
        formRequests: readonly FormRequestSource[] = [],
        existingControllerMap?: Map<string, Map<string, ControllerActionInfo>>
    ): Promise<readonly RouteAst[]> {
        const scanned = await RouteScanner.scanSource(sourceProject, formRequests, existingControllerMap);
        return scanned.routeOrigins.map(({ route, declaration, sourceFile }): RouteAst => {
            const sourceSpan = {
                kind: 'source_span' as const,
                file: SemanticValueFactory.sourceFilePath(sourceFile),
                start: { kind: 'number_value' as const, value: declaration.source.startOffset },
                end: { kind: 'number_value' as const, value: declaration.end.endOffset }
            };
            return {
                kind: 'route_ast',
                declaration,
                definition: RouteScanner.routeDefinitionFromScannedRoute(route, declaration, sourceSpan),
                source: sourceSpan
            };
        });
    }

    private static routeDefinitionFromScannedRoute(
        route: ScannedRouteDescriptor,
        declaration: RouteDeclarationAst,
        source: import("../../../types/upstream/provenance").SourceSpan
    ): RouteDefinition {
        const declarationMethods = declaration.targetMethods.map(resolveRouteHttpMethod);
        const toRouteMethod = (httpMethod: HttpMethod): Exclude<RouteMethod, { readonly kind: 'match' }> => {
            switch (httpMethod) {
                case HttpMethod.GET: return { kind: 'get' };
                case HttpMethod.POST: return { kind: 'post' };
                case HttpMethod.PUT: return { kind: 'put' };
                case HttpMethod.PATCH: return { kind: 'patch' };
                case HttpMethod.DELETE: return { kind: 'delete' };
                case HttpMethod.OPTIONS: return { kind: 'options' };
                case HttpMethod.HEAD: return { kind: 'head' };
            }
        };
        const fallbackMethod = toRouteMethod(resolveRouteHttpMethod(route.identity.coordinates.method));
        const preservedMethods = declarationMethods.length > 0
            ? declarationMethods.map(toRouteMethod)
            : [fallbackMethod];
        const preservedMethodList: RouteMethods = {
            kind: 'route_methods',
            items: preservedMethods.reduceRight<RouteMethods['items']>((tail, routeMethod) => ({ kind: 'cons', head: routeMethod, tail }), { kind: 'empty' })
        };
        const method: RouteMethod = preservedMethods.length > 1
            ? { kind: 'match', methods: preservedMethodList }
            : fallbackMethod;
        const methods: RouteMethods = preservedMethodList;
        const target: RouteTarget = matchRouteHandler<RouteTarget>(route.binding.operation.handler, {
            controllerAction: handler => ({
                kind: 'controller_action',
                controller: { kind: 'controller_reference', name: SemanticValueFactory.controllerName(handler.controllerName.value.value), action: handler.actionName }
            }),
            invokableController: handler => ({
                kind: 'controller_invokable',
                controller: { kind: 'controller_reference', name: SemanticValueFactory.controllerName(handler.controllerName.value.value), action: handler.actionName }
            }),
            closure: handler => ({ kind: 'closure', action: handler.actionName })
        });
        const middlewareItems = route.capability.middleware.reduceRight<RouteMiddlewares['items']>(
            (tail: RouteMiddlewares['items'], name: import('../../../types/upstream/names').PropertyName) => ({
                kind: 'cons',
                head: { kind: 'middleware', name: { kind: 'middleware_name', value: name.value } },
                tail
            }),
            { kind: 'empty' }
        );
        const middleware: RouteMiddlewares = { kind: 'route_middlewares', items: middlewareItems };
        const request: EndpointRequestBinding = route.binding.request.kind === 'form_request'
            ? { kind: 'form_request', request: { kind: 'request_reference', name: createRequestName(route.binding.request.identity.source.requestClass.value.value) } }
            : route.binding.request.kind === 'framework_request'
                ? { kind: 'framework_request', type: route.binding.request.type }
                : { kind: 'no_input' };
        const authentication: RouteAuthentication = route.capability.auth.value
            ? { kind: 'authenticated', scheme: route.capability.security.scheme, guard: route.capability.security.guards.items.kind === 'cons' ? { kind: 'some', value: route.capability.security.guards.items.head } : { kind: 'none' } }
            : { kind: 'public' };
        const parameters: RouteParameters = { kind: 'route_parameters', items: route.identity.parameters.all.reduceRight<RouteParameters['items']>((tail, parameter) => ({ kind: 'cons', head: parameter, tail }), { kind: 'empty' }) };
        const responseStatus: EndpointResponseStatus = { kind: 'implicit_default' };
        const responseCardinality: ResponseCardinality = route.binding.response.shape === 'collection'
            ? { kind: 'collection' }
            : { kind: 'single' };
        const response: EndpointResponseBinding = route.binding.response.kind === 'resource' || route.binding.response.kind === 'model' || route.binding.response.kind === 'inline' || route.binding.response.kind === 'void'
            ? {
                kind: 'declared_response',
                response: { kind: 'response_reference', name: route.binding.response.responseTypeName() },
                cardinality: responseCardinality,
                status: responseStatus
            }
            : { kind: 'empty_response', status: responseStatus };
        const domain: RouteDomain = route.identity.domain.domain.value.value.length === 0
            ? { kind: 'default' }
            : { kind: 'explicit', value: route.identity.domain.domain };
        const special: RouteSpecialKind = declaration.method === 'apiResource'
            ? { kind: 'api_resource', resource: {
                kind: 'route_resource_registration',
                name: route.identity.domain.resource,
                controller: route.binding.operation.handler.kind === 'controller_action' || route.binding.operation.handler.kind === 'invokable_controller'
                    ? {
                        kind: 'controller_reference',
                        name: SemanticValueFactory.controllerName(route.binding.operation.handler.controllerName.value.value),
                        action: route.binding.operation.handler.actionName
                    }
                    : {
                        kind: 'controller_reference',
                        name: SemanticValueFactory.controllerName(''),
                        action: route.binding.operation.handler.actionName
                    },
                only: { kind: 'empty' },
                except: { kind: 'empty' },
                shallow: { kind: 'truth_value', value: false },
                scoped: { kind: 'truth_value', value: false },
                parameters: { kind: 'empty' },
                creatable: { kind: 'truth_value', value: true },
                destroyable: { kind: 'truth_value', value: true },
                middleware: { kind: 'empty' }
            } }
            : { kind: 'standard' };
        const group: RouteGroupContext = {
            middleware,
            middlewareMutations: { kind: 'empty' },
            prefix: declaration.prefix.length === 0
                ? { kind: 'none' }
                : { kind: 'some', value: createRoutePath(declaration.prefix.join('/')) },
            namePrefix: { kind: 'none' },
            controller: { kind: 'none' },
            domain,
            bindingScope: { kind: 'default' },
            constraints: { kind: 'empty' }
        };
        const security: RouteSecurityContract = {
            authentication,
            middleware,
            security: route.capability.security,
            signature: { kind: 'not_signed' }
        };
        const defaults: RouteDefaults = { kind: 'route_defaults', items: { kind: 'empty' } };
        const transport: RouteTransportContract = {
            kind: 'route_transport',
            httpOnly: { kind: 'truth_value', value: false },
            httpsOnly: { kind: 'truth_value', value: false }
        };
        return {
            kind: 'route',
            identity: {
                kind: 'route_identity',
                name: { kind: 'some', value: route.identity.coordinates.name },
                method,
                methods,
                path: route.identity.coordinates.path
            },
            special,
            domain,
            group,
            bindings: { target, parameters, request, response },
            returnSemantic: route.binding.semanticReturn,
            security,
            capability: route.capability,
            defaults,
            transport,
            provenance: { source: SemanticValueFactory.sourceFilePath(route.provenance.sourceFile.value.value), span: source }
        };
    }

}
