import { strict as assert } from 'node:assert';
import { createClassName, createModelName, createRouteParameterName } from '../../../../types/upstream/names';
import { resolveRouteBindingSemantics } from '../routeBindingResolutionResolver';
import { extractRouteBindingFactsFromAst } from '../routeBindingAstAdapter';

describe('phase 90 identity catalog relation resolution', () => {

  it('extracts parent binding as an explicit relation from route nesting', () => {
    const facts = extractRouteBindingFactsFromAst({
      path: '/users/{user}/posts/{post:slug}',
      withTrashed: false,
      bindings: [
        { parameter: 'user' },
        { parameter: 'post', customKey: 'slug' },
      ],
    } as any);
    assert.deepEqual(facts[0].parent, { kind: 'absent' });
    assert.deepEqual(facts[1].parent, { kind: 'present', value: createRouteParameterName('user') });
  });

  it('is invariant under catalog reordering and uses the explicit parent relation', () => {
    const bindings = [
      { parameter: createRouteParameterName('post'), parent: { kind: 'present' as const, value: createRouteParameterName('user') }, key: { kind: 'custom' as const, column: { kind: 'column_name' as const, value: { kind: 'string_value' as const, value: 'slug' } } }, withTrashed: { kind: 'disabled' as const } },
      { parameter: createRouteParameterName('user'), parent: { kind: 'absent' as const }, key: { kind: 'default' as const }, withTrashed: { kind: 'disabled' as const } },
    ];
    const actionParameters = [
      { parameter: createRouteParameterName('post'), type: createClassName('App\\Models\\Post') },
      { parameter: createRouteParameterName('user'), type: createClassName('App\\Models\\User') },
    ];
    const forward = resolveRouteBindingSemantics({ bindings, actionParameters, modelNames: [createModelName('App\\Models\\Post'), createModelName('App\\Models\\User')], bindingScope: 'default', enumNames: [] });
    const reversed = resolveRouteBindingSemantics({ bindings, actionParameters: [...actionParameters].reverse(), modelNames: [createModelName('App\\Models\\User'), createModelName('App\\Models\\Post')], bindingScope: 'default', enumNames: [] });
    assert.deepEqual(forward.map(item => [item.parameter.value.value, item.kind, item.scoping.kind]), reversed.map(item => [item.parameter.value.value, item.kind, item.scoping.kind]));
    assert.deepEqual(forward[0].scoping, { kind: 'scoped', reason: 'custom_key' });
  });
});
