import { describe, expect, it } from 'vitest';
import { semanticDataflowFactLineageOperations, semanticDataflowIdentityOperations, type SemanticDataflowIdentity } from '../semanticDataflow';
import { sourceFileIdentityFactory } from '../names';
import { numberValue, stringValue } from '../valueObjects';
import type { SourceSpan } from '../provenance';
import { semanticDataflowQueryPolicySelectionFactory } from '../semanticDataflowQueryPolicy';

const source: SourceSpan = Object.freeze({
  kind: 'source_span',
  file: sourceFileIdentityFactory.create(stringValue.create('routes/web.php')),
  start: numberValue(10),
  end: numberValue(24),
});

const identity = (slot: string): SemanticDataflowIdentity => Object.freeze({
  kind: 'semantic_dataflow_identity',
  source,
  role: 'variable',
  slot: stringValue.create(slot),
});

describe('Phase2980 explicit semantic-dataflow runtime operations', () => {
  it('exposes canonical identity keying through an interface-typed operation object', () => {
    const key = semanticDataflowIdentityOperations.key(identity('route-handler'));
    expect(key.kind).toBe('semantic_dataflow_identity_key');
    expect(key.file.value).toBe('routes/web.php');
    expect(key.start).toBe(10);
    expect(key.end).toBe(24);
    expect(key.slot.value).toBe('route-handler');
  });

  it('owns semantic identity equality in the domain operation', () => {
    expect(semanticDataflowIdentityOperations.equal(identity('route-handler'), identity('route-handler'))).toBe(true);
    expect(semanticDataflowIdentityOperations.equal(identity('route-handler'), identity('controller-action'))).toBe(false);
  });

  it('exposes source-project identity creation as a named selection-domain operation', () => {
    expect(typeof semanticDataflowQueryPolicySelectionFactory.defaultSelection.createSourceProjectIdentity).toBe('function');
    expect(typeof semanticDataflowQueryPolicySelectionFactory.explicit(Object.freeze({
      kind: 'semantic_dataflow_query_policy_intent',
      sourceProducers: ['route'],
      sinkProducers: ['controller'],
      closed: true,
    })).createSourceProjectIdentity).toBe('function');
  });

  it('exposes query-policy materialization as a named selection-domain operation', () => {
    expect(typeof semanticDataflowQueryPolicySelectionFactory.defaultSelection.materializeQueryPolicyContracts).toBe('function');
    expect(typeof semanticDataflowQueryPolicySelectionFactory.explicit(Object.freeze({
      kind: 'semantic_dataflow_query_policy_intent',
      sourceProducers: ['route'],
      sinkProducers: ['controller'],
      closed: true,
    })).materializeQueryPolicyContracts).toBe('function');
  });

  it('attaches producer lineage without exposing a standalone exported function', () => {
    const fact = Object.freeze({
      kind: 'dependency' as const,
      source: identity('route-handler'),
      target: identity('controller-action'),
      role: 'callable' as const,
    });
    const continued = semanticDataflowFactLineageOperations.withLineage(fact, 'route');
    expect(continued.lineage?.producer).toBe('route');
    expect(continued.lineage?.identity).toBe(fact.source);
    expect(continued.lineage?.closed).toBe(true);
  });
});
