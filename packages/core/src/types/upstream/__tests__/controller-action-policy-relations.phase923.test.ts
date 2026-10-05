import { describe, expect, it } from 'vitest';
import { controllerActionPolicyRelations } from '../controllerActionPolicyRelations';
import type { EffectiveControllerActionPolicy } from '../effectiveControllerActionPolicy';
import { createActionName, createControllerName } from '../names';
import { createMiddlewareName } from '../names';

const source = {
  kind: 'source_span' as const,
  file: { kind: 'source_file' as const, value: { kind: 'string_value' as const, value: '<phase923>' } },
  start: { kind: 'number_value' as const, value: 0 },
  end: { kind: 'number_value' as const, value: 1 },
};

describe('Phase 923 controller action policy relations', () => {
  it('projects closed effective policy into semantic relations without dataflow facts', () => {
    const policy: EffectiveControllerActionPolicy = {
      kind: 'effective_controller_action_policy',
      controller: createControllerName('OrderController'),
      action: createActionName('store'),
      middleware: [{
        middleware: { name: createMiddlewareName('auth'), parameters: [] },
        source: { kind: 'controller_method' },
        scope: { kind: 'all' },
      }],
      authorization: [{
        kind: 'controller_authorization_relation',
        scope: { kind: 'method' },
        actions: { kind: 'only', actions: [createActionName('store')] },
        arguments: { kind: 'expression_arguments', items: { kind: 'empty' } },
        source,
      }],
      inheritedFrom: [],
      source: [source],
    };

    const relations = controllerActionPolicyRelations(policy);

    expect(relations.map(relation => relation.kind)).toEqual([
      'controller_action_middleware_policy',
      'controller_action_authorization_policy',
    ]);
    expect(relations[0]?.kind === 'controller_action_middleware_policy' && relations[0].middleware.name.value.value).toBe('auth');
    expect(relations[1]?.kind === 'controller_action_authorization_policy' && relations[1].action.value.value).toBe('store');
  });
});
