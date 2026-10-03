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
import type { RouteBoundaryOptions, IntermediateRouteBoundaryBasics } from "./boundaryBasicsTypes";
import type { BaseValidationRuleNode } from "../../../../types/domain/validationRules";
import { relationAny, relationEqual, relationGate } from "../../../../semantic/kernel/semanticRelations";
import { relationProject, relationTextSlice } from "../../../../semantic/kernel/relationalSequence";
import { present, presenceFold, presenceOf, type Presence } from "../../../../types/upstream/presence";

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
    readonly auth: Presence<boolean>;
}>;

export function resolveRouteCapabilityJudgment(
    input: RouteCapabilitySemanticInput,
    basics: IntermediateRouteBoundaryBasics,
    parameterCount: number,
    request: RouteBoundaryOptions['request'],
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
    const method = methodFromBoundary(basics, request.method);
    const requestContentType = presenceFold(input.requestContentType, () => detectContentType(method, input.schema), value => value);
    const crudRole = presenceFold(input.crudRole, () => RouteCrudClassifier.classify(method, request.path), value => value);
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

export function resolveRouteCapability(
    params: RouteBoundaryOptions,
    basics: IntermediateRouteBoundaryBasics,
    parameterCount: number,
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
            auth: presenceOf(params.auth),
        }),
        basics,
        parameterCount,
        params.request,
    );
}

function methodFromBoundary(basics: IntermediateRouteBoundaryBasics, method: HttpMethod): HttpMethod {
    return relationGate(basics.isGetMethod, () => 'GET', () => relationGate(basics.isHeadMethod, () => 'HEAD', () => method));
}

function hasRules(schema: Presence<RouteSchemaPayload>): boolean {
    return presenceFold(schema, () => false, value => relationGate(relationEqual(value.fields.length, 0), () => false, () => true));
}

function resolvePayloadTypeName(
    request: RouteBoundaryOptions['request'],
    basics: IntermediateRouteBoundaryBasics,
): string {
    return relationGate(
        relationEqual(request.kind, 'form_request'),
        () => request.source.identity.requestClass.value,
        () => {
            const action = basics.resolvedActionKind;
            return `${basics.resolvedDomain.value.value}${action.charAt(0).toUpperCase()}${relationTextSlice(action, 1)}Payload`;
        },
    );
}

function defaultErrors(
    isMutating: boolean,
    hasValidationRules: boolean,
    auth: Presence<boolean>,
): readonly HttpErrorResponseDescriptor[] {
    const validation = relationGate(relationAny([isMutating, hasValidationRules]), () => [httpErrorResponseValidation()], () => []);
    const unauthorized = presenceFold(auth, () => [], value => relationGate(value, () => [httpErrorResponseUnauthorized()], () => []));
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
