/**
 * capabilityBuilder.ts
 *
 * Builds the canonical capability contract from already-resolved boundary data.
 */

import type { RouteCapabilityContract, RouteIdentity } from '../../../../types/upstream/route';
import { routeSecurityAuthority } from '../../../../types/upstream/routeSecurityAuthority';
import { toUpstreamHttpErrorResponse, type HttpErrorResponseDescriptor } from "../../../../types/domain/httpErrors";
import type { ResolvedRouteBoundaryOptions, IntermediateRouteBoundaryBasics } from "./boundaryBasicsTypes";
import type { Sequence } from "../../../../types/upstream/collections";
import { relationFoldRight } from "../../../../semantic/foundation/relationalSequence";

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
    const identity: RouteIdentity = Object.freeze({
        kind: 'route_identity',
        key: basics.resolvedRouteName,
        declaredName: { kind: 'some', value: basics.resolvedRouteName },
        method: params.method,
        path: params.path,
    });
    const security = routeSecurityAuthority.resolve(middleware, params.auth);
    // Preserve the exact proof produced by RouteCapabilitySemanticAuthority.
    // This builder composes the closed contract; it must not mint a second proof.
    const reasoning = params.reasoning;

    return Object.freeze({
        identity,
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
        actionName: params.actionName,
        kind: 'route_capability',
        authority: 'upstream',
        reasoning,
        closed: true,
        derivation: Object.freeze({ kind: 'semantic_capability_derivation', strategy: reasoning.strategy, closed: true }),
        provenance: Object.freeze({ kind: 'semantic_capability_provenance', lane: 'upstream', closed: true }),
        evidence: Object.freeze({
            kind: 'route_capability_evidence',
            crud: params.crudEvidence,
        }),
        hookKind: params.hookKind,
        actionKind: basics.resolvedActionKind,
        requestContentType: params.requestContentType,
        executionSignature: params.executionSignature,
        payloadLocation: params.payloadLocation,
        payloadLocationDecision: params.payloadLocationDecision,
        schemaRole: params.schemaRole,
        errorResponses: sequenceMap<HttpErrorResponseDescriptor, import("../../../../types/upstream/routeErrorVocabulary").HttpErrorResponse>(params.errorResponses, toUpstreamHttpErrorResponse)
    });
}
