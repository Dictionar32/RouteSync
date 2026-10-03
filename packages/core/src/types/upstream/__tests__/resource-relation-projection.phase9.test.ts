import { describe, expect, it } from 'vitest';
import type { Expression } from '../expression';
import type { ResourceRelationProjection } from '../resource';

describe('Phase 9 resource relation projection contract', () => {
  it('models a direct Eloquent relation as a value projection', () => {
    const projection: ResourceRelationProjection = {
      kind: 'value',
      expression: {} as Expression,
    };

    expect(projection.kind).toBe('value');
  });
});
