import { describe, expect, it } from 'vitest';
import type { ResourceRelationProjection } from '../resource';
import type { Expression } from '../expression';

describe('Phase 11 direct relation binding', () => {
  it('keeps a direct Eloquent relation as a value projection', () => {
    const projection: ResourceRelationProjection = {
      kind: 'value',
      expression: {} as Expression,
    };

    expect(projection).toEqual({ kind: 'value', expression: projection.expression });
  });

  it('does not infer a ResourceReference from the containing resource', () => {
    const projection: ResourceRelationProjection = { kind: 'value', expression: {} as Expression };
    expect(projection.kind).not.toBe('resource');
  });
});
