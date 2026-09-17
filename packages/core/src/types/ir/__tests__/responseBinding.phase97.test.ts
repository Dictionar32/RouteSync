import { describe, expect, it, expectTypeOf } from 'vitest';
import type { RouteResponseBinding } from '../manifestIrTypes';
import type { ResponseReference } from '../endpointIrTypes';
import type { PaginationState } from '../paginationState';
import { createRouteName, createRoutePath, createActionName, createControllerName, createResourceName } from '../nominalVocabulary';
import { buildResponseReference } from '../../../ir/domain/request-endpoint/endpointRefs';

describe('Phase 97 response binding dataflow', () => {
  it('requires response semantics at the manifest route boundary', () => {
    expectTypeOf<RouteResponseBinding>().toHaveProperty('kind');
    expectTypeOf<RouteResponseBinding>().not.toBeAny();
  });

  it('does not allow pagination absence inside a paginated response variant', () => {
    type PaginatedBinding = Extract<RouteResponseBinding, { kind: 'paginated' }>;
    expectTypeOf<PaginatedBinding['pagination']>().toEqualTypeOf<Extract<PaginationState, { kind: 'present' }>>();
  });

  it('lowers an already-bound response without controller/action/resource guessing', () => {
    const route = {
      id: createRouteName('register.post'),
      method: 'POST' as const,
      path: createRoutePath('/register'),
      action: createActionName('store'),
      controller: createControllerName('AuthController'),
      middleware: [] as const,
      response: {
        kind: 'resource' as const,
        resource: createResourceName('RegisterResponse'),
        statusCode: 201 as const,
        pagination: { kind: 'none' as const }
      }
    };

    const response: ResponseReference = buildResponseReference(route);
    expect(response.type).toBe('resource');
    expect(response.pagination.kind).toBe('none');
  });
});
