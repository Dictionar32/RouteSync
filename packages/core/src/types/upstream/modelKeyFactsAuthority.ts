import type { ColumnDefinition } from './databaseVocabulary';
import type { ModelKeyKind, ModelKeySemanticType } from './model';
import type { ModelKeyFactsAuthorityInterface, ModelKeyFactsEvidence, ModelKeyFactsJudgment } from './modelKeyFactsAuthorityInterface';

const semanticType = (keyType: ModelKeyKind): ModelKeySemanticType => keyType.kind === 'integer' || keyType.kind === 'big_integer'
  ? { kind: 'number' }
  : { kind: 'string' };

const schemaKeyType = (column: ColumnDefinition): ModelKeyFactsJudgment => {
  switch (column.databaseType.kind) {
    case 'integer':
      return {
        kind: 'resolved_model_key',
        keyType: column.databaseType.width.kind === 'big' ? { kind: 'big_integer' } : { kind: 'integer' },
        semanticType: column.databaseType.width.kind === 'big' ? { kind: 'number' } : { kind: 'number' },
        origin: 'schema',
      };
    case 'string':
      return { kind: 'resolved_model_key', keyType: { kind: 'string' }, semanticType: { kind: 'string' }, origin: 'schema' };
    default:
      return { kind: 'unsupported_model_key_column_type', primaryKey: column.name, databaseType: column.databaseType.kind };
  }
};

const findColumn = (evidence: ModelKeyFactsEvidence, columns: ModelKeyFactsEvidence['columns']): ModelKeyFactsJudgment => {
  switch (columns.kind) {
    case 'empty': return { kind: 'missing_model_key_column', primaryKey: evidence.primaryKey };
    case 'cons':
      return columns.head.name.value.value === evidence.primaryKey.value.value
        ? schemaKeyType(columns.head)
        : findColumn(evidence, columns.tail);
  }
};

export const modelKeyFactsAuthority: ModelKeyFactsAuthorityInterface = Object.freeze({
  kind: 'model_key_facts_authority',
  contractVersion: 1,
  judge: (evidence: ModelKeyFactsEvidence): ModelKeyFactsJudgment => {
    switch (evidence.declared.kind) {
      case 'declared':
        return { kind: 'resolved_model_key', keyType: evidence.declared.value, semanticType: semanticType(evidence.declared.value), origin: 'explicit' };
      case 'infer_from_schema':
        return findColumn(evidence, evidence.columns);
    }
  },
});
