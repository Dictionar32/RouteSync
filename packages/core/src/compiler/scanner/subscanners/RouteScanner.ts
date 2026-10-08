/**
 * RouteScanner.ts
 *
 * Active Consumer Orchestrator scanning routes/api.php.
 * Consumes route-scanner sub-domain modules to emit canonical route semantic emissions.
 *
 * @module core/compiler/scanner/subscanners/RouteScanner
 */

import { relationContains, type RelationMembership } from '../../../semantic/foundation/relationMembership';
import path from "path";
import { relationFoldRight } from '../../../semantic/foundation/relationalSequence';
import * as fs from "node:fs";
import { routeAuthorizationKnowledge } from '../semantic/route/routeMiddlewareKnowledgeCatalog';
import { relationIndexLookup, relationIndexAdd, type RelationIndex } from '../../../semantic/foundation/relationMembership';
import { relationGate, relationLookup, relationOptionFold, relationEqual, relationAny, relationProject, relationFold, type RelationOption, relationNone, relationFirstOption, relationVariantFold } from '../../../semantic/foundation/relationalSequence';

import type { SourceProjectIdentity } from "../../../types/upstream/highLevelSourceModel";

import {
    type RouteParameter,
    type VoidResponseDescriptor,
    type HttpMethod,
} from "../../../types/route";
import type { RouteAst } from "../../../types/upstream/ast";
import type { RouteDeclarationAst } from "../lexer/routeAst";
import type { RouteMethod, RouteTarget, RouteAuthentication, RouteSpecialKind, RouteGroupContext, RouteSecurityContract, RouteDefaults, RouteTransportContract, RouteDomain, RouteProducerInput, RouteFileContext } from "../../../types/upstream/route";
import type { RouteMethods, RouteParameters } from "../../../types/upstream/collections";
import { controllerReturnSemanticFromValues } from './controller/controllerAstCanonical';
import type { EndpointRequestBinding, EndpointResponseBinding, EndpointResponseStatus } from "../../../types/upstream/endpointBindings";
import type { ResponseCardinality } from "../../../types/upstream/response";
import { matchRouteHandler } from "../../../types/domain/routeHandlers";
import { SemanticValueFactory } from "../../../types/domain/semanticValues";
import { routeBoundaryContractFromRouteEmission, routeProducerInputFromRouteBoundary, routeSemanticFlowFromRouteBoundary } from "./routeProducerRelations";
import { routeProducer } from "./routeProducer";
import { createActionName, createControllerName, createMiddlewareName, createPropertyName, createRequestName, createRoutePath, type RoutePath } from "../../../types/upstream/names";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import { routeDeclarationFlow, routeDeclarationSemanticKind, routeMethodSemanticKind, routeSourceFileContextKnowledge, type RouteDeclarationFlow } from "../lexer/routeAst/routeDataFlow";
import { readSourceText } from './scannerUtils';
import { ControllerScanner } from "./ControllerScanner";
import { type ControllerActionInfo } from "../descriptors/requestDescriptors";
import {
    extractPathParams,
    resolveRoutePath,
    emitResourceRoutes,
    type ResourceRouteMethod,
    emitStandardRoutes,
    type StandardRouteTarget,
    type RouteEmission
} from "./route-scanner";

const ROUTE_HTTP_METHODS: readonly (readonly [string, HttpMethod])[] = Object.freeze([
    [HttpMethod.GET, HttpMethod.GET], [HttpMethod.POST, HttpMethod.POST],
    [HttpMethod.PUT, HttpMethod.PUT], [HttpMethod.PATCH, HttpMethod.PATCH],
    [HttpMethod.DELETE, HttpMethod.DELETE], [HttpMethod.OPTIONS, HttpMethod.OPTIONS],
    [HttpMethod.HEAD, HttpMethod.HEAD],
]);

const ROUTE_AST_METHODS: readonly (readonly [HttpMethod, Exclude<RouteMethod, { readonly kind: 'match' }>])[] = Object.freeze([
    [HttpMethod.GET, { kind: 'get' }],
    [HttpMethod.POST, { kind: 'post' }],
    [HttpMethod.PUT, { kind: 'put' }],
    [HttpMethod.PATCH, { kind: 'patch' }],
    [HttpMethod.DELETE, { kind: 'delete' }],
    [HttpMethod.OPTIONS, { kind: 'options' }],
    [HttpMethod.HEAD, { kind: 'head' }],
]);

function resolveRouteHttpMethod(rawMethod: string): HttpMethod {
    return relationOptionFold(
        relationLookup(ROUTE_HTTP_METHODS, rawMethod.toUpperCase()),
        () => { throw Error(`Unsupported HTTP method in Route::match(): ${rawMethod}`); },
        value => value,
    );
}

const toRouteMethod = (httpMethod: HttpMethod): Exclude<RouteMethod, { readonly kind: 'match' }> =>
    relationOptionFold(
        relationLookup(ROUTE_AST_METHODS, httpMethod),
        () => ({ kind: 'get' as const }),
        value => value,
    );

