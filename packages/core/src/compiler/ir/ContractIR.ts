/**
 * Phase 4B — Domain-centric Contract IR.
 *
 * Resource, Request, and Endpoint are the primary contract units.
 * Every domain variant has a closed shape and readonly data.
 *
 * @module core/compiler/ir/ContractIR
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
} from './contract';

export {
    createContractIR,
    createResourceIR,
    createRequestIR,
    createEndpointIR,
} from './contract';
