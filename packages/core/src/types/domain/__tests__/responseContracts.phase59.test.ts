import { describe, expectTypeOf, it } from 'vitest';
import type {
  InlineResponseDescriptorParams,
  ResponseSemanticContract,
} from '../responseDescriptors';
import type {
  ResponseShapeSpecification,
} from '../responseShapes';

describe('Phase 59 response interface contracts', () => {
  it('keeps semantic response contract authoritative and closed', () => {
    expectTypeOf<ResponseSemanticContract['kind']>().toEqualTypeOf<'object'>();
    expectTypeOf<ResponseSemanticContract['fields']>().toEqualTypeOf<
      readonly ResponseSemanticContract['fields'][number][]
    >();
  });

  it('requires semantic contract for inline response descriptors', () => {
    expectTypeOf<InlineResponseDescriptorParams['semanticContract']>().toEqualTypeOf<
      ResponseSemanticContract
    >();
  });

  it('models response shape with cardinality and pagination states', () => {
    expectTypeOf<ResponseShapeSpecification['cardinality']>().toEqualTypeOf<
      'single' | 'collection'
    >();
    expectTypeOf<ResponseShapeSpecification['pagination']>().toEqualTypeOf<
      'none' | 'paginated'
    >();
  });
});
