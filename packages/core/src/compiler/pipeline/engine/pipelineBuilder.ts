/**
 * pipelineBuilder.ts
 *
 * Fluent builder for configuring and instantiating CodeGenerationEngine.
 *
 * @module compiler/pipeline/engine/pipelineBuilder
 */

import type { ITargetNode } from '../../target/ITargetNode';
import type { IGenerator } from '../../generators/IGenerator';
import type { IFormatter } from '../../formatting/IFormatter';
import type { IEmitter } from '../../emitters/IEmitter';
import type { IWriter } from '../../writers/IWriter';
import type { EngineConfig } from './engineConfig';
import { CodeGenerationEngine } from '../CodeGenerationEngine';

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
