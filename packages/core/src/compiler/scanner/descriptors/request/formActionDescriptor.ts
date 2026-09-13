/**
 * formActionDescriptor.ts
 *
 * AST descriptors for Scanned Form Actions.
 *
 * @module core/compiler/scanner/descriptors/request/formActionDescriptor
 */

import {
    FormAction,
    RequestField
} from "../../../artifacts/RequestTypesArtifact";

export interface ScannedFormActionParams {
    readonly name: string;
    readonly fields: readonly RequestField[];
}

/**
 * Reusable Constructor: Scanned Form Action Descriptor.
 */
export class ScannedFormActionDescriptor implements FormAction {
    public readonly name: string;
    public readonly fields: readonly RequestField[];

    constructor({ name, fields }: ScannedFormActionParams) {
        this.name = name;
        this.fields = fields;
        Object.freeze(this);
    }

    public static create({
        name,
        fields = []
    }: {
        readonly name: string;
        readonly fields?: readonly RequestField[];
    }): ScannedFormActionDescriptor {
        return new ScannedFormActionDescriptor({
            name,
            fields: Object.freeze([...fields])
        });
    }

    public static empty(name: string): ScannedFormActionDescriptor {
        return new ScannedFormActionDescriptor({
            name,
            fields: Object.freeze([])
        });
    }
}
