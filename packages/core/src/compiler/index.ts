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
export { computeStableSymbolId, computeIRHash } from './utils/Hash';
export {
    Arena,
    ASTArena,
    type ASTNodeId,
    type ASTNodeData
} from './utils/Arena';
export type { ControlFlowGraph } from './utils/ControlFlowGraph';
export {
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
    MemoizedQueryKey,
    QueryDescriptor,
    QueryKey,
    QueryNode,
    QueryContext,
    QueryFrame
} from './query';
export {
    createTypedCache,
    createMemoizedQueryKey,
    createQueryDatabase,
    createSalsaCompiler
} from './query';

// ============================================================================
// Emitters Module
// ============================================================================
export {
    type GeneratedArtifact,
    type BackendCapability
} from './emitters';

// ============================================================================
// Analysis Module
// ============================================================================
export type { SymbolNode, SymbolDatabase } from './analysis';
export {
    // Dominator analysis
    type DominatorTree,
    type DominanceFrontier,
    // Loop analysis
    type LoopInfo,
    LoopAnalysis,
    LoopNormalizer,
    // SSA analysis
    type SSABasicBlock,
    type SSARepresentation,
    SSABuilder,
    type SSARenamer,
    // Use-def analysis
    UseDefGraph,
    // Symbol analysis
    createSymbolDatabase,
    // Data flow framework
    type FlowState,
    DataFlowAnalysis,
    // Analysis management
    type AnalysisDependencyGraph,
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
    type ArtifactMetadata
} from './artifacts/Artifact';

export type {
    ArtifactRegistry,
    ArtifactKey,
    ArtifactStorage
} from './artifacts/types';

export { ASTArtifact } from './artifacts/ASTArtifact';
export { ScopeGraphArtifact, type ScopeNode } from './artifacts/ScopeGraphArtifact';
export { BoundASTArtifact, type BoundASTNode, type SymbolReference as BoundSymbolReference } from './artifacts/BoundASTArtifact';
export { SymbolGraphArtifact, type Symbol, type SymbolTable } from './artifacts/SymbolGraphArtifact';
export { ConstraintGraphArtifact } from './artifacts/ConstraintGraphArtifact';
export { TypeEnvironmentArtifact } from './artifacts/TypeEnvironmentArtifact';
export { ExpressionIRArtifact } from './artifacts/ExpressionIRArtifact';
export { LoweredTypeArtifact } from './artifacts/LoweredTypeArtifact';
export { DiagnosticArtifact } from './artifacts/DiagnosticArtifact';
export { SemanticIRArtifact } from './artifacts/SemanticIRArtifact';
export { CompilationResultArtifact } from './artifacts/CompilationResultArtifact';

// ============================================================================
// Passes Module
// ============================================================================
export {
    type PassDescriptor,
    type PassDependency,
    type CompilerPass,
    type ExecutablePass,
    createTypedPassAdapter,
    PassGraph,
    PassManager,
    CompilationState,
    CompilationContext,
    type CompilerOptions,
    ArtifactKeyWitness,
    type ResolveArtifacts,
    readArtifacts,
    tupleAt,
    type PassResult,
    AnalysisKey
} from './passes';

// ============================================================================
// Diagnostics Module
// ============================================================================
export {
    DiagnosticBag
} from './diagnostics';
export type {
    Diagnostic,
    DiagnosticSeverity,
    DiagnosticFix,
    TextEdit
} from './diagnostics';

// ============================================================================
// Cache Module
// ============================================================================
export type {
    ArtifactCache,
    CacheDescriptor,
    CacheInputDescriptor
} from './cache';
export { LRUCache } from './cache';

// ============================================================================
// Fingerprint Module
// ============================================================================
export type { CompilerFingerprint } from './fingerprint';
export { computeFingerprintHash } from './fingerprint';

// ============================================================================
// Types Module
// ============================================================================
export {
    PrimitiveKind,
    CollectionKind,
    SemanticTypeKind,
    NeverType,
    ErrorType,
    ReferenceType,
    UnionType,
    IntersectionType,
    ReadonlyCollectionType,
    MutableCollectionType,
    GenericType,
    ObjectProperty,
    ObjectType,
    ImmutableMap,
    ImmutableSet,
    TypeHasher,
    TypeInterner,
    createTypeSystem,
    isSubtype,
    isAssignable
} from './types';
export type {
    SemanticTypeBase,
    PrimitiveType,
    GenericVariance,
    GenericParameter,
    SemanticType,
    HashContext,
    TypeHierarchy
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
    type TypeEnvironment,
    type VariableState,
    type UnionFind as ConstraintUnionFind,
    createTypeEnvironment,
    createUnionFind,
    unionFindFind,
    unionFindUnion,
    solveConstraints,
    type ConstraintSolveResult
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
export type { ASTNode } from './artifacts/ASTArtifact';
export {
    ClassDeclaration,
    MethodDeclaration,
    PropertyDeclaration,
    CallExpression
} from './artifacts/ASTArtifact';

// ============================================================================
// Scanner Module
// ============================================================================
export {
    type TokenType,
    type TokenDescriptor,
    type PhpLiteralValue,
    type PhpAstValue,
    type PhpArrayEntry,
    type ParsedPhpArrayResult,
    PhpAstFactory,
    type SourceStream,
    tokenizePhpSource,
    parsePhpArray,
    classifyAstTokens,
    classifyAstValue,
    LaravelSourceLexer
} from './scanner/LaravelSourceLexer';

export {
    LaravelValidationType,
    type LaravelValidationConstraint,
    type ResourceExpressionDescriptor,
    ScannedRouteValidationRuleEntry,
    type ScannedRouteValidationRuleParams,
    RouteSemanticFlowValidationRuleSet,
    type RouteValidationRuleSet,
    ValidationTreeBuilder,
    buildValidationTree,
    RouteParameterSemanticFactory,
    type RouteSemanticFlowCompleteContracts,
    type RouteSemanticFlowConstructorInput,
    type RouteSemanticFlowParams,
    type ScannedRouteParameterParams,
    type ScannedRouteQueryParameterParams,
      compileBroadcastRuntimePattern,
    ScannedFormFieldDescriptor,
    type ScannedFormFieldParams,
    ScannedFormActionDescriptor,
    type ScannedFormActionParams,
    ScannedControllerActionDescriptor,
    type ScannedControllerActionParams,
    ScannedRequestTypeDescriptor,
    type ScannedRequestTypeParams,
    type ControllerActionInfo,
    type RequestActionDefinition,
    buildRequestTypeWithActions,
} from './scanner/scannerExports';

export { ResourceFieldSemanticBinding, type ResourceFieldSemanticBindingInput } from '../types/domain/resourceFieldSemanticBinding';

