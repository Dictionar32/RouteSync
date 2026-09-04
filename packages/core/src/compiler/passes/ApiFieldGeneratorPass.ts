/**
 * ApiFieldGeneratorPass.ts
 *
 * Compiler pass that collects unique field names across RequestTypes and generates api-field.ts constants.
 * Flow-based pipeline consuming pure domain operations.
 *
 * @module compiler/passes
 */

import type { CompilerPass } from './CompilerPass';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import { ArtifactKeyWitness, type ResolveArtifacts } from './ArtifactKeyWitness';
import type { GeneratedApiFieldArtifact } from '../artifacts/GeneratedApiFieldArtifact';
import {
    extractFieldNames,
    deduplicateFieldNames,
    formatApiFieldConstant,
    buildApiFieldArtifact
} from './api-field-domain';

export interface ApiFieldGeneratorPassDependencies {
    readonly exportConstName?: string;
}

export class ApiFieldGeneratorPass
    implements CompilerPass<readonly ['RequestTypes'], readonly ['GeneratedApiField']> {

    public readonly name = 'ApiFieldGenerator';

    public readonly inputWitnesses = [
        new ArtifactKeyWitness('RequestTypes')
    ] as const;

    public readonly outputKeys = ['GeneratedApiField'] as const;

    public readonly descriptor: PassDescriptor<
        readonly ['RequestTypes'],
        readonly ['GeneratedApiField']
    > = {
            consumes: ['RequestTypes'],
            produces: ['GeneratedApiField']
        };

    public readonly requires: readonly PassDependency<'RequestTypes'>[] = [
        {
            artifact: 'RequestTypes'
        }
    ];

    public readonly producesPass: readonly string[] = [];

    public readonly exportConstName: string;

    constructor({
        exportConstName = 'ApiApiField'
    }: ApiFieldGeneratorPassDependencies = {}) {
        this.exportConstName = exportConstName;
        Object.freeze(this);
    }

    public run(
        inputs: ResolveArtifacts<readonly ['RequestTypes']>
    ): ResolveArtifacts<readonly ['GeneratedApiField']> {
        const [requestTypesArtifact] = inputs;

        const extracted = extractFieldNames(requestTypesArtifact);
        const unique = deduplicateFieldNames(extracted);
        const code = formatApiFieldConstant(unique, this.exportConstName);
        const artifact = buildApiFieldArtifact(code, requestTypesArtifact.metadata);

        return [artifact];
    }
}