import type { EloquentRelationAst } from './eloquent';
import type { ModelSemanticRelation } from './model';
import type { SchemaRelationIndexInterface } from './schemaRelation';
import type { SemanticRelationReconciliationInterface } from './semanticReconciliation';
import { modelSemanticRelationIdentityKey, modelSemanticRelationIdentityOf } from './model';
import { createPropertyName } from './names';

export interface ModelRelationInterface {
  readonly kind: 'model_relation_interface';
  readonly evidence: readonly EloquentRelationAst[];
  readonly semantic: readonly ModelSemanticRelation[];
  readonly reconciliations: readonly SemanticRelationReconciliationInterface[];
  readonly schemaRelations: SchemaRelationIndexInterface;
  readonly closed: true;
}

const semanticIdentityForEvidence = (relation: EloquentRelationAst) =>
  modelSemanticRelationIdentityOf({
    sourceModel: relation.sourceModel,
    property: createPropertyName(relation.name.value.value),
    relation: relation.name,
    targetModel: relation.targetModel,
    eloquentType: relation.eloquentType,
    foreignKey: relation.key,
  });

const semanticMatchesForEvidence = (
  relation: EloquentRelationAst,
  semantic: readonly ModelSemanticRelation[],
): readonly ModelSemanticRelation[] => {
  const identityKey = modelSemanticRelationIdentityKey(semanticIdentityForEvidence(relation));
  return semantic.filter(candidate => modelSemanticRelationIdentityKey(candidate.identity) === identityKey);
};

const semanticForEvidence = (
  relation: EloquentRelationAst,
  semantic: readonly ModelSemanticRelation[],
): ModelSemanticRelation => {
  const matches = semanticMatchesForEvidence(relation, semantic);
  const match = matches[0];
  if (matches.length !== 1 || match === undefined) {
    throw Error(
      `Model relation identity alignment failed for ${relation.sourceModel.value.value}.${relation.name.value.value}: expected exactly one semantic relation, found ${matches.length}.`,
    );
  }
  return match;
};

export interface ModelRelationInterfaceFactoryInterface {
  (
    evidence: readonly EloquentRelationAst[],
    semantic: readonly ModelSemanticRelation[],
    schemaRelations: SchemaRelationIndexInterface,
    reconcile: (
      relation: EloquentRelationAst,
      schema: SchemaRelationIndexInterface,
      semantic: ModelSemanticRelation,
    ) => SemanticRelationReconciliationInterface,
  ): ModelRelationInterface;
}

export const modelRelationInterfaceFrom: ModelRelationInterfaceFactoryInterface = (
  evidence,
  semantic,
  schemaRelations,
  reconcile,
) => {
  const reconciliations = evidence.map(relation =>
    reconcile(relation, schemaRelations, semanticForEvidence(relation, semantic)),
  );
  return Object.freeze({
    kind: 'model_relation_interface' as const,
    evidence: Object.freeze([...evidence]),
    semantic: Object.freeze(reconciliations.map(value => value.semantic)),
    reconciliations: Object.freeze(reconciliations),
    schemaRelations,
    closed: true as const,
  });
};
