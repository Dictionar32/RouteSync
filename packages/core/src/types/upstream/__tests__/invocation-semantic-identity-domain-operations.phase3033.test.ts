import { describe, expect, it } from 'vitest';
import {
  knowledgeId,
  semanticAbsent,
  semanticOperation,
  semanticSource,
  type KnowledgeId,
  type SemanticInvocation,
} from '../semanticDataflowKnowledge';
import { invocationSemanticIdentityOperations } from '../invocationSemanticJudgmentAuthority';

const invocation = (source: ReturnType<typeof semanticSource.create>, identitySource = source): SemanticInvocation => Object.freeze({
  id: knowledgeId(identitySource, 'invocation', 'call'),
  receiver: semanticAbsent<KnowledgeId>('not_applicable'),
  operation: semanticOperation.create('dispatch'),
  arguments: Object.freeze([knowledgeId(identitySource, 'value', 'argument')]),
  source,
});

describe('Phase 3033 invocation semantic identity domain operations', () => {
  it('compares source identity through typed source equality including provider provenance', () => {
    const parserSource = semanticSource.create('Controller.php', 10, 20);
    const sameParserSource = semanticSource.create('Controller.php', 10, 20);
    const lexerSource = semanticSource.create('Controller.php', 10, 20, { code: 'lexer' });
    expect(invocationSemanticIdentityOperations.sameSource(parserSource, sameParserSource).kind).toBe('same_semantic_source');
    expect(invocationSemanticIdentityOperations.sameSource(parserSource, lexerSource).kind).toBe('different_semantic_source');
  });

  it('compares complete invocation shape without serializing a composite key', () => {
    const source = semanticSource.create('Controller.php', 10, 20);
    const sameSource = semanticSource.create('Controller.php', 10, 20);
    const otherSource = semanticSource.create('Controller.php', 11, 20);
    expect(invocationSemanticIdentityOperations.sameShape(invocation(source), invocation(sameSource)).kind)
      .toBe('same_invocation_semantic_shape');
    expect(invocationSemanticIdentityOperations.sameShape(invocation(source), invocation(otherSource, source)).kind)
      .toBe('different_invocation_semantic_shape');
  });
});
