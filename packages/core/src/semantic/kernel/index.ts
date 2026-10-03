/**
 * SemanticResolutionKernel sub-domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/semantic/kernel
 */

export { mapSqlTypeToTs, mapCastToTs } from './typeMapper';
export {
    isFieldNodeRecord,
    isSemanticResolutionRecord,
    buildResolutionContext
} from './contextBuilder';
export { createDefaultPlugins } from './defaultPlugins';
export {
  relationResolve,
  relationFirst,
  relationFold,
  relationProject,
  relationSelect,
  relationIsSome,
  relationOptionFold,
  relationRefine,
  relationFirstOption,
  relationOptionMap,
} from './relationalSequence';
export {
  solveCandidate,
  solveCandidateOption,
  solveCandidateId,
  candidateSatisfies,
} from './semanticDecisionRewriteEngine';
export {
  decisionCandidate,
  solveDecision,
  candidateAdmissible,
  requirement,
  exclusion,
  dependency,
} from './semanticDecisionEngine';
export { deriveDecision, deriveTransitions, applyDecisionRewrites, decisionClosure } from './semanticDecisionCalculus';
export { relationGate } from './semanticRelations';
export {
  applyRewrite,
  rewriteOnce,
  rewriteWitness,
  saturateRewrite,
  type RewriteRule,
  type RewriteResult,
  type RewriteWitness,
} from './semanticRewriteEngine';
export { candidate, controlClosure, controlRelation, candidateRelation, guardRelation, transitionRelation, joinRelation, recurrenceRelation, backedgeRelation, dependenceRelation, topology, relationKind, type ControlRelation, type ControlTopology, type ControlCandidate, type ControlRelationKind } from './controlRelations';
