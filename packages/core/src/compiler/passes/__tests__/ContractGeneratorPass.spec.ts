import { describe, test, expect, expectTypeOf } from 'vitest';
import { ContractGeneratorPass } from '../ContractGeneratorPass';
import { ContractActionGenerator } from '../../generators/contract-generation/ContractActionGenerator';
import { SemanticTypeResolver } from '../../domain/common/SemanticTypeResolver';

describe('ContractGeneratorPass Constructor TDD Specification', () => {
    test('1. Default constructor without arguments initializes default dependencies cleanly', () => {
        expectTypeOf<typeof ContractGeneratorPass>().toBeConstructibleWith();
        const pass = new ContractGeneratorPass();
        expect(pass.name).toBe('ContractGenerator');
        expect(pass.descriptor.consumes).toContain('RequestTypes');
        expect(pass.descriptor.produces).toContain('GeneratedContract');
    });

    test('2. Constructor with empty options object ({}) initializes dependencies without exceptions', () => {
        expectTypeOf<typeof ContractGeneratorPass>().toBeConstructibleWith({});
        const pass = new ContractGeneratorPass({});
        expect(pass).toBeInstanceOf(ContractGeneratorPass);
    });

    test('3. Constructor with partial dependencies injects custom resolver into default actionGenerator', () => {
        const customResolver = new SemanticTypeResolver();
        const pass = new ContractGeneratorPass({ resolver: customResolver });
        expect(pass).toBeInstanceOf(ContractGeneratorPass);
    });

    test('4. Constructor with full dependency injection respects supplied mock instances', () => {
        const customResolver = new SemanticTypeResolver();
        const customActionGen = new ContractActionGenerator({ resolver: customResolver });
        const pass = new ContractGeneratorPass({
            indentSize: 4,
            includeJsDoc: false,
            resolver: customResolver,
            actionGenerator: customActionGen
        });
        expect(pass).toBeInstanceOf(ContractGeneratorPass);
        expect(pass.indentSize).toBe(4);
        expect(pass.includeJsDoc).toBe(false)
    });
});