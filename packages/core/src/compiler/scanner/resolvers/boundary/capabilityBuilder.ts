/**
 * capabilityBuilder.ts
 *
 * Builds the canonical capability contract from already-resolved boundary data.
 */

import type { RouteCapabilityContract } from "../../../../types/route";
import { RouteSecurityResolver } from "../RouteSecurityResolver";
import { relationOptionFold, relationSome, relationNone, relationGate } from "../../../../semantic/kernel/relationalSequence";
import { RouteBoundaryOptions, IntermediateRouteBoundaryBasics } from "./boundaryBasics";
import type { ResolvedRouteCapability } from "./capabilityResolution";

export function buildRouteCapabilityContract(
    params: RouteBoundaryOptions,
    basics: IntermediateRouteBoundaryBasics,
    resolved: ResolvedRouteCapability
): RouteCapabilityContract {
    const middleware = relationOptionFold(relationGate(Boolean(params.middleware), () => relationSome(params.middleware as NonNullable<RouteBoundaryOptions['middleware']>), () => relationNone()), () => [], value => value);
    const auth = relationEqual(params.auth, true);
    const security = RouteSecurityResolver.resolve(middleware, auth);

    return Object.freeze({
        auth: security.auth,
        security: security.security,
        middleware: Object.freeze([...middleware]),
        policies: security.policies,
        rateLimit: security.rateLimit,
        invalidation: resolved.invalidation,
        crudRole: resolved.crudRole,
        hookKind: resolved.hookKind,
        actionKind: basics.resolvedActionKind,
        requestContentType: resolved.requestContentType,
        executionSignature: resolved.executionSignature,
        errorResponses: resolved.errorResponses
    });
}
