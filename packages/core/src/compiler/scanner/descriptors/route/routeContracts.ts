/**
 * routeContracts.ts
 *
 * Closed Route Sub-Contracts for Complete Constructor Parameterization.
 *
 * @module core/compiler/scanner/descriptors/route/routeContracts
 */

import {
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
    EndpointContract,
    RouteSchemaPayload,
    RouteHandlerDescriptor,
    FormRequestDescriptor,
    RouteIdentityContract,
    RouteBindingContract,
    RouteCapabilityContract,
    RouteProvenanceContract
} from "../../../../types/route";

export interface ScannedRouteCompleteContracts {
    readonly identity: RouteIdentityContract;
    readonly binding: RouteBindingContract;
    readonly capability: RouteCapabilityContract;
    readonly provenance: RouteProvenanceContract;
    readonly contract: EndpointContract;
}

export type ScannedRouteConstructorInput = ScannedRouteCompleteContracts;

export interface ScannedRouteParams {
    readonly identity: RouteIdentityContract;
    readonly binding: RouteBindingContract;
    readonly capability: RouteCapabilityContract;
    readonly provenance: RouteProvenanceContract;
    readonly contract: EndpointContract;
    readonly name: string;
    readonly method: HttpMethod;
    readonly path: string;
    readonly resourceName: string;
    readonly domain: string;
    readonly action: string;
    readonly handler: RouteHandlerDescriptor;
    readonly formRequests: readonly FormRequestDescriptor[];
    readonly actionName: string;
    readonly actionKind: RouteActionKind;
    readonly isMutating: boolean;
    readonly groupName: string;
    readonly crudRole: CrudRole;
    readonly runtimePath: string;
    readonly hookKind: RouteHookKind;
    readonly invalidation: RouteCacheInvalidationDescriptor;
    readonly executionSignature: RouteExecutionSignature;
    readonly requestContentType: RequestContentType;
    readonly auth: boolean;
    readonly security: RouteSecurityDescriptor;
    readonly middleware: readonly string[];
    readonly policies: readonly RoutePolicyDescriptor[];
    readonly rateLimit: RateLimitDescriptor | null;
    readonly parameters: readonly RouteParameter[];
    readonly pathParameters: readonly RouteParameter[];
    readonly queryParameters: readonly RouteQueryParameter[];
    readonly response: ResponseDescriptor;
    readonly errorResponses: readonly HttpErrorResponseDescriptor[];
    readonly sourceFile: string;
    readonly sourceLine: number;
    readonly controllerName: string;
    readonly schema: RouteSchemaPayload;
}