const routeFileNames: readonly string[] = Object.freeze(['api.php', 'web.php']);
const routeFiles = (sourceRoot: string, index = 0, output: readonly string[] = Object.freeze([])): readonly string[] =>
    relationGate(index >= routeFileNames.length, () => output, () => routeFiles(sourceRoot, index + 1, [...output, path.join(sourceRoot, 'routes', routeFileNames[index])]));

const routeDeclarationMethods = (methods: readonly string[], index = 0, output: readonly HttpMethod[] = Object.freeze([])): readonly HttpMethod[] =>
    relationGate(index >= methods.length, () => output, () => routeDeclarationMethods(methods, index + 1, [...output, resolveRouteHttpMethod(methods[index])]));

const controllerNameOf = (flow: RouteDeclarationFlow): RelationOption<string> => relationGate(
    relationAny([relationEqual(flow.target.value.kind, 'controller_action'), relationEqual(flow.target.value.kind, 'controller_invokable')]),
    () => relationSome((flow.target.value as Extract<RouteDeclarationAst['target'], { kind: 'controller_action' | 'controller_invokable' }>).controller),
    () => relationNone(),
);

const actionNameOf = (flow: RouteDeclarationFlow, declaration: RouteDeclarationAst): string => relationGate(
    relationEqual(flow.target.value.kind, 'controller_action'),
    () => (flow.target.value as Extract<RouteDeclarationAst['target'], { kind: 'controller_action' }>).action,
    () => relationGate(
        relationEqual(flow.target.value.kind, 'controller_invokable'),
        () => '__invoke',
        () => `closure_${declaration.source.startOffset}`,
    ),
);

export class RouteScanner {
    public static extractPathParams(routePath: string): readonly RouteParameter[] {
        return extractPathParams(createRoutePath(routePath));
    }

    private static async scanSource(
        sourceProject: SourceProjectIdentity,
        existingControllerMap: RelationOption<RelationIndex<string, RelationIndex<string, ControllerActionInfo>>> = relationNone(),
    ): Promise<{ readonly declarations: readonly RouteDeclarationAst[]; readonly routes: readonly RouteEmission[]; readonly routeOrigins: readonly { readonly route: RouteEmission; readonly declaration: RouteDeclarationAst; readonly sourceFile: string }[] }> {
        const sourceRoot = sourceProject.root.value.value;
        const files = routeFiles(sourceRoot);

        const scanFile = async (routesFile: string): Promise<{ readonly declarations: readonly RouteDeclarationAst[]; readonly routes: readonly RouteEmission[]; readonly routeOrigins: readonly { readonly route: RouteEmission; readonly declaration: RouteDeclarationAst; readonly sourceFile: string }[] }> => relationGate(
            fs.existsSync(routesFile),
            async () => {
                const source = await readSourceText(routesFile);
                const declarations = LaravelSourceLexer.parseRouteDeclarations(LaravelSourceLexer.tokenize(source));
                const process = async (items: readonly RouteDeclarationAst[], index = 0, routes: readonly RouteEmission[] = Object.freeze([]), origins: readonly { readonly route: RouteEmission; readonly declaration: RouteDeclarationAst; readonly sourceFile: string }[] = Object.freeze([])): Promise<{ readonly routes: readonly RouteEmission[]; readonly origins: readonly { readonly route: RouteEmission; readonly declaration: RouteDeclarationAst; readonly sourceFile: string }[] }> => relationGate(
                    index >= items.length,
                    () => Promise.resolve({ routes, origins }),
                    async () => {
                        const declaration = items[index];
                        const declarationFlow = routeDeclarationFlow(declaration);
                        const resolvedPath = resolveRoutePath(declaration.path, declarationFlow.group.value.prefix);
                        const controllerName = controllerNameOf(declarationFlow);
                        const actionName = actionNameOf(declarationFlow, declaration);
                        const actionInfo = relationOptionFold(
                            controllerName,
                            () => relationNone<ControllerActionInfo>(),
                            name => relationFirstControllerAction(
                                existingControllerMap,
                                name,
                                actionName,
                            ),
                        );
                        const unresolvedResponse = VoidResponseDescriptor.create();
                        const middlewares = relationProject(declarationFlow.middleware.value, value => createMiddlewareName(value));
                        const authorization = routeAuthorizationKnowledge(middlewares);
                        const isAuth = relationEqual(authorization.kind, 'authorized');
                        const declarationKind = routeDeclarationSemanticKind(declarationFlow.method);
                        const emittedRoutes = relationGate(
                            relationAny([relationEqual(declarationKind, 'resource'), relationEqual(declarationKind, 'api_resource'), relationEqual(declarationKind, 'singleton'), relationEqual(declarationKind, 'api_singleton')]),
                            () => emitResourceRoutes(declaration.method as ResourceRouteMethod, 
                                resolvedPath, resolvedPath.resourceName,
                                controllerName,
                                existingControllerMap,
                                unresolvedResponse, isAuth,
                                middlewares,
                                SemanticValueFactory.sourceFilePath(routesFile), declaration.source.line,
                                resourceRegistrationFromDeclaration(declaration, resolvedPath.resourceName),
                            ),
                            () => {
                                const target: StandardRouteTarget = relationOptionFold(
                                    actionInfo,
                                    () => relationOptionFold(controllerName,
                                        () => ({ kind: 'closure', actionName: createActionName(actionName), response: unresolvedResponse, semanticReturn: relationGate(relationEqual(declarationFlow.target.value.kind, 'closure'), () => controllerReturnSemanticFromValues((declarationFlow.target.value as Extract<RouteDeclarationAst['target'], { kind: 'closure' }>).returns, routesFile), () => ({ kind: 'absent' as const })) }),
                                        value => ({ kind: 'controller_reference', controllerName: createControllerName(value), actionName: createActionName(actionName), response: unresolvedResponse })
                                    ),
                                    value => ({ kind: 'controller_action', action: value })
                                );
                                return emitStandardRoutes(routeDeclarationMethods(declaration.targetMethods), resolvedPath, resolvedPath.resourceName, target, isAuth, middlewares, SemanticValueFactory.sourceFilePath(routesFile), declaration.source.line);
                            }
                        );
                        const nextRoutes = [...routes, ...emittedRoutes];
                        const nextOrigins = [...origins, ...relationProject(emittedRoutes, route => ({ route, declaration, sourceFile: routesFile }))];
                        return process(items, index + 1, nextRoutes, nextOrigins);
                    },
                );
                const processed = await process(declarations);
                return { declarations, routes: processed.routes, routeOrigins: processed.origins };
            },
            () => Promise.resolve({ declarations: Object.freeze([]), routes: Object.freeze([]), routeOrigins: Object.freeze([]) }),
        );

        const collect = async (index = 0, declarations: readonly RouteDeclarationAst[] = Object.freeze([]), routes: readonly RouteEmission[] = Object.freeze([]), origins: readonly { readonly route: RouteEmission; readonly declaration: RouteDeclarationAst; readonly sourceFile: string }[] = Object.freeze([])): Promise<{ readonly declarations: readonly RouteDeclarationAst[]; readonly routes: readonly RouteEmission[]; readonly routeOrigins: readonly { readonly route: RouteEmission; readonly declaration: RouteDeclarationAst; readonly sourceFile: string }[] }> => relationGate(
            index >= files.length,
            () => Promise.resolve({ declarations, routes, routeOrigins: origins }),
            async () => {
                const result = await scanFile(files[index]);
                return collect(index + 1, [...declarations, ...result.declarations], [...routes, ...result.routes], [...origins, ...result.routeOrigins]);
            },
        );
        return collect();
    }

