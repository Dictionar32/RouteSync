/**
 * ScannedRouteDescriptor.ts
 *
 * Active Consumer Orchestrator: Scanned Route Descriptor.
 * Composes 4 Complete Sub-Contracts (Identity, Binding, Capability, Provenance).
 * 0 '?', 0 '??', 0 '?.', 0 procedural string parsing inside the domain descriptor.
 *
 * Follows Rule 14: 0 wildcard re-exports (`0 export * from`), active consumption,
 * and pure flow declaration.
 *
 * @module core/compiler/scanner/descriptors/route/ScannedRouteDescriptor
 */

import {
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
    ScannedEndpointContract,
    RouteSchemaPayload,
    RouteHandlerDescriptor,
    FormRequestDescriptor,
    RouteIdentityContract,
    RouteBindingContract,
    RouteCapabilityContract,
    RouteProvenanceContract
} from "../../../../types/route";
import {
    RouteDomainResolver,
    RouteSecurityResolver,
    SparseRouteParams
} from "../../resolvers";
import {
    ScannedRouteCompleteContracts,
    ScannedRouteConstructorInput
} from "./routeContracts";
import {
    createRouteFromSubcontracts,
    createRouteFromSparse,
    createRouteFromControllerAction,
    createRouteFromClosure,
    createRouteFromControllerReference,
    createSyntheticRoute
} from "./routeSemanticFactories";

// ============================================================================
// Active Consumer: Composite Domain Model
// ============================================================================

export class ScannedRouteDescriptor implements ParsedRoute {
    public readonly identity: RouteIdentityContract;
    public readonly binding: RouteBindingContract;
    public readonly capability: RouteCapabilityContract;
    public readonly provenance: RouteProvenanceContract;

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
    public readonly contract: EndpointContract;

    constructor(params: ScannedRouteConstructorInput) {
        this.identity = params.identity;
        this.binding = params.binding;
        this.capability = params.capability;
        this.provenance = params.provenance;

        this.name = params.identity.name;
        this.method = params.identity.method;
        this.path = params.identity.path;
        this.resourceName = params.identity.resourceName;
        this.domain = params.identity.domain;
        this.groupName = params.identity.groupName;
        this.runtimePath = params.identity.runtimePath;
        this.parameters = params.identity.parameters.all;
        this.pathParameters = params.identity.parameters.path;
        this.queryParameters = params.identity.parameters.query;

        this.handler = params.binding.handler;
        this.action = params.binding.action;
        this.actionName = params.binding.actionName;
        this.controllerName = params.binding.controllerName;
        this.schema = params.binding.schema;
        this.response = params.binding.response;
        this.responseTypeName = params.binding.responseTypeName;
        this.formRequests = params.binding.formRequests;
        this.assignments = params.binding.assignments;

        this.auth = params.capability.auth;
        this.security = params.capability.security;
        this.middleware = params.capability.middleware;
        this.policies = params.capability.policies;
        this.rateLimit = params.capability.rateLimit;
        this.invalidation = params.capability.invalidation;
        this.crudRole = params.capability.crudRole;
        this.hookKind = params.capability.hookKind;
        this.actionKind = params.capability.actionKind;
        this.isMutating = params.capability.isMutating;
        this.requestContentType = params.capability.requestContentType;
        this.executionSignature = params.capability.executionSignature;
        this.errorResponses = params.capability.errorResponses;

        this.sourceFile = params.provenance.sourceFile;
        this.sourceLine = params.provenance.sourceLine;
        this.uri = params.provenance.uri;

        this.contract = params.contract;
        Object.freeze(this);
    }

    public static resolveDomain(route: {
        readonly domain?: string;
        readonly resourceName?: string;
        readonly controllerName?: string;
        readonly path?: string;
        readonly actionName?: string;
    }): string {
        return RouteDomainResolver.resolve(route);
    }

    public static resolveSecurityAndPolicies(
        middleware: readonly string[],
        auth: boolean
    ): {
        readonly security: RouteSecurityDescriptor;
        readonly auth: boolean;
        readonly policies: readonly RoutePolicyDescriptor[];
        readonly rateLimit: RateLimitDescriptor | null;
    } {
        return RouteSecurityResolver.resolve(middleware, auth);
    }

    public static create(
        params: ScannedRouteCompleteContracts | {
            readonly identity: RouteIdentityContract;
            readonly binding: RouteBindingContract;
            readonly capability: RouteCapabilityContract;
            readonly provenance: RouteProvenanceContract;
        } | SparseRouteParams
    ): ScannedRouteDescriptor {
        if ("identity" in params && "binding" in params && "capability" in params && "provenance" in params) {
            return "contract" in params
                ? new ScannedRouteDescriptor(params as ScannedRouteCompleteContracts)
                : ScannedRouteDescriptor.fromSubcontracts(params);
        }
        return ScannedRouteDescriptor.fromSparse(params as SparseRouteParams);
    }

    public static fromSparse(params: SparseRouteParams): ScannedRouteDescriptor {
        return createRouteFromSparse(ScannedRouteDescriptor, params);
    }

    public static fromScanned(contracts: ScannedRouteCompleteContracts): ScannedRouteDescriptor {
        return new ScannedRouteDescriptor(contracts);
    }

    public static fromSubcontracts(subcontracts: {
        readonly identity: RouteIdentityContract;
        readonly binding: RouteBindingContract;
        readonly capability: RouteCapabilityContract;
        readonly provenance: RouteProvenanceContract;
    }): ScannedRouteDescriptor {
        return createRouteFromSubcontracts(ScannedRouteDescriptor, subcontracts);
    }

    public static fromControllerAction(params: Parameters<typeof createRouteFromControllerAction>[1]): ScannedRouteDescriptor {
        return createRouteFromControllerAction(ScannedRouteDescriptor.create, params);
    }

    public static fromClosure(params: Parameters<typeof createRouteFromClosure>[1]): ScannedRouteDescriptor {
        return createRouteFromClosure(ScannedRouteDescriptor.create, params);
    }

    public static fromControllerReference(params: Parameters<typeof createRouteFromControllerReference>[1]): ScannedRouteDescriptor {
        return createRouteFromControllerReference(ScannedRouteDescriptor.create, params);
    }

    public static synthetic(params?: Parameters<typeof createSyntheticRoute>[1]): ScannedRouteDescriptor {
        return createSyntheticRoute(ScannedRouteDescriptor.create, params);
    }

    public *projectToHookSource(): Iterable<string> {
        yield `// Hook for ${this.identity.name} (${this.identity.method} ${this.identity.path})`;
        yield `// Group: ${this.identity.groupName}, Role: ${this.capability.crudRole}, Kind: ${this.capability.hookKind}`;
    }

    public withInvalidation(invalidation: RouteCacheInvalidationDescriptor): ScannedRouteDescriptor {
        const updatedCapability: RouteCapabilityContract = Object.freeze({
            ...this.capability,
            invalidation
        });
        const updatedContract = ScannedEndpointContract.fromSubcontracts({
            identity: this.identity,
            binding: this.binding,
            capability: updatedCapability,
            provenance: this.provenance
        });
        return new ScannedRouteDescriptor({
            identity: this.identity,
            binding: this.binding,
            capability: updatedCapability,
            provenance: this.provenance,
            contract: updatedContract
        });
    }
}

// ============================================================================
// Pure Functional Entry Point
// ============================================================================

export function createScannedRoute(
    params: Parameters<typeof ScannedRouteDescriptor.create>[0]
): ScannedRouteDescriptor {
    return ScannedRouteDescriptor.create(params);
}
