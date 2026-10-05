/**
 * Route producer semantic relation boundary.
 *
 * This module projects RouteEmission directly into canonical route contracts
 * and RouteProducerInput. No legacy route descriptor is constructed here;
 * the only RouteAst constructor remains routeProducer.produce().
 */

import path from "path";
import { relationFoldRight } from '../../../semantic/foundation/relationalSequence';
import { relationGate, relationOptionFold, relationAny, relationEqual, relationVariantFold, relationFirstOption, relationNone, relationSome, relationFold, relationLookup, relationProject, type RelationOption } from '../../../semantic/foundation/relationalSequence';
import { relationIndexLookup, relationIndexAdd, type RelationIndex, type RelationMembership } from '../../../semantic/foundation/relationMembership';
import { HttpMethod, RouteHandlerKind, type RouteParameter } from '../../../types/route';
import type { RouteDeclarationAst } from '../lexer/routeAst';
import type { RouteMethod, RouteTarget, RouteAuthentication, RouteSpecialKind, RouteGroupContext, RouteSecurityContract, RouteDefaults, RouteTransportContract, RouteDomain, RouteProducerInput, RouteFileContext } from '../../../types/upstream/route';
import { RouteBoundaryContractFactory, type RouteBoundaryOptions } from '../resolvers';
import type { RouteEmission } from './route-scanner/routeEmitter';
import type { RouteMethods, RouteParameters, Sequence } from '../../../types/upstream/collections';
import type { RouteDeclarationEvidence } from '../../../types/upstream/routeDeclarationEvidence';
import type { EndpointRequestBinding, EndpointResponseBinding, EndpointResponseStatus } from '../../../types/upstream/endpointBindings';
import type { ResponseCardinality } from '../../../types/upstream/response';
import { matchRouteHandler } from '../../../types/domain/routeHandlers';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { createRequestName, createMiddlewareName, createActionName } from '../../../types/upstream/names';
import { routeMethodSemanticKind, routeDeclarationSemanticKind, routeSourceFileContextKnowledge, routeDeclarationFlow } from '../lexer/routeAst/routeDataFlow';
import { ControllerActionInfo } from '../descriptors/requestDescriptors';
import type { ModelReference } from '../../../types/upstream/semanticReferences';
import { buildRouteHandler } from '../descriptors/request/controllerActionTypes';
import { emptyRouteSchemaPayload } from '../../../types/domain/validationRules';
import { resolveRouteGroupContextFromFact } from '../descriptors/route/routeGroupContextResolver';

const ROUTE_HTTP_METHODS: readonly (readonly [string, HttpMethod])[] = Object.freeze([
    [HttpMethod.GET, HttpMethod.GET], [HttpMethod.POST, HttpMethod.POST],
    [HttpMethod.PUT, HttpMethod.PUT], [HttpMethod.PATCH, HttpMethod.PATCH],
    [HttpMethod.DELETE, HttpMethod.DELETE], [HttpMethod.OPTIONS, HttpMethod.OPTIONS],
    [HttpMethod.HEAD, HttpMethod.HEAD],
]);

const ROUTE_AST_METHODS: readonly (readonly [HttpMethod, Exclude<RouteMethod, { readonly kind: 'match' }>])[] = Object.freeze([
    [HttpMethod.GET, { kind: 'get' }], [HttpMethod.POST, { kind: 'post' }],
    [HttpMethod.PUT, { kind: 'put' }], [HttpMethod.PATCH, { kind: 'patch' }],
    [HttpMethod.DELETE, { kind: 'delete' }], [HttpMethod.OPTIONS, { kind: 'options' }],
    [HttpMethod.HEAD, { kind: 'head' }],
]);

