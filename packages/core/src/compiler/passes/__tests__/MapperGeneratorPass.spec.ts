import { describe, test, expect, expectTypeOf } from 'vitest';
import { MapperGeneratorPass } from '../MapperGeneratorPass';

describe('MapperGeneratorPass Constructor TDD Specification', () => {
    test('1. Default constructor initializes cleanly without arguments', () => {
        expectTypeOf<typeof MapperGeneratorPass>().toBeConstructibleWith();
        const pass = new MapperGeneratorPass();
        expect(pass.name).toBe('MapperGenerator');
        expect(pass.descriptor.consumes).toContain('ResourceMappers');
        expect(pass.descriptor.produces).toContain('GeneratedMapper');
    });

    test('2. Constructor with empty options object ({}) initializes dependencies safely', () => {
        expectTypeOf<typeof MapperGeneratorPass>().toBeConstructibleWith({});
        const pass = new MapperGeneratorPass({});
        expect(pass).toBeInstanceOf(MapperGeneratorPass);
    });

    test('3. Constructor with custom options initializes properties cleanly', () => {
        const pass = new MapperGeneratorPass({ emitComments: false });
        expect(pass).toBeInstanceOf(MapperGeneratorPass);
        expect(pass.emitComments).toBe(false);
    });
});