import { describe, expect, expectTypeOf, it } from 'vitest';
import type { EloquentCardinality, EloquentReturn } from '../../../semantic/EloquentRegistry';
import type { InternalResolverQuery } from '../../../semantic/types';
import type { ModelName, ColumnName } from '../semanticValues';

describe('Phase 87.53 upstream ADT primitive leak boundary', () => {
  it('encodes Eloquent collection state as a closed cardinality ADT', () => {
    expectTypeOf<EloquentCardinality>().toEqualTypeOf<
      | { readonly kind: 'single' }
      | { readonly kind: 'collection' }
      | { readonly kind: 'paginated_collection' }
    >();
  });

  it('does not encode internal semantic model identity as free strings', () => {
    expectTypeOf<InternalResolverQuery>().toMatchTypeOf<
      | { readonly kind: 'model_column'; readonly model: ModelName; readonly column: ColumnName }
      | { readonly kind: 'model_accessor'; readonly model: ModelName; readonly column: ColumnName }
    >();
  });

  it('keeps unresolved array semantics explicit', () => {
    const value: EloquentReturn = { kind: 'array', element: { kind: 'unresolved' } };
    expect(value.element.kind).toBe('unresolved');
  });
});
