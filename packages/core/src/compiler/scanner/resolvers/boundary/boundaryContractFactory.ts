/**
 * boundaryContractFactory.ts
 *
 * Origin Boundary Factory: Converts perimeter options into complete RouteBoundaryContract.
 * Enforces Level 6/7 Correct-by-Construction: 100% non-nullable, frozen contracts.
 *
 * @module core/compiler/scanner/resolvers/boundary
 */

import {
    type RouteBoundaryContract,
    type RouteBoundaryOptions,
    resolveRouteBoundaryBasics
} from "./boundaryBasics";
import { deriveRouteConstantKey } from "./identityBuilder";
import { RouteCrudClassifier } from "../RouteCrudClassifier";
import {
    type HttpMethod,
    RequestContentType,
    RouteHookKind,
    ScannedRouteCacheInvalidationDescriptor,
    ScannedRouteExecutionSignature
} from "../../../../types/route";
import { ScannedRouteSchemaPayload } from "../../descriptors/validationDescriptors";
import { toCamelCase } from "../../../../utils/resource-naming";

export class RouteBoundaryContractFactory {
    /**
     * Constructs a guaranteed complete RouteBoundaryContract from perimeter options.
     * Pure Flow: 0 '?' in output, completely non-nullable and frozen.
     */
    public static create(options: RouteBoundaryOptions): RouteBoundaryContract {
        const basics = resolveRouteBoundaryBasics(options);
        const upperMethod = options.method.toUpperCase() as HttpMethod;
        const resolvedHookKind = options.hookKind ?? (basics.resolvedIsMutating ? RouteHookKind.Mutation : RouteHookKind.Query);
        const resolvedCrudRole = options.crudRole ?? RouteCrudClassifier.classify(upperMethod, options.path);
        const resolvedConstantKey = options.constantKey ?? deriveRouteConstantKey(options.path);
        const resolvedGroupName = options.groupName ?? toCamelCase(basics.fallbackResource);
        const resolvedResourceName = options.resourceName ?? basics.fallbackResource;
        const resolvedDomain = options.domain ?? basics.resolvedDomain;
        const resolvedRuntimePath = options.runtimePath ?? options.path;

        return Object.freeze({
            name: options.name ?? "",
            method: upperMethod,
            path: options.path,
            resourceName: resolvedResourceName,
            domain: resolvedDomain,
            groupName: resolvedGroupName,
            runtimePath: resolvedRuntimePath,
            constantKey: resolvedConstantKey,
            controllerName: basics.resolvedControllerName,
            actionName: basics.resolvedActionName,
            actionTarget: basics.resolvedAction,
            actionKind: basics.resolvedActionKind,
            isMutating: basics.resolvedIsMutating,
            crudRole: resolvedCrudRole,
            hookKind: resolvedHookKind,
            invalidation: options.invalidation ?? ScannedRouteCacheInvalidationDescriptor.none(),
            executionSignature: options.executionSignature ?? ScannedRouteExecutionSignature.create(resolvedHookKind, false, false, "void"),
            requestContentType: options.requestContentType ?? (basics.resolvedIsMutating ? RequestContentType.Json : RequestContentType.None),
            auth: options.auth ?? false,
            middleware: Object.freeze([...(options.middleware ?? [])]),
            parameters: Object.freeze([...(options.parameters ?? [])]),
            pathParameters: Object.freeze([...(options.pathParameters ?? [])]),
            queryParameters: Object.freeze([...(options.queryParameters ?? [])]),
            response: options.response ?? Object.freeze({ kind: "void" as const, status: 200, headers: [] } as any),
            errorResponses: Object.freeze([...(options.errorResponses ?? [])]),
            sourceFile: options.sourceFile ?? "",
            sourceLine: options.sourceLine ?? 0,
            schema: options.schema ?? ScannedRouteSchemaPayload.empty(),
            formRequests: Object.freeze([...(options.formRequests ?? [])]),
            handler: options.handler ?? Object.freeze({
                kind: "closure" as any,
                actionName: basics.resolvedActionName,
                target: `closure@${basics.resolvedActionName}`
            })
        });
    }
}
