import { describe, expect, it } from 'vitest';
import { createResponseFieldName } from '../../domain/semanticValueFactories';
import type { ResponseValueContract } from '../../domain/responseContracts';
import { responseAttributeValueSemanticAuthority } from '../responseAttributeValueSemanticAuthority';
import type { ResponseObservedValueEvidence } from '../responseAttributeValueSemanticJudgmentInterface';

describe('Phase 2052 response attribute value semantic authority', () => {
  it('judges literals as canonical response value contracts', () => {
    const judgment = responseAttributeValueSemanticAuthority.judge({ kind: 'literal', literalKind: 'string' });
    expect(judgment).toEqual({ kind: 'resolved', value: { kind: 'scalar', value: { kind: 'textual' } } });
  });

  it('judges all-string-keyed arrays as objects', () => {
    const evidence: ResponseObservedValueEvidence = {
      kind: 'array',
      entries: [
        { kind: 'keyed', name: createResponseFieldName('id'), value: { kind: 'literal', literalKind: 'number' } },
        { kind: 'keyed', name: createResponseFieldName('active'), value: { kind: 'literal', literalKind: 'boolean' } },
      ],
    };
    const judgment = responseAttributeValueSemanticAuthority.judge(evidence);
    expect(judgment.kind).toBe('resolved');
    if (judgment.kind === 'resolved') {
      expect(judgment.value.kind).toBe('object');
      if (judgment.value.kind === 'object') expect(judgment.value.fields.map(field => field.name.value)).toEqual(['id', 'active']);
    }
  });

  it('judges mixed or positional arrays as collections', () => {
    const judgment = responseAttributeValueSemanticAuthority.judge({
      kind: 'array',
      entries: [
        { kind: 'keyed', name: createResponseFieldName('id'), value: { kind: 'literal', literalKind: 'number' } },
        { kind: 'positional', value: { kind: 'literal', literalKind: 'string' } },
      ],
    });
    expect(judgment.kind).toBe('resolved');
    if (judgment.kind === 'resolved') expect(judgment.value.kind).toBe('collection');
  });

  it('does not turn unsupported AST evidence into a resolved semantic value', () => {
    expect(responseAttributeValueSemanticAuthority.judge({ kind: 'unsupported' })).toEqual({ kind: 'unsupported_evidence' });
  });

  it('deduplicates identical contracts and retains distinct values in a union', () => {
    const textual: ResponseValueContract = { kind: 'scalar', value: { kind: 'textual' } };
    const numeric: ResponseValueContract = { kind: 'scalar', value: { kind: 'decimal_number' } };
    expect(responseAttributeValueSemanticAuthority.merge([textual, textual])).toEqual({ kind: 'merged', value: textual });
    expect(responseAttributeValueSemanticAuthority.merge([textual, numeric])).toEqual({ kind: 'merged', value: { kind: 'union', members: [textual, numeric] } });
  });
});
