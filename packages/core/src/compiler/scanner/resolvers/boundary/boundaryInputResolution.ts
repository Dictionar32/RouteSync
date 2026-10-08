import type { RouteBoundaryOptions, ResolvedRouteBoundaryOptions } from "./boundaryBasicsTypes";
import { routeBoundaryBasicsInterface } from "./boundaryBasics";
import { resolveRouteCapability } from "./capabilityResolution";
import { routeCapabilityAuthority } from "../../../../types/upstream/routeCapabilityAuthority";
import { buildRouteProvenanceContract } from "./provenanceBuilder";
import { relationEqual } from "../../../../semantic/foundation/semanticRelations";
import { presenceOf, presenceFold } from "../../../../types/upstream/presence";
import { truthValue } from "../../../../types/upstream/valueObjects";
import type { RouteMiddleware } from "../../../../types/upstream/route";
import { createMiddlewareName, type PropertyName } from "../../../../types/upstream/names";
import type { RouteMiddlewares, Sequence } from "../../../../types/upstream/collections";
import { relationFoldRight } from "../../../../semantic/foundation/relationalSequence";


const sequenceCons = <T>(head: T, tail: Sequence<T>): Sequence<T> => ({ kind: "cons", head, tail });

const routeMiddlewares = (items: readonly PropertyName[]): RouteMiddlewares => {
    const empty: Sequence<RouteMiddleware> = { kind: "empty" };
    const sequence: Sequence<RouteMiddleware> = relationFoldRight<PropertyName, Sequence<RouteMiddleware>>(
        items,
        empty,
        (item, tail) => sequenceCons(Object.freeze({ kind: "direct", name: createMiddlewareName(item.value.value) }), tail),
    );
    return Object.freeze({ kind: "route_middlewares", items: sequence });
};

export function resolveRouteBoundaryInput(
    params: RouteBoundaryOptions
): ResolvedRouteBoundaryOptions {
    const basicsJudgment = routeBoundaryBasicsInterface(params);
    const basics = basicsJudgment.result;
    const binding = params.binding;
    const authInput = params.auth;
    const crudResolution = routeCapabilityAuthority.crudRoleResolution(
        params.method,
        params.path,
        basics.resolvedAction,
        params.crudRole,
    );
    const capabilityInput = Object.freeze({
        hookKind: params.hookKind,
        executionSignature: params.executionSignature,
        requestContentType: params.requestContentType,
        crudRole: params.crudRole ?? crudResolution.role,
        crudEvidence: crudResolution.evidence,
        errorResponses: params.errorResponses,
        invalidation: params.invalidation,
        schema: params.schema,
    });
    const capability = resolveRouteCapability(capabilityInput, basics, basics.resolvedParameters.length, truthValue(authInput), params.method, params.path, binding.request);
    const middlewareInput: readonly PropertyName[] = params.middleware;
    const provenance = buildRouteProvenanceContract({
        sourceFile: params.sourceFile,
        sourceLine: params.sourceLine,
        path: params.path
    });

    return Object.freeze({
        origin: params.origin,
        method: params.method,
        path: params.path,
        name: basics.resolvedRouteName,
        resourceName: basics.resolvedResourceName,
        domain: basics.resolvedDomain,
        controllerName: basics.resolvedControllerName,
        actionName: basics.resolvedActionName,
        action: basics.resolvedAction,
        actionKind: basics.resolvedActionKind,
        isMutating: basics.resolvedIsMutating,
        sourceFile: provenance.sourceFile,
        sourceLine: provenance.sourceLine,
        auth: truthValue(relationEqual(params.auth, true)),
        middleware: routeMiddlewares(middlewareInput),
        parameters: basics.resolvedParameters,
        pathParameters: basics.resolvedPathParameters,
        queryParameters: basics.resolvedQueryParameters,
        response: params.response,
        errorResponses: capability.errorResponses,
        invalidation: capability.invalidation,
        executionSignature: capability.executionSignature,
        requestContentType: capability.requestContentType,
        hookKind: capability.hookKind,
        crudRole: capability.crudRole,
        crudEvidence: capability.crudEvidence,
        constantKey: basics.resolvedConstantKey,
        runtimePath: basics.resolvedRuntimePath,
        groupName: basics.resolvedGroupName,
        schema: params.schema,
        binding,
        runtimeReturn: params.runtimeReturn,
        semanticReturn: params.semanticReturn
    });
}
