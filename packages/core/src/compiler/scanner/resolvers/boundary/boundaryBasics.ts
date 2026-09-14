/**
 * boundaryBasics.ts
 *
 * Intermediate resolution of basic perimeter route values.
 * Pure Flow Declaration: Consumes perimeter inputs and resolves basic coordinates.
 *
 * @module core/compiler/scanner/resolvers/boundary
 */

import type { RouteActionKind } from "../../../../types/route";
import { RouteDomainResolver } from "../RouteDomainResolver";
import type {
    RouteBoundaryContract,
    SparseRouteParams,
    IntermediateRouteBoundaryBasics
} from "./boundaryBasicsTypes";

export type {
    RouteBoundaryContract,
    SparseRouteParams,
    IntermediateRouteBoundaryBasics
};

export function resolveRouteBoundaryBasics(params: SparseRouteParams): IntermediateRouteBoundaryBasics {
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

    const isGetMethod = params.method.toUpperCase() === "GET";
    const isHeadMethod = params.method.toUpperCase() === "HEAD";
    const resolvedActionKind: RouteActionKind = params.actionKind !== undefined
        ? params.actionKind
        : (isGetMethod ? "read" : "create");
    const resolvedIsMutating = params.isMutating !== undefined
        ? params.isMutating
        : (!isGetMethod && !isHeadMethod);
    resolvedActionName = resolvedActionName || (resolvedIsMutating ? "mutate" : "query");

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
    const fallbackResource = (params.resourceName && params.resourceName.length > 0)
        ? params.resourceName
        : (pathSegments[0] || resolvedDomain);

    return {
        resolvedControllerName,
        resolvedActionName,
        resolvedAction,
        isGetMethod,
        isHeadMethod,
        resolvedActionKind,
        resolvedIsMutating,
        resolvedDomain,
        fallbackResource
    };
}
