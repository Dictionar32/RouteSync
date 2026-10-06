import { describe, expect, test } from 'vitest';
import type {
  SemanticDataflowIdentity,
} from '../../../types/upstream/semanticDataflow';
import { createSourceFile } from '../../../types/upstream/names';
import { numberValue, stringValue } from '../../../types/upstream/valueObjects';
import { createSemanticDataflowStatePolicy } from '../dataflow/semanticDataflowStatePolicy';
import type { DataFlowInterface } from '../../../types/dataflow/dataFlowInterface';
import type { SemanticDataflowInput, SemanticDataflowJudgment } from '../../../types/upstream/semanticDataflow';

type State = 'route' | 'resource' | 'other';

const identity = (role: string): SemanticDataflowIdentity => ({
  kind: 'semantic_dataflow_identity',
  source: Object.freeze({
    kind: 'source_span' as const,
    file: createSourceFile('fixture.php'),
    start: numberValue(0),
    end: numberValue(1),
  }),
  role: 'value',
  slot: stringValue(role),
});

const source = identity('source');
const target = identity('target');

const dataflow = Object.freeze({
  seed: (_input: SemanticDataflowInput) => Object.freeze({} as SemanticDataflowJudgment),
  state: Object.freeze({} as SemanticDataflowJudgment),
  derive: (state: SemanticDataflowJudgment) => state,
  close: (state: SemanticDataflowJudgment) => state,
  reaches: (_state: SemanticDataflowJudgment, from: SemanticDataflowIdentity, to: SemanticDataflowIdentity) =>
    JSON.stringify(from) === JSON.stringify(source) && JSON.stringify(to) === JSON.stringify(target),
}) satisfies DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>;

describe('Phase 1031 semantic dataflow state policy', () => {
  test('state refines source/sink selection without replacing canonical reaches', () => {
    const policy = createSemanticDataflowStatePolicy<State>(dataflow, {
      isSource: (_node, state) => state === 'route',
      isSink: (_node, state) => state === 'resource',
      isAdditionalFlowStep: () => false,
      isBarrier: () => false,
    });

    expect(policy.flows(source, target, 'route', 'resource')).toBe(true);
    expect(policy.flows(source, target, 'other', 'resource')).toBe(false);
    expect(policy.flows(source, target, 'route', 'other')).toBe(false);
    expect(policy.stateConfig.isAdditionalFlowStep(source, target, 'route', 'resource')).toBe(false);
    expect(policy.stateConfig.isBarrier(target, 'resource')).toBe(false);
  });
});
