/**
 * controllerActionTypes.ts
 *
 * Type contracts and route handler helpers for Controller Actions.
 *
 * @module core/compiler/scanner/descriptors/request/controllerActionTypes
 */

import type {
    ResponseDescriptor,
    RouteValidationRuleEntry,
    FormRequestDescriptor,
    RouteHandlerDescriptor,
    RouteSchemaPayload,
    HttpErrorResponseDescriptor
} from "../../../../types/route";
import { RouteHandlerKind } from "../../../../types/route";
import type { ControllerDataflowContract } from "../../subscanners/controller/controllerDataflowContract";

export type ControllerActionInfo = ScannedControllerActionParams;


/**
 * Level 7 Complete Contract for ScannedControllerActionParams (0 undefined, 0 null, 0 ?:).
 */
export interface ScannedControllerActionParamsContract {
    readonly controllerName: string;
    readonly actionName: string;
    readonly target: string;
    readonly handler: RouteHandlerDescriptor;
    readonly sourceFile: string;
    readonly sourceLine: number;
    readonly response: ResponseDescriptor;
    readonly formRequests: readonly FormRequestDescriptor[];
    readonly schema: RouteSchemaPayload;
    readonly schemaRules: readonly RouteValidationRuleEntry[];
    readonly dataflow: ControllerDataflowContract;
    readonly errorResponses: readonly HttpErrorResponseDescriptor[];
}

export type ScannedControllerActionParams = ScannedControllerActionParamsContract;

/**
 * Level 7 Complete Contract for ControllerActionCreateOptions (0 undefined, 0 null, 0 ?:).
 */
export interface ControllerActionCreateOptionsContract {
    readonly controllerName: string;
    readonly actionName: string;
    readonly sourceFile: string;
    readonly sourceLine: number;
    readonly response: ResponseDescriptor;
    readonly formRequests: readonly FormRequestDescriptor[];
    readonly schema: RouteSchemaPayload;
    readonly schemaRules: readonly RouteValidationRuleEntry[];
    readonly dataflow: ControllerDataflowContract;
    readonly errorResponses: readonly HttpErrorResponseDescriptor[];
}



export function buildRouteHandler(controllerName: string, actionName: string, target: string): RouteHandlerDescriptor {
    return Object.freeze(
        actionName === '__invoke'
            ? { kind: RouteHandlerKind.InvokableController, controllerName, actionName: '__invoke', target }
            : { kind: RouteHandlerKind.ControllerAction, controllerName, actionName, target }
    );
}
