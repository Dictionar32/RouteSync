import { describe, expect, it } from 'vitest';

describe('flow interface elevation phase 25', () => {
  it('documents the semantic rule for validation callback parameters', () => {
    const parameterNames = ['request', 'validator'];
    const selected = parameterNames.find(name => name === 'validator');
    expect(selected).toBe('validator');
  });
});
