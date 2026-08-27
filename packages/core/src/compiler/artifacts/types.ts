/**
 * Artifact Registry Type System
 * 
 * Central type registry mapping artifact keys to their concrete types.
 * This enables type-safe artifact storage and retrieval throughout
 * the compiler pipeline.
 * 
 * @module compiler/artifacts/types
 */

// Forward declarations - actual imports will be from specific artifact files
import type { ASTArtifact } from './ASTArtifact';
import type { ScopeGraphArtifact } from './ScopeGraphArtifact';
import type { BoundASTArtifact } from './BoundASTArtifact';
import type { SymbolGraphArtifact } from './SymbolGraphArtifact';
import type { ConstraintGraphArtifact } from './ConstraintGraphArtifact';
import type { TypeEnvironmentArtifact } from './TypeEnvironmentArtifact';
import type { ExpressionIRArtifact } from './ExpressionIRArtifact';
import type { LoweredTypeArtifact } from './LoweredTypeArtifact';
import type { DiagnosticArtifact } from './DiagnosticArtifact';
import type { DependencyGraphArtifact } from './DependencyGraphArtifact';
import type { SemanticIRArtifact } from './SemanticIRArtifact';
import type { ContractGraphArtifact } from './ContractGraphArtifact';
import type { CompilationResultArtifact } from './CompilationResultArtifact';

// Response analysis artifacts (Laravel-specific)
import type { ResponseArtifact, ValidationArtifact, ModelArtifact, ResourceArtifact, RouteArtifact } from '../ir/ResponseArtifact';
import type { RouteManifestArtifact } from './RouteManifestArtifact';
import type { ResponseAnalysisArtifact } from './ResponseAnalysisArtifact';

// TypeScript generation artifact
import type { GeneratedTypeScriptArtifact } from './GeneratedTypeScriptArtifact';

// Import at top
import type { SemanticTypesArtifact } from '../passes/TypeScriptGeneratorPass';

// Form generation artifacts
import type { RequestTypesArtifact } from './RequestTypesArtifact';
import type { GeneratedFormArtifact } from './GeneratedFormArtifact';

// Contract generation artifacts
import type { GeneratedContractArtifact } from './GeneratedContractArtifact';
import type { GeneratedApiFieldArtifact } from './GeneratedApiFieldArtifact';

// Mapper generation artifact
import type { GeneratedMapperArtifact } from './GeneratedMapperArtifact';

/**
 * Central artifact registry mapping keys to concrete artifact types.
 * 
 * This interface defines the complete set of artifacts that can flow
 * through the compiler pipeline. Each key must map to a unique artifact type.
 */
export interface ArtifactRegistry {
    AST: ASTArtifact;
    ScopeGraph: ScopeGraphArtifact;
    BoundAST: BoundASTArtifact;
    SymbolGraph: SymbolGraphArtifact;
    ConstraintGraph: ConstraintGraphArtifact;
    TypeEnvironment: TypeEnvironmentArtifact;
    ExpressionIR: ExpressionIRArtifact;
    LoweredTypeGraph: LoweredTypeArtifact;
    DiagnosticSnapshot: DiagnosticArtifact;
    DependencyGraph: DependencyGraphArtifact;
    SemanticIR: SemanticIRArtifact;
    ContractGraph: ContractGraphArtifact;
    CompilationResult: CompilationResultArtifact;

    // Laravel/HTTP Response Analysis Artifacts
    RouteManifest: RouteManifestArtifact;
    ResponseAnalysis: ResponseAnalysisArtifact;
    ResponseArtifact: ResponseArtifact;
    ValidationAnalysis: ValidationArtifact;
    ModelAnalysis: ModelArtifact;
    ResourceAnalysis: ResourceArtifact;
    RouteAnalysis: RouteArtifact;

    // ✨ NEW: TypeScript Generation Artifact
    SemanticTypes: SemanticTypesArtifact;
    GeneratedTypeScript: GeneratedTypeScriptArtifact;

    // ✨ NEW: Form Generation Artifacts
    RequestTypes: RequestTypesArtifact;
    GeneratedForm: GeneratedFormArtifact;

    // ✨ NEW: Contract Generation Artifacts
    GeneratedContract: GeneratedContractArtifact;
    GeneratedApiField: GeneratedApiFieldArtifact;

    // ✨ NEW: Mapper Generation Artifact
    GeneratedMapper: GeneratedMapperArtifact;
}

/**
 * Valid artifact keys (string literal union)
 */
export type ArtifactKey = keyof ArtifactRegistry;

/**
 * Partial storage for artifacts during compilation.
 * 
 * Not all artifacts need to be present at all times.
 * This type allows incremental artifact accumulation.
 */
export type ArtifactStorage = {
    [K in ArtifactKey]?: ArtifactRegistry[K];
};
