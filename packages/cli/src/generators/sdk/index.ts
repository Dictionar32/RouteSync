/**
 * index.ts
 *
 * Sub-domain exports for SDK generator.
 *
 * @module cli/generators/sdk
 */

export {
  type EndpointResponseInfo,
  resolveEndpointResponseInfo
} from './endpointResolver';
export {
  type ApiObjectEmitterContext,
  emitApiObjectLines
} from './apiObjectEmitter';
