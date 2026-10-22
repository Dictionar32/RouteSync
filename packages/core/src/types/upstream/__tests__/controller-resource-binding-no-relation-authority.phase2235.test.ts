import { describe, expect, it } from 'vitest';
import { createMethodName, methodNameEquals } from '../names';

describe('controller resource binding uses existing typed name authority', () => {
  it('compares method names through the existing name-domain operation', () => {
    expect(methodNameEquals(createMethodName('collection'), createMethodName('collection'))).toBe(true);
    expect(methodNameEquals(createMethodName('collection'), createMethodName('make'))).toBe(false);
  });
});
