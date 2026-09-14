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

export interface ControllerActionInfo {
    readonly controllerName: string;
    readonly actionName: string;
    readonly target: string;
    readonly handler: RouteHandlerDescriptor;
    readonly response: ResponseDescriptor;
    readonly sourceFile: string;
    readonly sourceLine: number;
    readonly formRequests: readonly FormRequestDescriptor[];
    readonly schema: RouteSchemaPayload;
    readonly schemaRules: readonly RouteValidationRuleEntry[];
    readonly resourceModelMap?: ReadonlyMap<string, string>;
    readonly errorResponses?: readonly HttpErrorResponseDescriptor[];
}

export interface ScannedControllerActionParams {
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
    readonly resourceModelMap?: ReadonlyMap<string, string>;
    readonly errorResponses?: readonly HttpErrorResponseDescriptor[];
}

export interface ControllerActionCreateOptions {
    readonly controllerName?: string;
    readonly actionName?: string;
    readonly sourceFile: string;
    readonly sourceLine?: number;
    readonly response?: ResponseDescriptor;
    readonly formRequests?: readonly FormRequestDescriptor[];
    readonly schema?: RouteSchemaPayload;
    readonly schemaRules?: readonly RouteValidationRuleEntry[];
    readonly resourceModelMap?: ReadonlyMap<string, string>;
    readonly errorResponses?: readonly HttpErrorResponseDescriptor[];
}

export function buildRouteHandler(controllerName: string, actionName: string, target: string): RouteHandlerDescriptor {
    return Object.freeze(
        actionName === '__invoke'
            ? { kind: RouteHandlerKind.InvokableController, controllerName, actionName: '__invoke', target }
            : { kind: RouteHandlerKind.ControllerAction, controllerName, actionName, target }
    );
}
