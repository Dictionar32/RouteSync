/**
 * Declarative route capability resolution.
 * Optional authoring inputs are boundary evidence; capability selection is a
 * relation catalog, not imperative branching.
 */

import type {
    HttpMethod,
    RouteExecutionSignature,
    CrudRole,
    RouteSchemaPayload,
    HttpErrorResponseDescriptor
} from "../../../../types/route";
import {
    RequestContentType,
    RouteHookKind,
    RouteSemanticFlowCacheInvalidationDescriptor,
    RouteSemanticFlowExecutionSignature
} from "../../../../types/route";
import type { RequestContentType as RequestContentTypeType, RouteHookKind as RouteHookKindType } from "../../../../types/route";
import { httpErrorResponseValidation, httpErrorResponseUnauthorized } from "../../../../types/domain/httpErrors";
import { RouteCrudClassifier } from "../RouteCrudClassifier";
import { ROUTE_ACTION_KIND_REGISTRY } from "../../../../types/route";
import { RouteBoundaryOptions, IntermediateRouteBoundaryBasics } from "./boundaryBasicsTypes";
import { relationAll, relationAny, relationEqual, relationGate } from "../../../../semantic/kernel/semanticRelations";
import { relationProject, relationTextSlice } from "../../../../semantic/kernel/relationalSequence";
import { present } from "../../../../types/upstream/presence";

export interface ResolvedRouteCapability {
    readonly hookKind: RouteHookKindType;
    readonly crudRole: CrudRole;
    readonly requestContentType: RequestContentTypeType;
    readonly executionSignature: RouteExecutionSignature;
    readonly invalidation: ReturnType<typeof RouteSemanticFlowCacheInvalidationDescriptor.none>;
    readonly errorResponses: readonly HttpErrorResponseDescriptor[];
}

const optional = <T>(value: T | void, fallback: T): T =>
    relationGate(Boolean(value), () => value as T, () => fallback);

export function resolveRouteCapability(
    params: RouteBoundaryOptions,
    basics: IntermediateRouteBoundaryBasics,
    parameterCount: number
): ResolvedRouteCapability {
    const hookKind = optional(
        params.hookKind,
        relationGate(basics.resolvedIsMutating, () => RouteHookKind.Mutation, () => RouteHookKind.Query),
    );
    const schema = params.schema;
    const hasValidationRules = hasRules(schema);
    const hasPayload = relationAny([basics.resolvedIsMutating, hasValidationRules]);
    const payloadTypeName = resolvePayloadTypeName(params, basics);
    const executionSignature = optional(
        params.executionSignature,
        RouteSemanticFlowExecutionSignature.create(
            hookKind,
            parameterCount > 0,
            hasPayload,
            present(payloadTypeName),
        ),
    );
    const method = params.method.toUpperCase() as HttpMethod;
    const requestContentType = optional(
        params.requestContentType,
        detectContentType(method, schema),
    );
    const crudRole = optional(
        params.crudRole,
        RouteCrudClassifier.classify(method, params.path),
    );
    const errorResponses = optional(
        params.errorResponses,
        defaultErrors(
            ROUTE_ACTION_KIND_REGISTRY[basics.resolvedActionKind].isMutating,
            hasValidationRules,
            Boolean(params.auth),
        ),
    );
    const invalidation = optional(
        params.invalidation,
        RouteSemanticFlowCacheInvalidationDescriptor.none(),
    );

    return Object.freeze({
        hookKind,
        crudRole,
        requestContentType,
        executionSignature,
        invalidation,
        errorResponses: Object.freeze([...errorResponses])
    });
}

function hasRules(schema: RouteSchemaPayload | void): boolean {
    return relationGate(Boolean(schema), () => Boolean((schema as RouteSchemaPayload).fields.length), () => false);
}

function resolvePayloadTypeName(
    params: RouteBoundaryOptions,
    basics: IntermediateRouteBoundaryBasics
): string {
    return relationGate(
        relationEqual(params.request.kind, 'form_request'),
        () => params.request.source.identity.requestClass.value,
        () => {
            const action = basics.resolvedActionKind;
            return `${basics.resolvedDomain.value.value}${action.charAt(0).toUpperCase()}${relationTextSlice(action, 1)}Payload`;
        },
    );
}

function defaultErrors(
    isMutating: boolean,
    hasValidationRules: boolean,
    auth: boolean
): readonly HttpErrorResponseDescriptor[] {
    const conditions: readonly boolean[] = [
        relationAny([isMutating, hasValidationRules]),
        auth,
    ];
    return Object.freeze([
        ...relationGate(conditions[0], () => [httpErrorResponseValidation()], () => []),
        ...relationGate(conditions[1], () => [httpErrorResponseUnauthorized()], () => []),
    ]);
}

function detectContentType(
    method: HttpMethod,
    schema: RouteSchemaPayload | void
): RequestContentTypeType {
    return relationGate(
        relationAny([relationEqual(method, "GET"), relationEqual(method, "HEAD")]),
        () => RequestContentType.None,
        () => relationGate(
            relationAll([
                Boolean(schema),
                relationAny(relationProject((schema as RouteSchemaPayload).fields, field =>
                    relationAny(relationProject(field.validation, containsFileRule)),
                )),
            ]),
            () => RequestContentType.Multipart,
            () => RequestContentType.Json,
        ),
    );
}

function containsFileRule(rule: { readonly kind: string }): boolean {
    return relationAny([relationEqual(rule.kind, "file"), relationEqual(rule.kind, "image")]);
}
