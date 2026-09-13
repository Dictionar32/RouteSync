/**
 * factories.ts
 *
 * Constructors and factory helpers for Response IR shapes, transports, and payloads.
 *
 * @module core/compiler/ir/response-ir
 */

import type { TypeIR } from '../../types/TypeIR';
import type {
  CollectionShape,
  EmptyResponse,
  ResourceResponseIR,
  ModelResponseIR,
  ObjectResponseIR,
  PrimitiveResponseIR,
  HttpResponseTransportIR
} from './types';

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
  contentType?: string
): HttpResponseTransportIR {
  return {
    kind: 'http',
    ...(status === undefined ? {} : { status }),
    ...(contentType === undefined ? {} : { contentType })
  };
}

export function createResourceResponse(
  resource: string,
  shape: CollectionShape,
  options: {
    model?: string;
    type?: TypeIR;
  } = {}
): ResourceResponseIR {
  return {
    kind: 'resource',
    resource,
    shape,
    ...(options.model === undefined ? {} : { model: options.model }),
    ...(options.type === undefined ? {} : { type: options.type })
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
    ...(type === undefined ? {} : { type })
  };
}

export function createObjectResponse(
  schema: TypeIR,
  shape: CollectionShape,
  schemaName?: string
): ObjectResponseIR {
  return {
    kind: 'object',
    schemaName,
    shape,
    schema
  };
}

export function createPrimitiveResponse(
  primitiveType: PrimitiveResponseIR['primitiveType']
): PrimitiveResponseIR {
  return {
    kind: 'primitive',
    primitiveType
  };
}

export function createEmptyResponse(): EmptyResponse {
  return { kind: 'empty' };
}
