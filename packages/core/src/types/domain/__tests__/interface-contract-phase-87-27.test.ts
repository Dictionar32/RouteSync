import { describe, expect, it } from 'vitest';
import { BoundSemanticFactory } from '../boundAst';
import { SemanticResolutionFactory } from '../semanticResolutionFactory';
import { SemanticValueFactory } from '../semanticValues';
import { matchSemanticResolution } from '../semanticResolution';

const common = {
  status: 'resolved' as const,
  confidence: 100,
  trace: [],
};

describe('Phase 87.27 upstream identity ADT', () => {
  it('carries model identity as a bound value, not a free string', () => {
    const model = SemanticValueFactory.modelName('Payment');
    const resolution = SemanticResolutionFactory.model({
      ...common,
      model,
      cardinality: { kind: 'single' },
      paginated: false,
      boundAst: BoundSemanticFactory.modelReference(model),
    });

    expect(matchSemanticResolution(resolution, {
      scalar: () => 'scalar',
      model: value => value.model.value,
      resource: () => 'resource',
      object: () => 'object',
      query_projection: () => 'query_projection',
      unknown: () => 'unknown',
    })).toBe('Payment');
  });

  it('carries resource identity as a bound value', () => {
    const resource = SemanticValueFactory.resourceName('PaymentResource');
    const resolution = SemanticResolutionFactory.resource({
      ...common,
      resource,
      cardinality: { kind: 'collection' },
      paginated: false,
      boundAst: BoundSemanticFactory.resourceReference(resource),
    });

    expect(resolution.kind).toBe('resource');
  });
});
