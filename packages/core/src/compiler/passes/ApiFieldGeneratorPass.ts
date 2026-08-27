/**
 * ApiFieldGeneratorPass.ts
 *
 * Compiler pass that collects field names across RequestTypes and generates contracts/api-field.ts.
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
            artifact: 'RequestTypes',
            producer: undefined
        }
    ];

    public readonly producesPass: readonly string[] = [];

    /**
     * Flow Declaration:
     *   inputs → extractFieldNames → deduplicateFieldNames → formatApiFieldConstant → buildApiFieldArtifact
     */
    public run(
        inputs: ResolveArtifacts<readonly ['RequestTypes']>
    ): ResolveArtifacts<readonly ['GeneratedApiField']> {
        const [requestTypesArtifact] = inputs;

        const extracted = extractFieldNames(requestTypesArtifact);
        const unique = deduplicateFieldNames(extracted);
        const code = formatApiFieldConstant(unique);
        const artifact = buildApiFieldArtifact(code, this.name);

        return [artifact];
    }
}