const routeDeclarationEvidenceFromAst = (declaration: RouteDeclarationAst): RouteDeclarationEvidence => Object.freeze({
    method: declaration.method,
    targetMethods: declaration.targetMethods,
    path: declaration.path,
    target: relationVariantFold(
        declaration.target,
        'controller_action',
        value => ({ kind: 'controller_action' as const, controller: value.controller.value, action: value.action.value }),
        residual => relationVariantFold(
            residual,
            'controller_invokable',
            value => ({ kind: 'controller_invokable' as const, controller: value.controller.value }),
            residualTarget => relationVariantFold(
                residualTarget,
                'closure',
                value => ({ kind: 'closure' as const, action: value.action.value, returns: value.returns }),
                value => ({ kind: 'unsupported' as const, reason: value.reason }),
            ),
        ),
    ),
    bindings: relationProject(declaration.bindings, value => ({ parameter: value.parameter, customKey: value.customKey })),
    prefix: declaration.prefix,
    middleware: declaration.middleware,
    routeMiddleware: declaration.routeMiddleware,
    resourceMiddleware: declaration.resourceMiddleware,
    resourceMiddlewareExclusions: declaration.resourceMiddlewareExclusions,
    groupNamePrefix: declaration.groupNamePrefix,
    groupController: declaration.groupController,
    groupDomain: declaration.groupDomain,
    groupBindingScope: declaration.groupBindingScope,
    missingHandler: declaration.missingHandler,
    withTrashed: declaration.withTrashed,
    routeConstraints: relationProject(declaration.routeConstraints, value => ({ method: value.method, parameter: value.parameter, argument: value.argument })),
    groupConstraints: relationProject(declaration.groupConstraints, value => ({ method: value.method, parameter: value.parameter, argument: value.argument })),
    source: { type: declaration.source.type, value: declaration.source.value, line: declaration.source.line, startOffset: declaration.source.startOffset, endOffset: declaration.source.endOffset },
    end: { type: declaration.end.type, value: declaration.end.value, line: declaration.end.line, startOffset: declaration.end.startOffset, endOffset: declaration.end.endOffset },
});

const resolveRouteHttpMethod = (rawMethod: string): HttpMethod => relationOptionFold(
    relationLookup(ROUTE_HTTP_METHODS, rawMethod.toUpperCase()),
    () => { throw Error(`Unsupported HTTP method in Route::match(): ${rawMethod}`); },
    value => value,
);

const toRouteMethod = (httpMethod: HttpMethod): Exclude<RouteMethod, { readonly kind: 'match' }> => relationOptionFold(
    relationLookup(ROUTE_AST_METHODS, httpMethod),
    () => ({ kind: 'get' as const }),
    value => value,
);

const routeResourceMiddlewareRules = (declaration: RouteDeclarationAst): Sequence<import('../../../types/upstream/route').RouteResourceMiddlewareRule> => {
    const rules = [
        ...declaration.resourceMiddleware.map(entry => ({ entry, exclude: false })),
        ...declaration.resourceMiddlewareExclusions.map(entry => ({ entry, exclude: true })),
    ];
    const toSequence = <T>(values: readonly T[]): Sequence<T> =>
        relationFoldRight(values, { kind: 'empty' } as Sequence<T>, (head, tail): Sequence<T> => ({ kind: 'cons', head, tail }));
    const resourceScope = (entry: RouteDeclarationAst['resourceMiddleware'][number]): import('../../../types/upstream/routeMiddleware').RouteMiddlewareScope =>
        entry.scope.kind === 'all'
            ? { kind: 'all' }
            : entry.scope.kind === 'only'
                ? { kind: 'only', actions: Object.freeze(entry.scope.actions.map(createActionName)) }
                : { kind: 'except', actions: Object.freeze(entry.scope.actions.map(createActionName)) };
    return toSequence(rules.map(({ entry, exclude }) => Object.freeze({
        kind: 'route_resource_middleware' as const,
        scope: resourceScope(entry),
        include: exclude ? { kind: 'empty' as const } : toSequence(entry.middleware.map(createMiddlewareName)),
        exclude: exclude ? toSequence(entry.middleware.map(createMiddlewareName)) : { kind: 'empty' as const },
    })));
};

