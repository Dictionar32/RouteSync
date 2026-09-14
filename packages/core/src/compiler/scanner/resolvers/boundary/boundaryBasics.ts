/**
 * boundaryBasics.ts
 *
 * Intermediate resolution of basic perimeter route values.
 *
 * @module core/compiler/scanner/resolvers/boundary
 */

import {
    HttpMethod,
    RouteActionKind
} from "../../../../types/route";
import { RouteDomainResolver } from "../RouteDomainResolver";

export interface SparseRouteParams {
    readonly name?: string;
    readonly method: HttpMethod;
    readonly path: string;
    readonly resourceName?: string;
    readonly domain?: string;
    readonly action?: string;
    readonly actionName?: string;
    readonly actionKind?: RouteActionKind;
    readonly isMutating?: boolean;
    readonly groupName?: string;
    readonly crudRole?: any;
    readonly runtimePath?: string;
    readonly constantKey?: string;
    readonly hookKind?: any;
    readonly invalidation?: any;
    readonly executionSignature?: any;
    readonly requestContentType?: any;
    readonly auth?: boolean;
    readonly middleware?: readonly string[];
    readonly parameters?: readonly any[];
    readonly pathParameters?: readonly any[];
    readonly queryParameters?: readonly any[];
    readonly response?: any;
    readonly errorResponses?: readonly any[];
    readonly sourceFile?: string;
    readonly sourceLine?: number;
    readonly controllerName?: string;
    readonly schema?: any;
    readonly formRequests?: readonly any[];
    readonly handler?: any;
}

export interface IntermediateRouteBoundaryBasics {
    readonly resolvedControllerName: string;
    readonly resolvedActionName: string;
    readonly resolvedAction: string;
    readonly isGetMethod: boolean;
    readonly isHeadMethod: boolean;
    readonly resolvedActionKind: RouteActionKind;
    readonly resolvedIsMutating: boolean;
    readonly resolvedDomain: string;
    readonly fallbackResource: string;
}

export function resolveRouteBoundaryBasics(params: SparseRouteParams): IntermediateRouteBoundaryBasics {
    let resolvedControllerName = params.controllerName ? params.controllerName : "";
    let resolvedActionName = params.actionName;
    let resolvedAction = params.action;

    if (params.action) {
        if (params.action.includes("@")) {
            const [ctrl, act] = params.action.split("@");
            if (!resolvedControllerName && ctrl) {
                resolvedControllerName = ctrl;
            }
            if (!resolvedActionName && act) {
                resolvedActionName = act;
            }
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
    resolvedActionName = resolvedActionName ? resolvedActionName : (resolvedIsMutating ? "mutate" : "query");

    if (!resolvedAction) {
        resolvedAction = resolvedControllerName ? `${resolvedControllerName}@${resolvedActionName}` : resolvedActionName;
    }

    const resolvedDomain = params.domain ? params.domain : RouteDomainResolver.resolve({
        domain: params.domain,
        resourceName: params.resourceName,
        controllerName: resolvedControllerName,
        path: params.path,
        actionName: resolvedActionName
    });

    const pathSegments = params.path.replace(/^\//, "").split("/")
        .filter(s => s && s !== "api" && s !== "v1" && !s.startsWith("{") && !s.startsWith(":"));
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
