import type { ModelMethod, ModelMethodResult } from './model';
import type { ModelSourceSemanticsAuthorityInterface, ModelSourceSemanticsEvidence, ModelSourceSemanticsJudgment, ModelMethodReturnTypeEvidence } from './modelSourceSemanticsAuthorityInterface';

const sequenceFrom = <T>(values: readonly T[]): Sequence<T> => values.reduceRight<Sequence<T>>(
  (tail, head) => ({ kind: 'cons', head, tail }),
  { kind: 'empty' },
);

const returnTypeOf = (evidence: ModelMethodReturnTypeEvidence): ModelMethodResult => {
  switch (evidence.kind) {
    case 'absent': return { kind: 'absent' };
    case 'class_reference': return { kind: 'present', type: { kind: 'reference', value: { kind: 'class', name: evidence.name } } };
    case 'unsupported_type_expression': return { kind: 'present', type: { kind: 'reference', value: { kind: 'class', name: { kind: 'class_name', value: { kind: 'string_value', value: 'mixed' } } } } };
    default: return evidence satisfies never;
  }
};

const methodOf = (evidence: ModelSourceSemanticsEvidence['methods'][number]): ModelMethod => ({
  kind: 'model_method',
  name: evidence.name,
  visibility: evidence.visibility,
  result: returnTypeOf(evidence.returnType),
  body: evidence.body,
  source: evidence.source,
});

const judge = (evidence: ModelSourceSemanticsEvidence): ModelSourceSemanticsJudgment => ({
  kind: 'model_source_semantics_resolved',
  inheritance: evidence.inheritance,
  capabilities: { kind: 'model_source_capabilities', traits: { kind: 'model_traits', items: sequenceFrom(evidence.traits) } },
  methods: evidence.methods.map(methodOf),
  constants: evidence.constants,
});

export const modelSourceSemanticsAuthority: ModelSourceSemanticsAuthorityInterface = Object.freeze({
  kind: 'model_source_semantics_authority',
  contractVersion: 1,
  judge,
});
