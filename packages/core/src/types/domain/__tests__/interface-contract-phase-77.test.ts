import { describe, expectTypeOf, it } from 'vitest';
import type {
  ResourceFieldDescriptor,
  ResourceExpressionCardinality,
  ModelResourceExpression,
  ResourceResourceExpression,
  ResourceAssignment,
  ParsedResource,
} from '../expressions';
import type {
  ResourceName,
  ResponseFieldName,
  ResponseTypeName,
  PropertyName,
  CastTypeName,
  SemanticOperator,
} from '../semanticValues';
import type { Nullability } from '../modelContracts';

describe('Phase 77 interface contract: generator input is already semantic manifest data', () => {
  it('keeps response field source and generated target names semantically distinct', () => {
    expectTypeOf<ResourceFieldDescriptor['name']>().toEqualTypeOf<ResponseFieldName>();
    expectTypeOf<ResourceFieldDescriptor['propertyName']>().toEqualTypeOf<PropertyName>();
  });

  it('carries resource/model references as domain values', () => {
    expectTypeOf<ModelResourceExpression['model']>().toEqualTypeOf<import('../semanticValues').ModelName>();
    expectTypeOf<ResourceResourceExpression['resource']>().toEqualTypeOf<ResourceName>();
    expectTypeOf<ParsedResource['name']>().toEqualTypeOf<PropertyName>();
    expectTypeOf<ParsedResource['typeName']>().toEqualTypeOf<ResponseTypeName>();
  });

  it('represents cardinality and nullability as domain state', () => {
    expectTypeOf<ResourceExpressionCardinality>().toEqualTypeOf<
      { readonly kind: 'single' } | { readonly kind: 'collection' }
    >();
    expectTypeOf<ResourceAssignment['nullability']>().toEqualTypeOf<Nullability>();
  });

  it('represents computed expression vocabulary without free operator/type strings', () => {
    expectTypeOf<import('../expressions').BinaryResourceExpression['operator']>().toEqualTypeOf<SemanticOperator>();
    expectTypeOf<import('../expressions').TypeCastResourceExpression['type']>().toEqualTypeOf<CastTypeName>();
  });
});
