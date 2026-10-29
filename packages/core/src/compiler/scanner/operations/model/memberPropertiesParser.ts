import type { PhpAstValue, PhpClassPropertyAst } from '../../../frontend/php';
import { createPropertyName } from '../../../../types/upstream/names';
import type { ModelPropertySourceEvidence, ModelPropertyValueEvidence } from '../../../../types/upstream/modelPropertyFactsAuthorityInterface';

export interface ModelPropertyEvidenceProducerInterface {
  readonly kind: 'model_property_evidence_producer';
  readonly contractVersion: 1;
  scan(property: PhpClassPropertyAst): ModelPropertySourceEvidence;
}

const valueEvidence = (value: PhpAstValue | undefined): ModelPropertyValueEvidence => {
  if (value === undefined) return { kind: 'absent' };
  if (value.kind === 'literal' && value.literalType === 'string') return { kind: 'string_literal', value: value.value };
  if (value.kind === 'literal' && value.literalType === 'boolean') return { kind: 'boolean_literal', value: value.value };
  if (value.kind === 'nested_array') return {
    kind: 'string_array',
    values: value.entries.map(entry => entry.value.kind === 'literal' && entry.value.literalType === 'string'
      ? { kind: 'string_literal' as const, value: entry.value.value }
      : { kind: 'other' as const }),
  };
  return { kind: 'other' };
};

export const modelPropertyEvidenceProducer: ModelPropertyEvidenceProducerInterface = Object.freeze({
  kind: 'model_property_evidence_producer',
  contractVersion: 1,
  scan: (property: PhpClassPropertyAst): ModelPropertySourceEvidence => ({
    kind: 'model_property_source_evidence',
    property: createPropertyName(property.name),
    value: valueEvidence(property.initialization.kind === 'present' ? property.initialization.value : undefined),
  }),
});
