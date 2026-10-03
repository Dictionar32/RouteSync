/**
 * syntheticRouteFactory.ts
 *
 * Synthetic route fixture creation.
 * Conforms to Level 6/7 Correct-by-Construction: Pure flow, zero any.
 *
 * @module compiler/scanner/descriptors/route/factories
 */

import {
    type HttpMethod,
    type RouteParameter,
    type ResponseDescriptor,
    ResourceResponseDescriptor,
    type RouteCacheInvalidationDescriptor,
    RouteSemanticFlowCacheInvalidationDescriptor,
    RouteHandlerKind
} from "../../../../../types/route";
import { emptyRouteSchemaPayload } from "../../../../types/domain/validationRules";
import { relationOptionalFold } from "../../../../../semantic/kernel/relationalSequence";
import type { RouteSemanticFlowFactory } from "../RouteSemanticFlowFactory";
import type { RouteBoundaryOptions } from "../../../resolvers";
import type { ActionName, DomainTypeName, ResourceName, RoutePath, SourceFile } from "../../../../../types/upstream/names";
import { SemanticValueFactory as SVF } from "../../../../../types/domain/semanticValues";

export type SyntheticRouteOptions = {
    readonly method?: HttpMethod;
    readonly path?: RoutePath;
    readonly domain?: DomainTypeName;
    readonly resourceName?: ResourceName;
    readonly actionName?: ActionName;
    readonly response?: ResponseDescriptor;
    readonly auth?: boolean;
    readonly middleware?: readonly import("../../../../../types/upstream/names").PropertyName[];
    readonly parameters?: readonly RouteParameter[];
    readonly invalidation?: RouteCacheInvalidationDescriptor;
    readonly sourceFile?: SourceFile;
    readonly sourceLine?: number;
};

export function createSyntheticRoute(
    createFn: (params: RouteBoundaryOptions) => RouteSemanticFlowFactory,
    options: SyntheticRouteOptions = {}
): RouteSemanticFlowFactory {
    const {
        method = "GET",
        path = SVF.routePath("/synthetic"),
        domain = SVF.domainName("Synthetic"),
        resourceName = SVF.resourceName("Synthetic"),
        actionName = SVF.actionName("index"),
        response,
        auth = false,
        middleware = [],
        parameters = [],
        invalidation,
        sourceFile,
        sourceLine
    } = options;

    return createFn({
        origin: "synthetic",
        method,
        path,
        domain,
        resourceName,
        actionName,
        action: SVF.actionName(`synthetic@${actionName.value.value}`),
        controllerName: SVF.controllerName("SyntheticController"),
        handler: Object.freeze({
            kind: RouteHandlerKind.ControllerAction,
            controllerName: SVF.className("SyntheticController"),
            actionName,
            target: SVF.className(`synthetic@${actionName.value.value}`)
        }),
        sourceFile: relationOptionalFold(sourceFile, () => SVF.sourceFilePath("<synthetic>"), value => value),
        sourceLine: relationOptionalFold(sourceLine, () => 0, value => value),
        response: relationOptionalFold(response, () => ResourceResponseDescriptor.single(SVF.resourceName(`${resourceName.value.value}Resource`)), value => value),
        request: { kind: 'no_request' },
        runtimeReturn: { kind: 'none' },
        semanticReturn: { kind: 'absent' },
        schema: emptyRouteSchemaPayload(),
        auth,
        middleware,
        parameters,
        invalidation: relationOptionalFold(invalidation, () => RouteSemanticFlowCacheInvalidationDescriptor.none(), value => value)
    });
}
