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

export { ControllerActionInfo, ScannedControllerActionParams, ControllerActionCreateOptions };

/**
 * Reusable Constructor: Scanned Controller Action Descriptor.
 */
export class ScannedControllerActionDescriptor implements ControllerActionInfo {
    public readonly controllerName: string;
    public readonly actionName: string;
    public readonly target: string;
    public readonly handler: RouteHandlerDescriptor;
    public readonly sourceFile: string;
    public readonly sourceLine: number;
    public readonly response: ResponseDescriptor;
    public readonly runtimeReturn: import('./controllerActionContract').RuntimeReturnContract;
    public readonly request: import("../../../../types/domain/request").RouteRequestBinding;
    public readonly schema: RouteSchemaPayload;
    public readonly dataflow: import("../../subscanners/controller/controllerDataflowContract").ControllerDataflowContract;
    public readonly errorResponses: readonly HttpErrorResponseDescriptor[];

    constructor(params: ScannedControllerActionParams) {
        this.controllerName = params.controllerName;
        this.actionName = params.actionName;
        this.target = params.target;
        this.handler = params.handler;
        this.sourceFile = params.sourceFile;
        this.sourceLine = params.sourceLine;
        this.response = params.response;
        this.runtimeReturn = params.runtimeReturn;
        this.request = params.request;
        this.schema = params.schema;
        this.dataflow = params.dataflow;
        this.errorResponses = Object.freeze([...params.errorResponses]);
        Object.freeze(this);
    }

    public static create(params: ControllerActionCreateOptions): ScannedControllerActionDescriptor {
        const target = `${params.controllerName}@${params.actionName}`;

        return new ScannedControllerActionDescriptor({
            controllerName: params.controllerName,
            actionName: params.actionName,
            target,
            handler: buildRouteHandler(params.controllerName, params.actionName, target),
            sourceFile: params.sourceFile,
            sourceLine: params.sourceLine,
            response: params.response,
            runtimeReturn: params.runtimeReturn,
            request: params.request,
            schema: params.schema,
            dataflow: params.dataflow,
            errorResponses: Object.freeze([...params.errorResponses])
        });
    }

    public static empty(controllerName: string, actionName: string, sourceFile: string): ScannedControllerActionDescriptor {
        return ScannedControllerActionDescriptor.create({
            controllerName,
            actionName,
            sourceFile,
            sourceLine: 1,
            response: new (VoidResponseDescriptor)(),
            runtimeReturn: { kind: 'none' },
            request: { kind: 'no_request' },
            schema: ScannedRouteSchemaPayload.empty(),
            dataflow: emptyControllerDataflowContract(),
            errorResponses: []
        });
    }
}
