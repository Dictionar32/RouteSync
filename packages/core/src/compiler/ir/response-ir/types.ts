/**
 * types.ts
 *
 * Discriminated union types and interfaces for Response IR.
 *
 * @module core/compiler/ir/response-ir
 */

import type { TypeIR } from '../../types/TypeIR';

export type CollectionShape =
  | { readonly kind: 'single' }
  | { readonly kind: 'collection' }
  | { readonly kind: 'paginated' };

export type EmptyResponse =
  | { readonly kind: 'empty' }
  | { readonly kind: 'redirect'; readonly target?: string };

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

export interface ResponseIR {
  readonly kind: 'response';
  readonly id: string;
  readonly transport: ResponseTransportIR;
  readonly payload: ResponsePayloadIR;
}
