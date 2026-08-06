/**
 * @file ICodeGenerationPipeline.ts
 * @description Interface contract untuk complete code generation pipeline
 * 
 * Pipeline mengintegrasikan semua layers:
 * IR → Generator → Target AST → Formatter → Emitter → Writer
 */

import type { ITargetNode } from '../target/ITargetNode';
import type { IGenerator } from '../generators/IGenerator';
import type { IFormatter } from '../formatting/IFormatter';
import type { IEmitter } from '../emitters/IEmitter';
import type { IWriter, GeneratedArtifact } from '../writers/IWriter';

/**
 * Complete code generation pipeline
 * 
 * Pipeline orchestrates transformation dari IR sampai generated files:
 * 1. Generator: IR → Target AST
 * 2. Formatter: AST → Formatted AST
 * 3. Emitter: AST → String
 * 4. Writer: String → File
 * 
 * @example
 * ```typescript
 * const pipeline = new CodeGenerationPipeline(
 *   generator,
 *   formatter,
 *   emitter,
 *   writer
 * );
 * 
 * await pipeline.execute(contractGraph);
 * ```
 */
export interface ICodeGenerationPipeline<TInput, TTargetNode extends ITargetNode> {
    /**
     * Execute complete pipeline: IR → Target AST → Formatted → Code → Files
     * 
     * FLOW:
     * 1. Generate Target AST dari IR
     * 2. Format AST (sort imports, reorder declarations)
     * 3. Emit string dari formatted AST
     * 4. Write ke files
     * 
     * @param input - IR input untuk generate
     * @returns Pipeline execution result
     * @throws PipelineError jika any stage fails
     */
    execute(input: TInput): Promise<PipelineResult>;
}

/**
 * Pipeline execution result
 */
export interface PipelineResult {
    /** Generated artifacts */
    readonly artifacts: readonly GeneratedArtifact[];

    /** Warnings generated during pipeline */
    readonly warnings: readonly PipelineWarning[];

    /** Performance metrics */
    readonly metrics: PipelineMetrics;
}

/**
 * Pipeline warning (non-fatal issues)
 */
export interface PipelineWarning {
    readonly stage: 'generation' | 'formatting' | 'emission' | 'writing';
    readonly message: string;
    readonly code?: string;
}

/**
 * Performance metrics untuk pipeline execution
 */
export interface PipelineMetrics {
    /** Total execution time (ms) */
    readonly totalTimeMs: number;

    /** Time per stage */
    readonly stages: Readonly<{
        readonly generationMs: number;
        readonly formattingMs: number;
        readonly emissionMs: number;
        readonly writingMs: number;
    }>;

    /** Memory usage */
    readonly memory?: Readonly<{
        readonly peakBytes: number;
        readonly finalBytes: number;
    }>;
}

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
    /** Enable/disable specific stages */
    readonly stages?: Readonly<{
        readonly formatting?: boolean;
        readonly validation?: boolean;
        readonly optimization?: boolean;
    }>;

    /** Performance profiling */
    readonly profiling?: boolean;

    /** Fail fast on first error */
    readonly failFast?: boolean;
}

/**
 * Pipeline error untuk type-safe error handling
 */
export class PipelineError extends Error {
    constructor(
        message: string,
        public readonly stage: 'generation' | 'formatting' | 'emission' | 'writing',
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'PipelineError';
        Object.freeze(this);
    }
}

/**
 * Pipeline builder untuk fluent configuration
 * 
 * @example
 * ```typescript
 * const pipeline = PipelineBuilder.create<ContractGraph, TSFile>()
 *   .withGenerator(new TypeScriptGenerator())
 *   .withFormatter(new TypeScriptFormatter())
 *   .withEmitter(new TypeScriptEmitter())
 *   .withWriter(new FileWriter('./output'))
 *   .build();
 * ```
 */
export interface IPipelineBuilder<TInput, TTargetNode extends ITargetNode> {
    withGenerator(generator: IGenerator<TInput, TTargetNode>): this;
    withFormatter(formatter: IFormatter<TTargetNode>): this;
    withEmitter(emitter: IEmitter<TTargetNode>): this;
    withWriter(writer: IWriter): this;
    withConfig(config: PipelineConfig): this;
    build(): ICodeGenerationPipeline<TInput, TTargetNode>;
}

