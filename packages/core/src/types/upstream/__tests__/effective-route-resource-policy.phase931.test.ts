import { describe, expect, it } from 'vitest';
import { resolveEffectiveControllerActionPolicyUpstream } from '../effectiveControllerActionPolicyResolver';
import { createActionName, createControllerName, createMiddlewareName } from '../names';

describe('Phase 931 effective route resource policy', () => {
  it('applies resource middleware and action-scoped exclusions to the concrete action', () => {
    const index = createActionName('index');
    const controller = createControllerName('OrderController');
    const auth = createMiddlewareName('auth');
    const verified = createMiddlewareName('verified');
    const source = { kind: 'source_span' as const, file: { kind: 'source_file' as const, value: { kind: 'string_value' as const, value: 'routes/web.php' } }, start: { kind: 'number_value' as const, value: 1 }, end: { kind: 'number_value' as const, value: 10 } };
    const result = resolveEffectiveControllerActionPolicyUpstream({
      controller,
      action: index,
      middleware: {
        declarations: [
          { middleware: { name: auth, parameters: [] }, source: { kind: 'route_group' }, scope: { kind: 'all' } },
          { middleware: { name: verified, parameters: [] }, source: { kind: 'resource' }, scope: { kind: 'only', actions: [index] } },
        ],
        exclusions: [
          { middleware: { name: auth, parameters: [] }, source: { kind: 'resource' }, scope: { kind: 'only', actions: [index] } },
        ],
        action: { kind: 'present', value: index },
      },
      policy: [],
      source: [source],
    });
    expect(result.controller).toEqual(controller);
    expect(result.action).toEqual(index);
    expect(result.middleware.map(entry => entry.middleware.name.value.value)).toEqual(['verified']);
  });
});
