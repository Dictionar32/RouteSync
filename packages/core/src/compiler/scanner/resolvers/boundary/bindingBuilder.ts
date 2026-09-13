/**
 * bindingBuilder.ts
 *
 * Builds RouteBindingContract from sparse parameters and intermediate basics.
 *
 * @module core/compiler/scanner/resolvers/boundary
 */

import {
    RouteBindingContract,
    RouteHandlerDescriptor,
    RouteHandlerKind,
    FormRequestDescriptor,
    ResourceResponseDescriptor,
    RouteSchemaPayload
} from "../../../../types/route";
import { toPascalCase } from "../../../../utils/resource-naming";
import { ScannedRouteSchemaPayload } from "../../descriptors/validationDescriptors";
import {
    SparseRouteParams,
    IntermediateRouteBoundaryBasics
} from "./boundaryBasics";

export function buildRouteBindingContract(
    params: SparseRouteParams,
    basics: IntermediateRouteBoundaryBasics
): RouteBindingContract {
    let resolvedHandler: RouteHandlerDescriptor;
    if (params.handler) {
        resolvedHandler = params.handler;
    } else if (basics.resolvedControllerName) {
        if (basics.resolvedActionName === "__invoke" || basics.resolvedActionName === "invoke") {
            resolvedHandler = Object.freeze({
                kind: RouteHandlerKind.InvokableController,
                controllerName: basics.resolvedControllerName,
                actionName: "__invoke",
                target: `${basics.resolvedControllerName}@__invoke`
            });
        } else {
            resolvedHandler = Object.freeze({
                kind: RouteHandlerKind.ControllerAction,
                controllerName: basics.resolvedControllerName,
                actionName: basics.resolvedActionName,
                target: `${basics.resolvedControllerName}@${basics.resolvedActionName}`
            });
        }
    } else {
        resolvedHandler = Object.freeze({
            kind: RouteHandlerKind.Closure,
            actionName: basics.resolvedActionName,
            target: `closure@${basics.resolvedActionName}`
        });
    }

    const formRequestsInput = params.formRequests ? params.formRequests : [];
    const resolvedFormRequests: readonly FormRequestDescriptor[] = Object.freeze(
        formRequestsInput.map(fr => typeof fr === "string"
            ? Object.freeze({ name: fr, sourceFile: `app/Http/Requests/${fr}.php` })
            : fr
        )
    );

    const schema: RouteSchemaPayload = params.schema ? params.schema : ScannedRouteSchemaPayload.empty();

    const resolvedResponse = params.response
        ? params.response
        : new ResourceResponseDescriptor({
            resourceName: `${basics.fallbackResource.charAt(0).toUpperCase() + basics.fallbackResource.slice(1)}Resource`,
            shape: "single"
        });

    return Object.freeze({
        handler: resolvedHandler,
        action: basics.resolvedAction,
        actionName: basics.resolvedActionName,
        controllerName: basics.resolvedControllerName,
        schema,
        response: resolvedResponse,
        responseTypeName: `${toPascalCase(basics.fallbackResource)}Response`,
        formRequests: resolvedFormRequests,
        assignments: Object.freeze([])
    });
}
