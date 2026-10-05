import { describe, expect, test } from 'vitest';
import type { SemanticDataflowFact } from '../../../types/upstream/semanticDataflowInterface';
import type { AstAnalysisFact } from '../astAnalysisInterface';

describe('Phase 906 upstream analysis dataflow interface', () => {
  test('uses canonical SemanticDataflowFact instead of primitive source/target dataflow descriptors', () => {
    const fact: SemanticDataflowFact = Object.freeze({
      kind: 'reaches',
      source: Object.freeze({
        kind: 'semantic_dataflow_identity',
        source: Object.freeze({
          kind: 'source_span',
          file: Object.freeze({ kind: 'source_file', value: Object.freeze({ kind: 'string_value', value: 'OrderController.php' }) }),
          start: Object.freeze({ kind: 'number_value', value: 1 }),
          end: Object.freeze({ kind: 'number_value', value: 2 }),
        }),
        role: 'variable',
        slot: Object.freeze({ kind: 'string_value', value: 'order' }),
      }),
      target: Object.freeze({
        kind: 'semantic_dataflow_identity',
        source: Object.freeze({
          kind: 'source_span',
          file: Object.freeze({ kind: 'source_file', value: Object.freeze({ kind: 'string_value', value: 'OrderController.php' }) }),
          start: Object.freeze({ kind: 'number_value', value: 3 }),
          end: Object.freeze({ kind: 'number_value', value: 4 }),
        }),
        role: 'resource-access',
        slot: Object.freeze({ kind: 'string_value', value: 'OrderResource' }),
      }),
    });

    const analysisFact: AstAnalysisFact = { kind: 'dataflow_fact', value: fact };
    expect(analysisFact.kind).toBe('dataflow_fact');
    expect(analysisFact.value).toBe(fact);
  });
});
