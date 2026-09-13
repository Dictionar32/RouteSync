/**
 * identityBuilder.ts
 *
 * Builds RouteIdentityContract from sparse parameters and intermediate basics.
 *
 * @module core/compiler/scanner/resolvers/boundary
 */

import {
    RouteIdentityContract,
    RouteParameter,
    RouteQueryParameter
} from "../../../../types/route";
import { toCamelCase } from "../../../../utils/resource-naming";
import { ScannedRouteParameterDescriptor } from "../../descriptors/routeDescriptors";
import {
    SparseRouteParams,
    IntermediateRouteBoundaryBasics
} from "./boundaryBasics";

export function buildRouteIdentityContract(
    params: SparseRouteParams,
    basics: IntermediateRouteBoundaryBasics
): RouteIdentityContract {
    const resolvedGroupName = params.groupName
        ? params.groupName
        : toCamelCase(basics.fallbackResource);

    const resolvedRuntimePath = params.runtimePath
        ? params.runtimePath
        : params.path.replace(/\{([^}]+)\}/g, ":$1");

    const inputParameters = (params.parameters ? params.parameters : []) as readonly RouteParameter[];
    const resolvedPathParams: readonly RouteParameter[] = params.pathParameters
        ? (params.pathParameters as readonly RouteParameter[])
        : (
            inputParameters.length > 0
                ? inputParameters.filter(p => p.in === "path")
                : [...params.path.matchAll(/\{([^}]+)\}/g)].map(m => ScannedRouteParameterDescriptor.fromPathSegment(m[1]))
        );
    const resolvedParameters = inputParameters.length > 0 ? inputParameters : resolvedPathParams;
    const queryParameters = (params.queryParameters ? params.queryParameters : []) as readonly RouteQueryParameter[];

    return Object.freeze({
        name: params.name ? params.name : `${basics.fallbackResource}.${basics.resolvedActionName}`,
        method: params.method,
        path: params.path,
        runtimePath: resolvedRuntimePath,
        resourceName: basics.fallbackResource,
        domain: basics.resolvedDomain,
        groupName: resolvedGroupName,
        parameters: Object.freeze({
            all: resolvedParameters,
            path: resolvedPathParams,
            query: queryParameters
        })
    });
}
