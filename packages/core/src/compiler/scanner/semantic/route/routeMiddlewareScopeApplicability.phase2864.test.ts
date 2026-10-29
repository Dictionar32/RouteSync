import { describe, expect, it } from 'vitest';
import { absent, present } from '../../../../types/upstream/presence';
import { createActionName } from '../../../../types/upstream/names';
import { routeMiddlewareIdentityAuthority, routeMiddlewareScopeApplicabilityAuthority } from './routeMiddlewareKnowledgeCatalog';
import type { RouteMiddlewareScopeApplicabilityHandlers, RouteMiddlewareScopeNotApplicableJudgment, RouteMiddlewareScope, RouteMiddlewareIdentityComparisonHandlers } from '../../../../types/upstream/routeMiddleware';
import type { Presence } from '../../../../types/upstream/presence';
import { createMiddlewareName } from '../../../../types/upstream/names';
import type { ActionName } from '../../../../types/upstream/names';

describe('route middleware scope applicability authority', () => {
  const handlers: RouteMiddlewareScopeApplicabilityHandlers<{ readonly kind: 'applicable' } | RouteMiddlewareScopeNotApplicableJudgment> = {
    onApplicable: (_scope: RouteMiddlewareScope, _action: Presence<ActionName>) => ({ kind: 'applicable' }),
    onNotApplicable: (judgment: RouteMiddlewareScopeNotApplicableJudgment) => judgment,
  };

  it('continues an all-scope judgment as applicable without losing explicit action presence', () => {
    const action = present(createActionName('show'));
    const result = routeMiddlewareScopeApplicabilityAuthority.classify({ kind: 'all' }, action).continueWith<{ readonly kind: 'applicable' } | RouteMiddlewareScopeNotApplicableJudgment>(handlers);
    expect(result.kind).toBe('applicable');
  });

  it('returns an actionable blocked judgment', () => {
    const result = routeMiddlewareScopeApplicabilityAuthority.classify(
      { kind: 'blocked', reason: { kind: 'unsupported_unpacked_arguments', arguments: [] } },
      absent(),
    ).continueWith<{ readonly kind: 'applicable' } | RouteMiddlewareScopeNotApplicableJudgment>(handlers);
    expect(result).toEqual({ kind: 'middleware_scope_blocked' });
  });

  it('distinguishes a missing action from an action outside an only-scope', () => {
    const result = routeMiddlewareScopeApplicabilityAuthority.classify(
      { kind: 'only', actions: [createActionName('index')] },
      absent(),
    ).continueWith<{ readonly kind: 'applicable' } | RouteMiddlewareScopeNotApplicableJudgment>(handlers);
    expect(result).toEqual({ kind: 'middleware_scope_action_required' });
  });
});


describe('route middleware identity authority', () => {
  const handlers: RouteMiddlewareIdentityComparisonHandlers<{ readonly kind: 'same' } | { readonly kind: 'different' }> = {
    onSameIdentity: () => ({ kind: 'same' }),
    onDifferentIdentity: () => ({ kind: 'different' }),
  };

  const reference = (name: string) => ({
    name: createMiddlewareName(name),
    parameters: [],
  });

  it('continues identical middleware identities through the matching domain case', () => {
    const identity = routeMiddlewareIdentityAuthority.identify(reference('auth'));
    const result = routeMiddlewareIdentityAuthority.compare(
      identity,
      routeMiddlewareIdentityAuthority.identify(reference('auth')),
    ).continueWith(handlers);
    expect(result).toEqual({ kind: 'same' });
  });

  it('continues different middleware identities through the distinct domain case', () => {
    const left = routeMiddlewareIdentityAuthority.identify(reference('auth'));
    const right = routeMiddlewareIdentityAuthority.identify(reference('guest'));
    expect(routeMiddlewareIdentityAuthority.compare(left, right).continueWith(handlers)).toEqual({ kind: 'different' });
  });
});
