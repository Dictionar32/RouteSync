import { describe, expect, it } from 'vitest';
import type { ControllerReturnSemantic } from '../controller';
import type { Expression } from '../expression';

describe('phase 14 response cardinality contract', () => {
  it('keeps resource cardinality as an ADT across controller return semantics', () => {
    const expression = {} as Expression;
    const value: ControllerReturnSemantic = {
      kind: 'resource',
      resource: { kind: 'resource_reference', name: { kind: 'resource_name', value: { kind: 'string_value', value: 'PostResource' } } },
      model: { kind: 'model_class', name: { kind: 'model_name', value: { kind: 'string_value', value: 'Post' } } },
      cardinality: { kind: 'collection' },
      expression,
    };

    expect(value.cardinality).toEqual({ kind: 'collection' });
  });
});
