/**
 * RouteSync Compiler
 * 
 * Multi-stage, artifact-based compilation pipeline for Laravel to TypeScript code generation.
 * 
 * Architecture Overview:
 * - Utils: Graph algorithms, queues, hashing utilities
 * - Artifacts: Typed artifact system for inter-pass communication
 * - Passes: Pass system with type-safe witnesses and dependency resolution
 * - Diagnostics: Error and warning reporting
 * - Cache: Artifact caching for incremental compilation
 * - Fingerprint: Compiler fingerprinting for cache invalidation
 * - Types: Semantic type system with join/meet/subtyping operations
 * - Result: Final compilation results
 * 
 * Key Design Principles:
 * - Type Safety: All artifacts are strongly typed
 * - Immutability: Compilation state is immutable (copy-on-write)
 * - Composability: Passes compose through artifacts
 * - Incrementality: Caching enables fast incremental builds
 * - Parallelism: Wave-based execution exploits pass-level parallelism
 */

// ============================================================================
// Utils Module
// ============================================================================
export { FIFOQueue } from './utils/Queue';
export {
    FrozenSet,
    DependencyGraph,
    DependencyGraphBuilder,
    IncrementalInvalidator,
    TarjanSCC,
    UnionFind as GraphUnionFind
} from './utils/Graph';
export { computeStableSymbolId, computeIRHash } from './utils/Hash';
export {
    Arena,
    ASTArena,
    type ASTNodeId,
    type ASTNodeData
} from './utils/Arena';
export { ControlFlowGraph } from './utils/ControlFlowGraph';
export { SourceLocation } from './utils/SourceLocation';
export {
    ImmutableList,
    ImmutableMap as ImmutableMapUtil,
    ImmutableSet as ImmutableSetUtil
} from './utils/ImmutableCollections';

// ============================================================================
// AST Module
// ============================================================================
export type { ASTNodeId as ASTNodeIdType, ASTNodeData as ASTNodeDataType } from './ast';
export { createASTNodeData, isSameKind, hasChildren } from './ast';

// ============================================================================
// Query Module - Incremental Compilation
// ============================================================================
export type {
    QueryCell,
    MemoizedQueryKey,
    QueryDescriptor,
    QueryKey,
    QueryNode,
    QueryContext,
    QueryFrame,
    SymbolDatabase
} from './query';
export {
    createPendingCell,
    createReadyCell,
    isReady,
    isPending,
    addDependency,
    TypedCache,
    createMemoizedQueryKey,
    QueryDatabase,
    MemoizedQueryDatabase,
    SalsaCompiler,
    QueryCycleError
} from './query';

// ============================================================================
// Emitters Module
// ============================================================================
export {
    type GeneratedArtifact,
    type BackendCapability,
    type ContractEmitter,
    TypeScriptEmitter
} from './emitters';

// ============================================================================
// Analysis Module
// ============================================================================
export {
    // Dominator analysis
    DominatorTree,
    DominanceFrontier,
    // Loop analysis
    type LoopInfo,
    LoopAnalysis,
    LoopNormalizer,
    // SSA analysis
    type SSABasicBlock,
    SSARepresentation,
    SSABuilder,
    SSARenamer,
    // Use-def analysis
    UseDefGraph,
    // Symbol analysis
    type SymbolNode,
    SymbolDatabase,
    // Data flow framework
    type FlowState,
    DataFlowAnalysis,
    // Analysis management
    AnalysisDependencyGraph,
    AnalysisManager,
    // Analysis key constants
    CFGAnalysis,
    DominatorsAnalysis,
    LoopInfoAnalysis,
    SSAAnalysis,
    UseDefAnalysis
} from './analysis';

// ============================================================================
// Optimization Module
// ============================================================================
export {
    // Core optimizers
    SSAOptimizer,
    OptimizationPipeline,
    PhiEliminator,
    CopyCoalescer,
    LICMOptimizer,
    // Optimization pass interface
    type OptimizationPass,
    // Instruction effect analysis
    type InstructionEffect,
    getInstructionEffect,
    isSpeculatable,
    hasSideEffects
} from './optimization';

// ============================================================================
// Verification Module
// ============================================================================
export {
    // Verification infrastructure
    Verifier,
    VerifierManager,
    VerifierPhase,
    type VerificationContext,
    // Concrete verifiers
    CFGVerifier,
    SSAVerifier,
    // Analysis components
    AliasAnalysis,
    type EffectAnalysis,
    DefaultEffectAnalysis
} from './verification';

