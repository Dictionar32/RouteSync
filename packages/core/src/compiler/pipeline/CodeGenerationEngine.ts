/**
 * @file CodeGenerationEngine.ts
 * @description Complete code generation engine dengan full pipeline integration
 * 
 * Architecture:
 * Input (Manifest/IR) → Pass System → Target AST → Formatter → Emitter → Writer
 * 
 * This engine orchestrates seluruh flow dari manifest sampai generated files,
 * menggantikan manual orchestration di CompilerBridge.
 */

import type { ICodeGenerationPipeline, PipelineResult, PipelineConfig, PipelineWarning } from './ICodeGenerationPipeline';
import type { ITargetNode } from '../target/ITargetNode';
import type { IGenerator } from '../generators/IGenerator';
import type { IFormatter } from '../formatting/IFormatter';
import type { IEmitter } from '../emitters/IEmitter';
import type { IWriter, GeneratedArtifact } from '../writers/IWriter';
import { PipelineError } from './ICodeGenerationPipeline';

/**
 * Configuration untuk CodeGenerationEngine
 */
export interface EngineConfig extends PipelineConfig {
    /** Enable detailed logging */
    readonly verbose?: boolean;

    /** Output directory untuk file writing */
    readonly outputDir?: string;

    /** Custom file naming strategy */
    readonly fileNaming?: FileNamingStrategy;
}

/**
 * File naming strategy
 */
export interface FileNamingStrategy {
    /** Generate filename untuk artifact type */
    getFileName(artifactType: string): string;
}

/**
 * Default file naming strategy
 */
const DEFAULT_FILE_NAMING: FileNamingStrategy = {
    getFileName(artifactType: string): string {
        switch (artifactType) {
            case 'GeneratedTypeScript':
                return 'types/api-read.ts';
            case 'GeneratedForm':
                return 'forms/api-form.ts';
            case 'GeneratedContract':
                return 'contracts/api-contract.ts';
            default:
                return `generated/${artifactType.toLowerCase()}.ts`;
        }
    }
};

/**
 * CodeGenerationEngine
 * 
 * Complete pipeline implementation yang orchestrates:
 * 1. Pass execution (generate artifacts)
 * 2. Target AST generation (via Generator)
 * 3. AST formatting (via Formatter)
 * 4. Code emission (via Emitter)
 * 5. File writing (via Writer)
 * 
 * @example
 * ```typescript
 * const engine = new CodeGenerationEngine({
 *   generator: new TypeScriptGenerator(),
 *   formatter: new TypeScriptFormatter(),
 *   emitter: new TypeScriptEmitter(),
 *   writer: new FileWriter('./output'),
 *   config: { verbose: true }
 * });
 * 
 * const result = await engine.execute(input);
 * ```
 */
