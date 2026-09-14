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
import type { SparseRouteParams } from "../../resolvers";
import type { ScannedRouteCompleteContracts, ScannedRouteConstructorInput } from "./routeContracts";
import { ScannedRouteFields } from "./routeDeclarations";
import { assignRouteProperties } from "./routePropertyAssigner";
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

export class ScannedRouteDescriptor extends ScannedRouteFields {
    constructor(params: ScannedRouteConstructorInput) {
        super();
        assignRouteProperties(this, params);
        Object.freeze(this);
    }

    public static resolveDomain = resolveRouteDescriptorDomain;
    public static resolveSecurityAndPolicies = resolveRouteDescriptorSecurity;

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

    public static fromSparse = (p: SparseRouteParams) => createRouteFromSparse(ScannedRouteDescriptor, p);
    public static fromScanned = (c: ScannedRouteCompleteContracts) => new ScannedRouteDescriptor(c);
    public static fromSubcontracts = (s: {
        readonly identity: RouteIdentityContract;
        readonly binding: RouteBindingContract;
        readonly capability: RouteCapabilityContract;
        readonly provenance: RouteProvenanceContract;
    }) => createRouteFromSubcontracts(ScannedRouteDescriptor, s);
    public static fromControllerAction = (p: Parameters<typeof createRouteFromControllerAction>[1]) =>
        createRouteFromControllerAction(ScannedRouteDescriptor.create, p);
    public static fromClosure = (p: Parameters<typeof createRouteFromClosure>[1]) =>
        createRouteFromClosure(ScannedRouteDescriptor.create, p);
    public static fromControllerReference = (p: Parameters<typeof createRouteFromControllerReference>[1]) =>
        createRouteFromControllerReference(ScannedRouteDescriptor.create, p);
    public static synthetic = (p?: Parameters<typeof createSyntheticRoute>[1]) =>
        createSyntheticRoute(ScannedRouteDescriptor.create, p);

    public *projectToHookSource(): Iterable<string> {
        yield* projectRouteToHookSource(this);
    }

    public withInvalidation(invalidation: RouteCacheInvalidationDescriptor): ScannedRouteDescriptor {
        return withRouteInvalidation(this, invalidation, ScannedRouteDescriptor);
    }
}

export function createScannedRoute(
    params: Parameters<typeof ScannedRouteDescriptor.create>[0]
): ScannedRouteDescriptor {
    return ScannedRouteDescriptor.create(params);
}
