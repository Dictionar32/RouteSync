import { describe, expect, it } from 'vitest';
import type { FormTypeName, PropertyName, ResourceName, RequestFieldName } from '../semanticValues';
import type { RequestField, RequestType, ResponseData } from '../request';

describe('interface contract phase 80', () => {
  it('carries request and form identity as semantic values', () => {
    expectTypeOf<RequestField['sourceName']>().toEqualTypeOf<RequestFieldName>();
    expectTypeOf<RequestField['name']>().toEqualTypeOf<PropertyName>();
    expectTypeOf<ResponseData['contract']['name']>().toEqualTypeOf<import('../semanticValues').ResponseTypeName>();
    expectTypeOf<RequestType['resourceName']>().toEqualTypeOf<ResourceName>();
    expectTypeOf<RequestType['formTypeName']>().toEqualTypeOf<FormTypeName>();
  });
});
