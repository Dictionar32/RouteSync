/**
 * types.ts
 *
 * Domain-centric Contract IR type interfaces.
 * Primary contract units: Resource, Request, and Endpoint.
 *
 * @module core/compiler/ir/contract
 */

import type { TypeIR } from '../../types/TypeIR';

/* -------------------------------------------------------------------------- */
/* Shared references                                                          */
/* -------------------------------------------------------------------------- */

export interface IRSourceRef {
    readonly file?: string;
    readonly line?: number;
    readonly column?: number;
}

/* -------------------------------------------------------------------------- */
/* Resource domain                                                            */
/* -------------------------------------------------------------------------- */

export interface ResourceFieldIR {
    readonly name: string;
    readonly type: TypeIR;
    readonly required: boolean;
    readonly nullable: boolean;
    readonly source?: IRSourceRef;
}

export interface ResourceAliasIR {
    readonly kind: 'resource_alias';
    readonly name: string;
    readonly target: string;
    readonly shape: 'single' | 'collection';
}

export interface ResourceIR {
    readonly kind: 'resource';
    readonly name: string;
    readonly model?: string;
    readonly fields: readonly ResourceFieldIR[];
    readonly aliases: readonly ResourceAliasIR[];
    readonly source?: IRSourceRef;
}

/* -------------------------------------------------------------------------- */
/* Request domain                                                             */
/* -------------------------------------------------------------------------- */

export interface RequestFieldIR {
    readonly name: string;
    readonly type: TypeIR;
    readonly required: boolean;
    readonly nullable: boolean;
    readonly source?: IRSourceRef;
}

export interface RequestActionIR {
    readonly kind: 'request_action';
    readonly name: string;
    readonly fields: readonly RequestFieldIR[];
}

export interface RequestIR {
    readonly kind: 'request';
    readonly name: string;
    readonly actions: readonly RequestActionIR[];
    readonly source?: IRSourceRef;
}

/* -------------------------------------------------------------------------- */
/* Endpoint domain                                                            */
/* -------------------------------------------------------------------------- */

export interface EndpointResponseIR {
    readonly kind: 'endpoint_response';
    readonly resource?: string;
    readonly type?: TypeIR;
    readonly shape: 'single' | 'collection' | 'paginated' | 'empty';
}

export interface EndpointParameterIR {
    readonly kind: 'endpoint_parameter';
    readonly name: string;
    readonly location: 'path' | 'query' | 'header' | 'body';
    readonly type: TypeIR;
    readonly required: boolean;
}

export interface EndpointIR {
    readonly kind: 'endpoint';
    readonly id: string;
    readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
    readonly path: string;
    readonly controller: string;
    readonly action: string;
    readonly parameters: readonly EndpointParameterIR[];
    readonly response: EndpointResponseIR;
    readonly middleware: readonly string[];
    readonly source?: IRSourceRef;
}

/* -------------------------------------------------------------------------- */
/* Contract root                                                              */
/* -------------------------------------------------------------------------- */

export interface ContractIR {
    readonly kind: 'contract';
    readonly version: string;
    readonly resources: readonly ResourceIR[];
    readonly requests: readonly RequestIR[];
    readonly endpoints: readonly EndpointIR[];
}
