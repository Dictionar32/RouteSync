/**
 * requestTypeDescriptor.ts
 *
 * AST descriptors for Scanned Request Types.
 *
 * @module core/compiler/scanner/descriptors/request/requestTypeDescriptor
 */

import {
    RequestType,
    FormAction,
    ResponseData,
    RequestResponse
} from "../../../artifacts/RequestTypesArtifact";
import { toPascalCase } from "../../../../utils/resource-naming";

export interface ScannedRequestTypeParams {
    readonly resourceName: string;
    readonly formTypeName: string;
    readonly actions: readonly FormAction[];
    readonly response: RequestResponse;
}

/**
 * Reusable Constructor: Scanned Request Type Descriptor.
 */
export class ScannedRequestTypeDescriptor implements RequestType {
    public readonly resourceName: string;
    public readonly formTypeName: string;
    public readonly actions: readonly FormAction[];
    public readonly response: RequestResponse;

    constructor({ resourceName, formTypeName, actions, response }: ScannedRequestTypeParams) {
        this.resourceName = resourceName;
        this.formTypeName = formTypeName;
        this.actions = actions;
        this.response = response;
        Object.freeze(this);
    }

    public static create({
        resourceName,
        formTypeName = `${toPascalCase(resourceName)}Form`,
        actions = [],
        response = { kind: "none" }
    }: {
        readonly resourceName: string;
        readonly formTypeName?: string;
        readonly actions?: readonly FormAction[];
        readonly response?: RequestResponse;
    }): ScannedRequestTypeDescriptor {
        return new ScannedRequestTypeDescriptor({
            resourceName,
            formTypeName,
            actions: Object.freeze([...actions]),
            response
        });
    }

    public static empty(resourceName: string): ScannedRequestTypeDescriptor {
        return new ScannedRequestTypeDescriptor({
            resourceName,
            formTypeName: `${toPascalCase(resourceName)}Form`,
            actions: Object.freeze([]),
            response: { kind: "none" }
        });
    }
}
