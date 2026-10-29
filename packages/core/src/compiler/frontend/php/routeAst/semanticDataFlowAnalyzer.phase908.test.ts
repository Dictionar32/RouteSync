import { describe, expect, test } from 'vitest';
import { analyzeSemanticDataFlow, analyzeSemanticDataFlowJudgment } from '../../../scanner/wiring/semanticDataflowRuntimeBinding';
import type { SemanticKnowledgeDataFlow } from './semanticKnowledgeDataFlowRelations';

describe('Phase 908 semantic dataflow compatibility analysis', () => {
  test('exposes the derived judgment without reducing paths or guards to text facts', () => {
    const model = {
      dataFlow: [],
    } as unknown as SemanticKnowledgeDataFlow;
    const value = analyzeSemanticDataFlow(model);
    expect(value.paths).toEqual([]);
    expect(value.reachable).toEqual([]);
  });
});

describe('Phase 1543 explicit no-evidence model', () => {
  test('does not label an empty evidence surface as a derived semantic judgment', () => {
    const model = { dataFlow: [] } as unknown as SemanticKnowledgeDataFlow;
    const result = analyzeSemanticDataFlowJudgment(model);
    expect(result.kind).toBe('semantic_data_flow_no_evidence');
    if (result.kind === 'semantic_data_flow_no_evidence') {
      expect(result.semanticStatus).toBe('not_evaluated');
      expect(result.protocolClosed).toBe(true);
      expect(result.evidenceStatus).toBe('no_dataflow_facts');
    }
  });
});


describe('Phase 1544 semantic knowledge versus dataflow-edge absence', () => {
  test('keeps no-edge evidence distinct from a truly empty semantic knowledge surface', () => {
    // The analyzer must anchor an edge-free but non-empty semantic model in
    // its existing knowledge identity and send it through upstream execution.
    const source = { filePath: { kind: 'text', value: 'sample.php' }, span: { kind: 'source-span', start: { kind: 'source-offset', value: 0 }, end: { kind: 'source-offset', value: 4 } }, evidence: { code: 'parser' } };
    const id = { kind: 'knowledge-id', identity: { kind: 'knowledge-identity', source, role: 'variable', slot: { kind: 'text', value: 'x' } } };
    const model = { facts: [{ kind: 'variable', value: { id, source } }], dataFlow: [], relations: [] } as unknown as SemanticKnowledgeDataFlow;
    const result = analyzeSemanticDataFlowJudgment(model);
    expect(result.kind).toBe('semantic_data_flow_judgment');
    if (result.kind === 'semantic_data_flow_judgment') {
      expect(result.evidenceStatus).toBe('semantic_knowledge_present_without_dataflow_edges');
      expect(result.analysis.paths).toEqual([]);
      expect(result.analysis.reachable).toEqual([]);
    }
  });
});
