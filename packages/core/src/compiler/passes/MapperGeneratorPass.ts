/**
 * MapperGeneratorPass.ts
 *
 * Active Consumer Orchestrator for transforming a closed ResourceMappers semantic contract into mapper functions:
 *   - Read mappers: API response (snake_case) -> frontend Transformed model (camelCase).
 *   - Form mappers: form values -> API payload (snake_case, via ApiApiField bracket notation).
 *
 * Single code output (1 pass = 1 artifact):
 *   - `code` -> mappers/api-mapper.ts
 *
 * @module compiler/passes
 */

import type { CompilerPass } from './CompilerPass';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import { ArtifactKeyWitness, type ResolveArtifacts } from './ArtifactKeyWitness';
import type { GeneratedMapperArtifact } from '../artifacts/GeneratedMapperArtifact';
import type { ResourceMappersArtifact } from '../artifacts/ResourceMappersArtifact';
import {
    buildReadMapperFromFields,
    buildFieldMappingLine,
    buildFormMapper,
    buildFormFieldLine,
    toApiFieldKey,
    collectMapperParts,
    type CollectedMapperParts,
    assembleMapperCode,
    buildMapperArtifact,
    buildEmptyMapperArtifact
} from './mapper';

// Explicit named re-exports (Rule 14: 0 wildcard re-exports)
export type { CollectedMapperParts };
export {
    buildReadMapperFromFields,
    buildFieldMappingLine,
    buildFormMapper,
    buildFormFieldLine,
    toApiFieldKey,
    collectMapperParts,
    assembleMapperCode,
    buildMapperArtifact,
    buildEmptyMapperArtifact
};

export class MapperGeneratorPass
    implements CompilerPass<readonly ['ResourceMappers'], readonly ['GeneratedMapper']> {

    public readonly name = 'MapperGenerator';

    public readonly inputWitnesses = [
        new ArtifactKeyWitness('ResourceMappers')
    ] as const;

    public readonly outputKeys = ['GeneratedMapper'] as const;

    public readonly descriptor: PassDescriptor<
        readonly ['ResourceMappers'],
        readonly ['GeneratedMapper']
    > = {
            consumes: ['ResourceMappers'],
            produces: ['GeneratedMapper']
        };

    public readonly requires: readonly PassDependency<'ResourceMappers'>[] = [
        {
            artifact: 'ResourceMappers',
            producer: undefined
        }
    ];

    public readonly producesPass: readonly string[] = [];
    private static readonly defaultPass = new MapperGeneratorPass();

    public static run(
        artifact: ResourceMappersArtifact
    ): ResolveArtifacts<readonly ['GeneratedMapper']> {
        return MapperGeneratorPass.defaultPass.run([artifact]);
    }

    public run(
        inputs: ResolveArtifacts<readonly ['ResourceMappers']>
    ): ResolveArtifacts<readonly ['GeneratedMapper']> {
        const [resourceMappersArtifact] = inputs;
        const mapping = resourceMappersArtifact.mapping;

        if (mapping.read.length === 0 && mapping.write.length === 0) {
            return [buildEmptyMapperArtifact(this.name)];
        }

        const parts = collectMapperParts(mapping);
        const code = assembleMapperCode(parts);
        return [buildMapperArtifact(code, this.name)];
    }
}

/**
 * Pure Dataflow Transform: ResourceMappersArtifact → GeneratedMapperArtifact
 * 1 Input, 1 Output, 0 '?', 0 'new' in call site, 0 array wrapping.
 */
export function lowerMapperArtifact(artifact: ResourceMappersArtifact): GeneratedMapperArtifact {
    return MapperGeneratorPass.run(artifact)[0];
}
