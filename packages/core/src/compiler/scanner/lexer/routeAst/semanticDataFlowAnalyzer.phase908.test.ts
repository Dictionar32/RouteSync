import { describe, expect, test } from 'vitest';
import { analyzeSemanticDataFlowInterface } from './semanticDataFlowAnalyzer';
import type { SemanticKnowledgeDataFlow } from './semanticKnowledgeDataFlowRelations';

describe('Phase 908 semantic dataflow interface', () => {
  test('exposes the derived judgment without reducing paths or guards to text facts', () => {
    const model = {
      dataFlow: [],
    } as unknown as SemanticKnowledgeDataFlow;
    const value = analyzeSemanticDataFlowInterface(model);
    expect(value.kind).toBe('semantic_data_flow_interface');
    expect(value.authority).toBe('semantic_data_flow_judgment');
    expect(value.judgment.analysis.paths).toEqual([]);
    expect(value.closed).toBe(true);
  });
});
