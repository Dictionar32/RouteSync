/**
 * controllerActionDescriptor.ts
 *
 * AST descriptors for Controller Actions.
 *
 * @module core/compiler/scanner/descriptors/request/controllerActionDescriptor
 */

import {
    ResourceResponseDescriptor,
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
    public readonly resourceModelMap: ReadonlyMap<string, string>;
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
        this.resourceModelMap = params.resourceModelMap ? Object.freeze(new Map(params.resourceModelMap)) : Object.freeze(new Map());
        this.errorResponses = params.errorResponses ? Object.freeze([...params.errorResponses]) : Object.freeze([]);
        Object.freeze(this);
    }

    public static create({
        controllerName = "GeneralController",
        actionName = "action",
        sourceFile,
        sourceLine = 1,
        response = new ResourceResponseDescriptor({ resourceName: "GeneralResource", shape: "single" }),
        formRequests = [],
        schema = ScannedRouteSchemaPayload.empty(),
        schemaRules = [],
        resourceModelMap,
        errorResponses
    }: ControllerActionCreateOptions): ScannedControllerActionDescriptor {
        const target = `${controllerName}@${actionName}`;
        return new ScannedControllerActionDescriptor({
            controllerName,
            actionName,
            target,
            handler: buildRouteHandler(controllerName, actionName, target),
            sourceFile,
            sourceLine,
            response,
            formRequests: Object.freeze([...formRequests]),
            schema,
            schemaRules: Object.freeze([...schemaRules]),
            resourceModelMap,
            errorResponses
        });
    }

    public static empty(controllerName: string, actionName: string, sourceFile: string): ScannedControllerActionDescriptor {
        return ScannedControllerActionDescriptor.create({
            controllerName,
            actionName,
            sourceFile,
            sourceLine: 1
        });
    }
}
