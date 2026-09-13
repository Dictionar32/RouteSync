/**
 * Phase 4C — Structured Response IR.
 *
 * Transport and payload are modeled as independent discriminated domains.
 * Payload variants carry their own shape, so callers do not need a collection
 * of generic "shape" checks.
 */

export {
  type CollectionShape,
  type EmptyResponse,
  type ResourceResponseIR,
  type ModelResponseIR,
  type ObjectResponseIR,
  type PrimitiveResponseIR,
  type BinaryResponseIR,
  type ResponsePayloadIR,
  type HttpResponseTransportIR,
  type RedirectResponseTransportIR,
  type StreamResponseTransportIR,
  type ResponseTransportIR,
  type ResponseIR,
  singleShape,
  collectionShape,
  paginatedShape,
  httpTransport,
  createResourceResponse,
  createModelResponse,
  createObjectResponse,
  createPrimitiveResponse,
  createEmptyResponse
} from './response-ir';
