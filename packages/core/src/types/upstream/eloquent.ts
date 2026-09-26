import type { Expression } from './expression';
import type { ClassName, ModelName, RelationName } from './names';
import type { EloquentRelationDescriptor, EloquentRelationType } from './modelVocabulary';
import type { TypeExpression } from './typeVocabulary';
import type { RelationKey } from './model';
import type { ModelRelationTargetShape, ModelRelationTraversalTarget } from './modelSourceFacts';
import type { RelationKind } from './model';
import type { SourceSpan } from './provenance';
import type { Sequence } from './collections';

/**
 * Canonical upstream Eloquent relation AST.
 *
 * The PHP method call is preserved as an Expression before any downstream
 * cardinality/multiplicity projection is derived. This is the Eloquent
 * semantic boundary; QueryAst may consume its relation query later.
 */
export type EloquentRelationAst = {
  readonly kind: 'eloquent_relation_ast';
  readonly name: RelationName;
  readonly sourceModel: ModelName;
  readonly relation: RelationKind;
  readonly eloquentType: EloquentRelationType;
  readonly descriptor: EloquentRelationDescriptor;
  readonly targetModel: ModelName;
  readonly targetClass: ClassName;
  readonly invocation: Expression;
  readonly source: SourceSpan;
  readonly semanticType: TypeExpression;
  readonly targetShape: ModelRelationTargetShape;
  readonly traversalTarget: ModelRelationTraversalTarget;
  readonly key: RelationKey;
};

export type EloquentModelAst = {
  readonly kind: 'eloquent_model_ast';
  readonly model: ModelName;
  readonly relations: Sequence<EloquentRelationAst>;
  readonly source: SourceSpan;
};

export type EloquentAst = {
  readonly kind: 'eloquent_ast';
  readonly models: Sequence<EloquentModelAst>;
  readonly source: SourceSpan;
};
