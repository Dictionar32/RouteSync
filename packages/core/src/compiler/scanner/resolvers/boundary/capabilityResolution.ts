/**
 * capabilityResolution.ts
 *
 * Resolves route capability values at the origin boundary.
 */

import type {
    HttpMethod,
    RequestContentType,
    RouteExecutionSignature,
    RouteHookKind,
    CrudRole,
    RequestContentType as RequestContentTypeVocabulary,
    RouteHookKind as RouteHookKindVocabulary,
    RouteSchemaPayload,
    HttpErrorResponseDescriptor
} from "../../../../types/route";
import { ScannedRouteCacheInvalidationDescriptor, ScannedRouteExecutionSignature } from "../../../../types/route";
import { ScannedHttpErrorResponseDescriptor } from "../../descriptors/routeDescriptors";
import { RouteCrudClassifier } from "../RouteCrudClassifier";
import { RouteBoundaryOptions, IntermediateRouteBoundaryBasics, ResolvedRouteBoundaryOptions } from "./boundaryBasicsTypes";

export interface ResolvedRouteCapability {
    readonly hookKind: RouteHookKind;
    readonly crudRole: CrudRole;
    readonly requestContentType: RequestContentType;
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
        : (basics.resolvedIsMutating ? RouteHookKindVocabulary.Mutation : RouteHookKindVocabulary.Query);
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
        : defaultErrors(basics.resolvedIsMutating, hasValidationRules, params.auth === true);
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
    return schema !== undefined && schema.rules.length > 0;
}

function resolvePayloadTypeName(
    params: RouteBoundaryOptions,
    basics: IntermediateRouteBoundaryBasics,
    hasValidationRules: boolean
): string {
    if (params.formRequests !== undefined && params.formRequests.length > 0) {
        const first = params.formRequests[0];
        return first.name.value;
    }
    if (hasValidationRules) {
        const action = basics.resolvedActionKind;
        return `${basics.resolvedDomain}${action.charAt(0).toUpperCase()}${action.slice(1)}Payload`;
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
): RequestContentType {
    if (method === "GET" || method === "HEAD") {
        return RequestContentTypeVocabulary.None;
    }
    if (schema !== undefined && schema.rules.some(rule => containsFileRule(rule))) {
        return RequestContentTypeVocabulary.Multipart;
    }
    return RequestContentTypeVocabulary.Json;
}

function containsFileRule(rule: unknown): boolean {
    if (typeof rule === "string") {
        return rule === "file" || rule === "image";
    }
    if (rule === null || typeof rule !== "object") {
        return false;
    }
    if (!("kind" in rule)) {
        return false;
    }
    const kind = rule.kind;
    return kind === "file" || kind === "image";
}
