import { describe, expect, test } from 'vitest';
import type { AstAnalysisJudgment } from '../astAnalysisInterface';
import { astAnalysisInterface } from '../astAnalysisInterface';
import { semanticDataflowInterfaceFromJudgment, type SemanticDataflowJudgment } from '../../../types/upstream/semanticDataflowInterface';

describe('Phase 907 upstream analysis dataflow authority', () => {
  test('analysis interface exposes the canonical SemanticDataflowInterface without re-encoding identity', () => {
    const dataflow: SemanticDataflowJudgment = Object.freeze({
      kind: 'semantic_dataflow_judgment',
      node: Object.freeze({
        kind: 'semantic_dataflow_identity',
        source: Object.freeze({
          kind: 'source_span',
          file: Object.freeze({ kind: 'source_file', value: Object.freeze({ kind: 'string_value', value: 'OrderController.php' }) }),
          start: Object.freeze({ kind: 'number_value', value: 1 }),
          end: Object.freeze({ kind: 'number_value', value: 2 }),
        }),
        role: 'scope',
        slot: Object.freeze({ kind: 'string_value', value: 'controller' }),
      }),
      source: Object.freeze({
        kind: 'source_span',
        file: Object.freeze({ kind: 'source_file', value: Object.freeze({ kind: 'string_value', value: 'OrderController.php' }) }),
        start: Object.freeze({ kind: 'number_value', value: 1 }),
        end: Object.freeze({ kind: 'number_value', value: 2 }),
      }),
      facts: Object.freeze([]),
      closure: Object.freeze([]),
      derivations: Object.freeze([]),
      fixedPoint: 'least_fixed_point',
      reasoning: 'declarative_relation_rewrite_fixed_point',
      authority: 'semantic_dataflow_judgment',
      closed: true,
    });
    const analysis = { dataflow } as unknown as AstAnalysisJudgment;
    const iface = astAnalysisInterface(analysis);
    const canonical = semanticDataflowInterfaceFromJudgment(dataflow);
    expect(iface.dataflow).toBe(canonical);
    expect(iface.dataflow.kind).toBe('semantic_dataflow_interface');
    expect(iface.dataflow.judgment).toBe(dataflow);
    expect(iface.dataflow.authority).toBe('semantic_dataflow_judgment');
    expect(iface.dataflow.origin).toEqual({
      kind: 'semantic_dataflow_origin',
      source: 'semantic_dataflow_input',
      identity: 'typed_semantic_dataflow_identity',
      closed: true,
    });
  });
});
