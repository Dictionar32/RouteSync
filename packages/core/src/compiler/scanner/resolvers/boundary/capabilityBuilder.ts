/**
 * capabilityBuilder.ts
 *
 * Builds the canonical capability contract from already-resolved boundary data.
 */

import type { RouteCapabilityContract } from "../../../../types/route";
import { RouteSecurityResolver } from "../RouteSecurityResolver";
import { presenceOf, presenceFold } from "../../../../types/upstream/presence";
import type { ResolvedRouteBoundaryOptions, IntermediateRouteBoundaryBasics } from "./boundaryBasicsTypes";

export function buildRouteCapabilityContract(
    params: ResolvedRouteBoundaryOptions,
    basics: IntermediateRouteBoundaryBasics,
): RouteCapabilityContract {
    const middleware = presenceFold(presenceOf(params.middleware), () => [], value => value);
    const security = RouteSecurityResolver.resolve(middleware, params.auth);

    return Object.freeze({
        auth: security.auth,
        security: security.security,
        middleware: Object.freeze([...middleware]),
        policies: security.policies,
        rateLimit: security.rateLimit,
        invalidation: params.invalidation,
        crudRole: params.crudRole,
        hookKind: params.hookKind,
        actionKind: basics.resolvedActionKind,
        requestContentType: params.requestContentType,
        executionSignature: params.executionSignature,
        errorResponses: params.errorResponses
    });
}
