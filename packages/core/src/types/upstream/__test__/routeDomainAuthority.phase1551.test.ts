import { describe, expect, it } from 'vitest';
import { routeDomainAuthority, routeRegisterEvidenceAuthority } from '../routeDomainAuthority';
import { createActionName, createControllerName, createDomainTypeName, createResourceName, createRoutePath } from '../names';
import type { RouteDomainResolutionContext } from '../routeDomainAuthority';

const emptyContext = (): RouteDomainResolutionContext => ({
  domain: { kind: 'none' },
  resourceName: { kind: 'none' },
  controllerName: { kind: 'none' },
  path: { kind: 'none' },
  actionName: { kind: 'none' },
});

describe('route domain authority closed judgment phase1551', () => {
  it('records the selected evidence and precedence instead of exposing only a projected domain', () => {
    const input: RouteDomainResolutionContext = {
      ...emptyContext(),
      domain: { kind: 'some', value: createDomainTypeName('Billing') },
      controllerName: { kind: 'some', value: createControllerName('CatalogController') },
      resourceName: { kind: 'some', value: createResourceName('OrdersResource') },
      path: { kind: 'some', value: createRoutePath('/orders') },
      actionName: { kind: 'some', value: createActionName('index') },
    };
    const judgment = routeDomainAuthority.resolveJudgment(input);

    expect(judgment).toMatchObject({
      kind: 'route_domain_resolution_judgment',
      outcome: 'candidate_selected',
      rule: 'explicit>controller>resource>register>path>action>default',
      authority: 'upstream',
      closed: true,
      result: { value: { value: 'Billing' } },
      selected: { kind: 'candidate_selected', candidate: { source: 'explicit_domain' } },
    });
  });

  it('distinguishes a default domain from a source-derived candidate', () => {
    const judgment = routeDomainAuthority.resolveJudgment(emptyContext());

    expect(judgment).toMatchObject({
      outcome: 'default_applied',
      authority: 'upstream',
      closed: true,
      result: { value: { value: 'App' } },
      selected: { kind: 'default_applied' },
    });
  });

  it('continues register-path evidence through its domain-owned ADT operation', () => {
    const evidence = routeRegisterEvidenceAuthority.classify(
      { kind: 'some', value: createRoutePath('/register') },
      { kind: 'none' },
    );
    const trace: string[] = [];
    evidence.continueWith({
      path_register: value => { trace.push(`path:${value.path.value.value.value}`); return []; },
      action_register: value => { trace.push(`action:${value.action.value.value.value}`); return []; },
      no_register: () => { trace.push('none'); return []; },
    });
    expect(evidence.kind).toBe('path_register');
    expect(trace).toEqual(['path:/register']);
  });

  it('continues register-action evidence without reducing the judgment to a boolean', () => {
    const evidence = routeRegisterEvidenceAuthority.classify(
      { kind: 'none' },
      { kind: 'some', value: createActionName('register') },
    );
    const trace: string[] = [];
    evidence.continueWith({
      path_register: () => { trace.push('path'); return []; },
      action_register: value => { trace.push(`action:${value.action.value.value.value}`); return []; },
      no_register: () => { trace.push('none'); return []; },
    });
    expect(evidence.kind).toBe('action_register');
    expect(trace).toEqual(['action:register']);
  });

  it('continues absent register evidence as its own closed ADT arm', () => {
    const evidence = routeRegisterEvidenceAuthority.classify(
      { kind: 'some', value: createRoutePath('/orders') },
      { kind: 'some', value: createActionName('index') },
    );
    const trace: string[] = [];
    evidence.continueWith({
      path_register: () => { trace.push('path'); return []; },
      action_register: () => { trace.push('action'); return []; },
      no_register: () => { trace.push('no_register'); return []; },
    });
    expect(evidence.kind).toBe('no_register');
    expect(trace).toEqual(['no_register']);
  });

  it('continues the selected domain judgment through domain handlers', () => {
    const judgment = routeDomainAuthority.resolveJudgment({
      ...emptyContext(),
      domain: { kind: 'some', value: createDomainTypeName('Billing') },
    });
    const trace: string[] = [];
    judgment.continueWith({
      candidate_selected: result => trace.push(`selected:${result.result.value.value}`),
      default_applied: result => trace.push(`default:${result.result.value.value}`),
    });
    judgment.selected.continueWith({
      candidate_selected: selection => trace.push(`candidate:${selection.candidate.source}`),
      default_applied: () => trace.push('candidate:default'),
    });
    expect(trace).toEqual(['selected:Billing', 'candidate:explicit_domain']);
  });
});
