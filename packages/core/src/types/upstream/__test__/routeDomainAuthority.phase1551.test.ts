import { describe, expect, it } from 'vitest';
import { routeDomainAuthority } from '../routeDomainAuthority';
import { createActionName, createControllerName, createDomainTypeName, createResourceName, createRoutePath } from '../names';
import type { RouteDomainResolutionContext } from '../routeDomainAuthority';
import type { RelationOption } from '../../../semantic/relations/relationFoundation';

const none = <Value>(): RelationOption<Value> => ({ kind: 'none' });
const some = <Value>(value: Value): RelationOption<Value> => ({ kind: 'some', value });
const emptyContext = (): RouteDomainResolutionContext => ({
  domain: none(),
  resourceName: none(),
  controllerName: none(),
  path: none(),
  actionName: none(),
});

describe('route domain authority closed judgment phase1551', () => {
  it('records the selected evidence and precedence instead of exposing only a projected domain', () => {
    const input: RouteDomainResolutionContext = {
      ...emptyContext(),
      domain: some(createDomainTypeName('Billing')),
      controllerName: some(createControllerName('CatalogController')),
      resourceName: some(createResourceName('OrdersResource')),
      path: some(createRoutePath('/orders')),
      actionName: some(createActionName('index')),
    };
    const judgment = routeDomainAuthority.resolveJudgment(input);

    expect(judgment).toMatchObject({
      kind: 'route_domain_resolution_judgment',
      outcome: 'candidate_selected',
      rule: 'explicit>controller>resource>register>path>action>default',
      authority: 'upstream',
      closed: true,
      result: { value: { value: 'Billing' } },
      selected: { kind: 'some', value: { source: 'explicit_domain' } },
    });
  });

  it('distinguishes a default domain from a source-derived candidate', () => {
    const judgment = routeDomainAuthority.resolveJudgment(emptyContext());

    expect(judgment).toMatchObject({
      outcome: 'default_applied',
      authority: 'upstream',
      closed: true,
      result: { value: { value: 'App' } },
      selected: { kind: 'none' },
    });
  });
});
