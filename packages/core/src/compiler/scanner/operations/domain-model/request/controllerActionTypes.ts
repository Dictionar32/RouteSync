/**
 * controllerActionTypes.ts
 *
 * Type contracts and route handler helpers for Controller Actions.
 *
 * @module core/compiler/scanner/operations/domain-model/request/controllerActionTypes
 */

import type {
    ResponseDescriptor,
    RouteHandlerDescriptor,
    RouteSchemaPayload,
    HttpErrorResponseDescriptor
} from "../../../../../types/route";
import { RouteHandlerKind } from "../../../../../types/route";
import type { ControllerActionDataflowContract } from './controllerActionContract';
import type { ControllerRequestBinding } from './controllerActionContract';
import type { ActionName, ControllerName, SourceFile } from '../../../../../types/upstream/names';
import type { ControllerParameterAst } from '../../../../frontend/php/controllerAstTypes';
import type { RuntimeReturnContract } from './controllerActionContract';
import type { ControllerReturnSemantic } from '../../../../../types/upstream/controller';
import type { RouteRequestSchemaEvidence } from '../../../../../types/upstream/controllerActionSchemaSemanticJudgmentInterface';
import { SemanticValueFactory } from '../../../../../types/domain/semanticValues';

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
    readonly schemaEvidence: RouteRequestSchemaEvidence<SourceFile>;
    readonly dataflow: ControllerActionDataflowContract;
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
    readonly schemaEvidence: RouteRequestSchemaEvidence<SourceFile>;
    readonly dataflow: ControllerActionDataflowContract;
    readonly errorResponses: readonly HttpErrorResponseDescriptor[];
    readonly parameters: readonly ControllerParameterAst[];
}



function buildRouteHandlerImplementation(
    controllerName: ControllerName,
    actionName: ActionName,
): RouteHandlerDescriptor {
    const controllerNameValue = controllerName.value.value;
    const actionNameValue = actionName.value.value;
    const target = `${controllerNameValue}@${actionNameValue}`;

    if (actionNameValue === '__invoke') {
        return Object.freeze({
            kind: RouteHandlerKind.InvokableController,
            controllerName: SemanticValueFactory.className(controllerNameValue),
            actionName: SemanticValueFactory.actionName('__invoke'),
            target: SemanticValueFactory.className(target),
        });
    }

    return Object.freeze({
        kind: RouteHandlerKind.ControllerAction,
        controllerName: SemanticValueFactory.className(controllerNameValue),
        actionName,
        target: SemanticValueFactory.className(target),
    });
}

export interface ControllerActionTypeOperationsInterface {
    readonly buildRouteHandler: (
        controllerName: ControllerName,
        actionName: ActionName,
    ) => RouteHandlerDescriptor;
}

export const controllerActionTypeOperations: ControllerActionTypeOperationsInterface = Object.freeze({
    buildRouteHandler: buildRouteHandlerImplementation,
});
