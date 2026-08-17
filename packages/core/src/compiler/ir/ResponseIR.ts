/**
 * Phase 4C — Structured Response IR.
 *
 * Transport and payload are modeled as independent discriminated domains.
 * Payload variants carry their own shape, so callers do not need a collection
 * of generic "shape" checks.
 */

import type { TypeIR } from '../types/TypeIR';

/* -------------------------------------------------------------------------- */
/* Response shape                                                             */
/* -------------------------------------------------------------------------- */

export type CollectionShape =
    | { readonly kind: 'single' }
    | { readonly kind: 'collection' }
    | { readonly kind: 'paginated' };

export type EmptyResponse =
    | { readonly kind: 'empty' }
    | { readonly kind: 'redirect'; readonly target?: string };

/* -------------------------------------------------------------------------- */
/* Payload variants                                                           */
/* -------------------------------------------------------------------------- */

export interface ResourceResponseIR {
    readonly kind: 'resource';
    readonly resource: string;
    readonly model?: string;
    readonly shape: CollectionShape;
    readonly type?: TypeIR;
}

export interface ModelResponseIR {
    readonly kind: 'model';
    readonly model: string;
    readonly shape: CollectionShape;
    readonly type?: TypeIR;
}

export interface ObjectResponseIR {
    readonly kind: 'object';
    readonly schemaName?: string;
    readonly shape: CollectionShape;
    readonly schema: TypeIR;
}

export interface PrimitiveResponseIR {
    readonly kind: 'primitive';
    readonly primitiveType: 'string' | 'number' | 'boolean' | 'null';
}

export interface BinaryResponseIR {
    readonly kind: 'binary';
    readonly contentType?: string;
    readonly filename?: string;
}

export type ResponsePayloadIR =
    | ResourceResponseIR
    | ModelResponseIR
    | ObjectResponseIR
    | PrimitiveResponseIR
    | BinaryResponseIR
    | EmptyResponse;

/* -------------------------------------------------------------------------- */
/* Transport                                                                  */
/* -------------------------------------------------------------------------- */

export interface HttpResponseTransportIR {
    readonly kind: 'http';
    readonly status?: number;
    readonly contentType?: string;
}

export interface RedirectResponseTransportIR {
    readonly kind: 'redirect';
    readonly status?: number;
    readonly target?: string;
}

export interface StreamResponseTransportIR {
    readonly kind: 'stream';
    readonly status?: number;
    readonly contentType?: string;
    readonly callback?: string;
}

export type ResponseTransportIR =
    | HttpResponseTransportIR
    | RedirectResponseTransportIR
    | StreamResponseTransportIR;

/* -------------------------------------------------------------------------- */
/* Root                                                                        */
/* -------------------------------------------------------------------------- */

export interface ResponseIR {
    readonly kind: 'response';
    readonly id: string;
    readonly transport: ResponseTransportIR;
    readonly payload: ResponsePayloadIR;
}

/* -------------------------------------------------------------------------- */
/* Constructors                                                                */
/* -------------------------------------------------------------------------- */

export function singleShape(): CollectionShape {
    return { kind: 'single' };
}

export function collectionShape(): CollectionShape {
    return { kind: 'collection' };
}

export function paginatedShape(): CollectionShape {
    return { kind: 'paginated' };
}

export function httpTransport(
    status?: number,
    contentType?: string,
): HttpResponseTransportIR {
    return {
        kind: 'http',
        ...(status === undefined ? {} : { status }),
        ...(contentType === undefined ? {} : { contentType }),
    };
}

export function createResourceResponse(
    resource: string,
    shape: CollectionShape,
    options: {
        model?: string;
        type?: TypeIR;
    } = {},
): ResourceResponseIR {
    return {
        kind: 'resource',
        resource,
        shape,
        ...(options.model === undefined ? {} : { model: options.model }),
        ...(options.type === undefined ? {} : { type: options.type }),
    };
}

export function createModelResponse(
    model: string,
    shape: CollectionShape,
    type?: TypeIR,
): ModelResponseIR {
    return {
        kind: 'model',
        model,
        shape,
        ...(type === undefined ? {} : { type }),
    };
}

export function createObjectResponse(
    schema: TypeIR,
    shape: CollectionShape,
    schemaName?: string,
): ObjectResponseIR {
    return {
        kind: 'object',
        schemaName,
        shape,
        schema,
    };
}

export function createPrimitiveResponse(
    primitiveType: PrimitiveResponseIR['primitiveType'],
): PrimitiveResponseIR {
    return {
        kind: 'primitive',
        primitiveType,
    };
}

export function createEmptyResponse(): EmptyResponse {
    return { kind: 'empty' };
}
