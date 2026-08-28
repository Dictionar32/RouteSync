/**
 * ContractGeneratorPass.ts
 * 
 * Compiler pass that transforms RequestTypes into Generated Contract code with Zod schemas.
 * Consumes Complete Contract dependencies guaranteed by Dependency Origin Boundary.
 * 
 * @module compiler/passes
 */

import type { CompilerPass } from './CompilerPass';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import { ArtifactKeyWitness, type ResolveArtifacts } from './ArtifactKeyWitness';
import type { GeneratedContractArtifact } from '../artifacts/GeneratedContractArtifact';
import {
    createContractGeneratorDependencies,
    type ContractGeneratorDependencies,
    extractRequestContracts,
    extractResponseSchemas,
    formatContractFile,
    buildContractArtifact
} from './contract-generator-domain';

export class ContractGeneratorPass
    implements CompilerPass<readonly ['RequestTypes'], readonly ['GeneratedContract']> {

    public readonly name = 'ContractGenerator';

    public readonly inputWitnesses = [
        new ArtifactKeyWitness('RequestTypes')
    ] as const;

    public readonly outputKeys = ['GeneratedContract'] as const;

    public readonly descriptor: PassDescriptor<
        readonly ['RequestTypes'],
        readonly ['GeneratedContract']
    > = {
            consumes: ['RequestTypes'],
            produces: ['GeneratedContract']
        };

    public readonly requires: readonly PassDependency<'RequestTypes'>[] = [
        {
            artifact: 'RequestTypes',
            producer: undefined
        }
    ];

    public readonly producesPass: readonly string[] = [];

    /** Guaranteed Complete Contract from Origin Boundary */
    private readonly deps: ContractGeneratorDependencies;

    constructor(options?: Partial<ContractGeneratorDependencies>) {
        this.deps = createContractGeneratorDependencies(options);
    }

    /**
     * Pure Flow Declaration:
     *   inputs → extractRequestContracts → extractResponseSchemas → formatContractFile → buildContractArtifact
     */
    public run(
        inputs: ResolveArtifacts<readonly ['RequestTypes']>
    ): ResolveArtifacts<readonly ['GeneratedContract']> {
        const [requestTypesArtifact] = inputs;

        // Pure flow consuming guaranteed complete contract dependencies
        const contracts = extractRequestContracts(requestTypesArtifact, this.deps.actionGenerator);
        const responseResult = extractResponseSchemas(requestTypesArtifact, this.deps.responseActionBuilder);
        const builtCode = formatContractFile(contracts, responseResult.fields, this.deps.codeBuilder);
        const artifact = buildContractArtifact(
            builtCode,
            contracts,
            responseResult.fields,
            this.name,
            responseResult.warnings
        );

        return [artifact];
    }
}
