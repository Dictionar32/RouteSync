/**
 * routeEmitter.ts
 *
 * Emits canonical route semantic emissions across apiResource and standard route declarations.
 *
 * @module core/compiler/scanner/subscanners/route-scanner
 */

import type { ActionName, ControllerName, PropertyName, ResourceName, SourceFile } from "../../../../types/upstream/names";
import {
    HttpMethod,
    HTTP_METHOD_REGISTRY,
    RouteActionKind,
    ResponseDescriptor,
} from "../../../../types/route";
import { ControllerActionInfo } from "../../descriptors/requestDescriptors";
import { resolveRoutePath, type ResolvedRoutePath } from "./routePathParser";
import { createActionName } from "../../../../types/upstream/names";
import { defaultApiResourceRegistration, resolveRouteResourceFlow, type RouteResourceMode } from "../../../../types/upstream/routeResourceFlow";
import type { RouteResourceRegistration } from "../../../../types/upstream/route";
import type { Sequence } from "../../../../types/upstream/collections";
import type { RouteDeclarationAst } from "../../lexer/routeAst/routeDeclarationAst";
import type { ControllerReturnSemantic } from "../../../../types/upstream/controller";
import type { RelationIndex } from '../../../../semantic/foundation/relationMembership';
import { relationIndexLookup } from '../../../../semantic/foundation/relationMembership';
import { relationGate, relationEqual, relationOptionFold, relationProject, relationVariantFold, type RelationOption, relationNone, relationSome } from "../../../../semantic/foundation/relationalSequence";

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

export type RouteEmission = {
    readonly method: HttpMethod;
    readonly path: ResolvedRoutePath;
    readonly resourceName: ResourceName;
    readonly target: StandardRouteTarget;
    readonly auth: boolean;
    readonly middleware: readonly PropertyName[];
    readonly sourceFile: SourceFile;
    readonly sourceLine: number;
};

export type ResourceRouteMethod = 'resource' | 'apiResource' | 'singleton' | 'apiSingleton';

const sequenceOf = <T>(values: readonly T[]): import("../../../../types/upstream/collections").Sequence<T> =>
    values.reduceRight<import("../../../../types/upstream/collections").Sequence<T>>((tail, head) => ({ kind: "cons", head, tail }), { kind: "empty" });

export const resourceRegistrationFromDeclaration = (
    declaration: RouteDeclarationAst,
    resourceName: ResourceName,
): RouteResourceRegistration => Object.freeze({
    ...defaultApiResourceRegistration(resourceName, { kind: "framework_convention" as const }),
    only: declaration.resourceActionFilter?.kind === "only" ? sequenceOf(declaration.resourceActionFilter.actions.map(createActionName)) : ({ kind: "empty" } as Sequence<ActionName>),
    except: declaration.resourceActionFilter?.kind === "except" ? sequenceOf(declaration.resourceActionFilter.actions.map(createActionName)) : ({ kind: "empty" } as Sequence<ActionName>),
    shallow: { kind: "truth_value" as const, value: declaration.resourceShallow },
    scoped: { kind: "truth_value" as const, value: declaration.resourceScoped },
    creatable: { kind: "truth_value" as const, value: declaration.resourceCreatable },
    destroyable: { kind: "truth_value" as const, value: declaration.resourceDestroyable },
});

export function emitResourceRoutes(
    resourceMethod: ResourceRouteMethod,
    resolvedBasePath: ResolvedRoutePath,
    resourceName: ResourceName,
    controllerName: RelationOption<ControllerName>,
    controllerMap: RelationOption<RelationIndex<string, RelationIndex<string, ControllerActionInfo>>>,
    resolvedResponse: ResponseDescriptor,
    isAuth: boolean,
    currentMiddlewares: readonly PropertyName[],
    routesFile: SourceFile,
    sourceLine: number,
    registration: RouteResourceRegistration = defaultApiResourceRegistration(resourceName, { kind: "framework_convention" as const }),
    index = 0,
): readonly RouteEmission[] {
    const mode = resourceMethod as RouteResourceMode;
    const plan = resolveRouteResourceFlow({
        mode,
        declarationPath: resolvedBasePath.path,
        prefix: [],
        resource: resourceName,
        registration,
    });
    const actions = plan.actions;
    return relationGate(
        index >= actions.length,
        () => Object.freeze([]),
        () => {
            const planned = actions[index];
            const path = resolveRoutePath(planned.path.value.value, []);
            const actionName = planned.action.value.value;
            const action = relationOptionFold(
                controllerName,
                () => relationNone<ControllerActionInfo>(),
                name => relationOptionFold(
                    controllerMap,
                    () => relationNone<ControllerActionInfo>(),
                    registry => relationOptionalMapEntry(relationIndexLookup(registry, name.value.value), actionName),
                ),
            );
            const current = relationOptionFold(
                action,
                () => relationOptionFold(
                    controllerName,
                    () => [{ method: planned.method as HttpMethod, path, resourceName, target: { kind: 'closure' as const, actionName: planned.action, response: resolvedResponse, semanticReturn: { kind: 'absent' as const } }, auth: isAuth, middleware: currentMiddlewares, sourceFile: routesFile, sourceLine }],
                    name => [{ method: planned.method as HttpMethod, path, resourceName, target: { kind: 'controller_reference' as const, controllerName: name, actionName: planned.action, response: resolvedResponse }, auth: isAuth, middleware: currentMiddlewares, sourceFile: routesFile, sourceLine }],
                ),
                value => [{ method: planned.method as HttpMethod, path, resourceName, target: { kind: 'controller_action' as const, action: value }, auth: isAuth, middleware: currentMiddlewares, sourceFile: routesFile, sourceLine }],
            );
            return [...current, ...emitResourceRoutes(resourceMethod, resolvedBasePath, resourceName, controllerName, controllerMap, resolvedResponse, isAuth, currentMiddlewares, routesFile, sourceLine, registration, index + 1)];
        },
    );
}

/** @deprecated Use emitResourceRoutes with the canonical Laravel apiResource method. */
export const emitApiResourceRoutes = (
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
): readonly RouteEmission[] => emitResourceRoutes('apiResource', resolvedBasePath, resourceName, controllerName, controllerMap, resolvedResponse, isAuth, currentMiddlewares, routesFile, sourceLine, undefined, index);

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
): readonly RouteEmission[] {
    return relationProject(targetMethods, method => {
        const { method: canonicalMethod } = mapMethodDetails(method);
        return relationVariantFold(
            target,
            'controller_action',
            residual => relationVariantFold(
                residual,
                'controller_reference',
                value => ({
                    method: canonicalMethod,
                    path: resolvedPath,
                    resourceName,
                    target: { kind: "closure" as const, actionName: value.actionName, response: value.response, semanticReturn: value.semanticReturn },
                    auth: isAuth,
                    middleware: currentMiddlewares,
                    sourceFile: routesFile,
                    sourceLine,
                }),
                value => ({
                    method: canonicalMethod,
                    path: resolvedPath,
                    resourceName,
                    target: { kind: "controller_reference" as const, actionName: value.actionName, controllerName: value.controllerName, response: value.response },
                    auth: isAuth,
                    middleware: currentMiddlewares,
                    sourceFile: routesFile,
                    sourceLine,
                }),
            ),
            value => ({
                method: canonicalMethod,
                path: resolvedPath,
                resourceName,
                target: { kind: "controller_action" as const, action: value.action },
                auth: isAuth,
                middleware: currentMiddlewares,
                sourceFile: routesFile,
                sourceLine,
            }),
        );
    });
}

