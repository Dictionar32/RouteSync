/**
 * CodeGenerationEngine.ts
 *
 * Active Consumer Orchestrator: Input (Manifest/IR) → Pass System → Target AST → Formatter → Emitter → Writer
 * Follows Rule 14: 0 wildcard re-exports (`0 export * from`), active consumption,
 * and pure flow declaration.
 *
 * @module compiler/pipeline/CodeGenerationEngine
 */

import type { ICodeGenerationPipeline, PipelineResult } from './ICodeGenerationPipeline';
import type { ITargetNode } from '../target/ITargetNode';
import type { IGenerator } from '../generators/IGenerator';
import type { IFormatter } from '../formatting/IFormatter';
import type { IEmitter } from '../emitters/IEmitter';
import type { IWriter } from '../writers/IWriter';
import {
    EngineConfig,
    FileNamingStrategy,
    DEFAULT_FILE_NAMING,
    PipelineBuilder,
    createDefaultEngineConfig,
    runCodeGenerationPipeline
} from './engine';

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
        this.config = createDefaultEngineConfig(deps.config);

        Object.freeze(this);
    }

    /**
     * Execute complete pipeline: Generation → Formatting → Emission → Writing.
     */
    async execute(input: TInput): Promise<PipelineResult> {
        return runCodeGenerationPipeline(
            {
                generator: this.generator,
                formatter: this.formatter,
                emitter: this.emitter,
                writer: this.writer,
                config: this.config
            },
            input,
            msg => this.log(msg)
        );
    }

    private log(message: string): void {
        if (this.config.verbose) {
            console.log(message);
        }
    }
}

export {
    EngineConfig,
    FileNamingStrategy,
    DEFAULT_FILE_NAMING,
    PipelineBuilder
};
