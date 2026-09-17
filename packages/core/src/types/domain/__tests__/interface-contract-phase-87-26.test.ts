import { describe, expect, it } from 'vitest';
import { BoundSemanticFactory } from '../boundAst';
import { SemanticResolutionFactory } from '../semanticResolutionFactory';
import { matchSemanticResolution } from '../semanticResolution';
import { SemanticValueFactory } from '../semanticValues';
import { PrimitiveKind, PrimitiveType } from '../../../compiler/types/SemanticType';

const common = {
  status: 'resolved' as const,
  confidence: 100,
  trace: [],
  boundAst: BoundSemanticFactory.unsupported('unresolved_symbol'),
};

describe('Phase 87.26 semantic resolution ADT', () => {
  it('constructs a scalar without free semantic identity fields', () => {
    const resolution = SemanticResolutionFactory.scalar({
      ...common,
      semanticType: new PrimitiveType(PrimitiveKind.STRING),
      nullable: false,
    });

    expect(resolution.kind).toBe('scalar');
    if (resolution.kind !== 'scalar') throw new Error('expected scalar');
    expect(resolution.semanticType.kind).toBe('primitive');
    expect(resolution.nullable).toBe(false);
  });

  it('requires exhaustive consumers through the matcher', () => {
    const resolution = SemanticResolutionFactory.model({
      ...common,
      model: SemanticValueFactory.modelName('Payment'),
      cardinality: { kind: 'single' },
      paginated: false,
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
});
