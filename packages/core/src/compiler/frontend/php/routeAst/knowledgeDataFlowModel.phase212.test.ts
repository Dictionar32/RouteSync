import { describe, expect, it } from 'vitest';
import { SEMANTIC_OPERATOR_KNOWLEDGE } from './semanticKnowledgeDataFlowRelations';

describe('Phase 212 knowledge/data-flow elevation', () => {
  it('stores operator fact classification as semantic vocabulary', () => {
    const identical = SEMANTIC_OPERATOR_KNOWLEDGE.find(item => item.code === 'identical');
    const notIdentical = SEMANTIC_OPERATOR_KNOWLEDGE.find(item => item.code === 'not_identical');
    const addition = SEMANTIC_OPERATOR_KNOWLEDGE.find(item => item.code === 'addition');

    expect(identical?.factKind).toBe('comparison');
    expect(notIdentical?.factKind).toBe('comparison');
    expect(addition?.factKind).toBe('binary-operation');
  });
});
