/**
 * routeDeclarations.ts
 *
 * Complete field storage for ScannedRouteDescriptor.
 * The constructor is the scanner origin boundary: a route can only become
 * a descriptor after all semantic sub-contracts have been resolved.
 */

import type {
    ParsedRoute,
    HttpMethod,
    RouteActionKind,
    CrudRole,
    RouteHookKind,
    RequestContentType,
    RouteParameter,
    RouteQueryParameter,
    ResponseDescriptor,
    HttpErrorResponseDescriptor,
    RouteCacheInvalidationDescriptor,
    RouteExecutionSignature,
    ResourceAssignment,
    EndpointContract,
    RouteSchemaPayload,
    RouteHandlerDescriptor,
    RouteIdentityContract,
    RouteBindingContract,
    RouteCapabilityContract,
    RouteProvenanceContract
} from "../../../../types/route";
import type { RouteRateLimit, RouteSecurityDescriptor } from "../../../../types/upstream/route";
import type { RouteMiddlewares } from "../../../../types/upstream/collections";
import type { ControllerName } from "../../../../types/upstream/names";
import { ROUTE_ACTION_KIND_REGISTRY } from "../../../../types/route";
import type { ScannedRouteConstructorInput } from "./routeContracts";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";

export abstract class ScannedRouteFields implements ParsedRoute {
    public readonly identity: RouteIdentityContract;
    public readonly binding: RouteBindingContract;
    public readonly capability: RouteCapabilityContract;
    public readonly provenance: RouteProvenanceContract;
    public readonly contract: EndpointContract;
    public readonly name: RouteIdentityContract["coordinates"]["name"];
    public readonly method: HttpMethod;
    public readonly path: RouteIdentityContract["coordinates"]["path"];
    public readonly resourceName: RouteIdentityContract["domain"]["resource"];
    public readonly domain: RouteIdentityContract["domain"];
    public readonly action: RouteBindingContract["operation"]["name"];
    public readonly handler: RouteHandlerDescriptor;
    public readonly actionName: RouteBindingContract["operation"]["name"];
    public readonly groupName: RouteIdentityContract["domain"]["group"];
    public readonly crudRole: CrudRole;
    public readonly runtimePath: RouteIdentityContract["coordinates"]["runtimePath"];
    public readonly responseTypeName: ReturnType<RouteBindingContract["response"]["responseTypeName"]>;
    public readonly actionKind: RouteActionKind;
    public get isMutating(): boolean {
        return ROUTE_ACTION_KIND_REGISTRY[this.actionKind].isMutating;
    }
    public readonly hookKind: RouteHookKind;
    public readonly invalidation: RouteCapabilityContract["invalidation"];
    public readonly executionSignature: RouteExecutionSignature;
    public readonly requestContentType: RequestContentType;
    public readonly auth: RouteCapabilityContract["auth"];
    public readonly security: RouteSecurityDescriptor;
    public readonly middleware: RouteMiddlewares;
    public readonly policies: RouteCapabilityContract["policies"];
    public readonly rateLimit: RouteRateLimit;
    public readonly parameters: RouteIdentityContract["parameters"]["all"];
    public readonly pathParameters: RouteIdentityContract["parameters"]["path"];
    public readonly queryParameters: RouteIdentityContract["parameters"]["query"];
    public readonly response: ResponseDescriptor;
    public readonly errorResponses: RouteCapabilityContract["errorResponses"];
    public readonly sourceFile: RouteProvenanceContract["sourceFile"];
    public readonly sourceLine: RouteProvenanceContract["sourceLine"];
    public readonly schema: RouteSchemaPayload;
    public readonly runtimeReturn: RouteBindingContract["runtimeReturn"];
    public readonly semanticReturn: RouteBindingContract["semanticReturn"];
    public readonly assignments: readonly ResourceAssignment[];
    public readonly uri: RouteProvenanceContract["uri"];
    public readonly controllerName: ControllerName;

    protected constructor(params: ScannedRouteConstructorInput) {
        const { identity, binding, capability, provenance, contract } = params;
        this.identity = identity;
        this.binding = binding;
        this.capability = capability;
        this.provenance = provenance;
        this.contract = contract;
        this.name = identity.coordinates.name;
        this.method = identity.coordinates.method;
        this.path = identity.coordinates.path;
        this.runtimePath = identity.coordinates.runtimePath;
        this.resourceName = identity.domain.resource;
        this.domain = identity.domain;
        this.groupName = identity.domain.group;
        this.parameters = identity.parameters.all;
        this.pathParameters = identity.parameters.path;
        this.queryParameters = identity.parameters.query;
        this.handler = binding.operation.handler;
        this.action = binding.operation.name;
        this.actionName = binding.operation.name;
        this.controllerName = binding.operation.handler.kind === "controller_action" || binding.operation.handler.kind === "invokable_controller" ? SemanticValueFactory.controllerName(binding.operation.handler.controllerName.value.value) : SemanticValueFactory.controllerName("");
        this.schema = binding.schema;
        this.runtimeReturn = binding.runtimeReturn;
        this.semanticReturn = binding.semanticReturn;
        this.response = binding.response;
        this.responseTypeName = binding.response.responseTypeName();
        this.assignments = binding.assignments;
        this.auth = capability.auth;
        this.security = capability.security;
        this.middleware = capability.middleware;
        this.policies = capability.policies;
        this.rateLimit = capability.rateLimit;
        this.invalidation = capability.invalidation;
        this.crudRole = capability.crudRole;
        this.hookKind = capability.hookKind;
        this.actionKind = capability.actionKind;
        this.requestContentType = capability.requestContentType;
        this.executionSignature = capability.executionSignature;
        this.errorResponses = capability.errorResponses;
        this.sourceFile = provenance.sourceFile;
        this.sourceLine = provenance.sourceLine;
        this.uri = provenance.uri;
    }
}
