/**
 * TypeScriptGeneratorPass.ts
 * 
 * Compiler pass that transforms SemanticTypes into Generated TypeScript code.
 * Uses TypeScriptGenerator internally for type-to-AST transformation.
 * 
 * @module compiler/passes
 */

import type { CompilerPass } from './CompilerPass';
import type { CompilationContext } from './CompilationContext';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import { ArtifactKeyWitness, ResolveArtifacts } from './ArtifactKeyWitness';
import type { GeneratedTypeScriptArtifact, GeneratedImport, GeneratedInterface } from '../artifacts/GeneratedTypeScriptArtifact';
import type { SemanticType, ObjectType, PrimitiveType, ReadonlyCollectionType, MutableCollectionType, UnionType } from '../types/SemanticType';

import { TypeScriptGenerator } from '../generators/typescript/TypeScriptGenerator';
import { computeFingerprintHash, type CompilerFingerprint } from '../fingerprint/Fingerprint';

/**
 * Input artifact untuk TypeScriptGeneratorPass
 * 
 * Pass ini menerima array of SemanticTypes yang akan di-transform
 * menjadi TypeScript code.
 */
export interface SemanticTypesArtifact {
    /** Artifact type ID */
    readonly typeId: 'SemanticTypes';

    /** Standard artifact metadata */
    readonly metadata: {
        readonly hash: string;
        readonly producer: string;
        readonly dependencies: readonly string[];
        readonly timestamp: number;
        readonly revision: string;
    };

    /** Array of semantic types to generate */
    readonly types: readonly SemanticType[];
}

/**
 * TypeScriptGeneratorPass transforms semantic types into TypeScript code.
 * 
 * Input:  ['SemanticTypes'] - Array of SemanticType
 * Output: ['GeneratedTypeScript'] - Generated TypeScript artifact
 * 
 * This pass:
 * 1. Receives SemanticTypes from previous passes
 * 2. Uses TypeScriptGenerator to transform each type
 * 3. Collects all generated code and metadata
 * 4. Produces GeneratedTypeScript artifact with complete code
 * 
 * @example
 * ```typescript
 * const pass = new TypeScriptGeneratorPass();
 * const manager = new PassManager([]);
 * manager.registerPass(pass);
 * ```
 */
