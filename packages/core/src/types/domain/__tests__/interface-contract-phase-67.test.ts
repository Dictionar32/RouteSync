import { describe, expectTypeOf, it } from 'vitest';
import type {
  BasePaginatedEnvelopeDescriptor,
  PaginationKindSpecification,
  PolymorphicRelationSpecification,
  ResponseShapeSpecification
} from '../responseShapes';
import type {
  ColumnName,
  EnvelopeTypeName,
  ModelName,
  ResponseDataKey,
  ResponseLinksKey,
  ResponseMetaKey
} from '../semanticValues';

describe('Phase 67 response-shape semantic contracts', () => {
  it('qualifies response cardinality and pagination', () => {
    expectTypeOf<ResponseShapeSpecification['cardinality']>().toEqualTypeOf<'one' | 'many'>();
    expectTypeOf<ResponseShapeSpecification['pagination']>().toEqualTypeOf<'none' | 'paginated'>();
  });

  it('qualifies pagination envelope keys and type identity', () => {
    expectTypeOf<BasePaginatedEnvelopeDescriptor['dataKey']>().toEqualTypeOf<ResponseDataKey>();
    expectTypeOf<BasePaginatedEnvelopeDescriptor['metaKey']>().toEqualTypeOf<ResponseMetaKey>();
    expectTypeOf<BasePaginatedEnvelopeDescriptor['linksKey']>().toEqualTypeOf<ResponseLinksKey | null>();
    expectTypeOf<BasePaginatedEnvelopeDescriptor['envelopeTypeName']>().toEqualTypeOf<EnvelopeTypeName>();
  });

  it('removes derived collection booleans from pagination specifications', () => {
    expectTypeOf<PaginationKindSpecification>().not.toHaveProperty('hasPageLinks');
    expectTypeOf<PaginationKindSpecification>().not.toHaveProperty('isCursorBased');
  });

  it('qualifies polymorphic relation identity', () => {
    expectTypeOf<PolymorphicRelationSpecification['defaultIdColumn']>().toEqualTypeOf<ColumnName>();
    expectTypeOf<PolymorphicRelationSpecification['defaultTypeColumn']>().toEqualTypeOf<ColumnName>();
    expectTypeOf<PolymorphicRelationSpecification['defaultUnionTypeName']>().toEqualTypeOf<EnvelopeTypeName>();
  });

  it('qualifies polymorphic target models', () => {
    expectTypeOf<ModelName>().toHaveProperty('kind');
    expectTypeOf<ColumnName>().toHaveProperty('kind');
  });
});
