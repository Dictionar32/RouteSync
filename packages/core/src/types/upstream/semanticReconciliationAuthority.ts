import type { EloquentRelationAst } from './eloquent';
import type {
  SemanticRelationReconciliationInterface,
  SemanticRelationReconciler,
  SemanticRelationReconciliationAuthorityInterface,
} from './semanticReconciliation';
import { modelSemanticRelationIdentityOf, type ModelSemanticRelation } from './model';
import type { SchemaRelationIndexInterface } from './schemaRelation';
import { semanticReconciliationAlgebra } from './semanticReconciliationAlgebra';

/**
 * Authority orchestrates the canonical algebra and seals its result. It does not
 * independently classify relation kinds, candidate counts, or key fallbacks.
 */
export const reconcileSemanticRelation: SemanticRelationReconciler = (relation, schema, semantic) => {
  const applicability = semanticReconciliationAlgebra.applicability(relation);
  const evidence = Object.freeze({
    kind: 'semantic_reconciliation_evidence' as const,
    relation,
    schema,
    applicability,
    closed: true as const,
  });
  const matches = semanticReconciliationAlgebra.candidates(evidence);
  const canonicalKey = semanticReconciliationAlgebra.canonicalKey(evidence, matches);
  const status = semanticReconciliationAlgebra.status(evidence, matches);
  const key = semanticReconciliationAlgebra.effectiveKey(evidence, status, canonicalKey);
  const schemaEvidence = semanticReconciliationAlgebra.schemaEvidence(evidence, matches);
  const resolvedSemantic: ModelSemanticRelation = Object.freeze({
    ...semantic,
    foreignKey: key,
    identity: modelSemanticRelationIdentityOf({ ...semantic, foreignKey: key }),
    ...(schemaEvidence.length === 1 && schemaEvidence[0] !== undefined ? { provenance: Object.freeze({
      kind: 'model_relation_provenance' as const,
      relationSource: relation.source,
      schema: schemaEvidence[0],
    }) } : {}),
  });
  return Object.freeze({
    kind: 'semantic_relation_reconciliation' as const,
    relation,
    status,
    key,
    semantic: resolvedSemantic,
    schemaEvidence: Object.freeze(schemaEvidence),
    closed: true as const,
  });
};

export const semanticRelationReconciliationAuthority: SemanticRelationReconciliationAuthorityInterface = Object.freeze({
  reconcile: reconcileSemanticRelation,
});
