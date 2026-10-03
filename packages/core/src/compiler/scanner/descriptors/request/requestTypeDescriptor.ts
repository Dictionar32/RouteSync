/**
 * Canonical scanned request-type descriptor.
 * Construction is a relation-style immutable projection rather than a class.
 */
import type {
    RequestIdentity,
    FormRequestSource,
    RequestType,
    FormAction,
    RequestResponse,
} from "../../../artifacts/RequestTypesArtifact";

export interface ScannedRequestTypeParams {
    readonly identity: RequestIdentity;
    readonly source: FormRequestSource;
    readonly actions: readonly FormAction[];
    readonly response: RequestResponse;
}

export type ScannedRequestTypeDescriptor = RequestType;

const createRequestTypeDescriptor = ({ identity, source, actions, response }: ScannedRequestTypeParams): ScannedRequestTypeDescriptor => Object.freeze({
    identity: Object.freeze(identity),
    source: Object.freeze(source),
    actions: Object.freeze([...actions]),
    response,
});

export const ScannedRequestTypeDescriptor = Object.freeze({
    create({
        identity,
        source,
        actions = [],
        response = { kind: "none" },
    }: {
        readonly identity: RequestIdentity;
        readonly source: FormRequestSource;
        readonly actions?: readonly FormAction[];
        readonly response?: RequestResponse;
    }): ScannedRequestTypeDescriptor {
        return createRequestTypeDescriptor({
            identity,
            source,
            actions,
            response,
        });
    },
    fromIdentity(
        identity: RequestIdentity,
        source: FormRequestSource,
        actions: readonly FormAction[] = [],
        response: RequestResponse = { kind: "none" },
    ): ScannedRequestTypeDescriptor {
        return createRequestTypeDescriptor({ identity, source, actions, response });
    },
});
