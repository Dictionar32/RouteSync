import { describe, expect, it } from 'vitest';
import { controllerReturnSemanticFromValues } from './controllerAstCanonical';

describe('phase 10 controller resource cardinality', () => {
  it('retains collection semantics instead of collapsing resource returns', () => {
    const result = controllerReturnSemanticFromValues([
      {
        kind: 'resource_collection',
        resourceName: 'PostResource',
        argument: { kind: 'variable_reference', name: 'posts' },
      } as never,
    ], '<test>');

    expect(result.kind).toBe('resource');
    if (result.kind === 'resource') expect(result.cardinality).toEqual({ kind: 'collection' });
  });
});
