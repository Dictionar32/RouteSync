/**
 * TypeScriptGeneratorPass.ts
 *
 * Compiler pass that transforms SemanticTypesArtifact into Generated TypeScript interfaces.
 * Pure Declarative Lowering Pass consuming Canonical ObjectType[] AST streams.
 *
 * @module compiler/passes
 */

import type { CompilerPass } from './CompilerPass';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import { ArtifactKeyWitness } from './ArtifactKeyWitness';
import type { GeneratedTypeScriptArtifact } from '../artifacts/GeneratedTypeScriptArtifact';
import type { SemanticTypesArtifact } from '../artifacts/SemanticTypesArtifact';
import { ArtifactTypeId } from '../artifacts/types';
import { TypeScriptCodeBuilder } from '../domain/common/TypeScriptTypeLowerer';

/**
 * CompilerPassName
 *
 * Canonical Domain Vocabulary for Compiler Pass Identities in the Execution DAG.
 */
export const CompilerPassName = Object.freeze({
    TypeScriptGenerator: 'TypeScriptGenerator',
    ContractGenerator: 'ContractGenerator',
    FormGenerator: 'FormGenerator',
    ApiFieldGenerator: 'ApiFieldGenerator',
    MapperGenerator: 'MapperGenerator',
    ResponseAnalysis: 'ResponseAnalysis'
} as const);

export type CompilerPassName = typeof CompilerPassName[keyof typeof CompilerPassName];

export interface TypeScriptGeneratorPassDependencies {
    readonly codeBuilder?: TypeScriptCodeBuilder;
}

export class TypeScriptGeneratorPass implements CompilerPass<readonly ['SemanticTypes'], readonly ['GeneratedTypeScript']> {
    public static readonly VERSION = '1.0.0' as const;
    public readonly name = CompilerPassName.TypeScriptGenerator;
    public readonly inputWitnesses = [new ArtifactKeyWitness(ArtifactTypeId.SemanticTypes)] as const;
    public readonly outputKeys = [ArtifactTypeId.GeneratedTypeScript] as const;

    public readonly descriptor: PassDescriptor<readonly ['SemanticTypes'], readonly ['GeneratedTypeScript']> = {
        consumes: [ArtifactTypeId.SemanticTypes],
        produces: [ArtifactTypeId.GeneratedTypeScript]
    };

    public readonly requires: readonly PassDependency<'SemanticTypes'>[] = [
        { artifact: ArtifactTypeId.SemanticTypes }
    ];

    public readonly producesPass: readonly string[] = [];

    private readonly codeBuilder: TypeScriptCodeBuilder;
    private static readonly defaultPass = new TypeScriptGeneratorPass();

    public static run(
        artifact: SemanticTypesArtifact
    ): readonly [GeneratedTypeScriptArtifact] {
        return TypeScriptGeneratorPass.defaultPass.run([artifact]);
    }

    constructor({
        codeBuilder = new TypeScriptCodeBuilder()
    }: TypeScriptGeneratorPassDependencies = {}) {
        this.codeBuilder = codeBuilder;
        Object.freeze(this);
    }

    /**
     * Executes the compiler pass with guaranteed upstream invariants.
     * Pure zero-cost declarative transformation from ObjectType[] AST to TypeScript declarations.
     */
    run([semanticTypesArtifact]: readonly [SemanticTypesArtifact]): readonly [GeneratedTypeScriptArtifact] {
        const result = this.codeBuilder.build(semanticTypesArtifact.types);

        return Object.freeze([{
            typeId: ArtifactTypeId.GeneratedTypeScript,
            code: result.code,
            imports: Object.freeze([]),
            interfaces: result.interfaces,
            generationMetadata: Object.freeze({
                generatorVersion: TypeScriptGeneratorPass.VERSION,
                typeCount: result.interfaces.length,
                interfaceCount: result.interfaces.length,
                importCount: 0,
                linesOfCode: result.code.length === 0 ? 0 : result.code.split('\n').length,
                warnings: Object.freeze([])
            }),
            metadata: semanticTypesArtifact.metadata
        }]);
    }
}