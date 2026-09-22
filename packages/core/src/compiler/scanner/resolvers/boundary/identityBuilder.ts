/**
 * identityBuilder.ts
 *
 * Builds RouteIdentityContract from sparse parameters and intermediate basics.
 *
 * @module core/compiler/scanner/resolvers/boundary
 */

import type { RouteIdentityContract } from "../../../../types/route";
import {
    RouteBoundaryOptions,
    IntermediateRouteBoundaryBasics
} from "./boundaryBasics";

export { deriveRouteConstantKey } from "./boundaryBasics";

export function buildRouteIdentityContract(
    params: RouteBoundaryOptions,
    basics: IntermediateRouteBoundaryBasics
): RouteIdentityContract {
    const resolvedParameters = basics.resolvedParameters;
    const resolvedPathParams = basics.resolvedPathParameters;
    const queryParameters = basics.resolvedQueryParameters;

    return Object.freeze({
        coordinates: Object.freeze({
            name: basics.resolvedRouteName,
            constantKey: basics.resolvedConstantKey,
            method: params.method,
            path: params.path,
            runtimePath: basics.resolvedRuntimePath,
        }),
        domain: Object.freeze({
            resource: basics.resolvedResourceName,
            domain: basics.resolvedDomain,
            group: basics.resolvedGroupName,
        }),
        parameters: Object.freeze({
            all: resolvedParameters,
            path: resolvedPathParams,
            query: queryParameters
        })
    });
}
