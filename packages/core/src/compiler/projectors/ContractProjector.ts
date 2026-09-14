/**
 * ContractProjector.ts
 *
 * Stream Projector for Contract Types & Zod Schemas (api-contract.ts).
 * Projects RequestTypesArtifact into contract validation code without intermediate array staging.
 *
 * @module compiler/projectors
 */

import type { CodeSink } from '../sink/CodeSink';
import type { RequestTypesArtifact } from '../artifacts/RequestTypesArtifact';
import type { GeneratedContractArtifact } from '../artifacts/GeneratedContractArtifact';
import {
    createContractGeneratorDependencies,
    type ContractGeneratorDependencies,
    extractRequestContracts,
    extractResponseSchemas,
    formatContractFile,
    buildContractArtifact
} from '../passes/contract-domain/index';

export class ContractProjector {
    private readonly deps: ContractGeneratorDependencies;

    constructor(options?: Partial<ContractGeneratorDependencies>) {
        this.deps = createContractGeneratorDependencies(options);
    }

    public project(artifact: RequestTypesArtifact, sink: CodeSink): GeneratedContractArtifact {
        const contracts = extractRequestContracts(artifact, this.deps.actionGenerator);
        const responseResult = extractResponseSchemas(artifact, this.deps.responseActionBuilder);
        const builtCode = formatContractFile(contracts, responseResult.fields, this.deps.codeBuilder);

        sink.writeBlock(builtCode.code);

        return buildContractArtifact(
            builtCode,
            contracts,
            responseResult.fields,
            'ContractProjector',
            responseResult.warnings
        );
    }
}