export class CodeGenerationEngine<TInput, TTargetNode extends ITargetNode>
    implements ICodeGenerationPipeline<TInput, TTargetNode> {

    private readonly generator: IGenerator<TInput, TTargetNode>;
    private readonly formatter: IFormatter<TTargetNode>;
    private readonly emitter: IEmitter<TTargetNode>;
    private readonly writer: IWriter;
    private readonly config: EngineConfig;

    constructor(deps: {
        readonly generator: IGenerator<TInput, TTargetNode>;
        readonly formatter: IFormatter<TTargetNode>;
        readonly emitter: IEmitter<TTargetNode>;
        readonly writer: IWriter;
        readonly config?: EngineConfig;
    }) {
        this.generator = deps.generator;
        this.formatter = deps.formatter;
        this.emitter = deps.emitter;
        this.writer = deps.writer;
        this.config = {
            stages: {
                formatting: true,
                validation: true,
                optimization: true
            },
            profiling: false,
            failFast: true,
            verbose: false,
            fileNaming: DEFAULT_FILE_NAMING,
            ...deps.config
        };

        Object.freeze(this);
    }

    /**
     * Execute complete pipeline
     * 
     * FLOW:
     * 1. Generation: Input → Target AST
     * 2. Formatting: AST → Formatted AST
     * 3. Emission: AST → String code
     * 4. Writing: Code → Files
     * 
     * @param input - Input untuk generation (ContractGraph, etc)
     * @returns PipelineResult dengan artifacts dan metrics
     */
    async execute(input: TInput): Promise<PipelineResult> {
        const startTime = performance.now();
        const warnings: PipelineWarning[] = [];
        const stageMetrics: Record<string, number> = {
            generationMs: 0,
            formattingMs: 0,
            emissionMs: 0,
            writingMs: 0
        };

        try {
            this.log('[CodeGenerationEngine] Starting pipeline execution...');

            // Stage 1: Generation (Input → Target AST)
            const { ast, generationTime } = await this.executeGeneration(input);
            stageMetrics.generationMs = generationTime;
            this.log(`[Stage 1] Generation complete: ${generationTime.toFixed(2)}ms`);

            // Stage 2: Formatting (AST → Formatted AST)
            const { formattedAst, formattingTime } = await this.executeFormatting(ast);
            stageMetrics.formattingMs = formattingTime;
            this.log(`[Stage 2] Formatting complete: ${formattingTime.toFixed(2)}ms`);

            // Stage 3: Emission (AST → Code String)
            const { code, emissionTime } = await this.executeEmission(formattedAst);
            stageMetrics.emissionMs = emissionTime;
            this.log(`[Stage 3] Emission complete: ${emissionTime.toFixed(2)}ms`);

            // Stage 4: Writing (Code → Files)
            const { artifacts, writingTime } = await this.executeWriting(code, input);
            stageMetrics.writingMs = writingTime;
            this.log(`[Stage 4] Writing complete: ${writingTime.toFixed(2)}ms`);

            const totalTime = performance.now() - startTime;
            this.log(`[CodeGenerationEngine] Pipeline complete: ${totalTime.toFixed(2)}ms`);

            return {
                artifacts,
                warnings,
                metrics: {
                    totalTimeMs: totalTime,
                    stages: {
                        generationMs: stageMetrics.generationMs,
                        formattingMs: stageMetrics.formattingMs,
                        emissionMs: stageMetrics.emissionMs,
                        writingMs: stageMetrics.writingMs
                    }
                }
            };

        } catch (error) {
            if (error instanceof PipelineError) {
                throw error;
            }
            throw new PipelineError(
                `Pipeline execution failed: ${error instanceof Error ? error.message : String(error)}`,
                'generation', // Default stage if unknown
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Stage 1: Generation (Input → Target AST)
     */
    private async executeGeneration(input: TInput): Promise<{
        ast: TTargetNode;
        generationTime: number;
    }> {
        const startTime = performance.now();

        try {
            this.log('[Generation] Generating target AST from input...');
            const ast = await this.generator.generate(input);
            const generationTime = performance.now() - startTime;

            return { ast, generationTime };
        } catch (error) {
            throw new PipelineError(
                `Generation stage failed: ${error instanceof Error ? error.message : String(error)}`,
                'generation',
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Stage 2: Formatting (AST → Formatted AST)
     */
    private async executeFormatting(ast: TTargetNode): Promise<{
        formattedAst: TTargetNode;
        formattingTime: number;
    }> {
        const startTime = performance.now();

        try {
            // Skip formatting jika disabled
            if (this.config.stages?.formatting === false) {
                this.log('[Formatting] Skipped (disabled in config)');
                return { formattedAst: ast, formattingTime: 0 };
            }

            this.log('[Formatting] Formatting AST (sorting imports, reordering declarations)...');
            const formattedAst = await this.formatter.format(ast);
            const formattingTime = performance.now() - startTime;

            return { formattedAst, formattingTime };
        } catch (error) {
            throw new PipelineError(
                `Formatting stage failed: ${error instanceof Error ? error.message : String(error)}`,
                'formatting',
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Stage 3: Emission (AST → Code String)
     */
    private async executeEmission(ast: TTargetNode): Promise<{
        code: string;
        emissionTime: number;
    }> {
        const startTime = performance.now();

        try {
            this.log('[Emission] Emitting code from formatted AST...');
            const code = await this.emitter.emit(ast);
            const emissionTime = performance.now() - startTime;

            this.log(`[Emission] Generated ${code.split('\n').length} lines of code`);

            return { code, emissionTime };
        } catch (error) {
            throw new PipelineError(
                `Emission stage failed: ${error instanceof Error ? error.message : String(error)}`,
                'emission',
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Stage 4: Writing (Code → Files)
     */
    private async executeWriting(code: string, input: TInput): Promise<{
        artifacts: readonly GeneratedArtifact[];
        writingTime: number;
    }> {
        const startTime = performance.now();

        try {
            this.log('[Writing] Writing generated code to files...');

            // Determine filename based on artifact type
            const artifactType = this.inferArtifactType(input);
            const fileName = this.config.fileNaming?.getFileName(artifactType) ?? DEFAULT_FILE_NAMING.getFileName(artifactType);

            // Write via Writer
            const artifact: GeneratedArtifact = {
                filePath: fileName,  // Use filePath for IWriter compatibility
                fileName,            // Keep fileName for backward compatibility
                content: code,
                metadata: {
                    linesOfCode: code.split('\n').length,
                    generatedAt: new Date(),
                    artifactType
                }
            };

            await this.writer.write(artifact);
            const writingTime = performance.now() - startTime;

            this.log(`[Writing] Written to ${fileName}`);

            return { artifacts: [artifact], writingTime };
        } catch (error) {
            throw new PipelineError(
                `Writing stage failed: ${error instanceof Error ? error.message : String(error)}`,
                'writing',
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Infer artifact type dari input
     * Helper untuk determine output filename
     */
    private inferArtifactType(input: TInput): string {
        // Basic inference - bisa di-extend sesuai kebutuhan
        const inputStr = String(input);
        if (inputStr.includes('Contract')) return 'GeneratedContract';
        if (inputStr.includes('Form')) return 'GeneratedForm';
        return 'GeneratedTypeScript';
    }

    /**
     * Log helper (conditional based on verbose mode)
     */
    private log(message: string): void {
        if (this.config.verbose) {
            console.log(message);
        }
    }
}

/**
 * PipelineBuilder untuk fluent configuration
 * 
 * @example
 * ```typescript
 * const engine = PipelineBuilder.create<ContractGraph, TSFile>()
 *   .withGenerator(generator)
 *   .withFormatter(formatter)
 *   .withEmitter(emitter)
 *   .withWriter(writer)
 *   .withVerbose(true)
 *   .build();
 * ```
 */
export class PipelineBuilder<TInput, TTargetNode extends ITargetNode> {
    private generator?: IGenerator<TInput, TTargetNode>;
    private formatter?: IFormatter<TTargetNode>;
    private emitter?: IEmitter<TTargetNode>;
    private writer?: IWriter;
    private config: EngineConfig = {
        stages: {
            formatting: true,
            validation: true,
            optimization: true
        },
        profiling: false,
        failFast: true,
        verbose: false
    };

    private constructor() { }

    static create<TInput, TTargetNode extends ITargetNode>(): PipelineBuilder<TInput, TTargetNode> {
        return new PipelineBuilder<TInput, TTargetNode>();
    }

    withGenerator(generator: IGenerator<TInput, TTargetNode>): this {
        this.generator = generator;
        return this;
    }

    withFormatter(formatter: IFormatter<TTargetNode>): this {
        this.formatter = formatter;
        return this;
    }

    withEmitter(emitter: IEmitter<TTargetNode>): this {
        this.emitter = emitter;
        return this;
    }

    withWriter(writer: IWriter): this {
        this.writer = writer;
        return this;
    }

    withConfig(config: Partial<EngineConfig>): this {
        this.config = { ...this.config, ...config };
        return this;
    }

    withVerbose(verbose: boolean): this {
        this.config = { ...this.config, verbose };
        return this;
    }

    withOutputDir(outputDir: string): this {
        this.config = { ...this.config, outputDir };
        return this;
    }

    build(): CodeGenerationEngine<TInput, TTargetNode> {
        if (!this.generator) throw new Error('Generator is required');
        if (!this.formatter) throw new Error('Formatter is required');
        if (!this.emitter) throw new Error('Emitter is required');
        if (!this.writer) throw new Error('Writer is required');

        return new CodeGenerationEngine({
            generator: this.generator,
            formatter: this.formatter,
            emitter: this.emitter,
            writer: this.writer,
            config: this.config
        });
    }
}
