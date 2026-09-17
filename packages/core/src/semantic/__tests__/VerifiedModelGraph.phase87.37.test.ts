import { describe, expect, it } from 'vitest';
import { verifyModelGraph } from '../VerifiedModelGraph';

describe('VerifiedModelGraph', () => {
  it('normalizes scanner input once at the origin boundary', () => {
    const graph = verifyModelGraph({
      models: [{ name: 'User', fields: { id: { type: 'number', nullable: false } } }],
    });

    expect(graph.models).toHaveLength(1);
    expect(graph.models[0].name).toBe('User');
    expect(graph.models[0].columns).toEqual([
      { name: 'id', type: 'number', nullable: false },
    ]);
  });

  it('freezes the verified graph container', () => {
    const graph = verifyModelGraph({ models: [{ name: 'User' }] });
    expect(Object.isFrozen(graph)).toBe(true);
    expect(Object.isFrozen(graph.models)).toBe(true);
  });
});
