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
    RateLimitDescriptor,
    RouteSecurityDescriptor,
    RoutePolicyDescriptor,
    RouteCacheInvalidationDescriptor,
    RouteExecutionSignature,
    ResourceAssignment,
    EndpointContract,
    RouteSchemaPayload,
    RouteHandlerDescriptor,
    FormRequestDescriptor,
    RouteIdentityContract,
    RouteBindingContract,
    RouteCapabilityContract,
    RouteProvenanceContract
} from "../../../../types/route";
import type { ScannedRouteConstructorInput } from "./routeContracts";

export abstract class ScannedRouteFields implements ParsedRoute {
    public readonly identity: RouteIdentityContract;
    public readonly binding: RouteBindingContract;
    public readonly capability: RouteCapabilityContract;
    public readonly provenance: RouteProvenanceContract;
    public readonly contract: EndpointContract;
    public readonly name: string;
    public readonly method: HttpMethod;
    public readonly path: string;
    public readonly resourceName: string;
    public readonly domain: string;
    public readonly action: string;
    public readonly handler: RouteHandlerDescriptor;
    public readonly formRequests: readonly FormRequestDescriptor[];
    public readonly actionName: string;
    public readonly groupName: string;
    public readonly crudRole: CrudRole;
    public readonly runtimePath: string;
    public readonly responseTypeName: string;
    public readonly actionKind: RouteActionKind;
    public readonly isMutating: boolean;
    public readonly hookKind: RouteHookKind;
    public readonly invalidation: RouteCacheInvalidationDescriptor;
    public readonly executionSignature: RouteExecutionSignature;
    public readonly requestContentType: RequestContentType;
    public readonly auth: boolean;
    public readonly security: RouteSecurityDescriptor;
    public readonly middleware: readonly string[];
    public readonly policies: readonly RoutePolicyDescriptor[];
    public readonly rateLimit: RateLimitDescriptor | null;
    public readonly parameters: readonly RouteParameter[];
    public readonly pathParameters: readonly RouteParameter[];
    public readonly queryParameters: readonly RouteQueryParameter[];
    public readonly response: ResponseDescriptor;
    public readonly errorResponses: readonly HttpErrorResponseDescriptor[];
    public readonly sourceFile: string;
    public readonly sourceLine: number;
    public readonly schema: RouteSchemaPayload;
    public readonly assignments: readonly ResourceAssignment[];
    public readonly uri: string;
    public readonly controllerName: string;

    protected constructor(params: ScannedRouteConstructorInput) {
        const { identity, binding, capability, provenance, contract } = params;
        this.identity = identity;
        this.binding = binding;
        this.capability = capability;
        this.provenance = provenance;
        this.contract = contract;
        this.name = identity.name;
        this.method = identity.method;
        this.path = identity.path;
        this.resourceName = identity.resourceName;
        this.domain = identity.domain;
        this.groupName = identity.groupName;
        this.parameters = identity.parameters.all;
        this.pathParameters = identity.parameters.path;
        this.queryParameters = identity.parameters.query;
        this.handler = binding.handler;
        this.action = binding.action;
        this.actionName = binding.actionName;
        this.controllerName = binding.controllerName;
        this.schema = binding.schema;
        this.response = binding.response;
        this.responseTypeName = binding.responseTypeName;
        this.formRequests = binding.formRequests;
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
        this.isMutating = capability.isMutating;
        this.requestContentType = capability.requestContentType;
        this.executionSignature = capability.executionSignature;
        this.errorResponses = capability.errorResponses;
        this.sourceFile = provenance.sourceFile;
        this.sourceLine = provenance.sourceLine;
        this.uri = provenance.uri;
    }
}
