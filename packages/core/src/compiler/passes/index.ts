/**
 * Compiler Passes Module
 * 
 * This module provides the pass system infrastructure for the RouteSync compiler.
 * It implements a typed, artifact-based compilation pipeline with support for:
 * - Type-safe pass definitions with input/output witnesses
 * - Dependency resolution and topological sorting
 * - Wave-based parallel execution
 * - Incremental compilation with caching
 * - Immutable compilation state
 * 
 * Architecture:
 * - PassDescriptor: Declares pass inputs/outputs
 * - CompilerPass: Typed pass interface with witnesses
 * - ExecutablePass: Runtime pass interface
 * - TypedPassAdapter: Adapts typed passes to executable passes
 * - PassGraph: Dependency resolution algorithms
 * - PassManager: Pipeline orchestration
 * - CompilationState: Immutable artifact storage
 * - CompilationContext: Compilation environment
 */

// Core pass interfaces
export { PassDescriptor, PassDependency } from './PassDescriptor';
export { CompilerPass } from './CompilerPass';
export { ExecutablePass } from './ExecutablePass';

// Pass adaptation
export { TypedPassAdapter } from './TypedPassAdapter';

// Dependency resolution
export { PassGraph } from './PassGraph';

// Pipeline orchestration
export { PassManager } from './PassManager';

// State and context
export { CompilationState } from './CompilationState';
export {
    CompilationContext,
    CompilerOptions,
    FileSnapshot,
    VirtualFileSystem
} from './CompilationContext';

// Artifact key witnesses and helpers
export {
    ArtifactKeyWitness,
    ResolveArtifacts,
    readArtifacts,
    tupleAt
} from './ArtifactKeyWitness';

// Pass result types
export {
    PassResult,
    AnalysisKey
} from './PassResult';