    /** Canonical route AST entrypoint. Legacy route-flow is no longer the scanner public return type. */
    public static async scan(
        sourceProject: SourceProjectIdentity,
        existingControllerMap: RelationOption<RelationIndex<string, RelationIndex<string, ControllerActionInfo>>> = relationNone(),
    ): Promise<readonly RouteAst[]> {
        return RouteScanner.scanAsts(sourceProject, existingControllerMap);
    }

    /** Canonical syntax + semantic bundle. One route scan produces both AST and semantic flow. */
    public static async scanCanonicalBundle(
        sourceProject: SourceProjectIdentity,
        existingControllerMap: RelationOption<RelationIndex<string, RelationIndex<string, ControllerActionInfo>>> = relationNone(),
    ): Promise<{ readonly asts: readonly RouteAst[]; readonly flows: readonly import('../../../types/domain/routes').RouteSemanticFlow[] }> {
        const scanned = await RouteScanner.scanSource(sourceProject, existingControllerMap);
        const bundles = relationProject(scanned.routeOrigins, ({ route, declaration, sourceFile }) => {
            const boundary = routeBoundaryContractFromRouteEmission(route);
            const sourceSpan = {
                kind: 'source_span' as const,
                file: SemanticValueFactory.sourceFilePath(sourceFile),
                start: { kind: 'number_value' as const, value: declaration.source.startOffset },
                end: { kind: 'number_value' as const, value: declaration.end.endOffset }
            };
            return Object.freeze({
                ast: routeProducer.produce(routeProducerInputFromRouteBoundary(boundary, declaration, sourceSpan, existingControllerMap)),
                flow: routeSemanticFlowFromRouteBoundary(boundary),
            });
        });
        const asts = relationProject(bundles, bundle => bundle.ast);
        const flows = relationProject(bundles, bundle => bundle.flow);
        return Object.freeze({ asts: Object.freeze(asts), flows: Object.freeze(flows) });
    }

    /** Canonical syntax + semantic AST boundary. Declaration provenance is retained from the producer. */
    public static async scanAsts(
        sourceProject: SourceProjectIdentity,
        existingControllerMap: RelationOption<RelationIndex<string, RelationIndex<string, ControllerActionInfo>>> = relationNone(),
    ): Promise<readonly RouteAst[]> {
        const bundle = await RouteScanner.scanCanonicalBundle(sourceProject, existingControllerMap);
        return bundle.asts;
    }



}

