/**
 * controllerActionTypes.ts
 *
 * Type contracts and route handler helpers for Controller Actions.
 *
 * @module core/compiler/scanner/descriptors/request/controllerActionTypes
 */

import type {
    ResponseDescriptor,
    RouteHandlerDescriptor,
    RouteSchemaPayload,
    HttpErrorResponseDescriptor
} from "../../../../types/route";
import { RouteHandlerKind } from "../../../../types/route";
import type { ControllerDataflowContract } from "../../subscanners/controller/controllerDataflowContract";
import type { RouteRequestBinding } from "../../../../types/domain/request";
import type { ActionName, ControllerName, SourceFile } from '../../../../types/upstream/names';
import type { RuntimeReturnContract } from './controllerActionContract';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';

export type ControllerActionInfo = ScannedControllerActionParams;


/**
 * Level 7 Complete Contract for ScannedControllerActionParams (0 undefined, 0 null, 0 ?:).
 */
export interface ScannedControllerActionParamsContract {
    readonly controllerName: ControllerName;
    readonly actionName: ActionName;
    readonly handler: RouteHandlerDescriptor;
    readonly sourceFile: SourceFile;
    readonly sourceLine: number;
    readonly response: ResponseDescriptor;
    readonly runtimeReturn: RuntimeReturnContract;
    readonly request: RouteRequestBinding;
    readonly schema: RouteSchemaPayload;
    readonly dataflow: ControllerDataflowContract;
    readonly errorResponses: readonly HttpErrorResponseDescriptor[];
}

export type ScannedControllerActionParams = ScannedControllerActionParamsContract;

export type ControllerActionCreateOptions = ControllerActionCreateOptionsContract;

/**
 * Level 7 Complete Contract for ControllerActionCreateOptions (0 undefined, 0 null, 0 ?:).
 */
export interface ControllerActionCreateOptionsContract {
    readonly controllerName: ControllerName;
    readonly actionName: ActionName;
    readonly sourceFile: SourceFile;
    readonly sourceLine: number;
    readonly response: ResponseDescriptor;
    readonly runtimeReturn: RuntimeReturnContract;
    readonly request: RouteRequestBinding;
    readonly schema: RouteSchemaPayload;
    readonly dataflow: ControllerDataflowContract;
    readonly errorResponses: readonly HttpErrorResponseDescriptor[];
}



export function buildRouteHandler(controllerName: ControllerName, actionName: ActionName): RouteHandlerDescriptor {
    const controllerNameValue = controllerName.value.value;
    const actionNameValue = actionName.value.value;
    const target = `${controllerNameValue}@${actionNameValue}`;
    return Object.freeze(
        actionNameValue === '__invoke'
            ? { kind: RouteHandlerKind.InvokableController, controllerName: controllerNameValue, actionName: '__invoke', target: SemanticValueFactory.className(target) }
            : { kind: RouteHandlerKind.ControllerAction, controllerName: controllerNameValue, actionName: actionNameValue, target: SemanticValueFactory.className(target) }
    );
}