export const routeBoundaryContractFromRouteEmission = (
    emission: RouteEmission,
): import('../../../types/upstream/route').RouteBoundaryContract => {
    const boundaryOptions: RouteBoundaryOptions = relationVariantFold(
            emission.target,
            'controller_action',
            residual => relationVariantFold(
                residual,
                'controller_reference',
                value => ({
                    origin: 'closure',
                    method: emission.method,
                    path: emission.path.path,
                    actionName: value.actionName,
                    action: SemanticValueFactory.actionName(`closure@${value.actionName.value.value}`),
                    controllerName: SemanticValueFactory.controllerName(''),
                    sourceFile: emission.sourceFile,
                    sourceLine: emission.sourceLine,
                    response: value.response,
                    runtimeReturn: { kind: 'none' as const },
                    semanticReturn: value.semanticReturn,
                    schema: emptyRouteSchemaPayload(),
                    binding: {
                        operation: { controllerName: SemanticValueFactory.controllerName(''), name: SemanticValueFactory.actionName(`closure@${value.actionName.value.value}`), handler: Object.freeze({
                            kind: RouteHandlerKind.Closure,
                            actionName: value.actionName,
                            target: SemanticValueFactory.className(`closure@${value.actionName.value.value}`),
                        }) },
                        request: { kind: 'no_request' as const },
                    },
                    resourceName: emission.resourceName,
                    auth: emission.auth,
                    middleware: emission.middleware,
                    parameters: emission.path.parameters,
                    runtimePath: emission.path.runtimePath,
                    constantKey: SemanticValueFactory.propertyName(emission.path.constantKey),
                }),
                value => ({
                    origin: 'controller_reference',
                    method: emission.method,
                    path: emission.path.path,
                    controllerName: value.controllerName,
                    actionName: value.actionName,
                    action: value.actionName,
                    sourceFile: emission.sourceFile,
                    sourceLine: emission.sourceLine,
                    response: value.response,
                    runtimeReturn: { kind: 'none' as const },
                    semanticReturn: { kind: 'absent' as const },
                    schema: emptyRouteSchemaPayload(),
                    binding: {
                        operation: { controllerName: value.controllerName, name: value.actionName, handler: buildRouteHandler(value.controllerName, value.actionName) },
                        request: { kind: 'no_request' as const },
                    },
                    resourceName: emission.resourceName,
                    auth: emission.auth,
                    middleware: emission.middleware,
                    parameters: emission.path.parameters,
                    runtimePath: emission.path.runtimePath,
                    constantKey: SemanticValueFactory.propertyName(emission.path.constantKey),
                }),
            ),
            value => ({
                origin: 'controller_action',
                method: emission.method,
                path: emission.path.path,
                resourceName: emission.resourceName,
                controllerName: value.action.controllerName,
                actionName: value.action.actionName,
                action: value.action.actionName,
                sourceFile: value.action.sourceFile,
                sourceLine: value.action.sourceLine,
                response: value.action.response,
                runtimeReturn: value.action.runtimeReturn,
                semanticReturn: value.action.semanticReturn,
                schema: value.action.schema,
                binding: {
                    operation: { controllerName: value.action.controllerName, name: value.action.actionName, handler: value.action.handler },
                    request: relationGate(
                        relationEqual(value.action.request.kind, 'form_request'),
                        () => ({
                            kind: 'form_request' as const,
                            identity: { source: value.action.request.source.identity, resource: emission.resourceName },
                            source: value.action.request.source,
                        }),
                        () => relationGate(
                            relationEqual(value.action.request.kind, 'framework_request'),
                            () => ({ kind: 'framework_request' as const, type: value.action.request.type }),
                            () => ({ kind: 'no_request' as const }),
                        ),
                    ),
                },
                auth: emission.auth,
                middleware: emission.middleware,
                parameters: emission.path.parameters,
                runtimePath: emission.path.runtimePath,
                constantKey: SemanticValueFactory.propertyName(emission.path.constantKey),
                errorResponses: value.action.errorResponses,
            }),
    );
    return RouteBoundaryContractFactory.create(boundaryOptions);
};

export const routeSemanticFlowFromRouteBoundary = (
    boundary: import('../../../types/upstream/route').RouteBoundaryContract,
): import('../../../types/domain/routes').RouteSemanticFlow => Object.freeze({
    identity: boundary.identity,
    binding: boundary.binding,
    capability: boundary.capability,
    provenance: boundary.provenance,
    contract: boundary.contract,
});

