import { describe, expect, it } from 'vitest';
import type { Lookup } from '../collections';
import type { ModelName } from '../names';

describe('controller response model origin contract phase 8', () => {
  it('uses Lookup for model-origin resolution so absence is not undefined', () => {
    const missing: Lookup<{ readonly model: ModelName }> = { kind: 'missing' };
    const found: Lookup<{ readonly model: ModelName }> = {
      kind: 'found',
      value: { model: { kind: 'model_name', value: { kind: 'string_value', value: 'Post' } } }
    };

    expect(missing.kind).toBe('missing');
    expect(found.kind).toBe('found');
  });
});
