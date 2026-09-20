import type { RouteBoundaryOptions, ResolvedRouteBoundaryOptions } from "./boundaryBasicsTypes";
import { resolveRouteBoundaryBasics } from "./boundaryBasics";
import { resolveRouteBinding } from "./bindingResolution";
import { resolveRouteCapability } from "./capabilityResolution";
import { buildRouteProvenanceContract } from "./provenanceBuilder";

export function resolveRouteBoundaryInput(
    params: RouteBoundaryOptions
): ResolvedRouteBoundaryOptions {
    const basics = resolveRouteBoundaryBasics(params);
    const binding = resolveRouteBinding(params);
    const capability = resolveRouteCapability(params, basics, basics.resolvedParameters.length);
    const provenance = buildRouteProvenanceContract(params);

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
        handler: params.handler,
        auth: params.auth === true,
        middleware: Object.freeze([...(params.middleware || [])]),
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
        constantKey: basics.resolvedConstantKey,
        runtimePath: basics.resolvedRuntimePath,
        groupName: basics.resolvedGroupName,
        schema: params.schema,
        request: binding.request
    });
}
