/**
 * Compiler Artifacts
 * 
 * This module exports all artifact types used in the compilation pipeline.
 * Artifacts are immutable snapshots of compiler state that flow between passes.
 * 
 * @module compiler/artifacts
 */

// Base types
export {
    CompilerArtifact,
    TypedArtifact,
    ArtifactMetadata,
    ArtifactOrigin,
    ArtifactOriginKind,
    ArtifactEdge
} from './Artifact';

// Type registry
export {
    ArtifactRegistry,
    ArtifactKey,
    ArtifactStorage
} from './types';

// Concrete artifacts
export { ASTArtifact, ASTNode, ClassDeclaration, MethodDeclaration, PropertyDeclaration, CallExpression } from './ASTArtifact';
export { ScopeGraphArtifact, ScopeNode } from './ScopeGraphArtifact';
export { BoundASTArtifact, BoundASTNode, SymbolReference } from './BoundASTArtifact';
export { SymbolGraphArtifact, Symbol, SymbolTable } from './SymbolGraphArtifact';
export { ConstraintGraphArtifact } from './ConstraintGraphArtifact';
export { TypeEnvironmentArtifact } from './TypeEnvironmentArtifact';
export { ExpressionIRArtifact } from './ExpressionIRArtifact';
export { LoweredTypeArtifact } from './LoweredTypeArtifact';
export { DiagnosticArtifact } from './DiagnosticArtifact';
export { DependencyGraphArtifact } from './DependencyGraphArtifact';
export { SemanticIRArtifact } from './SemanticIRArtifact';
export { ContractGraphArtifact } from './ContractGraphArtifact';
export { CompilationResultArtifact } from './CompilationResultArtifact';

// Existing exports...
export * from './GeneratedTypeScriptArtifact';
export * from './GeneratedFormArtifact';
export * from './GeneratedContractArtifact';
export * from './RequestTypesArtifact';