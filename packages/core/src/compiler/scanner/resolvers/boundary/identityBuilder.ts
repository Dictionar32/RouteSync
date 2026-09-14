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

export function deriveRouteConstantKey(routePath: string): string {
    const cleanPath = routePath.replace(/^\/|\/$/g, '');
    const segments = cleanPath.split('/');

    const keySegments: string[] = [];
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if ((seg.startsWith('{') && seg.endsWith('}')) || seg.startsWith(':')) {
            const paramName = seg.startsWith(':') ? seg.slice(1) : seg.slice(1, -1);
            if (paramName.toLowerCase() === 'id') {
                keySegments.push('DETAIL');
            } else {
                let processed = false;
                if (keySegments.length > 0) {
                    const lastIdx = keySegments.length - 1;
                    if (keySegments[lastIdx].endsWith('S')) {
                        keySegments[lastIdx] = keySegments[lastIdx].slice(0, -1);
                        processed = true;
                    }
                }
                if (!processed) {
                    const cleanParam = paramName.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
                    keySegments.push(cleanParam);
                }
            }
        } else {
            keySegments.push(seg.toUpperCase().replace(/[^A-Z0-9]/g, '_'));
        }
    }
    return keySegments.filter(Boolean).join('_');
}

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

    const resolvedConstantKey = params.constantKey
        ? params.constantKey
        : deriveRouteConstantKey(params.path);

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
        constantKey: resolvedConstantKey,
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
