/**
 * factories.ts
 *
 * Constructors and factory functions for Contract IR nodes.
 *
 * @module core/compiler/ir/contract
 */

import type {
    IRSourceRef,
    ResourceFieldIR,
    ResourceAliasIR,
    ResourceIR,
    RequestFieldIR,
    RequestActionIR,
    RequestIR,
    EndpointIR,
    ContractIR
} from './types';

export function createContractIR(
    version: string,
    resources: readonly ResourceIR[] = [],
    requests: readonly RequestIR[] = [],
    endpoints: readonly EndpointIR[] = [],
): ContractIR {
    return {
        kind: 'contract',
        version,
        resources,
        requests,
        endpoints,
    };
}

export function createResourceIR(
    name: string,
    fields: readonly ResourceFieldIR[],
    options: {
        model?: string;
        aliases?: readonly ResourceAliasIR[];
        source?: IRSourceRef;
    } = {},
): ResourceIR {
    return {
        kind: 'resource',
        name,
        model: options.model,
        fields,
        aliases: options.aliases ?? [],
        source: options.source,
    };
}

export function createRequestIR(
    name: string,
    actions: readonly RequestActionIR[],
    source?: IRSourceRef,
): RequestIR {
    return {
        kind: 'request',
        name,
        actions,
        source,
    };
}

export function createEndpointIR(
    input: Omit<EndpointIR, 'kind'>,
): EndpointIR {
    return {
        kind: 'endpoint',
        ...input,
    };
}
