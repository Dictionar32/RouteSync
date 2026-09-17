import { describe, expectTypeOf, it } from 'vitest';
import type {
  SemanticResolution,
  ModelSemanticResolution,
  ResourceSemanticResolution,
  ScalarSemanticResolution,
  ObjectSemanticResolution,
  QueryProjectionSemanticResolution,
  UnknownSemanticResolution,
} from '../semanticResolution';

describe('Phase 87.55 semantic resolution single source', () => {
  it('uses one closed upstream semantic ADT', () => {
    expectTypeOf<SemanticResolution>().toEqualTypeOf<
      | ScalarSemanticResolution
      | ModelSemanticResolution
      | ResourceSemanticResolution
      | ObjectSemanticResolution
      | QueryProjectionSemanticResolution
      | UnknownSemanticResolution
    >();
  });

  it('encodes model cardinality instead of collection flags', () => {
    expectTypeOf<ModelSemanticResolution['cardinality']>().toEqualTypeOf<
      | { readonly kind: 'single' }
      | { readonly kind: 'collection' }
      | { readonly kind: 'paginated_collection' }
    >();
  });

  it('keeps scalar nullability as an ADT', () => {
    expectTypeOf<ScalarSemanticResolution['nullability']>().toEqualTypeOf<
      | { readonly kind: 'non_nullable' }
      | { readonly kind: 'nullable' }
    >();
  });
});
