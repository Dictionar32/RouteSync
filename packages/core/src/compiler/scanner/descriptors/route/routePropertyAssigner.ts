/**
 * routePropertyAssigner.ts
 *
 * Direct field binder from Sub-Contracts to ParsedRoute shape.
 * Rule 10 & 14 Compliant: 0 '?', 0 '??', 0 '?.', direct pure assignment.
 *
 * @module core/compiler/scanner/descriptors/route/routePropertyAssigner
 */

import type { ParsedRoute } from "../../../../types/route";
import type { ScannedRouteConstructorInput } from "./routeContracts";

/**
 * Binds all 4 holistic sub-contracts onto the route instance.
 */
export function assignRouteProperties(
    target: ParsedRoute,
    params: ScannedRouteConstructorInput
): void {
    const mutable = target as any;
    // 1. Holistic Sub-Contracts
    mutable.identity = params.identity;
    mutable.binding = params.binding;
    mutable.capability = params.capability;
    mutable.provenance = params.provenance;
    mutable.contract = params.contract;

    // 2. Identity Flat Fields
    mutable.name = params.identity.name;
    mutable.method = params.identity.method;
    mutable.path = params.identity.path;
    mutable.resourceName = params.identity.resourceName;
    mutable.domain = params.identity.domain;
    mutable.groupName = params.identity.groupName;
    mutable.runtimePath = params.identity.runtimePath;
    mutable.parameters = params.identity.parameters.all;
    mutable.pathParameters = params.identity.parameters.path;
    mutable.queryParameters = params.identity.parameters.query;

    // 3. Binding Flat Fields
    mutable.handler = params.binding.handler;
    mutable.action = params.binding.action;
    mutable.actionName = params.binding.actionName;
    mutable.controllerName = params.binding.controllerName;
    mutable.schema = params.binding.schema;
    mutable.response = params.binding.response;
    mutable.responseTypeName = params.binding.responseTypeName;
    mutable.formRequests = params.binding.formRequests;
    mutable.assignments = params.binding.assignments;

    // 4. Capability Flat Fields
    mutable.auth = params.capability.auth;
    mutable.security = params.capability.security;
    mutable.middleware = params.capability.middleware;
    mutable.policies = params.capability.policies;
    mutable.rateLimit = params.capability.rateLimit;
    mutable.invalidation = params.capability.invalidation;
    mutable.crudRole = params.capability.crudRole;
    mutable.hookKind = params.capability.hookKind;
    mutable.actionKind = params.capability.actionKind;
    mutable.isMutating = params.capability.isMutating;
    mutable.requestContentType = params.capability.requestContentType;
    mutable.executionSignature = params.capability.executionSignature;
    mutable.errorResponses = params.capability.errorResponses;

    // 5. Provenance Flat Fields
    mutable.sourceFile = params.provenance.sourceFile;
    mutable.sourceLine = params.provenance.sourceLine;
    mutable.uri = params.provenance.uri;
}
