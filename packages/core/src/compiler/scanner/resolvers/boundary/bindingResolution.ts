/**
 * bindingResolution.ts
 *
 * Resolves route binding as a closed semantic judgment before contract construction.
 */

import type { RouteRequestBinding } from "../../../../types/domain/request";
import type { RouteOperationBinding } from "../../../../types/domain/routes";
import type { RouteHandlerDescriptor } from "../../../../types/route";
import type { ActionName, ControllerName } from "../../../../types/upstream/names";

export interface ResolvedRouteBinding {
    readonly operation: RouteOperationBinding;
    readonly request: RouteRequestBinding;
}

export function resolveRouteBinding(
    params: Readonly<{
        readonly controllerName: ControllerName;
        readonly action: ActionName;
        readonly handler: RouteHandlerDescriptor;
        readonly request: RouteRequestBinding;
    }>
): ResolvedRouteBinding {
    return Object.freeze({
        operation: Object.freeze({
            controllerName: params.controllerName,
            name: params.action,
            handler: params.handler
        }),
        request: params.request
    });
}
