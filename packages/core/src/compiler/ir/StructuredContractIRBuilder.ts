/**
 * Phase 4B — Domain Contract IR builder.
 *
 * This builder is intentionally boring: it composes already-typed domain
 * values. Semantic/type discrimination belongs to ContractIRTypeBuilder.
 */

import {
    createContractIR,
    type ContractIR,
    type EndpointIR,
    type RequestIR,
    type ResourceIR,
} from './ContractIR';

export interface ContractIRBuilderInput {
    readonly version: string;
    readonly resources?: readonly ResourceIR[];
    readonly requests?: readonly RequestIR[];
    readonly endpoints?: readonly EndpointIR[];
}

export class StructuredContractIRBuilder {
    public build(input: ContractIRBuilderInput): ContractIR {
        return createContractIR(
            input.version,
            input.resources ?? [],
            input.requests ?? [],
            input.endpoints ?? [],
        );
    }
}
