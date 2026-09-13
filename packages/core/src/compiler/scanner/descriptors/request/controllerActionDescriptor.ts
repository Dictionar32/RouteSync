/**
 * controllerActionDescriptor.ts
 *
 * AST descriptors for Controller Actions.
 *
 * @module core/compiler/scanner/descriptors/request/controllerActionDescriptor
 */

import {
    ResponseDescriptor,
    ResourceResponseDescriptor,
    RouteValidationRuleEntry,
    FormRequestDescriptor,
    RouteHandlerDescriptor,
    RouteHandlerKind,
    RouteSchemaPayload
} from "../../../../types/route";
import { ScannedRouteSchemaPayload } from "../validationDescriptors";

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
}

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

    constructor({
        controllerName,
        actionName,
        target,
        handler,
        sourceFile,
        sourceLine,
        response,
        formRequests,
        schema,
        schemaRules
    }: ScannedControllerActionParams) {
        this.controllerName = controllerName;
        this.actionName = actionName;
        this.target = target;
        this.handler = handler;
        this.sourceFile = sourceFile;
        this.sourceLine = sourceLine;
        this.response = response;
        this.formRequests = formRequests;
        this.schema = schema;
        this.schemaRules = schemaRules;
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
        schemaRules = []
    }: {
        readonly controllerName?: string;
        readonly actionName?: string;
        readonly sourceFile: string;
        readonly sourceLine?: number;
        readonly response?: ResponseDescriptor;
        readonly formRequests?: readonly FormRequestDescriptor[];
        readonly schema?: RouteSchemaPayload;
        readonly schemaRules?: readonly RouteValidationRuleEntry[];
    }): ScannedControllerActionDescriptor {
        const target = `${controllerName}@${actionName}`;
        const handler: RouteHandlerDescriptor = Object.freeze(
            actionName === '__invoke'
                ? {
                    kind: RouteHandlerKind.InvokableController,
                    controllerName,
                    actionName: '__invoke',
                    target
                }
                : {
                    kind: RouteHandlerKind.ControllerAction,
                    controllerName,
                    actionName,
                    target
                }
        );

        return new ScannedControllerActionDescriptor({
            controllerName,
            actionName,
            target,
            handler,
            sourceFile,
            sourceLine,
            response,
            formRequests: Object.freeze([...formRequests]),
            schema,
            schemaRules: Object.freeze([...schemaRules])
        });
    }

    public static empty(controllerName: string, actionName: string, sourceFile: string): ScannedControllerActionDescriptor {
        return ScannedControllerActionDescriptor.create({
            controllerName,
            actionName,
            sourceFile,
            sourceLine: 1,
            response: new ResourceResponseDescriptor({ resourceName: "GeneralResource", shape: "single" }),
            formRequests: [],
            schema: ScannedRouteSchemaPayload.empty(),
            schemaRules: []
        });
    }
}
