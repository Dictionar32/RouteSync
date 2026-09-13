/**
 * engineStages.ts
 *
 * Stage execution logic for CodeGenerationEngine (Generation, Formatting, Emission, Writing).
 *
 * @module compiler/pipeline/engine/engineStages
 */

import type { ITargetNode } from '../../target/ITargetNode';
import type { IGenerator } from '../../generators/IGenerator';
import type { IFormatter } from '../../formatting/IFormatter';
import type { IEmitter } from '../../emitters/IEmitter';
import type { IWriter, GeneratedArtifact } from '../../writers/IWriter';
import { PipelineError } from '../ICodeGenerationPipeline';
import { EngineConfig, DEFAULT_FILE_NAMING } from './engineConfig';

export function inferArtifactType<TInput>(input: TInput): string {
    const inputStr = String(input);
    if (inputStr.includes('Contract')) return 'GeneratedContract';
    if (inputStr.includes('Form')) return 'GeneratedForm';
    return 'GeneratedTypeScript';
}

export async function executeGenerationStage<TInput, TTargetNode extends ITargetNode>(
    generator: IGenerator<TInput, TTargetNode>,
    input: TInput,
    log: (msg: string) => void
): Promise<{ ast: TTargetNode; generationTime: number }> {
    const startTime = performance.now();
    try {
        log('[Generation] Generating target AST from input...');
        const ast = await generator.generate(input);
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

export async function executeFormattingStage<TTargetNode extends ITargetNode>(
    formatter: IFormatter<TTargetNode>,
    ast: TTargetNode,
    config: EngineConfig,
    log: (msg: string) => void
): Promise<{ formattedAst: TTargetNode; formattingTime: number }> {
    const startTime = performance.now();
    try {
        if (config.stages?.formatting === false) {
            log('[Formatting] Skipped (disabled in config)');
            return { formattedAst: ast, formattingTime: 0 };
        }

        log('[Formatting] Formatting AST (sorting imports, reordering declarations)...');
        const formattedAst = await formatter.format(ast);
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

export async function executeEmissionStage<TTargetNode extends ITargetNode>(
    emitter: IEmitter<TTargetNode>,
    ast: TTargetNode,
    log: (msg: string) => void
): Promise<{ code: string; emissionTime: number }> {
    const startTime = performance.now();
    try {
        log('[Emission] Emitting code from formatted AST...');
        const code = await emitter.emit(ast);
        const emissionTime = performance.now() - startTime;
        log(`[Emission] Generated ${code.split('\n').length} lines of code`);
        return { code, emissionTime };
    } catch (error) {
        throw new PipelineError(
            `Emission stage failed: ${error instanceof Error ? error.message : String(error)}`,
            'emission',
            error instanceof Error ? error : undefined
        );
    }
}

export async function executeWritingStage<TInput>(
    writer: IWriter,
    code: string,
    input: TInput,
    config: EngineConfig,
    log: (msg: string) => void
): Promise<{ artifacts: readonly GeneratedArtifact[]; writingTime: number }> {
    const startTime = performance.now();
    try {
        log('[Writing] Writing generated code to files...');

        const artifactType = inferArtifactType(input);
        const fileName = config.fileNaming?.getFileName(artifactType) ?? DEFAULT_FILE_NAMING.getFileName(artifactType);

        const artifact: GeneratedArtifact = {
            filePath: fileName,
            fileName,
            content: code,
            metadata: {
                linesOfCode: code.split('\n').length,
                generatedAt: new Date(),
                artifactType
            }
        };

        await writer.write(artifact);
        const writingTime = performance.now() - startTime;
        log(`[Writing] Written to ${fileName}`);

        return { artifacts: [artifact], writingTime };
    } catch (error) {
        throw new PipelineError(
            `Writing stage failed: ${error instanceof Error ? error.message : String(error)}`,
            'writing',
            error instanceof Error ? error : undefined
        );
    }
}
