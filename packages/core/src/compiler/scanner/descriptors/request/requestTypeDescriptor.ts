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
    ResponseData
} from "../../../artifacts/RequestTypesArtifact";
import { toPascalCase } from "../../../../utils/resource-naming";

export interface ScannedRequestTypeParams {
    readonly resourceName: string;
    readonly formTypeName: string;
    readonly actions: readonly FormAction[];
    readonly responseData: ResponseData | undefined;
}

/**
 * Reusable Constructor: Scanned Request Type Descriptor.
 */
export class ScannedRequestTypeDescriptor implements RequestType {
    public readonly resourceName: string;
    public readonly formTypeName: string;
    public readonly actions: readonly FormAction[];
    public readonly responseData?: ResponseData;

    constructor({ resourceName, formTypeName, actions, responseData }: ScannedRequestTypeParams) {
        this.resourceName = resourceName;
        this.formTypeName = formTypeName;
        this.actions = actions;
        this.responseData = responseData;
        Object.freeze(this);
    }

    public static create({
        resourceName,
        formTypeName = `${toPascalCase(resourceName)}Form`,
        actions = [],
        responseData
    }: {
        readonly resourceName: string;
        readonly formTypeName?: string;
        readonly actions?: readonly FormAction[];
        readonly responseData?: ResponseData | null;
    }): ScannedRequestTypeDescriptor {
        return new ScannedRequestTypeDescriptor({
            resourceName,
            formTypeName,
            actions: Object.freeze([...actions]),
            responseData: responseData ? Object.freeze({ ...responseData }) : undefined
        });
    }

    public static empty(resourceName: string): ScannedRequestTypeDescriptor {
        return new ScannedRequestTypeDescriptor({
            resourceName,
            formTypeName: `${toPascalCase(resourceName)}Form`,
            actions: Object.freeze([]),
            responseData: undefined
        });
    }
}
