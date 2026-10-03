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
    VoidResponseDescriptor,
    type RouteCacheInvalidationDescriptor,
    RouteHandlerKind
} from "../../../../../types/route";
import { emptyRouteSchemaPayload } from "../../../../../types/domain/validationRules";
import type { RouteSemanticFlowFactory } from "../RouteSemanticFlowFactory";
import { SemanticValueFactory } from "../../../../../types/domain/semanticValues";
import type { RouteBoundaryOptions } from "../../../resolvers";
import type { ActionName, DomainTypeName, ResourceName, RoutePath, SourceFile, PropertyName } from "../../../../../types/upstream/names";
import { relationOptionalFold } from "../../../../../semantic/kernel/relationalSequence";
import type { ControllerReturnSemantic } from "../../../../../types/upstream/controller";

export type ClosureRouteOptions = {
    readonly method: HttpMethod;
    readonly path: RoutePath;
    readonly actionName: ActionName;
    readonly sourceFile: SourceFile;
    readonly sourceLine: number;
    readonly response?: ResponseDescriptor;
    readonly semanticReturn: ControllerReturnSemantic;
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
    createFn: (params: RouteBoundaryOptions) => RouteSemanticFlowFactory,
    options: ClosureRouteOptions
): RouteSemanticFlowFactory {
    const {
        method,
        path,
        domain,
        resourceName,
        actionName,
        sourceFile,
        sourceLine,
        response,
        semanticReturn,
        auth = false,
        middleware = [],
        parameters = [],
        pathParameters,
        queryParameters = [],
        invalidation
    } = options;

    const resolvedResponse = relationOptionalFold(response, () => VoidResponseDescriptor.create(), value => value);

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
            actionName,
            target: SemanticValueFactory.className(`closure@${actionName.value.value}`)
        }),
        sourceFile,
        sourceLine,
        response: resolvedResponse,
        request: { kind: 'no_request' },
        runtimeReturn: { kind: 'none' },
        semanticReturn,
        schema: emptyRouteSchemaPayload(),
        auth,
        middleware,
        parameters,
        pathParameters,
        queryParameters,
        invalidation
    });
}
