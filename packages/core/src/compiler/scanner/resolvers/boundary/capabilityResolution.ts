/**
 * Boundary adapter for route capability semantics.
 *
 * Semantic authority lives in upstream routeCapabilitySemanticAuthority. This
 * module only translates compiler-boundary inputs into the upstream contract.
 */
import type {
    HttpMethod,
    RouteExecutionSignature,
    RoutePayloadLocation,
    CrudRole,
    RouteSchemaPayload,
    HttpErrorResponseDescriptor,
} from "../../../../types/route";
import type { RequestContentType as RequestContentTypeType, RouteHookKind as RouteHookKindType } from "../../../../types/route";
import type { RouteBoundaryOptions, ResolvedRouteBoundaryOptions, IntermediateRouteBoundaryBasics } from "./boundaryBasicsTypes";
import type { RouteRequestBinding } from "../../../../types/domain/request";
import { routeCapabilitySemanticAuthority, type RouteCapabilitySemanticEvidence, type RouteCapabilitySemanticOverrides } from "../../../../types/upstream/routeCapabilitySemanticAuthority";
import type { RouteCapabilityCrudEvidence } from "../../../../types/upstream/route";
import { presenceOf, type Presence } from "../../../../types/upstream/presence";
import type { TruthValue } from "../../../../types/upstream/valueObjects";
import type { RouteSemanticFlowCacheInvalidationDescriptor } from "../../../../types/domain/cacheInvalidation";

export interface ResolvedRouteCapability {
    readonly hookKind: RouteHookKindType;
    readonly crudRole: CrudRole;
    readonly actionName: import("../../../../types/upstream/names").ActionName;
    readonly crudEvidence: RouteCapabilityCrudEvidence;
    readonly requestContentType: RequestContentTypeType;
    readonly executionSignature: RouteExecutionSignature;
    readonly payloadLocation: RoutePayloadLocation;
    readonly payloadLocationDecision: import('../../../../types/upstream/routeExecutionVocabulary').RoutePayloadLocationDecision;
    readonly schemaRole: 'request' | 'response';
    readonly reasoning: import("../../../../types/upstream/semanticReasoning").SemanticReasoningContract<'evidence_resolution'>;
    readonly invalidation: ReturnType<typeof RouteSemanticFlowCacheInvalidationDescriptor.none>;
    readonly errorResponses: readonly HttpErrorResponseDescriptor[];
}

type RouteCapabilitySemanticBoundaryInput = Readonly<{
    readonly hookKind: Presence<RouteHookKindType>;
    readonly executionSignature: Presence<RouteExecutionSignature>;
    readonly requestContentType: Presence<RequestContentTypeType>;
    readonly crudRole: Presence<CrudRole>;
    readonly crudEvidence: Presence<RouteCapabilityCrudEvidence>;
    readonly errorResponses: Presence<readonly HttpErrorResponseDescriptor[]>;
    readonly invalidation: Presence<ReturnType<typeof RouteSemanticFlowCacheInvalidationDescriptor.none>>;
    readonly schema: RouteSchemaPayload;
    readonly auth: TruthValue;
}>;

export function resolveRouteCapabilityJudgment(
    input: RouteCapabilitySemanticBoundaryInput,
    basics: IntermediateRouteBoundaryBasics,
    parameterCount: number,
    method: HttpMethod,
    _path: import("../../../../types/upstream/names").RoutePath,
    request: RouteRequestBinding,
): ResolvedRouteCapability {
    const semanticInput: RouteCapabilitySemanticEvidence = Object.freeze({
        actionKind: basics.resolvedActionKind,
        isMutating: basics.resolvedIsMutating,
        parameterCount,
        method,
        path: _path,
        domain: basics.resolvedDomain,
        action: basics.resolvedAction,
        request,
        schema: input.schema.value,
        auth: input.auth.value,
        crudEvidence: input.crudEvidence.value,
    });
    const semanticOverrides: RouteCapabilitySemanticOverrides = Object.freeze({
        hookKind: input.hookKind,
        executionSignature: input.executionSignature,
        payloadLocation: input.payloadLocation,
        schemaRole: input.schemaRole,
        requestContentType: input.requestContentType,
        errorResponses: input.errorResponses,
        invalidation: input.invalidation,
    });
    return routeCapabilitySemanticAuthority.resolve(semanticInput, semanticOverrides);
}

type RouteCapabilityResolutionInput = Readonly<{
    readonly hookKind: RouteHookKindType | void;
    readonly executionSignature: RouteExecutionSignature | void;
    readonly payloadLocation: RoutePayloadLocation | void;
    readonly schemaRole: 'request' | 'response' | void;
    readonly requestContentType: RequestContentTypeType | void;
    readonly crudRole: CrudRole | void;
    readonly crudEvidence: RouteCapabilityCrudEvidence | void;
    readonly errorResponses: readonly HttpErrorResponseDescriptor[] | void;
    readonly invalidation: ReturnType<typeof RouteSemanticFlowCacheInvalidationDescriptor.none> | void;
    readonly schema: RouteSchemaPayload;
}>;

export function resolveRouteCapability(
    params: RouteCapabilityResolutionInput,
    basics: IntermediateRouteBoundaryBasics,
    parameterCount: number,
    auth: TruthValue,
    method: HttpMethod,
    path: import("../../../../types/upstream/names").RoutePath,
    request: RouteRequestBinding,
): ResolvedRouteCapability {
    return resolveRouteCapabilityJudgment(
        Object.freeze({
            hookKind: presenceOf(params.hookKind),
            executionSignature: presenceOf(params.executionSignature),
            payloadLocation: presenceOf(params.payloadLocation),
            schemaRole: presenceOf(params.schemaRole),
            requestContentType: presenceOf(params.requestContentType),
            crudRole: presenceOf(params.crudRole),
            crudEvidence: presenceOf(params.crudEvidence),
            errorResponses: presenceOf(params.errorResponses),
            invalidation: presenceOf(params.invalidation),
            schema: presenceOf(params.schema),
            auth: presenceOf(auth),
        }),
        basics,
        parameterCount,
        method,
        path,
        request,
    );
}
