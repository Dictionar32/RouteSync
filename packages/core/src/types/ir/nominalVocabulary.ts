/**
 * nominalVocabulary.ts
 *
 * Branded nominal domain atoms for Contract IR architecture.
 * Eliminates naked string and number primitive obsession.
 * Conforms to Level 7 Subatomic Architecture & Rule 14 (<= 100 lines).
 *
 * @module core/types/ir/nominalVocabulary
 */

import type { RoutePath } from '../domain/routeEntityDefinition';

export type EndpointId = string & { readonly __brand: unique symbol };
export type ResourceId = string & { readonly __brand: unique symbol };
export type RequestId = string & { readonly __brand: unique symbol };
export type HttpHeaderName = string & { readonly __brand: unique symbol };
export type SourceLineNumber = number & { readonly __brand: unique symbol };

export type HttpStatus =
    | 200 | 201 | 202 | 204
    | 301 | 302 | 304
    | 400 | 401 | 403 | 404 | 409 | 422 | 429
    | 500 | 502 | 503;

export const createEndpointId = (id: string): EndpointId => id as EndpointId;
export const createResourceId = (id: string): ResourceId => id as ResourceId;
export const createRequestId = (id: string): RequestId => id as RequestId;
export const createHttpHeaderName = (name: string): HttpHeaderName => name as HttpHeaderName;
export const createSourceLineNumber = (line: number): SourceLineNumber => Math.max(1, line) as SourceLineNumber;
