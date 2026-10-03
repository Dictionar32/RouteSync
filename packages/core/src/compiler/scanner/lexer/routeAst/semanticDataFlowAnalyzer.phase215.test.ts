import {
  analyzeSemanticDataFlow,
  pathSatisfiesGuard,
} from './semanticDataFlowAnalyzer';
import {
  semanticAbsent,
  semanticPresent,
  semanticValueFlow,
  type KnowledgeId,
  type SemanticKnowledgeDataFlow,
} from './semanticKnowledgeDataFlowRelations';

describe('Phase 215 semantic data-flow analyzer', () => {
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

  it('propagates semantic value flow without a CFG', () => {
    const a = id('a');
    const b = id('b');
    const c = id('c');
    const model: SemanticKnowledgeDataFlow = {
      facts: [
        { kind: 'value', value: { id: a, kind: { code: 'variable' }, name: semanticAbsent('not_provided'), value: semanticAbsent('not_provided'), source: { filePath: { kind: 'text', value: 'test.php' }, span: { kind: 'source-span', start: { kind: 'source-offset', value: 0 }, end: { kind: 'source-offset', value: 1 } }, evidence: { code: 'inference' } } } },
        { kind: 'value', value: { id: b, kind: { code: 'variable' }, name: semanticAbsent('not_provided'), value: semanticAbsent('not_provided'), source: { filePath: { kind: 'text', value: 'test.php' }, span: { kind: 'source-span', start: { kind: 'source-offset', value: 0 }, end: { kind: 'source-offset', value: 1 } }, evidence: { code: 'inference' } } } },
        { kind: 'value', value: { id: c, kind: { code: 'variable' }, name: semanticAbsent('not_provided'), value: semanticAbsent('not_provided'), source: { filePath: { kind: 'text', value: 'test.php' }, span: { kind: 'source-span', start: { kind: 'source-offset', value: 0 }, end: { kind: 'source-offset', value: 1 } }, evidence: { code: 'inference' } } } },
      ],
      dataFlow: [
        semanticValueFlow(a, b, 'value'),
        semanticValueFlow(b, c, 'value'),
      ],
      relations: [],
    };

    const analysis = analyzeSemanticDataFlow(model);
    expect(analysis.paths.some(path => path.target === c && path.guards.length === 0)).toBe(true);
    expect(analysis.paths.some(path => path.target === c && path.steps.length === 2)).toBe(true);
  });

  it('preserves semantic guards across derived paths', () => {
    const predicate = id('predicate');
    const a = id('a');
    const b = id('b');
    const c = id('c');
    const source = {
      filePath: { kind: 'text' as const, value: 'test.php' },
      span: { kind: 'source-span' as const, start: { kind: 'source-offset' as const, value: 0 }, end: { kind: 'source-offset' as const, value: 1 } },
      evidence: { code: 'inference' as const },
    };
    const model: SemanticKnowledgeDataFlow = {
      facts: [
        ...[predicate, a, b, c].map(value => ({ kind: 'value' as const, value: { id: value, kind: { code: 'variable' as const }, name: semanticAbsent('not_provided'), value: semanticAbsent('not_provided'), source } })),
      ],
      dataFlow: [
        semanticValueFlow(a, b, 'value', { predicate, polarity: 'satisfied' }),
        semanticValueFlow(b, c, 'value'),
      ],
      relations: [],
    };
    const analysis = analyzeSemanticDataFlow(model);
    const path = analysis.paths.find(item => item.target === c && item.steps.length === 2)!;
    expect(pathSatisfiesGuard(path, predicate, 'satisfied')).toBe(true);
  });
});
