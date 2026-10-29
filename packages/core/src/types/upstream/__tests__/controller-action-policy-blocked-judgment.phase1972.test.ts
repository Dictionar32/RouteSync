import { describe, expect, it } from 'vitest';
import { controllerActionPolicyRelations } from '../controllerActionPolicyRelations';
import { createActionName, createControllerName, stringValue } from '../names';
import type { EffectiveControllerActionPolicy } from '../effectiveControllerActionPolicy';

const source = Object.freeze({
  kind: 'source_span' as const,
  file: Object.freeze({ kind: 'source_file' as const, value: stringValue.create('Controller.php') }),
  start: Object.freeze({ kind: 'number_value' as const, value: 0 }),
  end: Object.freeze({ kind: 'number_value' as const, value: 1 }),
});

const argument = Object.freeze({
  kind: 'named' as const,
  name: Object.freeze({ kind: 'expression_argument_name' as const, value: stringValue.create('only') }),
  value: Object.freeze({
    kind: 'variable' as const,
    name: Object.freeze({ kind: 'variable_name' as const, value: stringValue.create('methods') }),
    source,
  }),
});

const policy: EffectiveControllerActionPolicy = Object.freeze({
  kind: 'effective_controller_action_policy',
  judgment: Object.freeze({
    kind: 'blocked',
    reasons: Object.freeze([Object.freeze({ kind: 'unsupported_only_expression', argument })]),
  }),
  controller: createControllerName('OrderController'),
  action: createActionName('store'),
  inheritedFrom: Object.freeze([]),
  source: Object.freeze([source]),
});

describe('Phase 1972 blocked controller action policy relation', () => {
  it('preserves blocked judgment instead of projecting partial policy as complete', () => {
    const relations = controllerActionPolicyRelations(policy);
    expect(relations).toHaveLength(1);
    expect(relations[0]?.kind).toBe('controller_action_policy_blocked');
    expect('middleware' in policy).toBe(false);
    expect('authorization' in policy).toBe(false);
    switch (relations[0]?.kind) {
      case 'controller_action_policy_blocked':
        expect(relations[0].reasons[0]?.kind).toBe('unsupported_only_expression');
        return;
      case undefined:
      case 'controller_action_middleware_policy':
      case 'controller_action_authorization_policy':
        throw new Error('Blocked policy must remain a blocked semantic relation');
    }
  });
  it('preserves inventory-unavailable reasons in the canonical blocked relation', () => {
    const controller = createControllerName('BaseController');
    const unavailablePolicy: EffectiveControllerActionPolicy = Object.freeze({
      kind: 'effective_controller_action_policy',
      judgment: Object.freeze({
        kind: 'blocked',
        reasons: Object.freeze([Object.freeze({
          kind: 'controller_policy_inventory_unavailable',
          controllers: Object.freeze([controller]),
        })]),
      }),
      controller: createControllerName('OrderController'),
      action: createActionName('store'),
      inheritedFrom: Object.freeze([controller]),
      source: Object.freeze([source]),
    });

    const relations = controllerActionPolicyRelations(unavailablePolicy);
    expect(relations).toHaveLength(1);
    switch (relations[0]?.kind) {
      case 'controller_action_policy_blocked':
        expect(relations[0].reasons[0]?.kind).toBe('controller_policy_inventory_unavailable');
        expect(relations[0].reasons[0]?.kind === 'controller_policy_inventory_unavailable'
          ? relations[0].reasons[0].controllers
          : []).toEqual([controller]);
        return;
      case undefined:
      case 'controller_action_middleware_policy':
      case 'controller_action_authorization_policy':
        throw new Error('Inventory-unavailable policy must remain a blocked semantic relation');
    }
  });

});
