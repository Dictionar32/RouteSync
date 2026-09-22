/**
 * capabilityResolution.ts
 *
 * Resolves route capability values at the origin boundary.
 */

import type {
    HttpMethod,
    RouteExecutionSignature,
    CrudRole,
    RouteSchemaPayload,
    HttpErrorResponseDescriptor
} from "../../../../types/route";
import { RequestContentType, RouteHookKind, ScannedRouteCacheInvalidationDescriptor, ScannedRouteExecutionSignature } from "../../../../types/route";
import type { RequestContentType as RequestContentTypeType, RouteHookKind } from "../../../../types/route";
import { ScannedHttpErrorResponseDescriptor } from "../../descriptors/routeDescriptors";
import { RouteCrudClassifier } from "../RouteCrudClassifier";
import { ROUTE_ACTION_KIND_REGISTRY } from "../../../../types/route";
import { RouteBoundaryOptions, IntermediateRouteBoundaryBasics, ResolvedRouteBoundaryOptions } from "./boundaryBasicsTypes";

export interface ResolvedRouteCapability {
    readonly hookKind: RouteHookKind;
    readonly crudRole: CrudRole;
    readonly requestContentType: RequestContentTypeType;
    readonly executionSignature: RouteExecutionSignature;
    readonly invalidation: ReturnType<typeof ScannedRouteCacheInvalidationDescriptor.none>;
    readonly errorResponses: readonly HttpErrorResponseDescriptor[];
}

export function resolveRouteCapability(
    params: RouteBoundaryOptions,
    basics: IntermediateRouteBoundaryBasics,
    parameterCount: number
): ResolvedRouteCapability {
    const hookKind = params.hookKind
        ? params.hookKind
        : (basics.resolvedIsMutating ? RouteHookKind.Mutation : RouteHookKind.Query);
    const schema = params.schema;
    const hasValidationRules = hasRules(schema);
    const hasPayload = basics.resolvedIsMutating || hasValidationRules;
    const payloadTypeName = resolvePayloadTypeName(params, basics, hasValidationRules);
    const executionSignature = params.executionSignature
        ? params.executionSignature
        : ScannedRouteExecutionSignature.create(hookKind, parameterCount > 0, hasPayload, payloadTypeName);
    const method = params.method.toUpperCase() as HttpMethod;
    const requestContentType = params.requestContentType
        ? params.requestContentType
        : detectContentType(method, schema);
    const crudRole = params.crudRole
        ? params.crudRole
        : RouteCrudClassifier.classify(method, params.path);
    const errorResponses = params.errorResponses
        ? params.errorResponses
        : defaultErrors(ROUTE_ACTION_KIND_REGISTRY[basics.resolvedActionKind].isMutating, hasValidationRules, params.auth === true);
    const invalidation = params.invalidation
        ? params.invalidation
        : ScannedRouteCacheInvalidationDescriptor.none();

    return Object.freeze({
        hookKind,
        crudRole,
        requestContentType,
        executionSignature,
        invalidation,
        errorResponses: Object.freeze([...errorResponses])
    });
}

function hasRules(schema: RouteSchemaPayload | undefined): boolean {
    return schema !== undefined && schema.fields.length > 0;
}

function resolvePayloadTypeName(
    params: RouteBoundaryOptions,
    basics: IntermediateRouteBoundaryBasics,
    hasValidationRules: boolean
): string {
    if (params.request.kind === 'form_request') {
        return params.request.source.identity.requestClass.value;
    }
    if (hasValidationRules) {
        const action = basics.resolvedActionKind;
        return `${basics.resolvedDomain.value.value}${action.charAt(0).toUpperCase()}${action.slice(1)}Payload`;
    }
    return "any";
}

function defaultErrors(
    isMutating: boolean,
    hasValidationRules: boolean,
    auth: boolean
): readonly HttpErrorResponseDescriptor[] {
    const errors: HttpErrorResponseDescriptor[] = [];
    if (isMutating || hasValidationRules) {
        errors.push(ScannedHttpErrorResponseDescriptor.unprocessableEntity());
    }
    if (auth) {
        errors.push(ScannedHttpErrorResponseDescriptor.unauthorized());
    }
    return errors;
}

function detectContentType(
    method: HttpMethod,
    schema: RouteSchemaPayload | undefined
): RequestContentTypeType {
    if (method === "GET" || method === "HEAD") {
        return RequestContentType.None;
    }
    if (schema !== undefined && schema.fields.some(field => field.validation.some(containsFileRule))) {
        return RequestContentType.Multipart;
    }
    return RequestContentType.Json;
}

function containsFileRule(rule: { readonly kind: string }): boolean {
    return rule.kind === "file" || rule.kind === "image";
}
