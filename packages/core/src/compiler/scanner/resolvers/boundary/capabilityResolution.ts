/**
 * Declarative route capability resolution.
 *
 * The semantic authority consumes an explicit Presence algebra. The legacy
 * boundary adapter only translates authoring options into that closed input.
 */
import type {
    HttpMethod,
    RouteExecutionSignature,
    CrudRole,
    RouteSchemaPayload,
    HttpErrorResponseDescriptor,
} from "../../../../types/route";
import {
    RequestContentType,
    RouteHookKind,
    RouteSemanticFlowCacheInvalidationDescriptor,
    RouteSemanticFlowExecutionSignature,
} from "../../../../types/route";
import type { RequestContentType as RequestContentTypeType, RouteHookKind as RouteHookKindType } from "../../../../types/route";
import { httpErrorResponseValidation, httpErrorResponseUnauthorized } from "../../../../types/domain/httpErrors";
import { RouteCrudClassifier } from "../RouteCrudClassifier";
import { ROUTE_ACTION_KIND_REGISTRY } from "../../../../types/route";
import type { RouteBoundaryOptions, ResolvedRouteBoundaryOptions, IntermediateRouteBoundaryBasics } from "./boundaryBasicsTypes";
import type { RouteRequestBinding } from "../../../../types/domain/request";
import type { BaseValidationRuleNode } from "../../../../types/domain/validationRules";
import { relationAny, relationEqual, relationGate } from "../../../../semantic/foundation/semanticRelations";
import { relationProject, relationVariantFold, relationTextSlice } from "../../../../semantic/foundation/relationalSequence";
import { present, presenceFold, presenceOf, type Presence } from "../../../../types/upstream/presence";
import { truthValue, type TruthValue } from "../../../../types/upstream/valueObjects";

export interface ResolvedRouteCapability {
    readonly hookKind: RouteHookKindType;
    readonly crudRole: CrudRole;
    readonly requestContentType: RequestContentTypeType;
    readonly executionSignature: RouteExecutionSignature;
    readonly invalidation: ReturnType<typeof RouteSemanticFlowCacheInvalidationDescriptor.none>;
    readonly errorResponses: readonly HttpErrorResponseDescriptor[];
}

export type RouteCapabilitySemanticInput = Readonly<{
    readonly hookKind: Presence<RouteHookKindType>;
    readonly executionSignature: Presence<RouteExecutionSignature>;
    readonly requestContentType: Presence<RequestContentTypeType>;
    readonly crudRole: Presence<CrudRole>;
    readonly errorResponses: Presence<readonly HttpErrorResponseDescriptor[]>;
    readonly invalidation: Presence<ReturnType<typeof RouteSemanticFlowCacheInvalidationDescriptor.none>>;
    readonly schema: Presence<RouteSchemaPayload>;
    readonly auth: Presence<TruthValue>;
}>;

export function resolveRouteCapabilityJudgment(
    input: RouteCapabilitySemanticInput,
    basics: IntermediateRouteBoundaryBasics,
    parameterCount: number,
    method: HttpMethod,
    path: import("../../../../types/upstream/names").RoutePath,
    request: RouteRequestBinding,
): ResolvedRouteCapability {
    const hookKind = presenceFold(input.hookKind, () => relationGate(basics.resolvedIsMutating, () => RouteHookKind.Mutation, () => RouteHookKind.Query), value => value);
    const hasValidationRules = hasRules(input.schema);
    const hasPayload = relationAny([basics.resolvedIsMutating, hasValidationRules]);
    const payloadTypeName = resolvePayloadTypeName(request, basics);
    const executionSignature = presenceFold(
        input.executionSignature,
        () => RouteSemanticFlowExecutionSignature.create(hookKind, parameterCount > 0, hasPayload, present(payloadTypeName)),
        value => value,
    );
    const resolvedMethod = methodFromBoundary(basics, method);
    const requestContentType = presenceFold(input.requestContentType, () => detectContentType(resolvedMethod, input.schema), value => value);
    const crudRole = presenceFold(input.crudRole, () => RouteCrudClassifier.classify(resolvedMethod, path.value.value), value => value);
    const errorResponses = presenceFold(
        input.errorResponses,
        () => defaultErrors(ROUTE_ACTION_KIND_REGISTRY[basics.resolvedActionKind].isMutating, hasValidationRules, input.auth),
        value => value,
    );
    const invalidation = presenceFold(input.invalidation, () => RouteSemanticFlowCacheInvalidationDescriptor.none(), value => value);
    return Object.freeze({
        hookKind,
        crudRole,
        requestContentType,
        executionSignature,
        invalidation,
        errorResponses: Object.freeze([...errorResponses]),
    });
}

type RouteCapabilityResolutionInput = Readonly<{
    readonly hookKind: RouteHookKindType | void;
    readonly executionSignature: RouteExecutionSignature | void;
    readonly requestContentType: RequestContentTypeType | void;
    readonly crudRole: CrudRole | void;
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
            requestContentType: presenceOf(params.requestContentType),
            crudRole: presenceOf(params.crudRole),
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

function methodFromBoundary(basics: IntermediateRouteBoundaryBasics, method: HttpMethod): HttpMethod {
    return relationGate(basics.isGetMethod, () => 'GET', () => relationGate(basics.isHeadMethod, () => 'HEAD', () => method));
}

function hasRules(schema: Presence<RouteSchemaPayload>): boolean {
    return presenceFold(schema, () => false, value => relationGate(relationEqual(value.fields.length, 0), () => false, () => true));
}

function resolvePayloadTypeName(
    request: RouteRequestBinding,
    basics: IntermediateRouteBoundaryBasics,
): string {
    return relationVariantFold(
        request,
        'form_request',
        () => {
            const action = basics.resolvedActionKind;
            return `${basics.resolvedDomain.value.value}${action.charAt(0).toUpperCase()}${relationTextSlice(action, 1)}Payload`;
        },
        value => value.identity.source.requestClass.value.value,
    );
}

function defaultErrors(
    isMutating: boolean,
    hasValidationRules: boolean,
    auth: Presence<TruthValue>,
): readonly HttpErrorResponseDescriptor[] {
    const validation = relationGate(relationAny([isMutating, hasValidationRules]), () => [httpErrorResponseValidation()], () => []);
    const unauthorized = presenceFold(auth, () => [], value => relationGate(value.value, () => [httpErrorResponseUnauthorized()], () => []));
    return Object.freeze([...validation, ...unauthorized]);
}

function detectContentType(
    method: HttpMethod,
    schema: Presence<RouteSchemaPayload>,
): RequestContentTypeType {
    return relationGate(
        relationAny([relationEqual(method, "GET"), relationEqual(method, "HEAD")]),
        () => RequestContentType.None,
        () => presenceFold(
            schema,
            () => RequestContentType.Json,
            value => relationGate(
                relationAny(relationProject(value.fields, field => relationAny(relationProject(field.validation, containsFileRule)))),
                () => RequestContentType.Multipart,
                () => RequestContentType.Json,
            ),
        ),
    );
}

function containsFileRule(rule: BaseValidationRuleNode): boolean {
    return relationAny([relationEqual(rule.kind, "file"), relationEqual(rule.kind, "image")]);
}
