/**
 * index.ts
 *
 * Sub-domain exports for RequestEndpointBuilder components.
 *
 * @module core/ir/domain/request-endpoint
 */

export {
  inferParamType,
  extractPathParams,
  buildRequestReference,
  buildResponseReference
} from './endpointRefs';
export {
  generateRequestId,
  validateContractIR
} from './requestValidator';