export class TypeScriptGeneratorPass
    implements CompilerPass<readonly ['SemanticTypes'], readonly ['GeneratedTypeScript']> {

    /** Pass name untuk identification dan logging */
    public readonly name = 'TypeScriptGenerator';

    /** Input witnesses untuk type-safe artifact retrieval */
    public readonly inputWitnesses = [
        new ArtifactKeyWitness('SemanticTypes')
    ] as const;

    /** Output keys yang di-produce oleh pass ini */
    public readonly outputKeys = ['GeneratedTypeScript'] as const;

    /** Pass descriptor untuk dependency resolution */
    public readonly descriptor: PassDescriptor<
        readonly ['SemanticTypes'],
        readonly ['GeneratedTypeScript']
    > = {
            consumes: ['SemanticTypes'],
            produces: ['GeneratedTypeScript']
        };

    /** Dependencies - pass ini butuh SemanticTypes artifact */
    public readonly requires: readonly PassDependency<'SemanticTypes'>[] = [
        {
            artifact: 'SemanticTypes',
            producer: undefined
        }
    ];

    /** Pass names this produces (none - end of pipeline) */
    public readonly producesPass: readonly string[] = [];

    /** Internal TypeScript generator instance */
    private readonly generator: TypeScriptGenerator;

    /**
     * Create TypeScriptGeneratorPass
     * 
     * @param config - Optional generator configuration
     */
    constructor(config?: { readonly strict?: boolean }) {
        this.generator = new TypeScriptGenerator();

        // Apply configuration if provided
        if (config?.strict) {
            // Future: configure generator for strict mode
        }
    }

    /**
     * Execute pass transformation
     * 
     * Process:
     * 1. Extract SemanticTypes from input tuple
     * 2. Generate TypeScript for each type using generator
     * 3. Collect imports and interfaces
     * 4. Build GeneratedTypeScript artifact with metadata
     * 5. Return artifact in output tuple
     * 
     * @param inputs - Tuple containing SemanticTypesArtifact
     * @returns Tuple containing GeneratedTypeScriptArtifact
     */
    public run(
        inputs: ResolveArtifacts<readonly ['SemanticTypes']>,
        _context: CompilationContext,
    ): ResolveArtifacts<readonly ['GeneratedTypeScript']> {
        try {
            // Extract semantic types artifact
            const [semanticTypesArtifact] = inputs;
            const types = semanticTypesArtifact.types;

            // Reset generator untuk fresh state
            this.generator.reset();

            // Generate TypeScript untuk each type
            const interfaces: GeneratedInterface[] = [];
            const warnings: string[] = [];

            // Count properties manually (ImmutableMap doesn't have .size)
            const countProperties = (type: ObjectType): number => {
                let count = 0;
                for (const _ of type.properties.entries()) {
                    count++;
                }
                return count;
            };

            for (const type of types) {
                try {
                    if (type.kind === 'object') {
                        // ✅ Extract name dan kind dari annotations
                        const nameAnnotation = type.annotations ? type.annotations.get('name') : undefined;
                        const kindAnnotation = type.annotations ? type.annotations.get('kind') : undefined;
                        const baseName = nameAnnotation || `UnknownType${Date.now()}`  // Fallback dengan warning

                        // Log warning jika no name
                        if (!nameAnnotation) {
                            warnings.push(`Type at index ${types.indexOf(type)} has no name annotation, using fallback`)
                        }

                        // ✅ Always add "Transformed" suffix untuk interface
                        const interfaceName = `${baseName}Transformed`
                        const interfaceNode = this.generator.generateEntityInterface(interfaceName, type);

                        // Track generated interface (store both interface + aliases info)
                        interfaces.push({
                            name: interfaceName,
                            propertyCount: countProperties(type),
                            extends: undefined,
                            lineRange: [0, 0]
                        });

                        // ✅ Store kind untuk buildCodeFromTypes() nanti
                        // We'll need to pass this info to code generation
                        // For now, interfaceNode carries the info

                        // Use interfaceNode (to avoid unused warning)
                        if (interfaceNode) {
                            // Successfully generated
                        }
                    }
                } catch (error) {
                    // Collect warnings untuk non-fatal errors
                    warnings.push(
                        `Failed to generate type: ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }

            // Generate code from types
            const code = this.buildCodeFromTypes(types);

            // Collect imports dari generator menggunakan getImports()
            const importSpecs = this.generator.getImports();
            const imports: GeneratedImport[] = importSpecs.map(spec => ({
                from: spec.source,
                names: Array.from(spec.named),
                typeOnly: spec.isTypeOnly
            }));

            // Build GeneratedTypeScript artifact
            const fingerprint: CompilerFingerprint = {
                compilerVersion: '1.0.0',
                parserVersion: '1.0.0',
                phpVersion: '8.2.0',
                frameworkVersion: '10.0.0',
                targetBackend: 'typescript',
                strictMode: false,
                featureFlags: new Map()
            };

            const artifact: GeneratedTypeScriptArtifact = {
                typeId: 'GeneratedTypeScript',
                code,
                imports,
                interfaces,
                generationMetadata: {
                    generatorVersion: '1.0.0',
                    typeCount: types.length,
                    interfaceCount: interfaces.length,
                    importCount: imports.length,
                    linesOfCode: code.split('\n').length,
                    warnings
                },
                // CompilerArtifact required metadata
                metadata: {
                    hash: computeFingerprintHash(fingerprint),
                    producer: this.name,
                    dependencies: ['SemanticTypes'],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                }
            };

            // Return as output tuple
            return [artifact];

        } catch (error) {
            // Fatal error - re-throw dengan context
            throw new TypeScriptGeneratorPassError(
                `TypeScript generation failed: ${error instanceof Error ? error.message : String(error)}`,
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Build code string from types
     * 
     * Phase 1 implementation - generates semantic interface names + conditional aliases
     * 
     * FIXED: Detect resources by naming convention, not just kind annotation
     * - Resources end with "Resource" OR "Response"
     * - Models are database models (don't get Show/Index aliases)
     */
    private buildCodeFromTypes(types: readonly SemanticType[]): string {
        const lines: string[] = [];

        lines.push('// Generated by TypeScriptGenerator');
        lines.push('// File: types/api-read.ts');
        lines.push('');

        for (const type of types) {
            if (type.kind === 'object') {
                // ✅ Extract annotations
                const nameAnnotation = type.annotations ? type.annotations.get('name') : undefined;
                const kindAnnotation = type.annotations ? type.annotations.get('kind') : undefined;
                const baseName = nameAnnotation || `Type${Date.now()}`

                // ✅ Always generate interface with "Transformed" suffix
                const interfaceName = `${baseName}Transformed`
                lines.push(`export interface ${interfaceName} {`);

                // ✅ Properties already camelCase dari CompilerBridge
                for (const [propName, propType] of type.properties.entries()) {
                    const tsType = this.convertTypeToString(propType);
                    lines.push(`    ${propName}: ${tsType};`);
                }

                lines.push('}');
                lines.push('');

                // ✅ FIXED: Detect resources by naming convention
                // Resources: ends with "Resource" OR "Response"
                // Models: everything else (database models)
                const isResource = kindAnnotation === 'resource' ||
                    baseName.endsWith('Resource') ||
                    baseName.endsWith('Response');

                if (isResource) {
                    // Generate Show/Index aliases for ALL resources
                    lines.push(`export type ${baseName}Show = ${interfaceName}`);
                    lines.push(`export type ${baseName}Index = ${interfaceName}[]`);
                    lines.push('');
                }
                // If it's a model (no Resource/Response suffix), skip aliases
            }
        }

        return lines.join('\n');
    }

    /**
     * Convert SemanticType to TypeScript type string
     */
    private convertTypeToString(type: SemanticType): string {
        switch (type.kind) {
            case 'primitive':
                // PrimitiveType has 'type' property (PrimitiveKind enum)
                // FIXED: datetime → string (ISO datetime strings in JSON)
                if (type.type === 'datetime') {
                    return 'string';
                }
                if (type.type === 'file') {
                    return 'File';
                }
                return type.type;
            case 'reference':
                return type.name;
            case 'readonly_collection':
            case 'mutable_collection':
                // Collection types have 'elementType' property
                return `${this.convertTypeToString(type.elementType)}[]`;
            case 'union':
                // ImmutableSet.values() returns readonly T[]
                return type.members.values()
                    .map((m: SemanticType) => this.convertTypeToString(m))
                    .join(' | ');
            case 'object':
                return 'object';
            case 'intersection':
                // ImmutableSet.values() returns readonly T[]
                return type.members.values()
                    .map((m: SemanticType) => this.convertTypeToString(m))
                    .join(' & ');
            case 'generic':
                // Handle generic types  
                return `${type.base.name}<${type.parameters.map(p => this.convertTypeToString(p.type)).join(', ')}>`;
            case 'never':
                return 'never';
            case 'error':
                return 'unknown'; // Error types map to unknown
            default:
                return 'unknown';
        }
    }
}

/**
 * Custom error class untuk TypeScriptGeneratorPass
 */
export class TypeScriptGeneratorPassError extends Error {
    constructor(
        message: string,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'TypeScriptGeneratorPassError';
        Object.freeze(this);
    }

    /**
     * Get detailed error message dengan cause chain
     */
    public getDetailedMessage(): string {
        let msg = `${this.name}: ${this.message}`;
        if (this.cause) {
            msg += `\n  Caused by: ${this.cause.message}`;
        }
        return msg;
    }
}
