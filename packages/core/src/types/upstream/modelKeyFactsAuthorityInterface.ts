import type { ColumnName } from './names';
import type { ColumnDefinition } from './databaseVocabulary';
import type { ModelKeyKind, ModelKeySemanticType } from './model';

export type ModelKeyFactsEvidence = {
  readonly kind: 'model_key_facts_evidence';
  readonly primaryKey: ColumnName;
  readonly declared: { readonly kind: 'declared'; readonly value: ModelKeyKind } | { readonly kind: 'infer_from_schema' };
  readonly columns: Sequence<ColumnDefinition>;
};

export type ModelKeyFactsJudgment =
  | { readonly kind: 'resolved_model_key'; readonly keyType: ModelKeyKind; readonly semanticType: ModelKeySemanticType; readonly origin: 'explicit' | 'schema' }
  | { readonly kind: 'missing_model_key_column'; readonly primaryKey: ColumnName }
  | { readonly kind: 'unsupported_model_key_column_type'; readonly primaryKey: ColumnName; readonly databaseType: ColumnDefinition['databaseType']['kind'] };

export interface ModelKeyFactsAuthorityInterface {
  readonly kind: 'model_key_facts_authority';
  readonly contractVersion: 1;
  judge(evidence: ModelKeyFactsEvidence): ModelKeyFactsJudgment;
}
