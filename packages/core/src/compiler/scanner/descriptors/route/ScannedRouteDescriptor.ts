/**
 * ScannedRouteDescriptor.ts
 *
 * Active Consumer Orchestrator: Scanned Route Descriptor.
 * Composes 4 Complete Sub-Contracts (Identity, Binding, Capability, Provenance).
 * 0 '?', 0 '??', 0 '?.', 0 procedural string parsing inside domain descriptor.
 *
 * @module core/compiler/scanner/descriptors/route/ScannedRouteDescriptor
 */

import type {
    RouteCacheInvalidationDescriptor,
    RouteIdentityContract,
    RouteBindingContract,
    RouteCapabilityContract,
    RouteProvenanceContract
} from "../../../../types/route";
import type { RouteBoundaryOptions } from "../../resolvers";
import type { ScannedRouteCompleteContracts, ScannedRouteConstructorInput } from "./routeContracts";
import { ScannedRouteFields } from "./routeDeclarations";
import { withRouteInvalidation, projectRouteToHookSource } from "./routeMutations";
import { resolveRouteDescriptorDomain, resolveRouteDescriptorSecurity } from "./routeMethods";
import {
    createRouteFromSubcontracts,
    createRouteFromSparse,
    createRouteFromControllerAction,
    createRouteFromClosure,
    createRouteFromControllerReference,
    createSyntheticRoute
} from "./routeSemanticFactories";

type RouteSubcontracts = {
    readonly identity: RouteIdentityContract;
    readonly binding: RouteBindingContract;
    readonly capability: RouteCapabilityContract;
    readonly provenance: RouteProvenanceContract;
};

function isCompleteRouteContracts(
    params: ScannedRouteCompleteContracts | RouteSubcontracts
): params is ScannedRouteCompleteContracts {
    return "contract" in params;
}

function isRouteSubcontracts(
    params: ScannedRouteCompleteContracts | RouteSubcontracts
): params is RouteSubcontracts {
    return "identity" in params;
}

export class ScannedRouteDescriptor extends ScannedRouteFields {
    constructor(params: ScannedRouteConstructorInput) {
        super(params);
        Object.freeze(this);
    }

    public static resolveDomain = resolveRouteDescriptorDomain;
    public static resolveSecurityAndPolicies = resolveRouteDescriptorSecurity;

    public static create(params: ScannedRouteCompleteContracts): ScannedRouteDescriptor;
    public static create(params: RouteSubcontracts): ScannedRouteDescriptor;
    public static create(
        params: ScannedRouteCompleteContracts | RouteSubcontracts
    ): ScannedRouteDescriptor {
        if (isCompleteRouteContracts(params)) {
            return new ScannedRouteDescriptor(params);
        }
        return ScannedRouteDescriptor.fromSubcontracts(params);
    }

    public static fromSparse = (p: RouteBoundaryOptions) => createRouteFromSparse(ScannedRouteDescriptor, p);
    public static fromScanned = (c: ScannedRouteCompleteContracts) => new ScannedRouteDescriptor(c);
    public static fromSubcontracts = (s: {
        readonly identity: RouteIdentityContract;
        readonly binding: RouteBindingContract;
        readonly capability: RouteCapabilityContract;
        readonly provenance: RouteProvenanceContract;
    }) => createRouteFromSubcontracts(ScannedRouteDescriptor, s);
    public static fromControllerAction = (p: Parameters<typeof createRouteFromControllerAction>[1]) =>
        createRouteFromControllerAction(ScannedRouteDescriptor.fromSparse, p);
    public static fromClosure = (p: Parameters<typeof createRouteFromClosure>[1]) =>
        createRouteFromClosure(ScannedRouteDescriptor.fromSparse, p);
    public static fromControllerReference = (p: Parameters<typeof createRouteFromControllerReference>[1]) =>
        createRouteFromControllerReference(ScannedRouteDescriptor.fromSparse, p);
    public static synthetic = (p?: Parameters<typeof createSyntheticRoute>[1]) =>
        createSyntheticRoute(ScannedRouteDescriptor.fromSparse, p);

    public *projectToHookSource(): Iterable<string> {
        yield* projectRouteToHookSource(this);
    }

    public withInvalidation(invalidation: RouteCacheInvalidationDescriptor): ScannedRouteDescriptor {
        return withRouteInvalidation(this, invalidation, ScannedRouteDescriptor);
    }
}

export function createScannedRoute(
    params: ScannedRouteCompleteContracts | RouteSubcontracts
): ScannedRouteDescriptor {
    return ScannedRouteDescriptor.create(params);
}
