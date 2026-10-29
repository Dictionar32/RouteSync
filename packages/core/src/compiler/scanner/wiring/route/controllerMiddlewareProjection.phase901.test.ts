import { describe, expect, it } from 'vitest';
import { controllerMiddlewareProjectionOperations } from './controllerMiddlewareProjection';
import type { ControllerMiddlewareRelation } from '../../../../types/upstream/controller';
import { createMiddlewareName, sourceFileIdentityFactory, stringValue } from '../../../../types/upstream/names';
import type { Sequence } from '../../../../types/upstream/collections';

const sequence = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });

const named = (name: string, exclusion = false, actions: ControllerMiddlewareRelation['actions'] = { kind: 'all' }): ControllerMiddlewareRelation => ({
  kind: 'controller_middleware_relation' as const,
  middleware: createMiddlewareName(name),
  origin: { kind: 'has_middleware' as const },
  scope: { kind: 'method' as const },
  actions,
  exclusion,
  source: { kind: 'source_span' as const, file: sourceFileIdentityFactory.create(stringValue.create('<test>')), start: { value: 0 }, end: { value: 1 } },
});

describe('Phase 901 controller middleware projection', () => {
  it('projects named declarations and exclusions with action scope', () => {
    const projection = controllerMiddlewareProjectionOperations.project(sequence([
      named('auth'),
      named('log', false, { kind: 'only', actions: sequence([{ kind: 'action_name', value: { kind: 'string_value', value: 'show' } }]) }),
      named('subscribed', true, { kind: 'except', actions: sequence([{ kind: 'action_name', value: { kind: 'string_value', value: 'store' } }]) }),
    ]));
    expect(projection.declarations.map(value => value.middleware.name.value.value)).toEqual(['auth', 'log']);
    expect(projection.declarations[1]?.scope.kind).toBe('only');
    expect(projection.exclusions.map(value => value.middleware.name.value.value)).toEqual(['subscribed']);
    expect(projection.exclusions[0]?.scope.kind).toBe('except');
  });

  it('does not coerce expression middleware into a named route middleware', () => {
    const projection = controllerMiddlewareProjectionOperations.project(sequence([{
      ...named('auth'),
      middleware: { kind: 'variable', name: { kind: 'variable_name', value: 'middleware' } } as never,
    }]));
    expect(projection.declarations).toHaveLength(0);
  });
});
