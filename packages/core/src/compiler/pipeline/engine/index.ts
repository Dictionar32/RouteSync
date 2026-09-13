/**
 * engine/index.ts
 *
 * Explicit named exports for CodeGenerationEngine internals.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module compiler/pipeline/engine
 */

export {
    type EngineConfig,
    type FileNamingStrategy,
    DEFAULT_FILE_NAMING,
    createDefaultEngineConfig
} from './engineConfig';

export {
    executeGenerationStage,
    executeFormattingStage,
    executeEmissionStage,
    executeWritingStage
} from './engineStages';

export { runCodeGenerationPipeline } from './pipelineRunner';
export { PipelineBuilder } from './pipelineBuilder';
