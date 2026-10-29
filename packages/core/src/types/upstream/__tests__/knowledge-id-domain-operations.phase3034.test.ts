import { describe, expect, it } from 'vitest';
import { knowledgeId, semanticKnowledgeIdOperations, semanticSource } from '../semanticDataflowKnowledge';

describe('Phase 3034 KnowledgeId domain operations', () => {
  it('compares knowledge identity through source provenance, role, and slot', () => {
    const source = semanticSource.create('Controller.php', 12, 24);
    const sameSource = semanticSource.create('Controller.php', 12, 24);
    const otherSource = semanticSource.create('Controller.php', 13, 24);
    expect(semanticKnowledgeIdOperations.same(knowledgeId(source, 'invocation', 'call'), knowledgeId(sameSource, 'invocation', 'call')).kind)
      .toBe('same_knowledge_id');
    expect(semanticKnowledgeIdOperations.same(knowledgeId(source, 'invocation', 'call'), knowledgeId(otherSource, 'invocation', 'call')).kind)
      .toBe('different_knowledge_id');
    expect(semanticKnowledgeIdOperations.same(knowledgeId(source, 'invocation', 'call'), knowledgeId(source, 'value', 'call')).kind)
      .toBe('different_knowledge_id');
    expect(semanticKnowledgeIdOperations.same(knowledgeId(source, 'invocation', 'call'), knowledgeId(source, 'invocation', 'argument')).kind)
      .toBe('different_knowledge_id');
  });
});
