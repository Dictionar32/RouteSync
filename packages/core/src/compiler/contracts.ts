/**
 * @file contracts.ts
 * @description Central export untuk semua interface contracts
 * 
 * File ini export semua "baju baru" (interface/contract) tanpa implementation.
 * Implementation akan dibuat bertahap setelah interfaces stable.
 * 
 * ARCHITECTURE LAYERS:
 * 1. Target AST - Base contracts untuk AST nodes
 * 2. Generator - Transform IR → Target AST
 * 3. Formatter - Optimize AST structure
 * 4. Emitter - Print AST → String
 * 5. Writer - Persist String → Files
 * 6. Pipeline - Orchestrate semua layers
 */

// ============================================================================
// Target AST Layer
// ============================================================================

export type {
    ITargetNode,
    ITargetVisitor,
    IStatementNode,
    IExpressionNode,
    ITypeNode,
    IDeclarationNode,
    SourceLocation,
} from './target/ITargetNode';

// ============================================================================
// Generator Layer
// ============================================================================

export type {
    IGenerator,
    GeneratorConfig,
    GeneratorResult,
    GeneratorWarning,
} from './generators/IGenerator';

export {
    GeneratorError,
} from './generators/IGenerator';

// ============================================================================
// Formatter Layer
// ============================================================================

export type {
    IFormatter,
    IComposableFormatter,
    FormatterConfig,
    FormattingResult,
    FormattingChange,
} from './formatting/IFormatter';

export {
    FormatterError,
} from './formatting/IFormatter';

// ============================================================================
// Emitter Layer
// ============================================================================

export type {
    IEmitter,
    IEmitterVisitor,
    IStreamingEmitter,
    EmitterConfig,
    EmissionResult,
} from './emitters/IEmitter';

export {
    EmitterError,
} from './emitters/IEmitter';

// ============================================================================
// Writer Layer
// ============================================================================

export type {
    IWriter,
    IMemoryWriter,
    GeneratedArtifact,
    ArtifactMetadata,
    WriterConfig,
    WriteResult,
    WriteError,
} from './writers/IWriter';

export {
    WriterError,
} from './writers/IWriter';

// ============================================================================
// Pipeline Layer
// ============================================================================

export type {
    ICodeGenerationPipeline,
    IPipelineBuilder,
    PipelineConfig,
    PipelineResult,
    PipelineWarning,
    PipelineMetrics,
} from './pipeline/ICodeGenerationPipeline';

export {
    PipelineError,
} from './pipeline/ICodeGenerationPipeline';

