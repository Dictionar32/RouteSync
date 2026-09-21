/**
 * identityBuilder.ts
 *
 * Builds RouteIdentityContract from sparse parameters and intermediate basics.
 *
 * @module core/compiler/scanner/resolvers/boundary
 */

import type { RouteIdentityContract } from "../../../../types/route";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
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
            name: SemanticValueFactory.routeName(basics.resolvedRouteName),
            constantKey: SemanticValueFactory.propertyName(basics.resolvedConstantKey),
            method: params.method,
            path: SemanticValueFactory.routePath(params.path),
            runtimePath: SemanticValueFactory.routePath(basics.resolvedRuntimePath),
        }),
        domain: Object.freeze({
            resource: SemanticValueFactory.resourceName(basics.resolvedResourceName),
            domain: SemanticValueFactory.domainName(basics.resolvedDomain),
            group: SemanticValueFactory.domainName(basics.resolvedGroupName),
        }),
        parameters: Object.freeze({
            all: resolvedParameters,
            path: resolvedPathParams,
            query: queryParameters
        })
    });
}
