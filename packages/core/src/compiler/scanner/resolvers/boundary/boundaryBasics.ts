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
import { relationAll, relationAny, relationEqual } from "../../../../semantic/kernel/semanticRelations";
import { relationFold, relationGate, relationProject, relationSelect, relationSlice, relationTextSlice, relationLookup, relationOptionFold, relationOptionValue, relationSome, relationNone } from "../../../../semantic/kernel/relationalSequence";
import type { RelationOption } from "../../../../semantic/kernel/relationalSequence";
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

const boundaryPresence = <T>(value: T | void): RelationOption<T> =>
    relationGate(Boolean(value), () => relationSome(value as T), () => relationNone<T>());

export function resolveRouteBoundaryBasics(params: RouteBoundaryOptions): IntermediateRouteBoundaryBasics {
    const path = params.path.value.value;
    let resolvedControllerName: ControllerName = relationOptionValue(boundaryPresence(params.controllerName), SemanticValueFactory.controllerName(""));
    const controllerText = resolvedControllerName.value.value;
    let resolvedActionName: ActionName = relationOptionValue(boundaryPresence(params.actionName), SemanticValueFactory.actionName(""));
    let resolvedAction: ActionName = relationOptionValue(boundaryPresence(params.action), resolvedActionName);

    relationGate(Boolean(params.action), () => {
        const actionText = params.action!.value.value;
        relationGate(actionText.includes("@"), () => {
            const parts = relationTextSlice(actionText, 0, actionText.length).split("@");
            const ctrl = parts[0];
            const act = parts[1];
            relationGate(relationAll([!controllerText, Boolean(ctrl)]), () => {
                resolvedControllerName = SemanticValueFactory.controllerName(ctrl);
            }, () => true);
            relationGate(relationAll([!resolvedActionName.value.value, Boolean(act)]), () => {
                resolvedActionName = SemanticValueFactory.actionName(act);
            }, () => true);
        }, () => {
            relationGate(!resolvedActionName.value.value, () => {
                resolvedActionName = SemanticValueFactory.actionName(actionText);
            }, () => true);
        });
    }, () => true);

    const methodSpecification = HTTP_METHOD_REGISTRY[params.method];
    const isGetMethod = relationEqual(params.method, "GET");
    const isHeadMethod = relationEqual(params.method, "HEAD");
    const resolvedActionKind: RouteActionKind = relationOptionValue(
        boundaryPresence(params.actionKind),
        resolveActionKindFromActionName(resolvedActionName, methodSpecification.actionKind),
    );
    const resolvedIsMutating = ROUTE_ACTION_KIND_REGISTRY[resolvedActionKind].isMutating;
    relationGate(!resolvedActionName.value.value, () => {
        resolvedActionName = actionNameForKind(resolvedActionKind);
    }, () => true);

    relationGate(!params.action, () => {
        const controllerTextResolved = resolvedControllerName.value.value;
        const actionTextResolved = resolvedActionName.value.value;
        resolvedAction = SemanticValueFactory.actionName(
            relationGate(Boolean(controllerTextResolved), () => `${controllerTextResolved}@${actionTextResolved}`, () => actionTextResolved),
        );
    }, () => true);

    const resolvedDomain: DomainTypeName = relationOptionValue(
        boundaryPresence(params.domain),
        RouteDomainResolver.resolve({
            resourceName: params.resourceName,
            controllerName: resolvedControllerName,
            path: params.path,
            actionName: resolvedActionName
        }),
    );

    const pathSegments = relationSelect(path.replace(/^\/|\/$/g, "").split("/"), segment => relationAll([
        Boolean(segment),
        !relationEqual(segment, "api"),
        !/^v\d+$/i.test(segment),
        !segment.startsWith("{"),
        !segment.startsWith(":")
    ]));
    const resolvedResourceName: ResourceName = relationOptionValue(
        boundaryPresence(params.resourceName),
        SemanticValueFactory.resourceName(relationGate(pathSegments.length > 0, () => pathSegments[0], () => resolvedDomain.value.value)),
    );

    const inputParameters: readonly RouteParameter[] = relationOptionValue(boundaryPresence(params.parameters), []);
    const resolvedPathParameters: readonly RouteParameter[] = relationOptionValue(
        boundaryPresence(params.pathParameters),
        relationGate(
            inputParameters.length > 0,
            () => relationSelect(inputParameters, parameter => relationEqual(parameter.location, "path")),
            () => relationProject([...path.matchAll(/\{([^}]+)\}/g)], match => ScannedRouteParameterDescriptor.fromPathSegment(match[1])),
        ),
    );
    const resolvedParameters: readonly RouteParameter[] = relationGate(inputParameters.length > 0, () => inputParameters, () => resolvedPathParameters);
    const resolvedQueryParameters: readonly RouteQueryParameter[] = relationOptionValue(boundaryPresence(params.queryParameters), []);
    const resolvedGroupName: DomainTypeName = relationOptionValue(
        boundaryPresence(params.groupName),
        SemanticValueFactory.domainName(toCamelCase(resolvedResourceName.value.value)),
    );
    const resolvedRuntimePath: RoutePath = relationOptionValue(
        boundaryPresence(params.runtimePath),
        SemanticValueFactory.routePath(path.replace(/\{([^}]+)\}/g, ":$1")),
    );
    const resolvedConstantKey: PropertyName = relationOptionValue(
        boundaryPresence(params.constantKey),
        SemanticValueFactory.propertyName(deriveRouteConstantKey(path)),
    );
    const resolvedRouteName: RouteName = relationOptionValue(
        boundaryPresence(params.name),
        SemanticValueFactory.routeName(`${resolvedResourceName.value.value}.${resolvedActionName.value.value}`),
    );

    return {
        resolvedControllerName, resolvedActionName, resolvedAction, isGetMethod, isHeadMethod,
        resolvedActionKind, resolvedIsMutating, resolvedDomain, resolvedResourceName, resolvedParameters,
        resolvedPathParameters, resolvedQueryParameters, resolvedGroupName, resolvedRuntimePath,
        resolvedConstantKey, resolvedRouteName
    };
}

