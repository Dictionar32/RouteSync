/**
 * controllerActionDescriptor.ts
 *
 * AST descriptors for Controller Actions.
 *
 * @module core/compiler/scanner/descriptors/request/controllerActionDescriptor
 */

import {
    VoidResponseDescriptor,
    RouteValidationRuleEntry,
    FormRequestDescriptor,
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
    public readonly formRequests: readonly FormRequestDescriptor[];
    public readonly schema: RouteSchemaPayload;
    public readonly schemaRules: readonly RouteValidationRuleEntry[];
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
        this.formRequests = params.formRequests;
        this.schema = params.schema;
        this.schemaRules = params.schemaRules;
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
            formRequests: Object.freeze([...params.formRequests]),
            schema: params.schema,
            schemaRules: Object.freeze([...params.schemaRules]),
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
            formRequests: [],
            schema: ScannedRouteSchemaPayload.empty(),
            schemaRules: [],
            dataflow: emptyControllerDataflowContract(),
            errorResponses: []
        });
    }
}