export const routeProducerInputFromRouteBoundary = (
        route: import('../../../types/upstream/route').RouteBoundaryContract,
        declaration: RouteDeclarationAst,
        source: import("../../../types/upstream/provenance").SourceSpan,
        existingControllerMap: RelationOption<RelationIndex<string, RelationIndex<string, ControllerActionInfo>>> = relationNone()
    ): RouteProducerInput => {
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
            all_methods: () => ({ kind: 'any' } as const),
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
        const request: EndpointRequestBinding = relationVariantFold(
            route.binding.request,
            'form_request',
            rest => relationVariantFold(
                rest,
                'framework_request',
                () => ({ kind: 'no_input' as const }),
                value => ({ kind: 'framework_request' as const, type: value.type }),
            ),
            value => ({ kind: 'form_request' as const, request: { kind: 'request_reference' as const, name: createRequestName(value.identity.source.requestClass.value.value) } }),
        );
        const authentication: RouteAuthentication = relationGate(
            route.capability.auth.value,
            () => ({ kind: 'authenticated', scheme: route.capability.security.scheme, guard: relationVariantFold(
                route.capability.security.guards,
                'cons',
                () => ({ kind: 'none' as const }),
                value => ({ kind: 'some' as const, value: value.head }),
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
        const semanticParameters = refineImplicitModelBindings(route.identity.parameters.all, controllerAction);
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
        const specialKind = routeDeclarationSemanticKind(declaration.method);
        const specialResource = () => ({
            kind: specialKind as Extract<RouteSpecialKind['kind'], 'resource' | 'api_resource' | 'singleton' | 'api_singleton'>,
            resource: {
                kind: 'route_resource_registration',
                name: route.identity.domain.resource,
                controller: matchRouteHandler(route.binding.operation.handler, {
                    controllerAction: handler => ({
                        kind: 'conventional_controller' as const,
                        className: handler.controllerName,
                    }),
                    invokableController: handler => ({
                        kind: 'conventional_controller' as const,
                        className: handler.controllerName,
                    }),
                    closure: () => ({ kind: 'framework_convention' as const }),
                }),
                only: { kind: 'empty' },
                except: { kind: 'empty' },
                shallow: { kind: 'truth_value', value: false },
                scoped: { kind: 'truth_value', value: false },
                parameters: { kind: 'empty' },
                creatable: { kind: 'truth_value', value: true },
                destroyable: { kind: 'truth_value', value: true },
                middleware: routeResourceMiddlewareRules(declaration),
            },
        });
        const special: RouteSpecialKind = relationGate(
            relationEqual(specialKind, 'resource'),
            () => specialResource() as RouteSpecialKind,
            () => relationGate(
                relationEqual(specialKind, 'api_resource'),
                () => specialResource() as RouteSpecialKind,
                () => relationGate(
                    relationEqual(specialKind, 'singleton'),
                    () => specialResource() as RouteSpecialKind,
                    () => relationGate(
                        relationEqual(specialKind, 'api_singleton'),
                        () => specialResource() as RouteSpecialKind,
                        () => ({ kind: 'standard' as const }),
                    ),
                ),
            ),
        );
        const declarationFlow = routeDeclarationFlow(declaration);
        const group: RouteGroupContext = {
            ...resolveRouteGroupContextFromFact(declarationFlow.group.value),
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
        const fileContext: RouteFileContext = routeSourceFileContextKnowledge(sourceFilePath);
        const producerInput: RouteProducerInput = {
            declaration: routeDeclarationEvidenceFromAst(declaration),
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
        return producerInput;
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
 ): readonly RouteParameter[] {
    const actionParameters = relationOptionFold(
        action,
        () => [] as RelationIndex<string, ModelReference>,
        value => relationFold(
            value.parameters,
            [] as RelationIndex<string, ModelReference>,
            (accumulator, parameter) => relationOptionFold(
                controllerModelReference(parameter.semantic),
                () => accumulator,
                model => relationIndexAdd(accumulator, parameter.name, model),
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
                model => {
                    const field = relationVariantFold(
                        parameter.binding,
                        'implicit_model',
                        () => ({ kind: 'none' as const }),
                        value => value.field,
                    );
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

function controllerModelReference(semantic: import('../../../types/upstream/controller').ControllerVariableSemantic): RelationOption<ModelReference> {
    return relationGate(
        relationEqual(semantic.kind, 'model_origin'),
        () => {
            const modelOrigin = semantic as Extract<typeof semantic, { readonly kind: 'model_origin' }>;
            return relationGate(
                relationEqual(modelOrigin.origin.kind, 'model_class'),
                () => relationSome({
                    kind: 'model_reference' as const,
                    name: modelOrigin.origin.name as Extract<typeof modelOrigin.origin, { readonly kind: 'model_class' }>['name'],
                }),
                () => relationNone<ModelReference>(),
            );
        },
        () => relationNone<ModelReference>(),
    );
}

