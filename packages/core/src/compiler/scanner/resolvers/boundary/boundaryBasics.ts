/**
 * boundaryBasics.ts
 *
 * Intermediate resolution of basic perimeter route values.
 * Pure Flow Declaration: Consumes perimeter inputs and resolves basic coordinates.
 *
 * @module core/compiler/scanner/resolvers/boundary
 */

import type { RouteActionKind, RouteParameter, RouteQueryParameter } from "../../../../types/route";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import type { ActionName, ControllerName, DomainTypeName, PropertyName, ResourceName, RouteName, RoutePath } from "../../../../types/upstream/names";
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
    const path = params.path.value.value;
    let resolvedControllerName: ControllerName = params.controllerName ?? SemanticValueFactory.controllerName("");
    const controllerText = resolvedControllerName.value.value;
    let resolvedActionName: ActionName = params.actionName ?? SemanticValueFactory.actionName("");
    let resolvedAction: ActionName = params.action ?? resolvedActionName;

    if (params.action) {
        const actionText = params.action.value.value;
        if (actionText.includes("@")) {
            const [ctrl, act] = actionText.split("@");
            if (!controllerText && ctrl) {
                resolvedControllerName = SemanticValueFactory.controllerName(ctrl);
            }
            if (!resolvedActionName.value.value && act) {
                resolvedActionName = SemanticValueFactory.actionName(act);
            }
        } else if (!resolvedActionName.value.value) {
            resolvedActionName = SemanticValueFactory.actionName(actionText);
        }
    }

    const methodSpecification = HTTP_METHOD_REGISTRY[params.method];
    const isGetMethod = params.method === "GET";
    const isHeadMethod = params.method === "HEAD";
    const resolvedActionKind: RouteActionKind = params.actionKind ?? resolveActionKindFromActionName(resolvedActionName, methodSpecification.actionKind);
    const resolvedIsMutating = ROUTE_ACTION_KIND_REGISTRY[resolvedActionKind].isMutating;
    if (!resolvedActionName.value.value) {
        resolvedActionName = actionNameForKind(resolvedActionKind);
    }

    if (!params.action) {
        const controllerTextResolved = resolvedControllerName.value.value;
        const actionTextResolved = resolvedActionName.value.value;
        resolvedAction = SemanticValueFactory.actionName(
            controllerTextResolved ? `${controllerTextResolved}@${actionTextResolved}` : actionTextResolved
        );
    }

    const resolvedDomain: DomainTypeName = params.domain ?? RouteDomainResolver.resolve({
        resourceName: params.resourceName,
        controllerName: resolvedControllerName,
        path: params.path,
        actionName: resolvedActionName
    });

    const pathSegments = path.replace(/^\//, "").split("/")
        .filter(s => s && s !== "api" && !/^v\d+$/i.test(s) && !s.startsWith("{") && !s.startsWith(":"));
    const resolvedResourceName: ResourceName = params.resourceName ?? SemanticValueFactory.resourceName(pathSegments[0] || resolvedDomain.value.value);

    const inputParameters: readonly RouteParameter[] = params.parameters ?? [];
    const resolvedPathParameters: readonly RouteParameter[] = params.pathParameters
        ?? (inputParameters.length > 0
            ? inputParameters.filter(parameter => parameter.location === "path")
            : [...path.matchAll(/\{([^}]+)\}/g)].map(match => ScannedRouteParameterDescriptor.fromPathSegment(match[1])));
    const resolvedParameters: readonly RouteParameter[] = inputParameters.length > 0
        ? inputParameters
        : resolvedPathParameters;
    const resolvedQueryParameters: readonly RouteQueryParameter[] = params.queryParameters ?? [];
    const resolvedGroupName: DomainTypeName = params.groupName ?? SemanticValueFactory.domainName(toCamelCase(resolvedResourceName.value.value));
    const resolvedRuntimePath: RoutePath = params.runtimePath ?? SemanticValueFactory.routePath(path.replace(/\{([^}]+)\}/g, ":$1"));
    const resolvedConstantKey: PropertyName = params.constantKey ?? SemanticValueFactory.propertyName(deriveRouteConstantKey(path));
    const resolvedRouteName: RouteName = params.name ?? SemanticValueFactory.routeName(`${resolvedResourceName.value.value}.${resolvedActionName.value.value}`);

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

export function deriveRouteConstantKey(routePath: string | RoutePath): string {
    const routePathValue = typeof routePath === "string" ? routePath : routePath.value.value;
    const cleanPath = routePathValue.replace(/^\/|\/$/g, "");
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


function resolveActionKindFromActionName(actionName: ActionName, fallback: RouteActionKind): RouteActionKind {
    switch (actionName.value.value) {
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

function actionNameForKind(kind: RouteActionKind): ActionName {
    switch (kind) {
        case "create": return SemanticValueFactory.actionName("create");
        case "update": return SemanticValueFactory.actionName("update");
        case "delete": return SemanticValueFactory.actionName("delete");
        case "read": return SemanticValueFactory.actionName("read");
    }
}
