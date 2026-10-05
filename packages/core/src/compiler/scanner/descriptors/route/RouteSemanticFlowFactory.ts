/**
 * RouteSemanticFlowFactory.ts
 *
 * Declarative route semantic witness catalog. The exported value is a frozen
 * relation-oriented constructor catalog; route instances are structural data,
 * never class instances.
 */

import { relationOptionFold, relationRefine, relationOptionalFold, relationGate, relationFoldRight } from "../../../../semantic/foundation/relationalSequence";
import { relationEqual } from "../../../../semantic/foundation/semanticRelations";
import {
    ScannedEndpointContract,
    VoidResponseDescriptor,
    ResourceResponseDescriptor,
    RouteHandlerKind,
    RouteSemanticFlowCacheInvalidationDescriptor
} from "../../../../types/route";
import type {
    RouteIdentityContract, RouteBindingContract, RouteCapabilityContract, RouteProvenanceContract,
    HttpMethod, RouteParameter, RouteQueryParameter, RouteCacheInvalidationDescriptor, ResponseDescriptor
} from "../../../../types/route";
import { RouteBoundaryContractFactory, type RouteBoundaryOptions } from "../../resolvers";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import { emptyRouteSchemaPayload } from "../../../../types/domain/validationRules";
import { buildRouteHandler } from "../request/controllerActionTypes";
import type { ControllerActionInfo } from "../requestDescriptors";
import type { ControllerReturnSemantic } from "../../../../types/upstream/controller";
import type { ActionName, ControllerName, DomainTypeName, ResourceName, RoutePath, SourceFile, PropertyName } from "../../../../types/upstream/names";
import type { RouteRequestBinding } from "../../../../types/domain/request";
import type { RouteSemanticFlowCompleteContracts, RouteSemanticFlowConstructorInput } from "./routeContracts";
import { createRouteSemanticFlowFields, type RouteSemanticFlowFields } from "./routeDeclarations";


export type RouteSubcontracts = {
    readonly identity: RouteIdentityContract;
    readonly binding: RouteBindingContract;
    readonly capability: RouteCapabilityContract;
    readonly provenance: RouteProvenanceContract;
};

export type RouteSemanticFlowFactory = RouteSemanticFlowFields & {
    readonly projectToHookSource: () => Iterable<string>;
    readonly withInvalidation: (invalidation: RouteCacheInvalidationDescriptor) => RouteSemanticFlowFactory;
};

const isCompleteRouteContracts = (
    params: RouteSemanticFlowCompleteContracts | RouteSubcontracts
): params is RouteSemanticFlowCompleteContracts => Object.prototype.hasOwnProperty.call(params, 'contract');

const projectRoute = (params: RouteSemanticFlowConstructorInput): RouteSemanticFlowFactory => Object.freeze({
    ...createRouteSemanticFlowFields(params),
    projectToHookSource: function* () {
        yield* projectRouteToHookSource(createRouteSemanticFlowFields(params));
    },
    withInvalidation: (invalidation: RouteCacheInvalidationDescriptor) => withRouteInvalidation(createRouteSemanticFlowFields(params), invalidation)
});

type ControllerActionRouteOptions = {
    readonly method: HttpMethod; readonly path: RoutePath; readonly action: ControllerActionInfo;
    readonly domain?: DomainTypeName; readonly resourceName: ResourceName; readonly auth?: boolean;
    readonly middleware?: readonly PropertyName[]; readonly parameters?: readonly RouteParameter[];
    readonly pathParameters?: readonly RouteParameter[]; readonly queryParameters?: readonly RouteQueryParameter[];
    readonly invalidation?: RouteCacheInvalidationDescriptor;
};

type ClosureRouteOptions = {
    readonly method: HttpMethod; readonly path: RoutePath; readonly actionName: ActionName; readonly sourceFile: SourceFile;
    readonly sourceLine: number; readonly response?: ResponseDescriptor; readonly semanticReturn: ControllerReturnSemantic;
    readonly domain?: DomainTypeName; readonly resourceName?: ResourceName; readonly auth?: boolean;
    readonly middleware?: readonly PropertyName[]; readonly parameters?: readonly RouteParameter[];
    readonly pathParameters?: readonly RouteParameter[]; readonly queryParameters?: readonly RouteQueryParameter[];
    readonly invalidation?: RouteCacheInvalidationDescriptor;
};

