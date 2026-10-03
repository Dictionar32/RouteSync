/**
 * Phase 271 — construct-free semantic compilation artifact.
 *
 * This is the lowering boundary. Source/evidence knowledge and compatibility
 * control projections may exist upstream, but target lowering consumes only
 * the closed relational theory and its proof/provenance.
 */
import {
  closeCanonicalSemanticRelations,
  type SemanticClosureResult,
} from './semanticClosureEngine';
import type { SemanticTheoryFact } from './semanticRelationTheory';

export interface SemanticCompilationArtifact {
  readonly closure: SemanticClosureResult;
}

/**
 * Build the only semantic artifact that canonical lowering is allowed to see.
 * No AST node or statement kind is
 * accepted here; the input is already the typed relational theory.
 */
export const buildSemanticCompilationArtifact = (
  relations: readonly SemanticTheoryFact[],
  maxRounds = 64,
): SemanticCompilationArtifact => Object.freeze({
  closure: closeCanonicalSemanticRelations(relations, maxRounds),
});
