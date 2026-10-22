import type { ResponseContractField, ResponseValueContract } from '../domain/responseContracts';
import { createResponseFieldName } from '../domain/semanticValueFactories';
import type {
  ResponseAttributeValueSemanticJudgmentInterface,
  ResponseObservedArrayEntryEvidence,
  ResponseObservedValueEvidence,
  ResponseObservedValueJudgment,
  ResponseValueMergeJudgment,
} from './responseAttributeValueSemanticJudgmentInterface';

const scalar = (value: 'textual' | 'decimal_number' | 'boolean_flag'): ResponseValueContract =>
  Object.freeze({ kind: 'scalar', value: Object.freeze({ kind: value }) });

const unsupported = (): ResponseObservedValueJudgment => Object.freeze({ kind: 'unsupported_evidence' });

const inferMany = (evidence: readonly ResponseObservedValueEvidence[]): ResponseValueContract => {
  const resolved = evidence.flatMap(value => {
    const judgment = judge(value);
    return judgment.kind === 'resolved' ? [judgment.value] : [];
  });
  if (resolved.length === 0) return Object.freeze({ kind: 'unresolved_declaration', reason: 'mixed_declaration' });
  const merged = mergeValues(resolved);
  switch (merged.kind) {
    case 'merged': return merged.value;
    case 'empty_input': return Object.freeze({ kind: 'unresolved_declaration', reason: 'mixed_declaration' });
  }
};

const entryValue = (entry: ResponseObservedArrayEntryEvidence): ResponseObservedValueEvidence => entry.value;

const judge = (evidence: ResponseObservedValueEvidence): ResponseObservedValueJudgment => {
  switch (evidence.kind) {
    case 'unsupported':
      return unsupported();
    case 'literal':
      switch (evidence.literalKind) {
        case 'null': return Object.freeze({ kind: 'resolved', value: Object.freeze({ kind: 'null' }) });
        case 'string': return Object.freeze({ kind: 'resolved', value: scalar('textual') });
        case 'number': return Object.freeze({ kind: 'resolved', value: scalar('decimal_number') });
        case 'boolean': return Object.freeze({ kind: 'resolved', value: scalar('boolean_flag') });
      }
    case 'array': {
      const keyed = evidence.entries.filter((entry): entry is Extract<ResponseObservedArrayEntryEvidence, { readonly kind: 'keyed' }> => entry.kind === 'keyed');
      const fields: readonly ResponseContractField[] = Object.freeze(keyed.map(entry => Object.freeze({
        name: entry.name,
        value: inferMany([entry.value]),
        nullability: Object.freeze({ kind: 'required' as const }),
        evidence: Object.freeze({ kind: 'observed' as const }),
      })));
      const value: ResponseValueContract = keyed.length === evidence.entries.length
        ? Object.freeze({ kind: 'object', fields })
        : Object.freeze({ kind: 'collection', element: inferMany(evidence.entries.map(entryValue)) });
      return Object.freeze({ kind: 'resolved', value });
    }
  }
};

const sameValue = (left: ResponseValueContract, right: ResponseValueContract): boolean => {
  if (left.kind !== right.kind) return false;
  switch (left.kind) {
    case 'null': return true;
    case 'unresolved_declaration': return right.kind === 'unresolved_declaration' && left.reason === right.reason;
    case 'scalar': return right.kind === 'scalar' && left.value.kind === right.value.kind;
    case 'named_type': return right.kind === 'named_type' && left.name.value.value === right.name.value.value;
    case 'model_reference': return right.kind === 'model_reference' && left.model.value.value === right.model.value.value;
    case 'collection': return right.kind === 'collection' && sameValue(left.element, right.element);
    case 'union': return right.kind === 'union' && left.members.length === right.members.length && left.members.every((member, index) => {
      const other = right.members[index];
      return other !== undefined && sameValue(member, other);
    });
    case 'object': return right.kind === 'object' && left.fields.length === right.fields.length && left.fields.every((field, index) => {
      const other = right.fields[index];
      return other !== undefined && field.name.value === other.name.value && sameValue(field.value, other.value) && field.nullability.kind === other.nullability.kind && field.evidence.kind === other.evidence.kind;
    });
  }
};

const mergeValues = (values: readonly ResponseValueContract[]): ResponseValueMergeJudgment => {
  const unique = values.reduce<readonly ResponseValueContract[]>((members, value) =>
    members.some(member => sameValue(member, value)) ? members : Object.freeze([...members, value]), Object.freeze([]));
  switch (unique.length) {
    case 0: return Object.freeze({ kind: 'empty_input' });
    case 1: {
      const value = unique[0];
      return value === undefined ? Object.freeze({ kind: 'empty_input' }) : Object.freeze({ kind: 'merged', value });
    }
    default: return Object.freeze({ kind: 'merged', value: Object.freeze({ kind: 'union', members: unique }) });
  }
};

export const responseAttributeValueSemanticAuthority: ResponseAttributeValueSemanticJudgmentInterface = Object.freeze({
  kind: 'response_attribute_value_semantic_judgment_authority',
  judge,
  merge: mergeValues,
});
