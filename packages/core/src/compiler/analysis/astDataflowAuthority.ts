/**
 * Compatibility boundary for the historical AST dataflow authority.
 *
 * Semantic dataflow meaning is owned by the upstream semantic authority. This
 * module intentionally contains no second solver or duplicate closure logic.
 * Existing compiler imports may continue to resolve through this boundary
 * while the canonical implementation remains under types/upstream.
 */
export {
  createSemanticDataflowJudgment,
  validateSemanticDataflowDerivations,
} from '../../types/upstream/semanticDataflowAuthority';
