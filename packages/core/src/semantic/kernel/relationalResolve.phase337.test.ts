import { describe, expect, it } from 'vitest';
import { relationResolve } from './relationalSequence';

describe('phase 337 relational resolve', () => {
  it('evaluates the selected relation branch lazily', () => {
    const trace: string[] = [];
    const result = relationResolve(
      true,
      () => { trace.push('selected'); return 'truth'; },
      () => { trace.push('rejected'); return 'false'; },
    );
    expect(result).toBe('truth');
    expect(trace).toEqual(['selected']);
  });

  it('uses the same relation mechanism for the false witness', () => {
    const result = relationResolve(false, () => 'truth', () => 'false');
    expect(result).toBe('false');
  });
});
