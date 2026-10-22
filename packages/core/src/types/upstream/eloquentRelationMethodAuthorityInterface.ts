import type { EloquentRelationDescriptor, EloquentRelationType } from './modelVocabulary';
import type { StringValue } from './valueObjects';

export type EloquentRelationMethodName = {
  readonly kind: 'eloquent_relation_method_name';
  readonly value: StringValue;
};

export type EloquentRelationMethodJudgment =
  | { readonly kind: 'recognized_eloquent_relation_method'; readonly method: EloquentRelationMethodName; readonly descriptor: EloquentRelationDescriptor }
  | { readonly kind: 'not_an_eloquent_relation_method'; readonly method: EloquentRelationMethodName };

export interface EloquentRelationMethodAuthorityInterface {
  readonly kind: 'eloquent_relation_method_authority';
  readonly contractVersion: 1;
  judge(input: { readonly method: EloquentRelationMethodName }): EloquentRelationMethodJudgment;
  descriptor(input: { readonly method: EloquentRelationMethodName }): EloquentRelationDescriptor;
  type(input: { readonly method: EloquentRelationMethodName }): EloquentRelationType;
}