type ControllerReferenceRouteOptions = {
    readonly method: HttpMethod; readonly path: RoutePath; readonly controllerName: ControllerName; readonly actionName: ActionName;
    readonly domain?: DomainTypeName; readonly resourceName?: ResourceName; readonly sourceFile: SourceFile; readonly sourceLine: number;
    readonly response?: ResponseDescriptor; readonly request?: RouteRequestBinding; readonly schema?: import("../../../../types/route").RouteSchemaPayload;
    readonly auth?: boolean; readonly middleware?: readonly PropertyName[]; readonly parameters?: readonly RouteParameter[];
    readonly pathParameters?: readonly RouteParameter[]; readonly queryParameters?: readonly RouteQueryParameter[];
    readonly invalidation?: RouteCacheInvalidationDescriptor;
};

type SyntheticRouteOptions = {
    readonly method?: HttpMethod; readonly path?: RoutePath; readonly domain?: DomainTypeName; readonly resourceName?: ResourceName;
    readonly actionName?: ActionName; readonly response?: ResponseDescriptor; readonly auth?: boolean;
    readonly middleware?: readonly PropertyName[]; readonly parameters?: readonly RouteParameter[];
    readonly invalidation?: RouteCacheInvalidationDescriptor; readonly sourceFile?: SourceFile; readonly sourceLine?: number;
};

function bindControllerRequest(request: import('../request/controllerActionContract').ControllerRequestBinding, resourceName: ResourceName): RouteRequestBinding {
    return relationGate(relationEqual(request.kind, 'form_request'),
        () => ({ kind: 'form_request', identity: { source: request.source.identity, resource: resourceName }, source: request.source }),
        () => relationGate(relationEqual(request.kind, 'framework_request'),
            () => ({ kind: 'framework_request', type: request.type }),
            () => ({ kind: 'no_request' })));
}

const createRouteFromSubcontracts = (subcontracts: RouteSubcontracts): RouteSemanticFlowFactory => createRouteSemanticFlow({
    ...subcontracts,
    contract: ScannedEndpointContract.fromSubcontracts(subcontracts)
});

const createRouteFromSparse = (params: RouteBoundaryOptions): RouteSemanticFlowFactory =>
    createRouteFromSubcontracts(RouteBoundaryContractFactory.create(params));

const sequenceFromArray = <T>(items: readonly T[]): import("../../../../types/upstream/collections").Sequence<T> =>
    relationFoldRight(items, { kind: 'empty' }, (head, tail) => ({ kind: 'cons', head, tail }));

function createRouteFromControllerAction(options: ControllerActionRouteOptions): RouteSemanticFlowFactory {
    const { method, path, domain, resourceName, action, auth = false, middleware = [], parameters = [], pathParameters, queryParameters = [], invalidation } = options;
    return createRouteFromSparse({ origin: 'controller_action', method, path, domain, resourceName,
        controllerName: action.controllerName, actionName: action.actionName, action: action.actionName, handler: action.handler,
        response: action.response, sourceFile: action.sourceFile, sourceLine: action.sourceLine,
        request: bindControllerRequest(action.request, resourceName), runtimeReturn: action.runtimeReturn, semanticReturn: action.semanticReturn,
        schema: action.schema, auth, middleware, parameters, pathParameters, queryParameters, invalidation, errorResponses: action.errorResponses });
}

function createRouteFromClosure(options: ClosureRouteOptions): RouteSemanticFlowFactory {
    const { method, path, domain, resourceName, actionName, sourceFile, sourceLine, response, semanticReturn, auth = false,
        middleware = [], parameters = [], pathParameters, queryParameters = [], invalidation } = options;
    const resolvedResponse = relationOptionalFold(response, () => VoidResponseDescriptor.create(), value => value);
    return createRouteFromSparse({ origin: 'closure', method, path, domain, resourceName, actionName,
        action: SemanticValueFactory.actionName(`closure@${actionName.value.value}`), controllerName: SemanticValueFactory.controllerName(''),
        handler: Object.freeze({ kind: RouteHandlerKind.Closure, actionName, target: SemanticValueFactory.className(`closure@${actionName.value.value}`) }),
        sourceFile, sourceLine, response: resolvedResponse, request: { kind: 'no_request' }, runtimeReturn: { kind: 'none' }, semanticReturn,
        schema: emptyRouteSchemaPayload(), auth, middleware, parameters, pathParameters, queryParameters, invalidation });
}

