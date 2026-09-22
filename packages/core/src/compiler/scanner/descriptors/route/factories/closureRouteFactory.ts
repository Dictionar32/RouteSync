/**
 * closureRouteFactory.ts
 *
 * Route creation from Closures.
 * Conforms to Level 6/7 Correct-by-Construction: Pure flow, zero any.
 *
 * @module compiler/scanner/descriptors/route/factories
 */

import {
    type HttpMethod,
    type RouteParameter,
    type RouteQueryParameter,
    type ResponseDescriptor,
    ResourceResponseDescriptor,
    type RouteCacheInvalidationDescriptor,
    RouteHandlerKind
} from "../../../../../types/route";
import { ScannedRouteSchemaPayload } from "../../validationDescriptors";
import type { ScannedRouteDescriptor } from "../ScannedRouteDescriptor";
import { SemanticValueFactory } from "../../../../../types/domain/semanticValues";
import type { RouteBoundaryOptions } from "../../../resolvers";
import type { ActionName, DomainTypeName, ResourceName, RoutePath, SourceFile, PropertyName } from "../../../../../types/upstream/names";

export type ClosureRouteOptions = {
    readonly method: HttpMethod;
    readonly path: RoutePath;
    readonly actionName: ActionName;
    readonly sourceFile: SourceFile;
    readonly sourceLine: number;
    readonly response?: ResponseDescriptor;
    readonly domain?: DomainTypeName;
    readonly resourceName?: ResourceName;
    readonly auth?: boolean;
    readonly middleware?: readonly PropertyName[];
    readonly parameters?: readonly RouteParameter[];
    readonly pathParameters?: readonly RouteParameter[];
    readonly queryParameters?: readonly RouteQueryParameter[];
    readonly invalidation?: RouteCacheInvalidationDescriptor;
};

export function createRouteFromClosure(
    createFn: (params: RouteBoundaryOptions) => ScannedRouteDescriptor,
    options: ClosureRouteOptions
): ScannedRouteDescriptor {
    const {
        method,
        path,
        domain,
        resourceName,
        actionName,
        sourceFile,
        sourceLine,
        response,
        auth = false,
        middleware = [],
        parameters = [],
        pathParameters,
        queryParameters = [],
        invalidation
    } = options;

    const resolvedResponse = response !== undefined
        ? response
        : new ResourceResponseDescriptor({ resourceName: `${resourceName ?? "Closure"}Resource`, shape: "single" });

    return createFn({
        origin: "closure",
        method,
        path,
        domain,
        resourceName,
        actionName,
        action: SemanticValueFactory.actionName(`closure@${actionName.value.value}`),
        controllerName: SemanticValueFactory.controllerName(""),
        handler: Object.freeze({
            kind: RouteHandlerKind.Closure,
            actionName: SemanticValueFactory.actionName(actionName),
            target: SemanticValueFactory.className(`closure@${actionName}`)
        }),
        sourceFile,
        sourceLine,
        response: resolvedResponse,
        request: { kind: 'no_request' },
        runtimeReturn: { kind: 'none' },
        schema: ScannedRouteSchemaPayload.empty(),
        auth,
        middleware,
        parameters,
        pathParameters,
        queryParameters,
        invalidation
    });
}
