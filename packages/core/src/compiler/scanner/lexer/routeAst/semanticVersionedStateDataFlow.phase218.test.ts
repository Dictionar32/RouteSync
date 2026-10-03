import { describe, expect, it } from 'vitest';
import {
  knowledgeId,
  semanticAbsent,
  semanticIdentifier,
  semanticSource,
  type SemanticKnowledgeDataFlow,
} from './semanticKnowledgeDataFlowRelations';
import { analyzeSemanticVersionedStateDataFlow } from './semanticVersionedStateDataFlowRelations';

describe('Phase 218 semantic versioned state data-flow', () => {
  it('derives a version from a canonical assignment and a candidate for a reference', () => {
    const source = semanticSource('test.php', 0, 1);
    const scope = knowledgeId(source, 'scope', 'function');
    const variable = knowledgeId(source, 'variable', 'user');
    const value = knowledgeId(source, 'value', 'input');
    const assignment = knowledgeId(source, 'assignment', 'assign-user');
    const reference = knowledgeId(semanticSource('test.php', 2, 3), 'reference', 'use-user');

    const model: SemanticKnowledgeDataFlow = {
      facts: [
        {
          kind: 'variable',
          value: { id: variable, name: semanticIdentifier('user'), scope, source },
        },
        {
          kind: 'value',
          value: {
            id: value,
            kind: { code: 'literal' },
            name: semanticAbsent('not_provided'),
            value: semanticAbsent('not_provided'),
            source,
          },
        },
        {
          kind: 'assignment',
          value: {
            id: assignment,
            target: variable,
            value,
            operator: { code: 'set' },
            reference: { code: 'by_value' },
            source,
          },
        },
        {
          kind: 'reference',
          value: {
            id: reference,
            variable,
            availability: semanticAbsent('not_provided'),
            source: semanticSource('test.php', 2, 3),
          },
        },
      ],
      dataFlow: [],
      relations: [],
    };

    const analysis = analyzeSemanticVersionedStateDataFlow(model);
    expect(analysis.versions).toHaveLength(1);
    expect(analysis.uses[0]?.candidates).toHaveLength(1);
  });
});
