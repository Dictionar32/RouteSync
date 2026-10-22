import type { EloquentRelationAst } from './eloquent';
import type { EloquentRelationMethodName } from './eloquentRelationMethodAuthorityInterface';
import type { ClassName, ModelName, RelationName } from './names';
import type { ColumnName } from './names';
import type { RelationKey } from './model';
import type { Expression } from './expression';
import type { SourceSpan } from './provenance';

export type EloquentRelationTargetEvidence =
  | { readonly kind: 'explicit_class_target'; readonly targetClass: ClassName }
  | { readonly kind: 'missing_class_target' };

export type EloquentRelationKeyArgumentName = 'foreignKey' | 'ownerKey' | 'localKey' | 'other_named';

export type EloquentRelationKeyArgumentEvidence =
  | { readonly kind: 'argument_absent' }
  | { readonly kind: 'positional_literal_string'; readonly value: ColumnName }
  | { readonly kind: 'positional_other' }
  | { readonly kind: 'named_literal_string'; readonly name: EloquentRelationKeyArgumentName; readonly value: ColumnName }
  | { readonly kind: 'named_other'; readonly name: EloquentRelationKeyArgumentName }
  | { readonly kind: 'unpacked_argument' };

export type EloquentRelationKeyArgumentsEvidence = {
  readonly kind: 'eloquent_relation_key_arguments_evidence';
  readonly second: EloquentRelationKeyArgumentEvidence;
  readonly third: EloquentRelationKeyArgumentEvidence;
};

export type EloquentRelationFactsEvidence = {
  readonly kind: 'eloquent_relation_facts_evidence';
  readonly method: EloquentRelationMethodName;
  readonly relationName: RelationName;
  readonly sourceModel: ModelName;
  readonly target: EloquentRelationTargetEvidence;
  readonly invocation: Expression;
  readonly source: SourceSpan;
  readonly keyArguments: EloquentRelationKeyArgumentsEvidence;
};

export type EloquentRelationFactsJudgment =
  | { readonly kind: 'eloquent_relation_facts_produced'; readonly relation: EloquentRelationAst }
  | { readonly kind: 'not_an_eloquent_relation' }
  | {
      readonly kind: 'unsupported_eloquent_relation';
      readonly method: EloquentRelationMethodName;
      readonly reason: 'related_model_not_explicit';
      readonly source: SourceSpan;
    };

export interface EloquentRelationFactsAuthorityInterface {
  readonly kind: 'eloquent_relation_facts_authority';
  readonly contractVersion: 1;
  judge(input: EloquentRelationFactsEvidence): EloquentRelationFactsJudgment;
}
