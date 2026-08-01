/**
 * CompilationResult.ts
 * 
 * Final compilation result representation.
 * 
 * NOTE: This is a stub. The full implementation will be extracted from compiler.ts
 * in a later refactoring step.
 */

/**
 * Compilation result.
 * 
 * The final output of the compiler pipeline, containing all generated
 * artifacts and metadata.
 */
import { ASTArtifact } from "../artifacts/ASTArtifact";
import { SymbolGraphArtifact } from "../artifacts/SymbolGraphArtifact";
import { ConstraintGraphArtifact } from "../artifacts/ConstraintGraphArtifact";
import { TypeEnvironmentArtifact } from "../artifacts/TypeEnvironmentArtifact";
import { SemanticIRArtifact } from "../artifacts/SemanticIRArtifact";
import { ContractGraph } from "../ir/ContractGraph";
import { DependencyGraph } from "../utils";
import { DiagnosticBag } from "../diagnostics";
import { SymbolTable } from "../../semantic/SymbolTable";

export interface CompilationStatistics {
  readonly durationMs: number;
  readonly files: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly invalidatedNodes: number;
}

export class CompilationResult {
  constructor(
    public readonly astSnapshot: ASTArtifact,
    public readonly symbolGraph: SymbolGraphArtifact,
    public readonly constraintGraph: ConstraintGraphArtifact,
    public readonly typeEnvironment: TypeEnvironmentArtifact,
    public readonly semanticIR: SemanticIRArtifact,
    public readonly graph: ContractGraph,
    public readonly dependencyGraph: DependencyGraph,
    public readonly diagnostics: DiagnosticBag,
    public readonly symbolTable: SymbolTable,
    public readonly statistics: CompilationStatistics
  ) {
    Object.freeze(this);
  }
}
