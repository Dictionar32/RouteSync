/**
 * index.ts
 *
 * Sub-domain exports for Response IR.
 *
 * @module core/compiler/ir/response-ir
 */

export type {
  CollectionShape,
  EmptyResponse,
  ResourceResponseIR,
  ModelResponseIR,
  ObjectResponseIR,
  PrimitiveResponseIR,
  BinaryResponseIR,
  ResponsePayloadIR,
  HttpResponseTransportIR,
  RedirectResponseTransportIR,
  StreamResponseTransportIR,
  ResponseTransportIR,
  ResponseIR
} from './types';

export {
  singleShape,
  collectionShape,
  paginatedShape,
  httpTransport,
  createResourceResponse,
  createModelResponse,
  createObjectResponse,
  createPrimitiveResponse,
  createEmptyResponse
} from './factories';
