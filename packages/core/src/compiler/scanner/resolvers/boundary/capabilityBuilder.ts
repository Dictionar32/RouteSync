/**
 * capabilityBuilder.ts
 *
 * Builds RouteCapabilityContract from sparse parameters and intermediate basics.
 *
 * @module core/compiler/scanner/resolvers/boundary
 */

import {
    HttpMethod,
    RouteHookKind,
    RequestContentType,
    ValidationRuleKind,
    RouteCapabilityContract,
    HttpErrorResponseDescriptor
} from "../../../../types/route";
import {
    ScannedRouteCacheInvalidationDescriptor,
    ScannedRouteExecutionSignature
} from "../../../../types/route";
import { ScannedHttpErrorResponseDescriptor } from "../../descriptors/routeDescriptors";
import { RouteCrudClassifier } from "../RouteCrudClassifier";
import { RouteSecurityResolver } from "../RouteSecurityResolver";
import {
    SparseRouteParams,
    IntermediateRouteBoundaryBasics
} from "./boundaryBasics";

export function buildRouteCapabilityContract(
    params: SparseRouteParams,
    basics: IntermediateRouteBoundaryBasics,
    parameterCount: number
): RouteCapabilityContract {
    const resolvedHookKind = params.hookKind
        ? params.hookKind
        : (basics.resolvedIsMutating ? RouteHookKind.Mutation : RouteHookKind.Query);

    const resolvedInvalidation = params.invalidation
        ? params.invalidation
        : ScannedRouteCacheInvalidationDescriptor.none();

    const schema = params.schema;
    const hasValidationRules = Boolean(schema && Array.isArray(schema.rules) && schema.rules.length > 0);
    const resolvedHasPayload = basics.resolvedIsMutating || resolvedHookKind === RouteHookKind.Mutation || hasValidationRules;

    const resolvedSignature = params.executionSignature
        ? params.executionSignature
        : ScannedRouteExecutionSignature.create(resolvedHookKind, parameterCount > 0, !!resolvedHasPayload);

    const upperMethod = params.method.toUpperCase() as HttpMethod;
    let detectedContentType: RequestContentType = RequestContentType.Json;
    if (upperMethod === "GET" || upperMethod === "HEAD") {
        detectedContentType = RequestContentType.None;
    } else if (schema && Array.isArray(schema.rules) && schema.rules.some((r: any) => {
        const ruleList = (r as any).rules || r.ast || [];
        return Array.isArray(ruleList) && ruleList.some((rule: any) => {
            const kind = typeof rule === "string" ? rule : (rule && rule.kind ? rule.kind : "");
            return kind === ValidationRuleKind.File || kind === ValidationRuleKind.Image || kind === "file" || kind === "image";
        });
    })) {
        detectedContentType = RequestContentType.Multipart;
    }
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
    const resolvedErrorResponses: readonly HttpErrorResponseDescriptor[] = Object.freeze(
        params.errorResponses ? params.errorResponses : defaultErrors
    );

    return Object.freeze({
        auth: secPolicies.auth,
        security: secPolicies.security,
        middleware: Object.freeze([...middleware]),
        policies: secPolicies.policies,
        rateLimit: secPolicies.rateLimit,
        invalidation: resolvedInvalidation,
        crudRole: resolvedCrudRole,
        hookKind: resolvedHookKind,
        actionKind: basics.resolvedActionKind,
        isMutating: basics.resolvedIsMutating,
        requestContentType: resolvedContentType,
        executionSignature: resolvedSignature,
        errorResponses: resolvedErrorResponses
    });
}
