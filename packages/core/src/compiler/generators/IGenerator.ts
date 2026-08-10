/**
 * @file IGenerator.ts
 * @description Interface contracts untuk Generator layer
 * 
 * Generator layer bertanggung jawab transform IR (Intermediate Representation)
 * menjadi Target AST. Generator TAHU tentang domain concepts dan target language syntax.
 */

/**
 * Base interface untuk semua generators
 * 
 * Generic parameters:
 * - TInput: Input type (biasanya IR nodes seperti ContractGraph, EntityNode)
 * - TOutput: Output type (Target AST node)
 * 
 * Note: TOutput tidak strictly enforce ITargetNode karena visitor pattern
 * bisa berbeda per target language (TSVisitor vs generic ITargetVisitor).
 * 
 * @example
 * ```typescript
 * class TypeScriptGenerator implements IGenerator<ContractGraph, TSFile> {
 *   generate(input: ContractGraph): TSFile {
 *     // Transform IR to TypeScript AST
 *   }
 * }
 * ```
 */
export interface IGenerator<TInput, TOutput> {
    /**
     * Generate Target AST dari input
     * 
     * Method ini HARUS:
     * - Pure function (no side effects)
     * - Deterministic (same input → same output)
     * - Type-safe (no any types)
     * 
     * @param input - Input untuk transform (IR node)
     * @returns Target AST node (Promise untuk async compatibility)
     * @throws GeneratorError jika transformation fails
     */
    generate(input: TInput): TOutput | Promise<TOutput>;
}

/**
 * Configuration options untuk generators
 */
export interface GeneratorConfig {
    /** Target language version (e.g., 'ES2020', 'ES2022') */
    readonly targetVersion?: string;

    /** Enable strict mode generation */
    readonly strict?: boolean;

    /** Additional metadata untuk embed dalam generated code */
    readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Generator error untuk type-safe error handling
 */
export class GeneratorError extends Error {
    constructor(
        message: string,
        public readonly cause?: Error,
        public readonly context?: Readonly<Record<string, unknown>>
    ) {
        super(message);
        this.name = 'GeneratorError';
        Object.freeze(this);
    }
}

/**
 * Result type untuk generator operations
 */
export interface GeneratorResult<T> {
    /** Generated AST node */
    readonly node: T;

    /** Warnings generated during transformation */
    readonly warnings: readonly GeneratorWarning[];

    /** Metadata about generation process */
    readonly metadata: Readonly<Record<string, unknown>>;
}

/**
 * Warning yang terjadi during generation (non-fatal)
 */
export interface GeneratorWarning {
    readonly message: string;
    readonly code: string;
    readonly location?: Readonly<{
        readonly file: string;
        readonly line: number;
        readonly column: number;
    }>;
}

