import { createColumnName, createPropertyName, createTableName } from './names';
import type { ModelPropertyFactsAuthorityInterface, ModelPropertyFactsJudgment, ModelPropertySourceEvidence, ModelPropertyValueEvidence } from './modelPropertyFactsAuthorityInterface';

const keyTypeJudgment = (value: string): ModelPropertyFactsJudgment => {
  switch (value) {
    case 'int':
    case 'integer': return { kind: 'set_model_key_type', value: { kind: 'integer' } };
    case 'bigint': return { kind: 'set_model_key_type', value: { kind: 'big_integer' } };
    case 'string': return { kind: 'set_model_key_type', value: { kind: 'string' } };
    case 'uuid': return { kind: 'set_model_key_type', value: { kind: 'uuid' } };
    case 'ulid': return { kind: 'set_model_key_type', value: { kind: 'ulid' } };
    default: return { kind: 'unsupported_model_key_type', value };
  }
};

const propertyList = (value: ModelPropertyValueEvidence) =>
  value.kind === 'string_array'
    ? value.values.flatMap(item => item.kind === 'string_literal' ? [createPropertyName(item.value)] : [])
    : [];

const judgeValue = (property: string, value: ModelPropertyValueEvidence): ModelPropertyFactsJudgment => {
  switch (property) {
    case 'table':
      return value.kind === 'string_literal' ? { kind: 'set_model_table', value: createTableName(value.value) } : { kind: 'ignored_model_property' };
    case 'primaryKey':
      return value.kind === 'string_literal' ? { kind: 'set_model_primary_key', value: createColumnName(value.value) } : { kind: 'ignored_model_property' };
    case 'keyType':
      return value.kind === 'string_literal' ? keyTypeJudgment(value.value) : { kind: 'ignored_model_property' };
    case 'incrementing':
      return value.kind === 'boolean_literal' ? { kind: 'set_model_incrementing', value: value.value } : { kind: 'ignored_model_property' };
    case 'fillable': return { kind: 'set_model_fillable', value: propertyList(value) };
    case 'guarded': return { kind: 'set_model_guarded', value: propertyList(value) };
    case 'hidden': return { kind: 'set_model_hidden', value: propertyList(value) };
    case 'appends': return { kind: 'set_model_appends', value: propertyList(value) };
    default: return { kind: 'ignored_model_property' };
  }
};

export const modelPropertyFactsAuthority: ModelPropertyFactsAuthorityInterface = Object.freeze({
  kind: 'model_property_facts_authority',
  contractVersion: 1,
  judge: (evidence: ModelPropertySourceEvidence): ModelPropertyFactsJudgment => judgeValue(evidence.property.value.value, evidence.value),
});
