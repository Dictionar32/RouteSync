/**
 * requestTypeDescriptor.ts
 *
 * AST descriptors for Scanned Request Types.
 *
 * @module core/compiler/scanner/descriptors/request/requestTypeDescriptor
 */

import {
    RequestIdentity,
    FormRequestSource,
    RequestType,
    FormAction,
    ResponseData,
    RequestResponse
} from "../../../artifacts/RequestTypesArtifact";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";

export interface ScannedRequestTypeParams {
    readonly identity: RequestIdentity;
    readonly source: FormRequestSource;
    readonly actions: readonly FormAction[];
    readonly response: RequestResponse;
}

/**
 * Reusable Constructor: Scanned Request Type Descriptor.
 */
export class ScannedRequestTypeDescriptor implements RequestType {
    public readonly identity: RequestIdentity;
    public readonly source: FormRequestSource;
    public readonly actions: readonly FormAction[];
    public readonly response: RequestResponse;

    constructor({ identity, source, actions, response }: ScannedRequestTypeParams) {
        this.identity = Object.freeze(identity);
        this.source = Object.freeze(source);
        this.actions = actions;
        this.response = response;
        Object.freeze(this);
    }

    public static create({
        identity,
        source,
        actions = [],
        response = { kind: "none" }
    }: {
        readonly identity: RequestIdentity;
        readonly source: FormRequestSource;
        readonly actions?: readonly FormAction[];
        readonly response?: RequestResponse;
    }): ScannedRequestTypeDescriptor {
        return new ScannedRequestTypeDescriptor({
            identity,
            source,
            actions: Object.freeze([...actions]),
            response
        });
    }

    public static fromIdentity(identity: RequestIdentity, source: FormRequestSource, actions: readonly FormAction[] = [], response: RequestResponse = { kind: "none" }): ScannedRequestTypeDescriptor {
        return new ScannedRequestTypeDescriptor({
            identity,
            source,
            actions: Object.freeze([...actions]),
            response
        });
    }

}
