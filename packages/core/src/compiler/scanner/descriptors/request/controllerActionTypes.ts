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
import type { ControllerRequestBinding } from './controllerActionContract';
import type { ActionName, ControllerName, SourceFile } from '../../../../types/upstream/names';
import type { ControllerParameterAst } from '../../lexer/controllerAstTypes';
import type { RuntimeReturnContract } from './controllerActionContract';
import type { ControllerReturnSemantic } from '../../../../types/upstream/controller';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import { relationGate } from '../../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../../semantic/foundation/semanticRelations';

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
    readonly semanticReturn: ControllerReturnSemantic;
    readonly request: ControllerRequestBinding;
    readonly schema: RouteSchemaPayload;
    readonly dataflow: ControllerDataflowContract;
    readonly errorResponses: readonly HttpErrorResponseDescriptor[];
    /** Upstream parameter facts retained so route binding can be resolved semantically. */
    readonly parameters: readonly ControllerParameterAst[];
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
    readonly semanticReturn: ControllerReturnSemantic;
    readonly request: ControllerRequestBinding;
    readonly schema: RouteSchemaPayload;
    readonly dataflow: ControllerDataflowContract;
    readonly errorResponses: readonly HttpErrorResponseDescriptor[];
    readonly parameters: readonly ControllerParameterAst[];
}



export function buildRouteHandler(controllerName: ControllerName, actionName: ActionName): RouteHandlerDescriptor {
    const controllerNameValue = controllerName.value.value;
    const actionNameValue = actionName.value.value;
    const target = `${controllerNameValue}@${actionNameValue}`;
    return Object.freeze(
        relationGate(relationEqual(actionNameValue, '__invoke'),
            () => ({ kind: RouteHandlerKind.InvokableController, controllerName: SemanticValueFactory.controllerName(controllerNameValue), actionName: '__invoke', target: SemanticValueFactory.className(target) }),
            () => ({ kind: RouteHandlerKind.ControllerAction, controllerName: SemanticValueFactory.controllerName(controllerNameValue), actionName: actionNameValue, target: SemanticValueFactory.className(target) }))
    );
}
