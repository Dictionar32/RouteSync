import type { RouteBoundaryOptions, ResolvedRouteBoundaryOptions } from "./boundaryBasicsTypes";
import { routeBoundaryBasicsInterface } from "./boundaryBasics";
import { resolveRouteCapability } from "./capabilityResolution";
import { buildRouteProvenanceContract } from "./provenanceBuilder";
import { relationEqual } from "../../../../semantic/kernel/semanticRelations";
import { presenceOf, presenceFold } from "../../../../types/upstream/presence";
import { numberValue, truthValue } from "../../../../types/upstream/valueObjects";

export function resolveRouteBoundaryInput(
    params: RouteBoundaryOptions
): ResolvedRouteBoundaryOptions {
    const basicsJudgment = routeBoundaryBasicsInterface(params);
    const basics = basicsJudgment.result;
    const binding = params.binding;
    const capability = resolveRouteCapability(params, basics, basics.resolvedParameters.length, truthValue(params.auth), binding.request);
    const provenance = buildRouteProvenanceContract({
        sourceFile: params.sourceFile,
        sourceLine: numberValue(params.sourceLine),
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
        middleware: Object.freeze(presenceFold(presenceOf(params.middleware), () => [], value => value)),
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
        binding,
        runtimeReturn: params.runtimeReturn,
        semanticReturn: params.semanticReturn
    });
}