// ============================================================================
// Artifacts Module
// ============================================================================
export {
    CompilerArtifact,
    TypedArtifact,
    ArtifactMetadata
} from './artifacts/Artifact';

export {
    ArtifactRegistry,
    ArtifactKey,
    ArtifactStorage
} from './artifacts/types';

export { ASTArtifact } from './artifacts/ASTArtifact';
export { ScopeGraphArtifact, ScopeNode } from './artifacts/ScopeGraphArtifact';
export { BoundASTArtifact, BoundASTNode, SymbolReference as BoundSymbolReference } from './artifacts/BoundASTArtifact';
export { SymbolGraphArtifact, Symbol, SymbolTable } from './artifacts/SymbolGraphArtifact';
export { ConstraintGraphArtifact } from './artifacts/ConstraintGraphArtifact';
export { TypeEnvironmentArtifact } from './artifacts/TypeEnvironmentArtifact';
export { ExpressionIRArtifact } from './artifacts/ExpressionIRArtifact';
export { LoweredTypeArtifact } from './artifacts/LoweredTypeArtifact';
export { DiagnosticArtifact } from './artifacts/DiagnosticArtifact';
export { DependencyGraphArtifact } from './artifacts/DependencyGraphArtifact';
export { SemanticIRArtifact } from './artifacts/SemanticIRArtifact';
export { CompilationResultArtifact } from './artifacts/CompilationResultArtifact';

// ============================================================================
// Passes Module
// ============================================================================
export {
    PassDescriptor,
    PassDependency,
    CompilerPass,
    ExecutablePass,
    TypedPassAdapter,
    PassGraph,
    PassManager,
    CompilationState,
    CompilationContext,
    CompilerOptions,
    FileSnapshot,
    VirtualFileSystem,
    ArtifactKeyWitness,
    ResolveArtifacts,
    readArtifacts,
    tupleAt,
    PassResult,
    AnalysisKey
} from './passes';

// ============================================================================
// Diagnostics Module
// ============================================================================
export {
    Diagnostic,
    DiagnosticSeverity,
    DiagnosticFix,
    TextEdit,
    FileSpan,
    DiagnosticBag
} from './diagnostics';

// ============================================================================
// Cache Module
// ============================================================================
export {
    ArtifactCache,
    CacheDescriptor,
    CacheInputDescriptor,
    LRUCache
} from './cache';

// ============================================================================
// Fingerprint Module
// ============================================================================
export {
    CompilerFingerprint,
    computeFingerprintHash
} from './fingerprint';

// ============================================================================
// Types Module
// ============================================================================
export {
    PrimitiveKind,
    CollectionKind,
    SemanticTypeKind,
    SemanticTypeBase,
    PrimitiveType,
    NeverType,
    ErrorType,
    ReferenceType,
    UnionType,
    IntersectionType,
    ReadonlyCollectionType,
    MutableCollectionType,
    GenericVariance,
    GenericParameter,
    GenericType,
    ObjectProperty,
    ObjectType,
    SemanticType,
    ImmutableMap,
    ImmutableSet,
    HashContext,
    TypeHasher,
    TypeInterner,
    TypeHierarchy,
    TypeSystem
} from './types';

// ============================================================================
// Result Module
// ============================================================================
export { CompilationResult, type CompilationStatistics } from './result';

// ============================================================================
// Constraints Module
// ============================================================================
export {
    type TypeVariable,
    type Constraint,
    type ConstraintViolation,
    TypeEnvironment,
    type VariableState,
    UnionFind as ConstraintUnionFind,
    ConstraintSolver
} from './constraints';

// ============================================================================
// IR Module - Intermediate Representation
// ============================================================================
export {
    type SymbolReference,
    type ConstantValue,
    type Expression,
    ArrayConstant,
    ClassConstant,
    EnumCase,
    type SemanticIRNodeKind,
    type IRNodeId,
    type SemanticOrigin,
    type SemanticIRNode,
    SemanticIRArena,
    type NodeId,
    type ContractBaseNode,
    type ContractNode,
    type ContractVisitor,
    EntityNode,
    SchemaNode,
    RelationNode,
    ContractGraph,
    ContractGraphBuilder
} from './ir';

// ============================================================================
// Re-export AST node types from artifacts for convenience
// ============================================================================
export {
    ASTNode,
    ClassDeclaration,
    MethodDeclaration,
    PropertyDeclaration,
    CallExpression
} from './artifacts/ASTArtifact';

// ============================================================================
// Scanner Module
// ============================================================================
export * from './scanner/LaravelSourceLexer';
export * from './scanner/StaticLaravelScanner';
