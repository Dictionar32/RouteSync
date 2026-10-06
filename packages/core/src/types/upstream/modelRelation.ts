import type { EloquentRelationAst } from './eloquent';
import type { ModelSemanticRelation } from './model';
import type { SchemaRelationIndexInterface } from './schemaRelation';
import type { SemanticRelationReconciliationInterface } from './semanticReconciliation';
import { relationProject, relationResolve, relationSelect } from '../../semantic/foundation/relationalSequence';

export interface ModelRelationInterface {
  readonly kind: 'model_relation_interface';
  readonly evidence: readonly EloquentRelationAst[];
  readonly semantic: readonly ModelSemanticRelation[];
  readonly reconciliations: readonly SemanticRelationReconciliationInterface[];
  readonly schemaRelations: SchemaRelationIndexInterface;
  readonly closed: true;
}

const semanticMatchesForEvidence = (
  relation: EloquentRelationAst,
  semantic: readonly ModelSemanticRelation[],
): readonly ModelSemanticRelation[] => relationSelect(
  semantic,
  candidate =>
    candidate.sourceModel.value.value === relation.sourceModel.value.value &&
    candidate.property.value.value === relation.name.value.value &&
    candidate.relation.value.value === relation.name.value.value &&
    candidate.targetModel.value.value === relation.targetModel.value.value &&
    candidate.eloquentType.kind === relation.eloquentType.kind,
);

const semanticForEvidence = (
  relation: EloquentRelationAst,
  semantic: readonly ModelSemanticRelation[],
): ModelSemanticRelation => {
  const matches = semanticMatchesForEvidence(relation, semantic);
  return relationResolve(
    matches.length === 1,
    () => matches[0],
    () => {
      throw Error(
        `Model relation identity alignment failed for ${relation.sourceModel.value.value}.${relation.name.value.value}: expected exactly one semantic relation, found ${matches.length}.`,
      );
    },
  );
};

export const modelRelationInterfaceFrom = (
  evidence: readonly EloquentRelationAst[],
  semantic: readonly ModelSemanticRelation[],
  schemaRelations: SchemaRelationIndexInterface,
  reconcile: (
    relation: EloquentRelationAst,
    schema: SchemaRelationIndexInterface,
    semantic: ModelSemanticRelation,
  ) => SemanticRelationReconciliationInterface,
): ModelRelationInterface => {
  const reconciliations = relationProject(evidence, relation =>
    reconcile(relation, schemaRelations, semanticForEvidence(relation, semantic)),
  );
  return Object.freeze({
    kind: 'model_relation_interface' as const,
    evidence: Object.freeze([...evidence]),
    semantic: Object.freeze(relationProject(reconciliations, value => value.semantic)),
    reconciliations: Object.freeze(reconciliations),
    schemaRelations,
    closed: true as const,
  });
};
