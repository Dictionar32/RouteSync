import { describe, expect, it } from 'vitest';
import { semanticRewriteAuthority } from '../semanticRewriteAuthority';
import { semanticAbsenceTerm, semanticTextTerm, semanticTruthTerm, semanticVariableTerm, type SemanticRewriteExecutionRequest } from '../semanticRewriteInterface';

describe('Phase 1549 — upstream semantic rewrite authority contract', () => {
  it('returns a closed judgment only after the foundation solver saturates', () => {
    const request: SemanticRewriteExecutionRequest<'source' | 'reachable'> = {
      kind: 'semantic_rewrite_execution_request',
      seeds: [{ relation: 'source', arguments: [semanticTextTerm('route-a')] }],
      rules: [{
        id: 'source-is-reachable',
        priority: 1,
        when: [{ relation: 'source', polarity: 'positive', arguments: [semanticVariableTerm('route')] }],
        then: [{ relation: 'reachable', polarity: 'positive', arguments: [semanticVariableTerm('route')] }],
      }],
    };
    const judgment = semanticRewriteAuthority.resolve(request);
    expect(judgment.status).toBe('closed');
    expect(judgment.saturated).toBe(true);
    expect(judgment.closed).toBe(true);
    expect(judgment.facts).toContainEqual({ relation: 'reachable', arguments: [semanticTextTerm('route-a')] });
  });

  it('does not mislabel round-limit exhaustion as a closed least fixed point', () => {
    const judgment = semanticRewriteAuthority.resolve({
      kind: 'semantic_rewrite_execution_request',
      seeds: [{ relation: 'source', arguments: [semanticTextTerm('route-a')] }],
      rules: [{
        id: 'source-is-reachable',
        priority: 1,
        when: [{ relation: 'source', polarity: 'positive', arguments: [semanticVariableTerm('route')] }],
        then: [{ relation: 'reachable', polarity: 'positive', arguments: [semanticVariableTerm('route')] }],
      }],
      maxRounds: 0,
    });
    expect(judgment.status).toBe('incomplete');
    expect(judgment.saturated).toBe(false);
    expect(judgment.closed).toBe(false);
    if (judgment.status === 'incomplete') expect(judgment.reason).toBe('max_rounds_exceeded');
  });

  it('preserves false and semantic absence as distinct terms', () => {
    const judgment = semanticRewriteAuthority.resolve({
      kind: 'semantic_rewrite_execution_request',
      seeds: [{ relation: 'values', arguments: [semanticTruthTerm('false'), semanticAbsenceTerm()] }],
      rules: [],
    });
    expect(judgment.facts).toContainEqual({ relation: 'values', arguments: [semanticTruthTerm('false'), semanticAbsenceTerm()] });
  });
});
