import { describe, expect, it } from 'vitest';
import { controllerResourceBindingAuthority } from '../controllerResourceBindingAuthority';
import type { ControllerResourceBindingCandidate } from '../controllerResourceBindingInterface';
import { createMethodName } from '../names';
import { responseRef } from '../semanticReferences';
import { SemanticValueFactory } from '../../domain/semanticValues';

describe('controller resource static-call applicability judgment phase 2055', () => {
  const candidate = (
    method: string,
    response: Extract<ControllerResourceBindingCandidate, { readonly kind: 'static_call' }>['response'] = { kind: 'response_reference_not_declared' },
  ): ControllerResourceBindingCandidate => ({
    kind: 'static_call',
    resourceName: SemanticValueFactory.resourceName('Post'),
    methodName: createMethodName(method),
    argument: { kind: 'absent' },
    response,
  });

  it('declares applicability through the authority rule interface instead of a method-name switch', () => {
    expect(controllerResourceBindingAuthority.contractVersion).toBe(8);
    expect(controllerResourceBindingAuthority.staticCallRules).toHaveLength(1);
    expect(controllerResourceBindingAuthority.staticCallRules[0]?.kind).toBe('controller_resource_static_call_rule');
    expect(controllerResourceBindingAuthority.staticCallRules[0]?.methodName.value.value).toBe('collection');
  });

  it('keeps non-collection static calls outside resource-binding semantics', () => {
    expect(controllerResourceBindingAuthority.judge(candidate('make'))).toEqual({
      kind: 'not_applicable',
      closed: true,
    });
  });

  it('recognizes collection applicability before resolving its response and model evidence', () => {
    expect(controllerResourceBindingAuthority.judge(candidate('collection'))).toEqual({
      kind: 'unresolved',
      reason: 'response_reference_not_declared',
      closed: true,
    });
  });

  it('distinguishes a missing collection argument after response identity is present', () => {
    expect(controllerResourceBindingAuthority.judge(candidate('collection', { kind: 'response_reference_declared', response: responseRef('PostResponse') }))).toEqual({
      kind: 'unresolved',
      reason: 'collection_argument_absent',
      closed: true,
    });
  });
});
