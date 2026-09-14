/**
 * capabilityBuilder.ts
 *
 * Builds RouteCapabilityContract from sparse parameters and intermediate basics.
 *
 * @module core/compiler/scanner/resolvers/boundary
 */

import {
    HttpMethod, RouteHookKind, RequestContentType, ValidationRuleKind,
    RouteCapabilityContract, HttpErrorResponseDescriptor,
    ScannedRouteCacheInvalidationDescriptor, ScannedRouteExecutionSignature
} from "../../../../types/route";
import { ScannedHttpErrorResponseDescriptor } from "../../descriptors/routeDescriptors";
import { RouteCrudClassifier } from "../RouteCrudClassifier";
import { RouteSecurityResolver } from "../RouteSecurityResolver";
import { SparseRouteParams, IntermediateRouteBoundaryBasics } from "./boundaryBasics";

export function buildRouteCapabilityContract(
    params: SparseRouteParams,
    basics: IntermediateRouteBoundaryBasics,
    parameterCount: number
): RouteCapabilityContract {
    const resolvedHookKind = params.hookKind
        ? params.hookKind
        : (basics.resolvedIsMutating ? RouteHookKind.Mutation : RouteHookKind.Query);

    const schema = params.schema;
    const hasValidationRules = Boolean(schema && Array.isArray(schema.rules) && schema.rules.length > 0);
    const resolvedHasPayload = basics.resolvedIsMutating || resolvedHookKind === RouteHookKind.Mutation || hasValidationRules;

    const payloadTypeName = resolvePayloadTypeName(params, basics, hasValidationRules);
    const resolvedSignature = params.executionSignature
        ? params.executionSignature
        : ScannedRouteExecutionSignature.create(resolvedHookKind, parameterCount > 0, !!resolvedHasPayload, payloadTypeName);

    const upperMethod = params.method.toUpperCase() as HttpMethod;
    const detectedContentType = detectContentType(upperMethod, schema);
    const resolvedContentType = params.requestContentType ? params.requestContentType : detectedContentType;
    const resolvedCrudRole = params.crudRole ? params.crudRole : RouteCrudClassifier.classify(upperMethod, params.path);

    const middleware = params.middleware ? params.middleware : [];
    const auth = params.auth ? params.auth : false;
    const secPolicies = RouteSecurityResolver.resolve(middleware, auth);

    const defaultErrors: readonly HttpErrorResponseDescriptor[] = (
        (basics.resolvedIsMutating || hasValidationRules ? [ScannedHttpErrorResponseDescriptor.unprocessableEntity()] : []).concat(
            auth ? [ScannedHttpErrorResponseDescriptor.unauthorized()] : []
        )
    );

    return Object.freeze({
        auth: secPolicies.auth,
        security: secPolicies.security,
        middleware: Object.freeze([...middleware]),
        policies: secPolicies.policies,
        rateLimit: secPolicies.rateLimit,
        invalidation: params.invalidation || ScannedRouteCacheInvalidationDescriptor.none(),
        crudRole: resolvedCrudRole,
        hookKind: resolvedHookKind,
        actionKind: basics.resolvedActionKind,
        isMutating: basics.resolvedIsMutating,
        requestContentType: resolvedContentType,
        executionSignature: resolvedSignature,
        errorResponses: Object.freeze(params.errorResponses ? params.errorResponses : defaultErrors)
    });
}

function resolvePayloadTypeName(params: SparseRouteParams, basics: IntermediateRouteBoundaryBasics, hasValidationRules: boolean): string {
    if (params.formRequests && params.formRequests.length > 0) {
        const first = params.formRequests[0];
        const name = typeof first === "string" ? first : first.name;
        if (name) return name;
    }
    if (hasValidationRules) {
        const domain = basics.resolvedDomain || 'General';
        const action = basics.resolvedActionKind || 'Action';
        return `${domain}${action.charAt(0).toUpperCase() + action.slice(1)}Payload`;
    }
    return 'any';
}

function isFileOrImageRule(rule: unknown): boolean {
    const kind = typeof rule === "string" ? rule : (rule && typeof rule === "object" && "kind" in rule ? (rule as { kind: unknown }).kind : "");
    return kind === "file" || kind === "image" || kind === ValidationRuleKind.File || kind === ValidationRuleKind.Image;
}

function detectContentType(upperMethod: HttpMethod, schema: SparseRouteParams['schema']): RequestContentType {
    if (upperMethod === "GET" || upperMethod === "HEAD") return RequestContentType.None;
    if (schema && Array.isArray(schema.rules) && schema.rules.some(r => {
        const ruleList = (r as { rules?: unknown; ast?: unknown }).rules || (r as { rules?: unknown; ast?: unknown }).ast;
        return Array.isArray(ruleList) && ruleList.some(isFileOrImageRule);
    })) {
        return RequestContentType.Multipart;
    }
    return RequestContentType.Json;
}
