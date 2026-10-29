/**
 * Direct route-boundary operations for the active Laravel route scanner.
 * These operations produce the canonical RouteBoundaryContract directly.
 */

import type { ActionName, ControllerName, PropertyName, ResourceName, SourceFile } from "../../../types/upstream/names";
import { HttpMethod, HTTP_METHOD_REGISTRY, type ResponseDescriptor } from "../../../types/route";
import type { ControllerActionInfo } from "../operations/domain-model/requestDescriptors";
import { RouteParameterSemanticFactory } from "../semantic/route/routeParameterSemanticFactory";
import type { RouteResourceFlowJudgment } from "../../../types/upstream/routeResourceFlow";
import type { RouteBoundaryContract } from "../../../types/upstream/route";
import type { LaravelRouteAuthorizationSemanticJudgment } from "../../../types/upstream/routeAuthorizationSemanticJudgmentInterface";
import type { ControllerReturnSemantic } from "../../../types/upstream/controller";
import type { Presence } from "../../../types/upstream/presence";
import type { ResolvedLaravelRoutePath } from "../../../types/upstream/routePathResolution";
import type { SourceSpan } from "../../../types/upstream/provenance";

export interface RouteMethodDetails {
    readonly method: HttpMethod;
    readonly actionKind: import("../../../types/route").RouteActionKind;
    readonly isMutating: boolean;
}

export type StandardRouteTarget =
    | { readonly kind: "controller_action"; readonly action: ControllerActionInfo }
    | { readonly kind: "controller_reference"; readonly controllerName: import("../../../types/upstream/names").ControllerName; readonly actionName: import("../../../types/upstream/names").ActionName; readonly response: ResponseDescriptor }
    | { readonly kind: "closure"; readonly actionName: ActionName; readonly response: ResponseDescriptor; readonly semanticReturn: ControllerReturnSemantic };

export type RouteBoundaryProjection = (
    method: HttpMethod,
    path: ResolvedLaravelRoutePath,
    resourceName: ResourceName,
    target: StandardRouteTarget,
    authorization: LaravelRouteAuthorizationSemanticJudgment,
    middleware: readonly PropertyName[],
    sourceFile: SourceFile,
    sourceLine: number,
    sourceSpan: SourceSpan,
) => RouteBoundaryContract;

export interface RouteBoundaryEmitterInterface {
    readonly mapMethodDetails: (method: HttpMethod) => RouteMethodDetails;
    readonly emitResourceRouteBoundariesFromJudgment: (
        judgment: RouteResourceFlowJudgment,
        controllerName: Presence<ControllerName>,
        resolvedResponse: ResponseDescriptor,
        authorization: LaravelRouteAuthorizationSemanticJudgment,
        currentMiddlewares: readonly PropertyName[],
        routesFile: SourceFile,
        sourceLine: number,
        sourceSpan: SourceSpan,
        project: RouteBoundaryProjection,
    ) => readonly RouteBoundaryContract[];
    readonly emitStandardRouteBoundaries: (
        targetMethods: readonly HttpMethod[],
        resolvedPath: ResolvedLaravelRoutePath,
        resourceName: ResourceName,
        target: StandardRouteTarget,
        authorization: LaravelRouteAuthorizationSemanticJudgment,
        currentMiddlewares: readonly PropertyName[],
        routesFile: SourceFile,
        sourceLine: number,
        sourceSpan: SourceSpan,
        project: RouteBoundaryProjection,
    ) => readonly RouteBoundaryContract[];
}

/** Interface-owned route boundary projection operations on the actual runtime path. */
export const routeBoundaryEmitter: RouteBoundaryEmitterInterface = Object.freeze({
    mapMethodDetails: (method: HttpMethod): RouteMethodDetails => {
        const spec = HTTP_METHOD_REGISTRY[method];
        return { method: spec.method, actionKind: spec.actionKind, isMutating: spec.isMutating };
    },
    emitResourceRouteBoundariesFromJudgment: (
        judgment: RouteResourceFlowJudgment,
        controllerName: Presence<ControllerName>,
        resolvedResponse: ResponseDescriptor,
        authorization: LaravelRouteAuthorizationSemanticJudgment,
        currentMiddlewares: readonly PropertyName[],
        routesFile: SourceFile,
        sourceLine: number,
        sourceSpan: SourceSpan,
        project: RouteBoundaryProjection,
    ): readonly RouteBoundaryContract[] => {
        const plan = judgment.plan;
        return Object.freeze(plan.actions.map(planned => {
            const path: ResolvedLaravelRoutePath = Object.freeze({
                kind: 'resolved_laravel_route_path',
                path: planned.path,
                resourceName: plan.resource,
                parameters: Object.freeze(planned.parameters.map(parameter => RouteParameterSemanticFactory.fromPathSegment(parameter.value.value))),
                runtimePath: planned.runtimePath,
                constantKey: planned.constantKey,
            });
            const target: StandardRouteTarget = controllerName.kind === 'absent'
                ? { kind: 'closure', actionName: planned.action, response: resolvedResponse, semanticReturn: { kind: 'absent' } }
                : { kind: 'controller_reference', controllerName: controllerName.value, actionName: planned.action, response: resolvedResponse };
            return project(planned.method, path, plan.resource, target, authorization, currentMiddlewares, routesFile, sourceLine, sourceSpan);
        }));
    },
    emitStandardRouteBoundaries: (
        targetMethods: readonly HttpMethod[],
        resolvedPath: ResolvedLaravelRoutePath,
        resourceName: ResourceName,
        target: StandardRouteTarget,
        authorization: LaravelRouteAuthorizationSemanticJudgment,
        currentMiddlewares: readonly PropertyName[],
        routesFile: SourceFile,
        sourceLine: number,
        sourceSpan: SourceSpan,
        project: RouteBoundaryProjection,
    ): readonly RouteBoundaryContract[] => targetMethods.map(method => project(
        routeBoundaryEmitter.mapMethodDetails(method).method,
        resolvedPath,
        resourceName,
        target,
        authorization,
        currentMiddlewares,
        routesFile,
        sourceLine,
        sourceSpan,
    )),
});
