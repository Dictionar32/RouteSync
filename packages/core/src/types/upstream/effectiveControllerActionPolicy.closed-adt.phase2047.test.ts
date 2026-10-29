import { describe, expect, it } from 'vitest';
import { effectiveControllerActionPolicyUpstreamOperations } from './effectiveControllerActionPolicyResolver';
import { controllerActionPolicyRelations } from './controllerActionPolicyRelations';
import { createActionName, createControllerName, createMiddlewareName, stringValue } from './names';

describe('Phase 2047 effective controller-action policy closed ADT', () => {
  it('does not expose partial middleware or authorization products when judgment is blocked', () => {
    const action = createActionName('store');
    const source = Object.freeze({
      kind: 'source_span' as const,
      file: Object.freeze({ kind: 'source_file' as const, value: stringValue.create('Controller.php') }),
      start: Object.freeze({ kind: 'number_value' as const, value: 0 }),
      end: Object.freeze({ kind: 'number_value' as const, value: 1 }),
    });
    const blockedReason = Object.freeze({ kind: 'unsupported_only_expression' as const, argument: Object.freeze({
      kind: 'named' as const,
      name: Object.freeze({ kind: 'expression_argument_name' as const, value: stringValue.create('only') }),
      value: Object.freeze({
        kind: 'variable' as const,
        name: Object.freeze({ kind: 'variable_name' as const, value: stringValue.create('methods') }),
        source,
      }),
    }) });
    const policy = effectiveControllerActionPolicyUpstreamOperations.resolve({
      controller: createControllerName('OrderController'),
      action,
      middleware: {
        declarations: [{
          middleware: { kind: 'named' as const, name: createMiddlewareName('auth'), parameters: [] },
          source: { kind: 'route_group' as const },
          scope: { kind: 'blocked' as const, reason: blockedReason },
        }],
        exclusions: [],
        action: { kind: 'present' as const, value: action },
      },
      policy: [],
      policyCatalog: { kind: 'complete', entries: [] },
      inheritedFrom: [],
      source: [source],
    });

    expect(policy.judgment.kind).toBe('blocked');
    expect('middleware' in policy).toBe(false);
    expect('authorization' in policy).toBe(false);
    expect(controllerActionPolicyRelations(policy).map(relation => relation.kind)).toEqual([
      'controller_action_policy_blocked',
    ]);
  });

  it('exposes middleware and authorization only for a complete judgment', () => {
    const action = createActionName('index');
    const policy = effectiveControllerActionPolicyUpstreamOperations.resolve({
      controller: createControllerName('OrderController'),
      action,
      middleware: {
        declarations: [{
          middleware: { kind: 'named' as const, name: createMiddlewareName('auth'), parameters: [] },
          source: { kind: 'route_group' as const },
          scope: { kind: 'all' as const },
        }],
        exclusions: [],
        action: { kind: 'present' as const, value: action },
      },
      policy: [],
      policyCatalog: { kind: 'complete', entries: [] },
      inheritedFrom: [],
      source: [],
    });

    expect(policy.judgment.kind).toBe('complete');
    if (policy.judgment.kind === 'complete') {
      expect(policy.middleware).toHaveLength(1);
      expect(policy.authorization).toHaveLength(0);
    }
  });
});
