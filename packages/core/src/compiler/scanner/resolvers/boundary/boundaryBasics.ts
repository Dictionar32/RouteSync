/**
 * boundaryBasics.ts
 *
 * Intermediate resolution of basic perimeter route values.
 * Pure Flow Declaration: Consumes perimeter inputs and resolves basic coordinates.
 *
 * @module core/compiler/scanner/resolvers/boundary
 */

import type { RouteActionKind, RouteParameter, RouteQueryParameter } from "../../../../types/route";
import { HTTP_METHOD_REGISTRY, ROUTE_ACTION_KIND_REGISTRY } from "../../../../types/route";
import { ScannedRouteParameterDescriptor } from "../../descriptors/routeDescriptors";
import { toCamelCase } from "../../../../utils/resource-naming";
import { RouteDomainResolver } from "../RouteDomainResolver";
import type {
    RouteBoundaryContract,
    RouteBoundaryOptions,
    IntermediateRouteBoundaryBasics
} from "./boundaryBasicsTypes";

export type {
    RouteBoundaryContract,
    RouteBoundaryOptions,
    IntermediateRouteBoundaryBasics
};

export function resolveRouteBoundaryBasics(params: RouteBoundaryOptions): IntermediateRouteBoundaryBasics {
    let resolvedControllerName = params.controllerName ?? "";
    let resolvedActionName = params.actionName;
    let resolvedAction = params.action;

    if (params.action) {
        if (params.action.includes("@")) {
            const [ctrl, act] = params.action.split("@");
            if (!resolvedControllerName && ctrl) resolvedControllerName = ctrl;
            if (!resolvedActionName && act) resolvedActionName = act;
        } else if (!resolvedActionName) {
            resolvedActionName = params.action;
        }
    }

    const methodSpecification = HTTP_METHOD_REGISTRY[params.method];
    const isGetMethod = params.method === "GET";
    const isHeadMethod = params.method === "HEAD";
    const resolvedActionKind: RouteActionKind = params.actionKind ?? resolveActionKindFromActionName(resolvedActionName, methodSpecification.actionKind);
    const resolvedIsMutating = ROUTE_ACTION_KIND_REGISTRY[resolvedActionKind].isMutating;
    resolvedActionName = resolvedActionName || actionNameForKind(resolvedActionKind);

    if (!resolvedAction) {
        resolvedAction = resolvedControllerName ? `${resolvedControllerName}@${resolvedActionName}` : resolvedActionName;
    }

    const resolvedDomain = params.domain ?? RouteDomainResolver.resolve({
        domain: params.domain,
        resourceName: params.resourceName,
        controllerName: resolvedControllerName,
        path: params.path,
        actionName: resolvedActionName
    });

    const pathSegments = params.path.replace(/^\//, "").split("/")
        .filter(s => s && s !== "api" && !/^v\d+$/i.test(s) && !s.startsWith("{") && !s.startsWith(":"));
    const resolvedResourceName = (params.resourceName && params.resourceName.length > 0)
        ? params.resourceName
        : (pathSegments[0] || resolvedDomain);

    const inputParameters: readonly RouteParameter[] = params.parameters ?? [];
    const resolvedPathParameters: readonly RouteParameter[] = params.pathParameters
        ?? (inputParameters.length > 0
            ? inputParameters.filter(parameter => parameter.location === "path")
            : [...params.path.matchAll(/\{([^}]+)\}/g)].map(match => ScannedRouteParameterDescriptor.fromPathSegment(match[1])));
    const resolvedParameters: readonly RouteParameter[] = inputParameters.length > 0
        ? inputParameters
        : resolvedPathParameters;
    const resolvedQueryParameters: readonly RouteQueryParameter[] = params.queryParameters ?? [];
    const resolvedGroupName = params.groupName !== undefined
        ? params.groupName
        : toCamelCase(resolvedResourceName);
    const resolvedRuntimePath = params.runtimePath !== undefined
        ? params.runtimePath
        : params.path.replace(/\{([^}]+)\}/g, ":$1");
    const resolvedConstantKey = params.constantKey !== undefined
        ? params.constantKey
        : deriveRouteConstantKey(params.path);
    const resolvedRouteName = params.name !== undefined
        ? params.name
        : `${resolvedResourceName}.${resolvedActionName}`;

    return {
        resolvedControllerName,
        resolvedActionName,
        resolvedAction,
        isGetMethod,
        isHeadMethod,
        resolvedActionKind,
        resolvedIsMutating,
        resolvedDomain,
        resolvedResourceName,
        resolvedParameters,
        resolvedPathParameters,
        resolvedQueryParameters,
        resolvedGroupName,
        resolvedRuntimePath,
        resolvedConstantKey,
        resolvedRouteName
    };
}

export function deriveRouteConstantKey(routePath: string): string {
    const cleanPath = routePath.replace(/^\/|\/$/g, "");
    const segments = cleanPath.split("/");
    const keySegments: string[] = [];

    for (const segment of segments) {
        if ((segment.startsWith("{") && segment.endsWith("}")) || segment.startsWith(":")) {
            const paramName = segment.startsWith(":") ? segment.slice(1) : segment.slice(1, -1);
            if (paramName.toLowerCase() === "id") {
                keySegments.push("DETAIL");
                continue;
            }
            const lastIndex = keySegments.length - 1;
            if (lastIndex >= 0 && keySegments[lastIndex].endsWith("S")) {
                keySegments[lastIndex] = keySegments[lastIndex].slice(0, -1);
                continue;
            }
            const cleanParam = paramName.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase();
            keySegments.push(cleanParam);
            continue;
        }
        keySegments.push(segment.toUpperCase().replace(/[^A-Z0-9]/g, "_"));
    }

    return keySegments.filter(Boolean).join("_");
}


function resolveActionKindFromActionName(actionName: string | undefined, fallback: RouteActionKind): RouteActionKind {
    switch (actionName) {
        case "index":
        case "show":
        case "read":
            return "read";
        case "store":
        case "create":
            return "create";
        case "update":
        case "edit":
            return "update";
        case "destroy":
        case "delete":
            return "delete";
        default:
            return fallback;
    }
}

function actionNameForKind(kind: RouteActionKind): string {
    switch (kind) {
        case "create": return "create";
        case "update": return "update";
        case "delete": return "delete";
        case "read": return "read";
    }
}
