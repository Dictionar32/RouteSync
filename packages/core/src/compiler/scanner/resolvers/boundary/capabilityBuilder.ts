/**
 * capabilityBuilder.ts
 *
 * Builds the canonical capability contract from already-resolved boundary data.
 */

import type { RouteCapabilityContract } from "../../../../types/route";
import { RouteSecurityResolver } from "../RouteSecurityResolver";
import { toUpstreamHttpErrorResponse, type HttpErrorResponseDescriptor } from "../../../../types/domain/httpErrors";
import type { ResolvedRouteBoundaryOptions, IntermediateRouteBoundaryBasics } from "./boundaryBasicsTypes";
import type { Sequence } from "../../../../types/upstream/collections";
import { relationFoldRight } from "../../../../semantic/kernel/relationalSequence";

const sequenceCons = <T>(head: T, tail: Sequence<T>): Sequence<T> => ({ kind: 'cons', head, tail });
const sequenceFromArray = <T>(items: readonly T[]): Sequence<T> => {
    const empty: Sequence<T> = { kind: 'empty' };
    return relationFoldRight<T, Sequence<T>>(items, empty, (item, tail) => sequenceCons(item, tail));
};
const sequenceMap = <T, U>(items: readonly T[], project: (item: T) => U): Sequence<U> => {
    const empty: Sequence<U> = { kind: 'empty' };
    return relationFoldRight<T, Sequence<U>>(items, empty, (item, tail) => sequenceCons(project(item), tail));
};

export function buildRouteCapabilityContract(
    params: ResolvedRouteBoundaryOptions,
    basics: IntermediateRouteBoundaryBasics,
): RouteCapabilityContract {
    const middleware = params.middleware;
    const security = RouteSecurityResolver.resolve(middleware, params.auth);

    return Object.freeze({
        auth: security.auth,
        security: security.security,
        middleware,
        policies: security.policies,
        rateLimit: security.rateLimit,
        invalidation: Object.freeze({
            targets: sequenceFromArray(params.invalidation.targets),
            queryKeyExpressions: sequenceFromArray(params.invalidation.queryKeyExpressions),
        }),
        crudRole: params.crudRole,
        hookKind: params.hookKind,
        actionKind: basics.resolvedActionKind,
        requestContentType: params.requestContentType,
        executionSignature: params.executionSignature,
        errorResponses: sequenceMap<HttpErrorResponseDescriptor, import("../../../../types/upstream/routeErrorVocabulary").HttpErrorResponse>(params.errorResponses, toUpstreamHttpErrorResponse)
    });
}
