/**
 * domainExtractor.ts
 *
 * Reads the canonical route resource identity produced by the route scanner.
 * Resource/domain classification belongs to the route origin boundary, not
 * to RequestType assembly.
 */

import { RouteSemanticFlow } from "../../../../types/route";

export interface RouteDomainInfo {
    readonly rawDomain: string;
    readonly bareDomain: string;
}

export function extractRouteDomain(route: RouteSemanticFlow): RouteDomainInfo {
    const resourceName = route.identity.domain.resource.value.value;
    return {
        rawDomain: resourceName,
        bareDomain: resourceName
    };
}
