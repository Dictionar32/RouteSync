import type { ColumnName, PropertyName, TableName } from './names';
import type { ModelKeyKind } from './model';

export type ModelPropertyValueEvidence =
  | { readonly kind: 'absent' }
  | { readonly kind: 'string_literal'; readonly value: string }
  | { readonly kind: 'boolean_literal'; readonly value: boolean }
  | { readonly kind: 'string_array'; readonly values: readonly ({ readonly kind: 'string_literal'; readonly value: string } | { readonly kind: 'other' })[] }
  | { readonly kind: 'other' };

export interface ModelPropertySourceEvidence {
  readonly kind: 'model_property_source_evidence';
  readonly property: PropertyName;
  readonly value: ModelPropertyValueEvidence;
}

export type ModelPropertyFactsJudgment =
  | { readonly kind: 'ignored_model_property' }
  | { readonly kind: 'set_model_table'; readonly value: TableName }
  | { readonly kind: 'set_model_primary_key'; readonly value: ColumnName }
  | { readonly kind: 'set_model_key_type'; readonly value: ModelKeyKind }
  | { readonly kind: 'set_model_incrementing'; readonly value: boolean }
  | { readonly kind: 'set_model_fillable'; readonly value: readonly PropertyName[] }
  | { readonly kind: 'set_model_guarded'; readonly value: readonly PropertyName[] }
  | { readonly kind: 'set_model_hidden'; readonly value: readonly PropertyName[] }
  | { readonly kind: 'set_model_appends'; readonly value: readonly PropertyName[] }
  | { readonly kind: 'unsupported_model_key_type'; readonly value: string };

export interface ModelPropertyFactsAuthorityInterface {
  readonly kind: 'model_property_facts_authority';
  readonly contractVersion: 1;
  judge(evidence: ModelPropertySourceEvidence): ModelPropertyFactsJudgment;
}