export function deriveRouteConstantKey(routePath: string | RoutePath): string {
    const routePathValue = relationGate(relationEqual(typeof routePath, "string"), () => routePath as string, () => (routePath as RoutePath).value.value);
    const cleanPath = routePathValue.replace(/^\/|\/$/g, "");
    const segments = cleanPath.split("/");
    const state = relationFold(segments, { keys: [] as readonly string[] }, (current, segment) => {
        const parameter = relationAll([segment.startsWith("{"), segment.endsWith("}")]);
        const colonParameter = segment.startsWith(":");
        return relationGate(relationAny([parameter, colonParameter]), () => {
            const parameterName = relationGate(colonParameter, () => relationTextSlice(segment, 1), () => relationTextSlice(segment, 1, segment.length - 1));
            return relationGate(relationEqual(parameterName.toLowerCase(), "id"), () => ({ keys: [...current.keys, "DETAIL"] }), () => {
                const previous = relationGate(current.keys.length > 0, () => current.keys[current.keys.length - 1], () => "");
                const plural = relationEqual(previous.endsWith("S"), true);
                const normalizedPrevious = relationGate(plural, () => relationTextSlice(previous, 0, previous.length - 1), () => previous);
                const cleanParameter = parameterName.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase();
                const nextKeys = relationGate(plural, () => [...relationSlice(current.keys, 0, current.keys.length - 1), normalizedPrevious, cleanParameter], () => [...current.keys, cleanParameter]);
                return { keys: nextKeys };
            });
        }, () => ({ keys: [...current.keys, segment.toUpperCase().replace(/[^A-Z0-9]/g, "_")] }));
    });
    return state.keys.join("_");
}


function resolveActionKindFromActionName(actionName: ActionName, fallback: RouteActionKind): RouteActionKind {
    const catalog: readonly (readonly [string, RouteActionKind])[] = [
        ["index", "read"], ["show", "read"], ["read", "read"],
        ["store", "create"], ["create", "create"],
        ["update", "update"], ["edit", "update"],
        ["destroy", "delete"], ["delete", "delete"],
    ];
    return relationOptionFold(relationLookup(catalog, actionName.value.value), () => fallback, value => value);
}

function actionNameForKind(kind: RouteActionKind): ActionName {
    const catalog: readonly (readonly [RouteActionKind, ActionName])[] = [
        ["create", SemanticValueFactory.actionName("create")],
        ["update", SemanticValueFactory.actionName("update")],
        ["delete", SemanticValueFactory.actionName("delete")],
        ["read", SemanticValueFactory.actionName("read")],
    ];
    return relationOptionFold(relationLookup(catalog, kind), () => SemanticValueFactory.actionName("read"), value => value);
}
