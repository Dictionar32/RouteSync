import { describe, expect, it } from 'vitest';
import { relationGate } from './semanticRelations';

describe('phase339 relation gate', () => {
  it('evaluates only the selected semantic witness branch', () => {
    const trace: string[] = [];
    const value = relationGate(true, () => { trace.push('accepted'); return 'A'; }, () => { trace.push('rejected'); return 'B'; });
    expect(value).toBe('A');
    expect(trace).toEqual(['accepted']);
  });
});
