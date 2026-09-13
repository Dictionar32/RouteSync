/**
 * index.ts
 *
 * Contract IR domain exports.
 *
 * @module core/compiler/ir/contract
 */

export type {
    IRSourceRef,
    ResourceFieldIR,
    ResourceAliasIR,
    ResourceIR,
    RequestFieldIR,
    RequestActionIR,
    RequestIR,
    EndpointResponseIR,
    EndpointParameterIR,
    EndpointIR,
    ContractIR,
} from './types';

export {
    createContractIR,
    createResourceIR,
    createRequestIR,
    createEndpointIR,
} from './factories';
