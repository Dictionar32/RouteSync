/**
 * controllerActionDescriptor.ts
 *
 * AST descriptors for Controller Actions.
 *
 * @module core/compiler/scanner/descriptors/request/controllerActionDescriptor
 */

import {
    VoidResponseDescriptor,
    RouteHandlerDescriptor,
    RouteSchemaPayload,
    ResponseDescriptor,
    HttpErrorResponseDescriptor
} from "../../../../types/route";
import { ScannedRouteSchemaPayload } from "../validationDescriptors";
import {
    ControllerActionInfo,
    ScannedControllerActionParams,
    ControllerActionCreateOptions,
    buildRouteHandler
} from "./controllerActionTypes";
import { emptyControllerDataflowContract } from "../../subscanners/controller/controllerDataflowContract";
import type { ActionName, ControllerName, SourceFile } from "../../../../types/upstream/names";
import type { ControllerRequestBinding } from './controllerActionContract';
import { createActionName, createControllerName, createSourceFile } from "../../../../types/domain/semanticValues";

export { ControllerActionInfo, ScannedControllerActionParams, ControllerActionCreateOptions };

/**
 * Reusable Constructor: Scanned Controller Action Descriptor.
 */
export class ScannedControllerActionDescriptor implements ControllerActionInfo {
    public readonly controllerName: ControllerName;
    public readonly actionName: ActionName;
    public readonly handler: RouteHandlerDescriptor;
    public readonly sourceFile: SourceFile;
    public readonly sourceLine: number;
    public readonly response: ResponseDescriptor;
    public readonly runtimeReturn: import('./controllerActionContract').RuntimeReturnContract;
    public readonly semanticReturn: import('../../../../types/upstream/controller').ControllerReturnSemantic;
    public readonly request: ControllerRequestBinding;
    public readonly schema: RouteSchemaPayload;
    public readonly dataflow: import("../../subscanners/controller/controllerDataflowContract").ControllerDataflowContract;
    public readonly errorResponses: readonly HttpErrorResponseDescriptor[];

    constructor(params: ScannedControllerActionParams) {
        this.controllerName = params.controllerName;
        this.actionName = params.actionName;
        this.handler = params.handler;
        this.sourceFile = params.sourceFile;
        this.sourceLine = params.sourceLine;
        this.response = params.response;
        this.runtimeReturn = params.runtimeReturn;
        this.semanticReturn = params.semanticReturn;
        this.request = params.request;
        this.schema = params.schema;
        this.dataflow = params.dataflow;
        this.errorResponses = Object.freeze([...params.errorResponses]);
        Object.freeze(this);
    }

    public static create(params: ControllerActionCreateOptions): ScannedControllerActionDescriptor {
        return new ScannedControllerActionDescriptor({
            controllerName: params.controllerName,
            actionName: params.actionName,
            handler: buildRouteHandler(params.controllerName, params.actionName),
            sourceFile: params.sourceFile,
            sourceLine: params.sourceLine,
            response: params.response,
            runtimeReturn: params.runtimeReturn,
            semanticReturn: params.semanticReturn,
            request: params.request,
            schema: params.schema,
            dataflow: params.dataflow,
            errorResponses: Object.freeze([...params.errorResponses])
        });
    }

    public static empty(controllerName: string, actionName: string, sourceFile: string): ScannedControllerActionDescriptor {
        return ScannedControllerActionDescriptor.create({
            controllerName: createControllerName(controllerName),
            actionName: createActionName(actionName),
            sourceFile: createSourceFile(sourceFile),
            sourceLine: 1,
            response: new (VoidResponseDescriptor)(),
            runtimeReturn: { kind: 'none' },
            semanticReturn: { kind: 'absent' },
            request: { kind: 'no_request' },
            schema: ScannedRouteSchemaPayload.empty(),
            dataflow: emptyControllerDataflowContract(),
            errorResponses: []
        });
    }
}
