import { strict as assert } from 'node:assert';
import { extractRouteBindingFactsFromAst } from '../routeBindingAstAdapter';
import { resolveRouteBindingFacts } from '../routeBindingSemanticResolver';

describe('phase 75 Laravel withTrashed semantic elevation', () => {
  it('preserves withTrashed as an AST fact and elevates it into the binding ADT', () => {
    const facts = extractRouteBindingFactsFromAst({
      withTrashed: { kind: 'enabled' as const },
      bindings: [{ parameter: 'post', customKey: 'slug' }],
    } as any);

    assert.deepEqual(facts[0].withTrashed, { kind: 'present' });

    const bindings = resolveRouteBindingFacts(facts);
    assert.deepEqual(bindings[0].withTrashed, { kind: 'enabled' });
    assert.equal(bindings[0].key.kind, 'custom');
  });

  it('does not enable withTrashed for ordinary implicit binding', () => {
    const facts = extractRouteBindingFactsFromAst({
      withTrashed: { kind: 'disabled' as const },
      bindings: [{ parameter: 'post', customKey: undefined }],
    } as any);

    const bindings = resolveRouteBindingFacts(facts);
    assert.deepEqual(bindings[0].withTrashed, { kind: 'disabled' });
  });
});


describe('phase 76 binding semantic gating', () => {
  it('does not expose withTrashed on a plain route parameter', () => {
    const bindings = resolveRouteBindingSemantics({
      bindings: [{ parameter: { kind: 'route_parameter_name', value: { kind: 'string_value', value: 'post' } }, key: { kind: 'default' }, withTrashed: { kind: 'enabled' as const } }],
      actionParameters: [{ parameter: { kind: 'route_parameter_name', value: { kind: 'string_value', value: 'post' } }, type: { kind: 'absent' } }],
      modelNames: [],
      bindingScope: 'default',
      enumNames: [],
    });
    assert.equal(bindings[0].kind, 'parameter');
    assert.deepEqual(bindings[0].withTrashed, { kind: 'disabled' });
  });

  it('does not expose withTrashed on implicit enum binding', () => {
    const bindings = resolveRouteBindingSemantics({
      bindings: [{ parameter: { kind: 'route_parameter_name', value: { kind: 'string_value', value: 'category' } }, key: { kind: 'default' }, withTrashed: { kind: 'enabled' as const } }],
      actionParameters: [{ parameter: { kind: 'route_parameter_name', value: { kind: 'string_value', value: 'category' } }, type: { kind: 'class_name', value: { kind: 'string_value', value: 'App\\Enums\\Category' } } }],
      modelNames: [],
      bindingScope: 'default',
      enumNames: [{ kind: 'enum_name', value: { kind: 'string_value', value: 'App\\Enums\\Category' } }],
    });
    assert.equal(bindings[0].kind, 'implicit_enum');
    assert.deepEqual(bindings[0].withTrashed, { kind: 'disabled' });
  });
});
