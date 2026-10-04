/**
 * RouteScanner.ts
 *
 * Active Consumer Orchestrator scanning routes/api.php.
 * Consumes route-scanner sub-domain modules to emit canonical RouteSemanticFlow streams.
 *
 * @module core/compiler/scanner/subscanners/RouteScanner
 */

import { relationContains, type RelationMembership } from '../../../semantic/kernel/relationMembership';
import path from "path";
import { relationFoldRight } from '../../../semantic/kernel/relationalSequence';
import * as fs from "node:fs";
import { routeAuthorizationKnowledge } from '../semantic/route/routeMiddlewareKnowledgeCatalog';
import { relationIndexLookup, relationIndexAdd, type RelationIndex } from '../../../semantic/kernel/relationMembership';
import { relationGate, relationLookup, relationOptionFold, relationEqual, relationAny, relationProject, relationFold, type RelationOption, relationSome, relationNone, relationFirstOption } from '../../../semantic/kernel/relationalSequence';

import type { SourceProjectIdentity } from "../../../types/upstream/highLevelSourceModel";

import {
    RouteSemanticFlow,
    RouteParameter,
    VoidResponseDescriptor,
    HttpMethod,
} from "../../../types/route";
import type { FormRequestSource } from "../../../types/domain/request";
import type { RouteAst } from "../../../types/upstream/ast";
import type { RouteDeclarationAst } from "../lexer/routeAst";
import type { RouteMethod, RouteTarget, RouteAuthentication, RouteSpecialKind, RouteGroupContext, RouteSecurityContract, RouteDefaults, RouteTransportContract, RouteDomain, RouteProducerInput } from "../../../types/upstream/route";
import type { RouteAst } from "../../../types/upstream/ast";
import type { RouteMethods, RouteParameters } from "../../../types/upstream/collections";
import { controllerReturnSemanticFromValues } from './controller/controllerAstCanonical';
import type { EndpointRequestBinding, EndpointResponseBinding, EndpointResponseStatus } from "../../../types/upstream/endpointBindings";
import type { ResponseCardinality } from "../../../types/upstream/response";
import { matchRouteHandler } from "../../../types/domain/routeHandlers";
import { SemanticValueFactory } from "../../../types/domain/semanticValues";
import { routeProducer } from "./routeProducer";
import { createActionName, createControllerName, createPropertyName, createRequestName, createRoutePath, type RoutePath } from "../../../types/upstream/names";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import { routeDeclarationSemanticKind, routeMethodSemanticKind, routeSourceFileContextKnowledge } from "../lexer/routeAst/routeDataFlow";
import { readSourceText } from './scannerUtils';
import { ControllerScanner } from "./ControllerScanner";
import { ControllerActionInfo } from "../descriptors/requestDescriptors";
import { resolveRouteGroupContext } from "../descriptors/route/routeGroupContextResolver";
import type { RouteSemanticFlowFactory } from "../descriptors/routeDescriptors";
import {
    extractPathParams,
    resolveRoutePath,
    emitApiResourceRoutes,
    emitStandardRoutes,
    type StandardRouteTarget
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

const controllerNameOf = (declaration: RouteDeclarationAst): RelationOption<string> => relationGate(
    relationAny([relationEqual(declaration.target.kind, 'controller_action'), relationEqual(declaration.target.kind, 'controller_invokable')]),
    () => relationSome((declaration.target as Extract<RouteDeclarationAst['target'], { kind: 'controller_action' | 'controller_invokable' }>).controller),
    () => relationNone(),
);

const actionNameOf = (declaration: RouteDeclarationAst): string => relationGate(
    relationEqual(declaration.target.kind, 'controller_action'),
    () => (declaration.target as Extract<RouteDeclarationAst['target'], { kind: 'controller_action' }>).action,
    () => relationGate(
        relationEqual(declaration.target.kind, 'controller_invokable'),
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
        formRequests: readonly FormRequestSource[] = [],
        existingControllerMap?: RelationIndex<string, RelationIndex<string, ControllerActionInfo>>,
        modelNames: RelationMembership<string> = Object.freeze([] as string[])
    ): Promise<{ readonly declarations: readonly RouteDeclarationAst[]; readonly routes: readonly RouteSemanticFlowFactory[]; readonly routeOrigins: readonly { readonly route: RouteSemanticFlowFactory; readonly declaration: RouteDeclarationAst; readonly sourceFile: string }[] }> {
        const sourceRoot = sourceProject.root.value.value;
        const files = routeFiles(sourceRoot);

        const scanFile = async (routesFile: string): Promise<{ readonly declarations: readonly RouteDeclarationAst[]; readonly routes: readonly RouteSemanticFlowFactory[]; readonly routeOrigins: readonly { readonly route: RouteSemanticFlowFactory; readonly declaration: RouteDeclarationAst; readonly sourceFile: string }[] }> => relationGate(
            fs.existsSync(routesFile),
            async () => {
                const source = await readSourceText(routesFile);
                const declarations = LaravelSourceLexer.parseRouteDeclarations(LaravelSourceLexer.tokenize(source));
                const process = async (items: readonly RouteDeclarationAst[], index = 0, routes: readonly RouteSemanticFlowFactory[] = Object.freeze([]), origins: readonly { readonly route: RouteSemanticFlowFactory; readonly declaration: RouteDeclarationAst; readonly sourceFile: string }[] = Object.freeze([])): Promise<{ readonly routes: readonly RouteSemanticFlowFactory[]; readonly origins: readonly { readonly route: RouteSemanticFlowFactory; readonly declaration: RouteDeclarationAst; readonly sourceFile: string }[] }> => relationGate(
                    index >= items.length,
                    () => Promise.resolve({ routes, origins }),
                    async () => {
                        const declaration = items[index];
                        const resolvedPath = resolveRoutePath(declaration.path, declaration.prefix);
                        const controllerName = controllerNameOf(declaration);
                        const actionName = actionNameOf(declaration);
                        const actionInfo = relationOptionFold(
                            controllerName,
                            () => relationNone<ControllerActionInfo>(),
                            name => relationFirstControllerAction(
                                relationOptionFold(relationFirstOption([existingControllerMap], value => Boolean(value)), () => relationNone(), value => relationSome(value)),
                                name,
                                actionName,
                            ),
                        );
                        const unresolvedResponse = VoidResponseDescriptor.create();
                        const middlewares = declaration.middleware;
                        const authorization = routeAuthorizationKnowledge(relationProject(middlewares, value => createPropertyName(value)));
                        const isAuth = relationEqual(authorization.kind, 'authorized');
                        const declarationKind = routeDeclarationSemanticKind(declaration.method);
                        const emittedRoutes = relationGate(
                            relationEqual(declarationKind, 'api_resource'),
                            () => emitApiResourceRoutes(
                                resolvedPath, resolvedPath.resourceName,
                                controllerName,
                                relationOptionFold(relationFirstOption([existingControllerMap], value => Boolean(value)), () => relationNone(), value => relationSome(value)),
                                unresolvedResponse, isAuth,
                                relationProject(middlewares, value => createPropertyName(value)),
                                SemanticValueFactory.sourceFilePath(routesFile), declaration.source.line
                            ),
                            () => {
                                const target: StandardRouteTarget = relationOptionFold(
                                    actionInfo,
                                    () => relationOptionFold(controllerName,
                                        () => ({ kind: 'closure', actionName: createActionName(actionName), response: unresolvedResponse, semanticReturn: relationGate(relationEqual(declaration.target.kind, 'closure'), () => controllerReturnSemanticFromValues((declaration.target as Extract<RouteDeclarationAst['target'], { kind: 'closure' }>).returns, routesFile), () => ({ kind: 'absent' as const })) }),
                                        value => ({ kind: 'controller_reference', controllerName: createControllerName(value), actionName: createActionName(actionName), response: unresolvedResponse })
                                    ),
                                    value => ({ kind: 'controller_action', action: value })
                                );
                                return emitStandardRoutes(routeDeclarationMethods(declaration.targetMethods), resolvedPath, resolvedPath.resourceName, target, isAuth, relationProject(middlewares, value => createPropertyName(value)), SemanticValueFactory.sourceFilePath(routesFile), declaration.source.line);
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

        const collect = async (index = 0, declarations: readonly RouteDeclarationAst[] = Object.freeze([]), routes: readonly RouteSemanticFlowFactory[] = Object.freeze([]), origins: readonly { readonly route: RouteSemanticFlowFactory; readonly declaration: RouteDeclarationAst; readonly sourceFile: string }[] = Object.freeze([])): Promise<{ readonly declarations: readonly RouteDeclarationAst[]; readonly routes: readonly RouteSemanticFlowFactory[]; readonly routeOrigins: readonly { readonly route: RouteSemanticFlowFactory; readonly declaration: RouteDeclarationAst; readonly sourceFile: string }[] }> => relationGate(
            index >= files.length,
            () => Promise.resolve({ declarations, routes, routeOrigins: origins }),
            async () => {
                const result = await scanFile(files[index]);
                return collect(index + 1, [...declarations, ...result.declarations], [...routes, ...result.routes], [...origins, ...result.routeOrigins]);
            },
        );
        return collect();
    }

    public static async scan(
        sourceProject: SourceProjectIdentity,
        formRequests: readonly FormRequestSource[] = [],
        existingControllerMap?: RelationIndex<string, RelationIndex<string, ControllerActionInfo>>
    ): Promise<readonly RouteSemanticFlow[]> {
        return (await RouteScanner.scanSource(sourceProject, formRequests, existingControllerMap)).routes;
    }

    /** Canonical syntax + semantic AST boundary. Declaration provenance is retained from the producer; RouteSemanticFlow is only an intermediate compatibility representation. */
    public static async scanAsts(
        sourceProject: SourceProjectIdentity,
        formRequests: readonly FormRequestSource[] = [],
        existingControllerMap?: RelationIndex<string, RelationIndex<string, ControllerActionInfo>>,
        modelNames: RelationMembership<string> = Object.freeze([] as string[])
    ): Promise<readonly RouteAst[]> {
        const scanned = await RouteScanner.scanSource(sourceProject, formRequests, existingControllerMap, modelNames);
        return relationProject(scanned.routeOrigins, ({ route, declaration, sourceFile }): RouteAst => {
            const sourceSpan = {
                kind: 'source_span' as const,
                file: SemanticValueFactory.sourceFilePath(sourceFile),
                start: { kind: 'number_value' as const, value: declaration.source.startOffset },
                end: { kind: 'number_value' as const, value: declaration.end.endOffset }
            };
            return RouteScanner.routeAstFromRouteSemanticFlow(route, declaration, sourceSpan, existingControllerMap, modelNames);
        });
    }

    private static routeAstFromRouteSemanticFlow(
        route: RouteSemanticFlowFactory,
        declaration: RouteDeclarationAst,
        source: import("../../../types/upstream/provenance").SourceSpan,
        existingControllerMap?: RelationIndex<string, RelationIndex<string, ControllerActionInfo>>,
        modelNames: RelationMembership<string> = Object.freeze([] as string[])
    ): RouteAst {
        const declarationMethods = relationProject(declaration.targetMethods, resolveRouteHttpMethod);
        const fallbackMethod = toRouteMethod(resolveRouteHttpMethod(route.identity.coordinates.method));
        const preservedMethods = relationGate(
            declarationMethods.length > 0,
            () => relationProject(declarationMethods, toRouteMethod),
            () => [fallbackMethod],
        );
        const preservedMethodList: RouteMethods = {
            kind: 'route_methods',
            items: routeMethodsToList(preservedMethods),
        };
        const routeMethodKind = {
            any: () => ({ kind: 'any' } as const),
            match: () => ({ kind: 'match', methods: preservedMethodList } as const),
            standard: () => fallbackMethod,
        } as const;
        const methodKind = routeMethodSemanticKind(declaration.method);
        const method: RouteMethod = routeMethodKind[methodKind]();
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
        const request: EndpointRequestBinding = relationGate(
            relationEqual(route.binding.request.kind, 'form_request'),
            () => ({ kind: 'form_request', request: { kind: 'request_reference', name: createRequestName(route.binding.request.identity.source.requestClass.value.value) } }),
            () => relationGate(
                relationEqual(route.binding.request.kind, 'framework_request'),
                () => ({ kind: 'framework_request', type: route.binding.request.type }),
                () => ({ kind: 'no_input' }),
            ),
        );
        const authentication: RouteAuthentication = relationGate(
            route.capability.auth.value,
            () => ({ kind: 'authenticated', scheme: route.capability.security.scheme, guard: relationGate(
                relationEqual(route.capability.security.guards.kind, 'cons'),
                () => ({ kind: 'some', value: route.capability.security.guards.head }),
                () => ({ kind: 'none' }),
            ) }),
            () => ({ kind: 'public' }),
        );
        const controllerAction: RelationOption<ControllerActionInfo> = matchRouteHandler(route.binding.operation.handler, {
            controllerAction: handler => relationOptionFold(
                relationFirstControllerAction(existingControllerMap, handler.controllerName.value.value, handler.actionName.value.value),
                () => relationNone<ControllerActionInfo>(),
                value => relationSome(value),
            ),
            invokableController: handler => relationFirstControllerAction(existingControllerMap, handler.controllerName.value.value, '__invoke'),
            closure: () => relationNone<ControllerActionInfo>(),
        });
        const semanticParameters = refineImplicitModelBindings(route.identity.parameters.all, controllerAction, modelNames);
        const parameters: RouteParameters = { kind: 'route_parameters', items: relationFoldRight(semanticParameters, { kind: 'empty' } as RouteParameters['items'], (parameter, tail) => ({ kind: 'cons', head: parameter, tail })) };
        const responseStatus: EndpointResponseStatus = { kind: 'implicit_default' };
        const responseCardinality: ResponseCardinality = relationGate(
            relationEqual(route.binding.response.shape, 'collection'),
            () => ({ kind: 'collection' }),
            () => ({ kind: 'single' }),
        );
        const response: EndpointResponseBinding = relationGate(
            relationAny([
                relationEqual(route.binding.response.kind, 'resource'),
                relationEqual(route.binding.response.kind, 'model'),
                relationEqual(route.binding.response.kind, 'inline'),
                relationEqual(route.binding.response.kind, 'void'),
            ]),
            () => ({
                kind: 'declared_response',
                response: { kind: 'response_reference', name: route.binding.response.responseTypeName() },
                cardinality: responseCardinality,
                status: responseStatus,
            }),
            () => ({ kind: 'empty_response', status: responseStatus }),
        );
        const domain: RouteDomain = relationGate(
            relationEqual(route.identity.domain.domain.value.value.length, 0),
            () => ({ kind: 'default' }),
            () => ({ kind: 'explicit', value: route.identity.domain.domain }),
        );
        const special: RouteSpecialKind = relationGate(
            relationEqual(routeDeclarationSemanticKind(declaration.method), 'api_resource'),
            () => ({ kind: 'api_resource', resource: {
                kind: 'route_resource_registration',
                name: route.identity.domain.resource,
                controller: relationGate(
                    relationAny([
                        relationEqual(route.binding.operation.handler.kind, 'controller_action'),
                        relationEqual(route.binding.operation.handler.kind, 'invokable_controller'),
                    ]),
                    () => ({
                        kind: 'conventional_controller',
                        className: SemanticValueFactory.className(route.binding.operation.handler.controllerName.value.value),
                    }),
                    () => ({ kind: 'framework_convention' }),
                ),
                only: { kind: 'empty' },
                except: { kind: 'empty' },
                shallow: { kind: 'truth_value', value: false },
                scoped: { kind: 'truth_value', value: false },
                parameters: { kind: 'empty' },
                creatable: { kind: 'truth_value', value: true },
                destroyable: { kind: 'truth_value', value: true },
                middleware: { kind: 'empty' },
            } }),
            () => ({ kind: 'standard' }),
        );
        const group: RouteGroupContext = {
            ...resolveRouteGroupContext(declaration),
            domain,
        };
        const security: RouteSecurityContract = {
            authentication,
            signature: { kind: 'not_signed' }
        };
        const defaults: RouteDefaults = { kind: 'route_defaults', items: { kind: 'empty' } };
        const transport: RouteTransportContract = {
            kind: 'route_transport',
            httpOnly: { kind: 'truth_value', value: false },
            httpsOnly: { kind: 'truth_value', value: false }
        };
        const sourceFile = SemanticValueFactory.sourceFilePath(route.provenance.sourceFile.value.value);
        const sourceFilePath = route.provenance.sourceFile.value.value.split(path.sep).join('/');
        const fileContext = routeSourceFileContextKnowledge(sourceFilePath);
        const producerInput: RouteProducerInput = {
            declaration,
            source,
            identity: {
                kind: 'route_identity',
                key: route.identity.coordinates.name,
                declaredName: { kind: 'none' },
                method,
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
            provenance: {
                source: sourceFile,
                span: source,
                fileContext
            }
        };
        return routeProducer.produce(producerInput);
    }

}

function routeMethodsToList(methods: readonly Exclude<RouteMethod, { readonly kind: 'match' }>[], index = 0): RouteMethods['items'] {
    return relationGate(
        index >= methods.length,
        () => ({ kind: 'empty' as const }),
        () => ({ kind: 'cons' as const, head: methods[index], tail: routeMethodsToList(methods, index + 1) }),
    );
}

function relationFirstControllerAction(
    controllerMap: RelationOption<RelationIndex<string, RelationIndex<string, ControllerActionInfo>>>,
    controllerName: string,
    actionName: string,
): RelationOption<ControllerActionInfo> {
    return relationOptionFold(
        controllerMap,
        () => relationNone<ControllerActionInfo>(),
        registry => relationOptionFold(
            relationMapEntry(registry, controllerName),
            () => relationNone<ControllerActionInfo>(),
            actions => relationMapEntry(actions, actionName),
        ),
    );
}

function relationMapEntry<K, V>(source: RelationIndex<K, V>, key: K): RelationOption<V> { return relationIndexLookup(source, key); }

function refineImplicitModelBindings(
    parameters: readonly RouteParameter[],
    action: RelationOption<ControllerActionInfo>,
    modelNames: RelationMembership<string>,
): readonly RouteParameter[] {
    const actionParameters = relationOptionFold(
        action,
        () => [] as RelationIndex<string, string>,
        value => relationFold(
            value.parameters,
            [] as RelationIndex<string, string>,
            (accumulator, parameter) => relationOptionFold(
                namedParameterType(parameter.type),
                () => accumulator,
                type => relationIndexAdd(accumulator, parameter.name, type),
            ),
        ),
    );
    return Object.freeze(relationProject(parameters, parameter => relationGate(
        relationEqual(parameter.location.kind, 'path'),
        () => {
            const typeOption = relationIndexLookup(actionParameters, parameter.name.value.value);
            return relationOptionFold(
                typeOption,
                () => parameter,
                value => {
                    const typeName = value;
                    const field = relationGate(
                        relationEqual(parameter.binding.kind, 'implicit_model'),
                        () => parameter.binding.field,
                        () => ({ kind: 'none' as const }),
                    );
                    const model = { kind: 'model_reference' as const, name: { kind: 'model_name' as const, value: { kind: 'string_value' as const, value: typeName } } };
                    return Object.freeze({
                        ...parameter,
                        type: { kind: 'model' as const, model },
                        binding: { kind: 'implicit_model' as const, model, field, scoped: { kind: 'truth_value' as const, value: false }, withTrashed: { kind: 'truth_value' as const, value: false } },
                    });
                },
            );
        },
        () => parameter,
    )));
}

function namedParameterType(type: import('../lexer/controllerAstTypes').PhpParameterTypeAst): RelationOption<string> {
    return relationGate(
        relationEqual(type.kind, 'named'),
        () => relationSome((type as Extract<typeof type, { kind: 'named' }>).name),
        () => relationGate(
            relationEqual(type.kind, 'nullable'),
            () => namedParameterType((type as Extract<typeof type, { kind: 'nullable' }>).inner),
            () => relationNone<string>(),
        ),
    );
}
