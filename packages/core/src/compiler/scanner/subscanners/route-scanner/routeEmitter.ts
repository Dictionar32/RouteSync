/**
 * routeEmitter.ts
 *
 * Emits canonical RouteSemanticFlow objects across apiResource and standard route declarations.
 *
 * @module core/compiler/scanner/subscanners/route-scanner
 */

import type { ActionName, ControllerName, PropertyName, ResourceName, SourceFile } from "../../../../types/upstream/names";
import {
    RouteSemanticFlow,
    HttpMethod,
    HTTP_METHOD_REGISTRY,
    RouteActionKind,
    ResponseDescriptor,
} from "../../../../types/route";
import { ControllerActionInfo } from "../../descriptors/requestDescriptors";
import { RouteSemanticFlowFactory } from "../../descriptors/routeDescriptors";
import { resolveRoutePath, type ResolvedRoutePath } from "./routePathParser";
import { createActionName } from "../../../../types/upstream/names";
import type { ControllerReturnSemantic } from "../../../../types/upstream/controller";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import type { RelationIndex } from '../../../../semantic/kernel/relationMembership';
import { relationIndexLookup } from '../../../../semantic/kernel/relationMembership';
import { relationGate, relationEqual, relationFirstOption, relationOptionFold, relationProject, relationVariantFold, type RelationOption, relationNone, relationSome } from "../../../../semantic/kernel/relationalSequence";

export function mapMethodDetails(method: HttpMethod): {
    method: HttpMethod;
    actionKind: RouteActionKind;
    isMutating: boolean;
} {
    const spec = HTTP_METHOD_REGISTRY[method];
    return { method: spec.method, actionKind: spec.actionKind, isMutating: spec.isMutating };
}

function relationMapEntry<K, V>(source: RelationIndex<K, V>, key: K): RelationOption<V> { return relationIndexLookup(source, key); }

function relationOptionalMapEntry<K, V>(source: RelationOption<RelationIndex<K, V>>, key: K): RelationOption<V> {
    return relationOptionFold(source, () => relationNone<V>(), value => relationMapEntry(value, key));
}

export function emitApiResourceRoutes(
    resolvedBasePath: ResolvedRoutePath,
    resourceName: ResourceName,
    controllerName: RelationOption<ControllerName>,
    controllerMap: RelationOption<RelationIndex<string, RelationIndex<string, ControllerActionInfo>>>,
    resolvedResponse: ResponseDescriptor,
    isAuth: boolean,
    currentMiddlewares: readonly PropertyName[],
    routesFile: SourceFile,
    sourceLine: number,
    index = 0,
): readonly RouteSemanticFlowFactory[] {
    const resourceActions = [
        { method: 'GET' as const, suffix: '', actionName: 'index' },
        { method: 'POST' as const, suffix: '', actionName: 'store' },
        { method: 'GET' as const, suffix: '/{id}', actionName: 'show' },
        { method: 'PUT' as const, suffix: '/{id}', actionName: 'update' },
        { method: 'DELETE' as const, suffix: '/{id}', actionName: 'destroy' },
    ];
    return relationGate(
        index >= resourceActions.length,
        () => Object.freeze([]),
        () => {
            const resAction = resourceActions[index];
            const path = resolveRoutePath(`${resolvedBasePath.path}${resAction.suffix}`, []);
            const action = relationOptionFold(
                controllerName,
                () => relationNone<ControllerActionInfo>(),
                name => relationOptionFold(
                    controllerMap,
                    () => relationNone<ControllerActionInfo>(),
                    registry => relationOptionalMapEntry(relationIndexLookup(registry, name.value.value), resAction.actionName),
                ),
            );
            const current = relationOptionFold(
                action,
                () => relationOptionFold(
                    controllerName,
                    () => [RouteSemanticFlowFactory.fromClosure({
                        method: resAction.method,
                        path: path.path,
                        resourceName,
                        actionName: createActionName(resAction.actionName),
                        sourceFile: routesFile,
                        sourceLine,
                        response: resolvedResponse,
                        semanticReturn: { kind: "absent" },
                        auth: isAuth,
                        middleware: currentMiddlewares,
                        parameters: path.parameters,
                    })],
                    name => [RouteSemanticFlowFactory.fromControllerReference({
                        method: resAction.method,
                        path: path.path,
                        resourceName,
                        actionName: createActionName(resAction.actionName),
                        controllerName: name,
                        auth: isAuth,
                        middleware: currentMiddlewares,
                        response: resolvedResponse,
                        sourceFile: routesFile,
                        sourceLine,
                        parameters: path.parameters,
                    })],
                ),
                value => [RouteSemanticFlowFactory.fromControllerAction({
                    method: resAction.method,
                    path: path.path,
                    resourceName,
                    action: value,
                    auth: isAuth,
                    middleware: currentMiddlewares,
                    parameters: path.parameters,
                })],
            );
            return [...current, ...emitApiResourceRoutes(resolvedBasePath, resourceName, controllerName, controllerMap, resolvedResponse, isAuth, currentMiddlewares, routesFile, sourceLine, index + 1)];
        },
    );
}

export type StandardRouteTarget =
    | { readonly kind: "controller_action"; readonly action: ControllerActionInfo }
    | { readonly kind: "controller_reference"; readonly controllerName: import("../../../../types/upstream/names").ControllerName; readonly actionName: import("../../../../types/upstream/names").ActionName; readonly response: ResponseDescriptor }
    | { readonly kind: "closure"; readonly actionName: ActionName; readonly response: ResponseDescriptor; readonly semanticReturn: ControllerReturnSemantic };

export function emitStandardRoutes(
    targetMethods: readonly HttpMethod[],
    resolvedPath: ResolvedRoutePath,
    resourceName: ResourceName,
    target: StandardRouteTarget,
    isAuth: boolean,
    currentMiddlewares: readonly PropertyName[],
    routesFile: SourceFile,
    sourceLine: number,
): readonly RouteSemanticFlowFactory[] {
    return relationProject(targetMethods, method => {
        const { method: canonicalMethod } = mapMethodDetails(method);
        return relationVariantFold(
            target,
            'controller_action',
            residual => relationVariantFold(
                residual,
                'controller_reference',
                value => RouteSemanticFlowFactory.fromClosure({
                    method: canonicalMethod,
                    path: resolvedPath.path,
                    resourceName,
                    actionName: value.actionName,
                    sourceFile: routesFile,
                    sourceLine,
                    response: value.response,
                    semanticReturn: value.semanticReturn,
                    auth: isAuth,
                    middleware: currentMiddlewares,
                    parameters: resolvedPath.parameters,
                }),
                value => RouteSemanticFlowFactory.fromControllerReference({
                    method: canonicalMethod,
                    path: resolvedPath.path,
                    resourceName,
                    actionName: value.actionName,
                    controllerName: value.controllerName,
                    sourceFile: SemanticValueFactory.sourceFilePath(routesFile.value.value),
                    sourceLine,
                    response: value.response,
                    auth: isAuth,
                    middleware: currentMiddlewares,
                    parameters: resolvedPath.parameters,
                }),
            ),
            value => RouteSemanticFlowFactory.fromControllerAction({
                method: canonicalMethod,
                path: resolvedPath.path,
                resourceName,
                action: value.action,
                auth: isAuth,
                middleware: currentMiddlewares,
                parameters: resolvedPath.parameters,
            }),
        );
    });
}

