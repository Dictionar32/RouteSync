import { describe, expect, it } from 'vitest';
import { controllerActionBindingAlgebra } from './controllerActionBindingAlgebra';
import { createActionName, createControllerName } from './names';

const identity = Object.freeze({ controller: createControllerName('App\\Http\\Controllers\\UserController'), action: createActionName('show') });
const policy = (value: string) => Object.freeze({ identity, value });
const controller = (value: string) => Object.freeze({ identity, value });

describe('Phase 2625 controller/action binding cardinality', () => {
  it('preserves duplicate supplied policy candidates as ambiguity', () => {
    const result = controllerActionBindingAlgebra.resolve({
      identity,
      suppliedPolicies: [policy('first'), policy('second')],
      catalogControllers: [],
    });

    expect(result.kind).toBe('supplied_policy_ambiguous');
    if (result.kind === 'supplied_policy_ambiguous') {
      expect(result.candidates.map(candidate => candidate.value)).toEqual(['first', 'second']);
    }
  });

  it('preserves duplicate controller candidates as ambiguity instead of selecting the first', () => {
    const result = controllerActionBindingAlgebra.resolve({
      identity,
      suppliedPolicies: [],
      catalogControllers: [controller('first'), controller('second')],
    });

    expect(result.kind).toBe('catalog_controller_ambiguous');
    if (result.kind === 'catalog_controller_ambiguous') {
      expect(result.candidates.map(candidate => candidate.value)).toEqual(['first', 'second']);
    }
  });

  it('preserves an absent policy and controller binding as unbound', () => {
    const result = controllerActionBindingAlgebra.resolve({
      identity,
      suppliedPolicies: [],
      catalogControllers: [],
    });

    expect(result).toEqual({ kind: 'unbound' });
  });

  it('uses a unique supplied policy before catalog evidence', () => {
    const result = controllerActionBindingAlgebra.resolve({
      identity,
      suppliedPolicies: [policy('canonical')],
      catalogControllers: [controller('catalog')],
    });

    expect(result).toEqual({ kind: 'supplied_policy', value: 'canonical' });
  });
});
