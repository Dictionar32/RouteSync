import {
  semanticAbsent,
  semanticDependency,
  semanticPresent,
  semanticValueFlow,
  type KnowledgeId,
  type SemanticFlowGuard,
} from './semanticKnowledgeDataFlowRelations';

describe('Phase 214 semantic guarded data-flow', () => {
  const id = (slot: string): KnowledgeId => ({
    kind: 'knowledge-id',
    identity: {
      kind: 'knowledge-identity',
      source: {
        filePath: { kind: 'text', value: 'test.php' },
        span: {
          kind: 'source-span',
          start: { kind: 'source-offset', value: 0 },
          end: { kind: 'source-offset', value: 1 },
        },
        evidence: { code: 'inference' },
      },
      role: 'value',
      slot: { kind: 'text', value: slot },
    },
  });

  it('stores a predicate as a guard on value flow', () => {
    const predicate = id('predicate');
    const value = id('value');
    const target = id('target');
    const guard: SemanticFlowGuard = { predicate, polarity: 'satisfied' };
    const flow = semanticValueFlow(value, target, 'value', guard);

    expect(flow.guard.kind).toBe('present');
    if (flow.guard.kind === 'present') {
      expect(flow.guard.value.predicate).toBe(predicate);
      expect(flow.guard.value.polarity).toBe('satisfied');
    }
  });

  it('keeps unguarded flow explicit as semantic absence', () => {
    const flow = semanticDependency(id('a'), id('b'), 'value');
    expect(flow.guard.kind).toBe('absent');
  });
});
