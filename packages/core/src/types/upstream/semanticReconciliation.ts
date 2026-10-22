import type { EloquentRelationAst } from './eloquent';
import type { ModelSemanticRelation, RelationKey } from './model';
import type { SchemaRelationIndexInterface, SchemaForeignKeyEvidence } from './schemaRelation';
import type { ForeignKey } from './databaseVocabulary';

export type RelationReconciliationStatus =
  | 'matched'
  | 'schema_only'
  | 'eloquent_only'
  | 'ambiguous'
  | 'conflict'
  | 'not_applicable';

/** Closed result of reconciling upstream Eloquent evidence with schema evidence. */
export interface SemanticRelationReconciliationInterface {
  readonly kind: 'semantic_relation_reconciliation';
  readonly relation: EloquentRelationAst;
  readonly status: RelationReconciliationStatus;
  readonly key: RelationKey;
  readonly semantic: ModelSemanticRelation;
  readonly schemaEvidence: readonly SchemaForeignKeyEvidence[];
  readonly closed: true;
}

/** Contract only: the implementation and semantic decision live in authority. */
export interface SemanticRelationReconciliationAuthorityInterface {
  reconcile(
    relation: EloquentRelationAst,
    schema: SchemaRelationIndexInterface,
    semantic: ModelSemanticRelation,
  ): SemanticRelationReconciliationInterface;
}

export type SemanticRelationReconciler = (
  relation: EloquentRelationAst,
  schema: SchemaRelationIndexInterface,
  semantic: ModelSemanticRelation,
) => SemanticRelationReconciliationInterface;


/** Closed applicability judgment produced before candidate matching. */
export type RelationApplicability =
  | { readonly kind: 'direct_foreign_key'; readonly relationKind: 'belongs_to' | 'has_many' | 'has_one' }
  | { readonly kind: 'unsupported_relation'; readonly relationKind: string };

/** Inputs shared by the canonical relation-reconciliation algebra. */
export interface SemanticReconciliationEvidence {
  readonly kind: 'semantic_reconciliation_evidence';
  readonly relation: EloquentRelationAst;
  readonly schema: SchemaRelationIndexInterface;
  /** Closed applicability judgment computed once by the upstream authority. */
  readonly applicability: RelationApplicability;
  readonly closed: true;
}

/**
 * Algebra for reconciling Eloquent declarations with schema foreign-key evidence.
 * Consumers use these operations rather than implementing domain classification.
 */
export interface SemanticReconciliationAlgebraInterface {
  applicability(relation: EloquentRelationAst): RelationApplicability;
  candidates(evidence: SemanticReconciliationEvidence): readonly ForeignKey[];
  canonicalKey(evidence: SemanticReconciliationEvidence, matches: readonly ForeignKey[]): RelationKey;
  status(
    evidence: SemanticReconciliationEvidence,
    matches: readonly ForeignKey[],
  ): RelationReconciliationStatus;
  effectiveKey(
    evidence: SemanticReconciliationEvidence,
    status: RelationReconciliationStatus,
    canonicalKey: RelationKey,
  ): RelationKey;
  schemaEvidence(
    evidence: SemanticReconciliationEvidence,
    matches: readonly ForeignKey[],
  ): readonly SchemaForeignKeyEvidence[];
}
