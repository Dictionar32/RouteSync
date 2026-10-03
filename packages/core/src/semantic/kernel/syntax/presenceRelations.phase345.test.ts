import { absent, present, presenceFold, presenceProject } from './presenceRelations';

describe('Phase 345 Presence relations', () => {
  it('derives present values without a sentinel', () => {
    expect(presenceFold(present(7), () => 0, value => value)).toBe(7);
    expect(presenceFold(absent<number>(), () => 0, value => value)).toBe(0);
  });

  it('projects relation witnesses', () => {
    expect(presenceFold(presenceProject(present('x'), value => value.length), () => 0, value => value)).toBe(1);
    expect(presenceFold(presenceProject(absent<string>(), value => value.length), () => 0, value => value)).toBe(0);
  });
});
