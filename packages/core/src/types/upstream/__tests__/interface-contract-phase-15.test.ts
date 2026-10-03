import { describe, expect, it, expectTypeOf } from 'vitest';
import type { Cardinality } from '../primitiveVocabulary';
import type { EloquentRelationCardinality, EloquentRelationDescriptor, EloquentRelationMultiplicity } from '../modelVocabulary';
import type { ResponseCardinality } from '../response';
import type { ResourceAliasIR } from '../../ir/resourceIrTypes';

describe('phase 15 canonical cardinality contracts', () => {
  it('uses the canonical one/many ADT for Eloquent relation cardinality', () => {
    expectTypeOf<EloquentRelationCardinality>().toEqualTypeOf<Cardinality>();
    expectTypeOf<EloquentRelationMultiplicity>().toEqualTypeOf<{ kind: 'single' } | { kind: 'collection' }>();
  });

  it('does not duplicate relation multiplicity inside the relation descriptor', () => {
    const descriptor = null as unknown as EloquentRelationDescriptor;
    expect('multiplicity' in descriptor).toBe(false);
  });

  it('uses ResponseCardinality for resource aliases', () => {
    expectTypeOf<ResourceAliasIR['cardinality']>().toEqualTypeOf<ResponseCardinality>();
  });
});
