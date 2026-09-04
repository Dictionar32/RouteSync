import { describe, test, expect, expectTypeOf } from 'vitest';
import { FormGeneratorPass } from '../FormGeneratorPass';
import { FormActionGenerator } from '../../generators/form-generation/FormActionGenerator';
import { SemanticTypeResolver } from '../../domain/common/SemanticTypeResolver';

describe('FormGeneratorPass Constructor TDD Specification', () => {
    test('1. Default constructor without arguments initializes default dependencies cleanly', () => {
        expectTypeOf<typeof FormGeneratorPass>().toBeConstructibleWith();
        const pass = new FormGeneratorPass();
        expect(pass.name).toBe('FormGenerator');
        expect(pass.descriptor.consumes).toContain('RequestTypes');
        expect(pass.descriptor.produces).toContain('GeneratedForm');
    });

    test('2. Constructor with empty options object ({}) initializes dependencies without exceptions', () => {
        expectTypeOf<typeof FormGeneratorPass>().toBeConstructibleWith({});
        const pass = new FormGeneratorPass({});
        expect(pass).toBeInstanceOf(FormGeneratorPass);
    });

    test('3. Constructor with partial dependencies injects custom resolver into default actionGenerator', () => {
        const customResolver = new SemanticTypeResolver();
        const pass = new FormGeneratorPass({ resolver: customResolver });
        expect(pass).toBeInstanceOf(FormGeneratorPass);
    });

    test('4. Constructor with full dependency injection respects supplied mock instances', () => {
        const customResolver = new SemanticTypeResolver();
        const customActionGen = new FormActionGenerator({ resolver: customResolver });
        const pass = new FormGeneratorPass({
            indentSize: 4,
            includeJsDoc: false,
            resolver: customResolver,
            actionGenerator: customActionGen
        });
        expect(pass).toBeInstanceOf(FormGeneratorPass);
        expect(pass.indentSize).toBe(4);
        expect(pass.includeJsDoc).toBe(false);
    });
});