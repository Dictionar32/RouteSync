import { describe, test, expect, expectTypeOf } from 'vitest';
import { ApiFieldGeneratorPass } from '../ApiFieldGeneratorPass';

describe('ApiFieldGeneratorPass Constructor TDD Specification', () => {
    test('1. Default constructor initializes cleanly without arguments', () => {
        expectTypeOf<typeof ApiFieldGeneratorPass>().toBeConstructibleWith();
        const pass = new ApiFieldGeneratorPass();
        expect(pass.name).toBe('ApiFieldGenerator');
        expect(pass.exportConstName).toBe('API_FIELDS');
    });

    test('2. Constructor with empty options object ({}) initializes defaults safely', () => {
        expectTypeOf<typeof ApiFieldGeneratorPass>().toBeConstructibleWith({});
        const pass = new ApiFieldGeneratorPass({});
        expect(pass).toBeInstanceOf(ApiFieldGeneratorPass);
        expect(pass.exportConstName).toBe('API_FIELDS');
    });

    test('3. Constructor with custom flat exportConstName sets property immutably', () => {
        const pass = new ApiFieldGeneratorPass({ exportConstName: 'CUSTOM_FIELDS' });
        expect(pass.exportConstName).toBe('CUSTOM_FIELDS');
    });
});