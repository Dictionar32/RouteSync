import { describe, expectTypeOf, it } from 'vitest';
import type {
  AuthorizationHeaderName,
  SecuritySchemeSpecification
} from '../authAndPolicy';
import type {
  RequestHeaderExpression,
  RequestMimeType,
  RequestContentTypeSpecification
} from '../httpVocabulary';
import type { RouteBindingField, RouteParameter } from '../parameters';

describe('Phase 71 semantic absence contracts', () => {
  it('models request MIME absence as an explicit ADT state', () => {
    expectTypeOf<RequestMimeType>().toEqualTypeOf<
      | { readonly kind: 'json'; readonly value: 'application/json' }
      | { readonly kind: 'multipart'; readonly value: 'multipart/form-data' }
      | { readonly kind: 'urlencoded'; readonly value: 'application/x-www-form-urlencoded' }
      | { readonly kind: 'none' }
    >();
    expectTypeOf<RequestHeaderExpression>().toMatchTypeOf<
      { readonly kind: 'none' } | { readonly kind: 'content_type'; readonly value: string }
    >();
  });

  it('models authorization-header absence as an explicit ADT state', () => {
    expectTypeOf<AuthorizationHeaderName>().toEqualTypeOf<
      | { readonly kind: 'authorization'; readonly value: 'Authorization' }
      | { readonly kind: 'none' }
    >();
    expectTypeOf<SecuritySchemeSpecification['defaultHeaderName']>().toEqualTypeOf<AuthorizationHeaderName>();
  });

  it('models route binding absence as an explicit ADT state', () => {
    expectTypeOf<RouteBindingField>().toEqualTypeOf<
      | { readonly kind: 'convention' }
      | { readonly kind: 'explicit'; readonly value: string }
    >();
    expectTypeOf<RouteParameter['bindingField']>().toEqualTypeOf<RouteBindingField>();
  });

  it('keeps the content-type specification semantically closed', () => {
    expectTypeOf<RequestContentTypeSpecification['mimeType']>().toEqualTypeOf<RequestMimeType>();
    expectTypeOf<RequestContentTypeSpecification['headerExpression']>().toEqualTypeOf<RequestHeaderExpression>();
  });
});