function createRouteFromControllerReference(options: ControllerReferenceRouteOptions): RouteSemanticFlowFactory {
    const { method, path, controllerName, actionName, domain, resourceName, sourceFile, sourceLine,
        response = VoidResponseDescriptor.create(), request, schema = emptyRouteSchemaPayload(), auth = false,
        middleware = [], parameters = [], pathParameters, queryParameters = [], invalidation } = options;
    return createRouteFromSparse({ origin: 'controller_reference', method, path, domain, resourceName, controllerName, actionName,
        action: actionName, handler: buildRouteHandler(controllerName, actionName), response, sourceFile, sourceLine,
        request: relationOptionalFold(request, () => ({ kind: 'no_request' as const }), value => value), runtimeReturn: { kind: 'none' },
        semanticReturn: { kind: 'absent' }, schema, auth, middleware, parameters, pathParameters, queryParameters, invalidation });
}

function createSyntheticRoute(options: SyntheticRouteOptions = {}): RouteSemanticFlowFactory {
    const { method = 'GET', path = SemanticValueFactory.routePath('/synthetic'), domain = SemanticValueFactory.domainName('Synthetic'),
        resourceName = SemanticValueFactory.resourceName('Synthetic'), actionName = SemanticValueFactory.actionName('index'), response,
        auth = false, middleware = [], parameters = [], invalidation, sourceFile, sourceLine } = options;
    return createRouteFromSparse({ origin: 'synthetic', method, path, domain, resourceName, actionName,
        action: SemanticValueFactory.actionName(`synthetic@${actionName.value.value}`), controllerName: SemanticValueFactory.controllerName('SyntheticController'),
        handler: Object.freeze({ kind: RouteHandlerKind.ControllerAction, controllerName: SemanticValueFactory.className('SyntheticController'), actionName,
            target: SemanticValueFactory.className(`synthetic@${actionName.value.value}`) }),
        sourceFile: relationOptionalFold(sourceFile, () => SemanticValueFactory.sourceFilePath('<synthetic>'), value => value),
        sourceLine: relationOptionalFold(sourceLine, () => 0, value => value),
        response: relationOptionalFold(response, () => ResourceResponseDescriptor.single(SemanticValueFactory.resourceName(`${resourceName.value.value}Resource`)), value => value),
        request: { kind: 'no_request' }, runtimeReturn: { kind: 'none' }, semanticReturn: { kind: 'absent' }, schema: emptyRouteSchemaPayload(),
        auth, middleware, parameters, invalidation: relationOptionalFold(invalidation, () => RouteSemanticFlowCacheInvalidationDescriptor.none(), value => value) });
}

const withRouteInvalidation = (route: RouteSemanticFlowFields, invalidation: RouteCacheInvalidationDescriptor): RouteSemanticFlowFactory => {
    const updatedCapability: RouteCapabilityContract = Object.freeze({ ...route.capability, invalidation: Object.freeze({
        targets: sequenceFromArray(invalidation.targets),
        queryKeyExpressions: sequenceFromArray(invalidation.queryKeyExpressions)
    }) });
    return createRouteSemanticFlow({ identity: route.identity, binding: route.binding, capability: updatedCapability, provenance: route.provenance,
        contract: ScannedEndpointContract.fromSubcontracts({ identity: route.identity, binding: route.binding, capability: updatedCapability, provenance: route.provenance }) });
};

const projectRouteToHookSource = function*(route: RouteSemanticFlowFields): Iterable<string> {
    yield `// Hook for ${route.identity.coordinates.name} (${route.identity.coordinates.method} ${route.identity.coordinates.path})`;
    yield `// Group: ${route.identity.domain.group}, Role: ${route.capability.crudRole}, Kind: ${route.capability.hookKind}`;
};

export const createRouteSemanticFlow = (
    params: RouteSemanticFlowCompleteContracts | RouteSubcontracts
): RouteSemanticFlowFactory => relationOptionFold(
    relationRefine(params, isCompleteRouteContracts),
    () => createRouteFromSubcontracts(params),
    complete => projectRoute(complete),
);

export const RouteSemanticFlowFactory = Object.freeze({
    create: createRouteSemanticFlow,
    fromSparse: (params: RouteBoundaryOptions) => createRouteFromSparse(params),
    fromContracts: (contracts: RouteSemanticFlowCompleteContracts) => createRouteSemanticFlow(contracts),
    fromSubcontracts: (subcontracts: RouteSubcontracts) => createRouteSemanticFlow(subcontracts),
    fromControllerAction: (params: ControllerActionRouteOptions) => createRouteFromControllerAction(params),
    fromClosure: (params: ClosureRouteOptions) => createRouteFromClosure(params),
    fromControllerReference: (params: ControllerReferenceRouteOptions) => createRouteFromControllerReference(params),
    synthetic: (params?: SyntheticRouteOptions) => createSyntheticRoute(params)
});
