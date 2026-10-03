import { describe, expect, it } from 'vitest';
import {
  semanticFact,
  knowledgeId,
  semanticSource,
} from './semanticKnowledgeDataFlowRelations';
import { analyzeSemanticStateDataFlow } from './semanticStateDataFlow';

const source = semanticSource('phase216.php', 0, 1);
const id = (slot: string) => knowledgeId(source, 'variable', slot);

describe('Phase 216 semantic state data-flow', () => {
  it('derives def-use from canonical facts without a CFG', () => {
    const variable = id('user');
    const assignment = semanticFact({
      kind: 'assignment',
      value: {
        id: id('assign'),
        target: variable,
        value: id('input'),
        operator: { code: 'set' },
        reference: { code: 'by_value' },
        source,
      },
    });
    const reference = semanticFact({
      kind: 'reference',
      value: { id: id('read'), variable, availability: { kind: 'absent', reason: { code: 'not_provided' } }, source },
    });

    const model = { facts: [assignment, reference], dataFlow: [], relations: [] };
    const analysis = analyzeSemanticStateDataFlow(model);

    expect(analysis.defUse).toHaveLength(1);
    expect(analysis.defUse[0]?.definition.location.kind).toBe('variable');
  });

  it('keeps state indexes derived rather than canonical', () => {
    const model = { facts: [], dataFlow: [], relations: [] };
    const analysis = analyzeSemanticStateDataFlow(model);
    expect(analysis.accesses).toEqual([]);
  });
});
