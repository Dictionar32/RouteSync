import { strict as assert } from 'node:assert';
import { createClassName, createModelName, createRouteParameterName } from '../../../../types/upstream/names';
import { resolveRouteBindingSemantics } from '../routeBindingResolutionResolver';

describe('route binding scoping semantic elevation', () => {
  const bindings = [
    { parameter: createRouteParameterName('user'), parent: { kind: 'absent' as const }, key: { kind: 'default' as const }, withTrashed: { kind: 'disabled' as const } },
    { parameter: createRouteParameterName('post'), parent: { kind: 'present' as const, value: createRouteParameterName('user') }, key: { kind: 'custom' as const, column: { kind: 'column_name' as const, value: { kind: 'string_value' as const, value: 'slug' } } }, withTrashed: { kind: 'disabled' as const },
    },
  ];

  const actionParameters = [
    { parameter: createRouteParameterName('user'), type: createClassName('App\\Models\\User') },
    { parameter: createRouteParameterName('post'), type: createClassName('App\\Models\\Post') },
  ];

  const models = [createModelName('App\\Models\\User'), createModelName('App\\Models\\Post')];

  it('elevates Laravel custom-key nested binding into scoped semantic fact', () => {
    const resolved = resolveRouteBindingSemantics({ bindings, actionParameters, modelNames: models, bindingScope: 'default', enumNames: [] });
    assert.deepEqual(resolved[0].scoping, { kind: 'none' });
    assert.deepEqual(resolved[1].scoping, { kind: 'scoped', reason: 'custom_key' });
  });

  it('honors scopeBindings and withoutScopedBindings upstream', () => {
    const forced = resolveRouteBindingSemantics({ bindings, actionParameters, modelNames: models, bindingScope: 'scoped', enumNames: [] });
    assert.deepEqual(forced[1].scoping, { kind: 'scoped', reason: 'scope_bindings' });

    const disabled = resolveRouteBindingSemantics({ bindings, actionParameters, modelNames: models, bindingScope: 'without_scoped', enumNames: [] });
    assert.deepEqual(disabled[1].scoping, { kind: 'disabled' });
  });
});
