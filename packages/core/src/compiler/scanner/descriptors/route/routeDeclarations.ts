/**
 * routeDeclarations.ts
 *
 * Base field definitions for ScannedRouteDescriptor.
 *
 * @module core/compiler/scanner/descriptors/route/routeDeclarations
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

export abstract class ScannedRouteFields implements ParsedRoute {
    public readonly identity!: RouteIdentityContract;
    public readonly binding!: RouteBindingContract;
    public readonly capability!: RouteCapabilityContract;
    public readonly provenance!: RouteProvenanceContract;
    public readonly contract!: EndpointContract;

    public readonly name!: string;
    public readonly method!: HttpMethod;
    public readonly path!: string;
    public readonly resourceName!: string;
    public readonly domain!: string;
    public readonly action!: string;
    public readonly handler!: RouteHandlerDescriptor;
    public readonly formRequests!: readonly FormRequestDescriptor[];
    public readonly actionName!: string;
    public readonly groupName!: string;
    public readonly crudRole!: CrudRole;
    public readonly runtimePath!: string;
    public readonly responseTypeName!: string;
    public readonly actionKind!: RouteActionKind;
    public readonly isMutating!: boolean;
    public readonly hookKind!: RouteHookKind;
    public readonly invalidation!: RouteCacheInvalidationDescriptor;
    public readonly executionSignature!: RouteExecutionSignature;
    public readonly requestContentType!: RequestContentType;
    public readonly auth!: boolean;
    public readonly security!: RouteSecurityDescriptor;
    public readonly middleware!: readonly string[];
    public readonly policies!: readonly RoutePolicyDescriptor[];
    public readonly rateLimit!: RateLimitDescriptor | null;
    public readonly parameters!: readonly RouteParameter[];
    public readonly pathParameters!: readonly RouteParameter[];
    public readonly queryParameters!: readonly RouteQueryParameter[];
    public readonly response!: ResponseDescriptor;
    public readonly errorResponses!: readonly HttpErrorResponseDescriptor[];
    public readonly sourceFile!: string;
    public readonly sourceLine!: number;
    public readonly schema!: RouteSchemaPayload;
    public readonly assignments!: readonly ResourceAssignment[];
    public readonly uri!: string;
    public readonly controllerName!: string;
}
