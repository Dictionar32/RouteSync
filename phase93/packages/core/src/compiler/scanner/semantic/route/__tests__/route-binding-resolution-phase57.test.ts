import { strict as assert } from 'node:assert';
import { createClassName, createEnumName, createModelName, createRouteParameterName } from '../../../../types/upstream/names';
import { resolveRouteBindingSemantics } from '../routeBindingResolutionResolver';

describe('route binding semantic resolution', () => {
  it('resolves implicit model binding only when action parameter and model type both match', () => {
    const bindings = [
      { parameter: createRouteParameterName('user'), parent: { kind: 'absent' as const }, key: { kind: 'default' as const }, withTrashed: { kind: 'disabled' as const } },
      { parameter: createRouteParameterName('post'), parent: { kind: 'present' as const, value: createRouteParameterName('user') }, key: { kind: 'custom' as const, column: { kind: 'column_name' as const, value: { kind: 'string_value' as const, value: 'slug' } } }, withTrashed: { kind: 'disabled' as const } },
    ];

    const resolved = resolveRouteBindingSemantics({
      bindings,
      actionParameters: [
        { parameter: createRouteParameterName('user'), type: createClassName('App\\Models\\User') },
        { parameter: createRouteParameterName('post'), type: createClassName('string') },
      ],
      modelNames: [createModelName('App\\Models\\User'), createModelName('App\\Models\\Post')],
      bindingScope: 'default',
      enumNames: [],
    });

    assert.equal(resolved[0].kind, 'implicit_model');
    assert.equal(resolved[0].model?.value.value, 'App\\Models\\User');
    assert.equal(resolved[1].kind, 'parameter');
    assert.equal(resolved[1].model, undefined);
    assert.equal(resolved[1].key.kind, 'custom');
  });

  it('resolves Laravel implicit enum binding before falling back to a plain parameter', () => {
    const bindings = [
      { parameter: createRouteParameterName('category'), parent: { kind: 'absent' as const }, key: { kind: 'default' as const }, withTrashed: { kind: 'disabled' as const } },
    ];

    const resolved = resolveRouteBindingSemantics({
      bindings,
      actionParameters: [
        { parameter: createRouteParameterName('category'), type: createClassName('App\\Enums\\Category') },
      ],
      modelNames: [],
      bindingScope: 'default',
      enumNames: [createEnumName('App\\Enums\\Category')],
    });

    assert.equal(resolved[0].kind, 'implicit_enum');
    assert.equal(resolved[0].enum?.value.value, 'App\\Enums\\Category');
    assert.equal(resolved[0].model, undefined);
    assert.deepEqual(resolved[0].scoping, { kind: 'none' });
  });
});
