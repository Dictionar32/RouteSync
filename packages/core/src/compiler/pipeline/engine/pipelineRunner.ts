/**
 * pipelineRunner.ts
 *
 * Coordinates multi-stage code generation pipeline execution:
 * Generation → Formatting → Emission → Writing.
 *
 * @module compiler/pipeline/engine
 */

import type { ITargetNode } from '../../target/ITargetNode';
import type { IGenerator } from '../../generators/IGenerator';
import type { IFormatter } from '../../formatting/IFormatter';
import type { IEmitter } from '../../emitters/IEmitter';
import type { IWriter } from '../../writers/IWriter';
import {
    type PipelineResult,
    type PipelineWarning,
    PipelineError
} from '../ICodeGenerationPipeline';
import type { EngineConfig } from './engineConfig';
import {
    executeGenerationStage,
    executeFormattingStage,
    executeEmissionStage,
    executeWritingStage
} from './engineStages';

export async function runCodeGenerationPipeline<TInput, TTargetNode extends ITargetNode>(
    deps: {
        readonly generator: IGenerator<TInput, TTargetNode>;
        readonly formatter: IFormatter<TTargetNode>;
        readonly emitter: IEmitter<TTargetNode>;
        readonly writer: IWriter;
        readonly config: EngineConfig;
    },
    input: TInput,
    logger: (message: string) => void
): Promise<PipelineResult> {
    const startTime = performance.now();
    const warnings: PipelineWarning[] = [];
    const stageMetrics: Record<string, number> = {
        generationMs: 0,
        formattingMs: 0,
        emissionMs: 0,
        writingMs: 0
    };

    try {
        logger('[CodeGenerationEngine] Starting pipeline execution...');

        // Stage 1: Generation (Input → Target AST)
        const { ast, generationTime } = await executeGenerationStage(
            deps.generator,
            input,
            logger
        );
        stageMetrics.generationMs = generationTime;
        logger(`[Stage 1] Generation complete: ${generationTime.toFixed(2)}ms`);

        // Stage 2: Formatting (AST → Formatted AST)
        const { formattedAst, formattingTime } = await executeFormattingStage(
            deps.formatter,
            ast,
            deps.config,
            logger
        );
        stageMetrics.formattingMs = formattingTime;
        logger(`[Stage 2] Formatting complete: ${formattingTime.toFixed(2)}ms`);

        // Stage 3: Emission (AST → Code String)
        const { code, emissionTime } = await executeEmissionStage(
            deps.emitter,
            formattedAst,
            logger
        );
        stageMetrics.emissionMs = emissionTime;
        logger(`[Stage 3] Emission complete: ${emissionTime.toFixed(2)}ms`);

        // Stage 4: Writing (Code → Files)
        const { artifacts, writingTime } = await executeWritingStage(
            deps.writer,
            code,
            input,
            deps.config,
            logger
        );
        stageMetrics.writingMs = writingTime;
        logger(`[Stage 4] Writing complete: ${writingTime.toFixed(2)}ms`);

        const totalTime = performance.now() - startTime;
        logger(`[CodeGenerationEngine] Pipeline complete: ${totalTime.toFixed(2)}ms`);

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
            'generation',
            error instanceof Error ? error : undefined
        );
    }
}
