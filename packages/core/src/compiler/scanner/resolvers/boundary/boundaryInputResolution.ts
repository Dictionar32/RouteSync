import type { RouteBoundaryOptions, ResolvedRouteBoundaryOptions } from "./boundaryBasicsTypes";
import { routeBoundaryBasicsInterface } from "./boundaryBasics";
import { resolveRouteCapability } from "./capabilityResolution";
import { routeCapabilityAuthority } from "../../../../types/upstream/routeCapabilityAuthority";
import { routeSecurityAuthority } from "../../../../types/upstream/routeSecurityAuthority";
import { buildRouteProvenanceContract } from "./provenanceBuilder";
import { relationEqual } from "../../../../semantic/relations/semanticRelations";
import { presenceOf, presenceFold } from "../../../../types/upstream/presence";
import type { RouteMiddleware } from "../../../../types/upstream/route";
import { createMiddlewareName, type PropertyName } from "../../../../types/upstream/names";
import type { RouteMiddlewares, Sequence } from "../../../../types/upstream/collections";
import { relationFoldRight } from "../../../../semantic/relations/relationalSequence";


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
    const middlewareInput: readonly PropertyName[] = params.middleware;
    const middleware = routeMiddlewares(middlewareInput);
    const security = routeSecurityAuthority.resolve({
        kind: "route_security_authority_input",
        middleware,
        authorization: params.authorization,
    });
    const crudResolution = routeCapabilityAuthority.resolve({
        kind: "route_capability_crud_input",
        method: params.method,
        path: params.path,
        action: basics.resolvedAction,
        ...(params.crudRole === undefined ? {} : { explicitRole: params.crudRole }),
    });
    const capabilityInput = Object.freeze({
        hookKind: params.hookKind,
        executionSignature: params.executionSignature,
        payloadLocation: params.payloadLocation,
        schemaRole: params.schemaRole,
        requestContentType: params.requestContentType,
        crudRole: presenceFold(presenceOf(params.crudRole), () => crudResolution.role, role => role),
        crudEvidence: crudResolution.evidence,
        errorResponses: params.errorResponses,
        invalidation: params.invalidation,
        schema: params.schema,
    });
    const capability = resolveRouteCapability(capabilityInput, basics, basics.resolvedParameters.length, security.auth, params.method, params.path, binding.request);
    const provenance = buildRouteProvenanceContract({
        sourceFile: params.sourceFile,
        sourceLine: params.sourceLine,
        path: params.path,
        sourceSpan: params.sourceSpan
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
        sourceSpan: provenance.declarationSpan,
        authorization: params.authorization,
        auth: security.auth,
        middleware,
        security,
        parameters: basics.resolvedParameters,
        pathParameters: basics.resolvedPathParameters,
        queryParameters: basics.resolvedQueryParameters,
        response: params.response,
        responseProjection: params.responseProjection,
        errorResponses: capability.errorResponses,
        invalidation: capability.invalidation,
        executionSignature: capability.executionSignature,
        payloadLocation: capability.payloadLocation,
        payloadLocationDecision: capability.payloadLocationDecision,
        schemaRole: capability.schemaRole,
        reasoning: capability.reasoning,
        requestContentType: capability.requestContentType,
        hookKind: capability.hookKind,
        crudRole: capability.crudRole,
        actionName: capability.actionName,
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
