/**
 * ContractCodeBuilder Tests
 * 
 * Test Coverage:
 * 1. Builds 4 sections correctly
 * 2. Handles empty contracts
 * 3. Handles single contract
 * 4. Handles multiple contracts
 * 5. Handles multiple actions per contract
 * 6. Proper section ordering
 * 7. Proper imports
 * 8. Section line ranges tracked
 * 9. Comment headers present
 * 10. Valid TypeScript syntax
 */

import { describe, test, expect } from 'vitest';
import { ContractCodeBuilder } from '../ContractCodeBuilder';
import type { GeneratedContract, GeneratedContractAction } from '../ContractActionGenerator';

describe('ContractCodeBuilder', () => {
    /**
     * Test 1: Builds 4 sections correctly
     */
    test('should build 4 sections (schemas, types, validators, exports)', () => {
        const builder = new ContractCodeBuilder();

        const mockAction: GeneratedContractAction = {
            name: 'create',
            schemaLines: [
                '  create: z.object({',
                '    name: z.string()',
                '  })'
            ],
            typeLines: [
                '  create: {',
                '    name: string',
                '  }'
            ],
            fieldCount: 1
        };

        const contracts: GeneratedContract[] = [{
            resourceName: 'Register',
            actions: [mockAction]
        }];

        const result = builder.buildContractFile(contracts);

        // Should have 4 sections
        expect(result.sections).toHaveLength(4);
        expect(result.sections[0].name).toBe('schemas');
        expect(result.sections[1].name).toBe('types');
        expect(result.sections[2].name).toBe('validators');
        expect(result.sections[3].name).toBe('exports');

        // Code should contain all sections
        expect(result.code).toContain('// ========== SECTION 1: Zod Schemas ==========');
        expect(result.code).toContain('// ========== SECTION 2: Inferred Types ==========');
        expect(result.code).toContain('// ========== SECTION 3: Validators ==========');
        expect(result.code).toContain('// ========== SECTION 4: Exports ==========');
    });

    /**
     * Test 2: Handles empty contracts
     */
    test('should handle empty contracts gracefully', () => {
        const builder = new ContractCodeBuilder();

        const result = builder.buildContractFile([]);

        expect(result.contractCount).toBe(0);
        expect(result.sections).toHaveLength(4);

        // Should have placeholder comments
        expect(result.code).toContain('// No contracts generated');
        expect(result.code).toContain('// No types generated');
        expect(result.code).toContain('// No validators generated');
        expect(result.code).toContain('// No exports generated');
    });

    /**
     * Test 3: Handles single contract
     */
    test('should handle single contract with single action', () => {
        const builder = new ContractCodeBuilder();

        const mockAction: GeneratedContractAction = {
            name: 'create',
            schemaLines: [
                '  create: z.object({',
                '    email: z.string()',
                '    password: z.string()',
                '  })'
            ],
            typeLines: [
                '  create: {',
                '    email: string',
                '    password: string',
                '  }'
            ],
            fieldCount: 2
        };

        const contracts: GeneratedContract[] = [{
            resourceName: 'Login',
            actions: [mockAction]
        }];

        const result = builder.buildContractFile(contracts);

        expect(result.contractCount).toBe(1);

        // Should contain schema
        expect(result.code).toContain('export const LoginContractSchema = {');
        expect(result.code).toContain('create: z.object({');
        expect(result.code).toContain('email: z.string()');
        expect(result.code).toContain('password: z.string()');

        // Should contain type
        expect(result.code).toContain('export type LoginContract = {');
        expect(result.code).toContain('create: z.infer<typeof LoginContractSchema.create>');

        // Should contain validator
        expect(result.code).toContain('export const validateLoginCreate = (data: unknown) => {');
        expect(result.code).toContain('return LoginContractSchema.create.parse(data);');

        // Should contain export
        expect(result.code).toContain('export const ContractSchemas = {');
        expect(result.code).toContain('Login: LoginContractSchema');
    });

    /**
     * Test 4: Handles multiple contracts
     */
    test('should handle multiple contracts', () => {
        const builder = new ContractCodeBuilder();

        const createAction: GeneratedContractAction = {
            name: 'create',
            schemaLines: [
                '  create: z.object({',
                '    name: z.string()',
                '  })'
            ],
            typeLines: [
                '  create: {',
                '    name: string',
                '  }'
            ],
            fieldCount: 1
        };

        const loginAction: GeneratedContractAction = {
            name: 'create',
            schemaLines: [
                '  create: z.object({',
                '    email: z.string()',
                '  })'
            ],
            typeLines: [
                '  create: {',
                '    email: string',
                '  }'
            ],
            fieldCount: 1
        };

        const contracts: GeneratedContract[] = [
            { resourceName: 'Register', actions: [createAction] },
            { resourceName: 'Login', actions: [loginAction] }
        ];

        const result = builder.buildContractFile(contracts);

        expect(result.contractCount).toBe(2);

        // Should contain both contracts
        expect(result.code).toContain('RegisterContractSchema');
        expect(result.code).toContain('LoginContractSchema');

        // Should contain both types
        expect(result.code).toContain('RegisterContract');
        expect(result.code).toContain('LoginContract');

        // Should contain both validators
        expect(result.code).toContain('validateRegisterCreate');
        expect(result.code).toContain('validateLoginCreate');

        // Should contain both exports
        expect(result.code).toContain('Register: RegisterContractSchema');
        expect(result.code).toContain('Login: LoginContractSchema');
    });

    /**
     * Test 5: Handles multiple actions per contract
     */
    test('should handle multiple actions per contract', () => {
        const builder = new ContractCodeBuilder();

        const createAction: GeneratedContractAction = {
            name: 'create',
            schemaLines: [
                '  create: z.object({',
                '    shipping_nama: z.string()',
                '  })'
            ],
            typeLines: [
                '  create: {',
                '    shipping_nama: string',
                '  }'
            ],
            fieldCount: 1
        };

        const updateAction: GeneratedContractAction = {
            name: 'update',
            schemaLines: [
                '  update: z.object({',
                '    status: z.string().optional()',
                '  })'
            ],
            typeLines: [
                '  update: {',
                '    status: string | undefined',
                '  }'
            ],
            fieldCount: 1
        };

        const contracts: GeneratedContract[] = [{
            resourceName: 'Order',
            actions: [createAction, updateAction]
        }];

        const result = builder.buildContractFile(contracts);

        // Should contain both actions in schema
        expect(result.code).toContain('create: z.object({');
        expect(result.code).toContain('update: z.object({');

        // Should contain both actions in type
        expect(result.code).toContain('create: z.infer<typeof OrderContractSchema.create>');
        expect(result.code).toContain('update: z.infer<typeof OrderContractSchema.update>');

        // Should contain both validators
        expect(result.code).toContain('validateOrderCreate');
        expect(result.code).toContain('validateOrderUpdate');
    });

    /**
     * Test 6: Proper section ordering
     */
    test('should maintain proper section ordering', () => {
        const builder = new ContractCodeBuilder();

        const mockAction: GeneratedContractAction = {
            name: 'create',
            schemaLines: [
                '  create: z.object({',
                '    field: z.string()',
                '  })'
            ],
            typeLines: [
                '  create: {',
                '    field: string',
                '  }'
            ],
            fieldCount: 1
        };

        const contracts: GeneratedContract[] = [{
            resourceName: 'Test',
            actions: [mockAction]
        }];

        const result = builder.buildContractFile(contracts);

        // Section 1 should come before Section 2
        const section1Index = result.code.indexOf('SECTION 1: Zod Schemas');
        const section2Index = result.code.indexOf('SECTION 2: Inferred Types');
        const section3Index = result.code.indexOf('SECTION 3: Validators');
        const section4Index = result.code.indexOf('SECTION 4: Exports');

        expect(section1Index).toBeLessThan(section2Index);
        expect(section2Index).toBeLessThan(section3Index);
        expect(section3Index).toBeLessThan(section4Index);
    });

    /**
     * Test 7: Proper imports
     */
    test('should include proper imports at top', () => {
        const builder = new ContractCodeBuilder();

        const mockAction: GeneratedContractAction = {
            name: 'create',
            schemaLines: [
                '  create: z.object({',
                '    field: z.string()',
                '  })'
            ],
            typeLines: [
                '  create: {',
                '    field: string',
                '  }'
            ],
            fieldCount: 1
        };

        const contracts: GeneratedContract[] = [{
            resourceName: 'Test',
            actions: [mockAction]
        }];

        const result = builder.buildContractFile(contracts);

        // Should start with header comment + imports
        expect(result.code).toMatch(/^\/\*\*[\s\S]*Runtime contract validation/);
        expect(result.code).toContain("import { z } from 'zod';");

        // Import should come before first section
        const importIndex = result.code.indexOf("import { z } from 'zod';");
        const firstSectionIndex = result.code.indexOf('SECTION 1');
        expect(importIndex).toBeLessThan(firstSectionIndex);
    });

    /**
     * Test 8: Section line ranges tracked
     */
    test('should track section line ranges correctly', () => {
        const builder = new ContractCodeBuilder();

        const mockAction: GeneratedContractAction = {
            name: 'create',
            schemaLines: [
                '  create: z.object({',
                '    field: z.string()',
                '  })'
            ],
            typeLines: [
                '  create: {',
                '    field: string',
                '  }'
            ],
            fieldCount: 1
        };

        const contracts: GeneratedContract[] = [{
            resourceName: 'Test',
            actions: [mockAction]
        }];

        const result = builder.buildContractFile(contracts);

        // All sections should have valid ranges
        for (const section of result.sections) {
            expect(section.startLine).toBeGreaterThan(0);
            expect(section.endLine).toBeGreaterThanOrEqual(section.startLine);
        }

        // Sections should not overlap
        for (let i = 0; i < result.sections.length - 1; i++) {
            const current = result.sections[i];
            const next = result.sections[i + 1];
            expect(current.endLine).toBeLessThan(next.startLine);
        }
    });

    /**
     * Test 9: Comment headers present
     */
    test('should include section comment headers', () => {
        const builder = new ContractCodeBuilder();

        const mockAction: GeneratedContractAction = {
            name: 'create',
            schemaLines: [
                '  create: z.object({',
                '    field: z.string()',
                '  })'
            ],
            typeLines: [
                '  create: {',
                '    field: string',
                '  }'
            ],
            fieldCount: 1
        };

        const contracts: GeneratedContract[] = [{
            resourceName: 'Test',
            actions: [mockAction]
        }];

        const result = builder.buildContractFile(contracts);

        // All section headers should be present
        expect(result.code).toContain('// ========== SECTION 1: Zod Schemas ==========');
        expect(result.code).toContain('// ========== SECTION 2: Inferred Types ==========');
        expect(result.code).toContain('// ========== SECTION 3: Validators ==========');
        expect(result.code).toContain('// ========== SECTION 4: Exports ==========');

        // File header should be present
        expect(result.code).toContain('Runtime contract validation schemas');
        expect(result.code).toContain('Generated by ContractGeneratorPass');
    });

    /**
     * Test 10: Valid TypeScript syntax
     */
    test('should generate syntactically valid TypeScript', () => {
        const builder = new ContractCodeBuilder();

        const mockAction: GeneratedContractAction = {
            name: 'create',
            schemaLines: [
                '  create: z.object({',
                '    name: z.string(),',
                '    email: z.string()',
                '  })'
            ],
            typeLines: [
                '  create: {',
                '    name: string',
                '    email: string',
                '  }'
            ],
            fieldCount: 2
        };

        const contracts: GeneratedContract[] = [{
            resourceName: 'Register',
            actions: [mockAction]
        }];

        const result = builder.buildContractFile(contracts);

        // Should have valid export statements
        expect(result.code).toMatch(/export const \w+ContractSchema = \{/);
        expect(result.code).toMatch(/export type \w+Contract = \{/);
        expect(result.code).toMatch(/export const validate\w+ = \(data: unknown\) => \{/);
        expect(result.code).toMatch(/export const ContractSchemas = \{/);

        // Should have proper object/block structure
        expect(result.code).not.toContain('{{'); // No double braces
        expect(result.code).not.toContain('}}'); // No double braces

        // Should have matching braces (count should be equal)
        const openBraces = (result.code.match(/\{/g) || []).length;
        const closeBraces = (result.code.match(/\}/g) || []).length;
        expect(openBraces).toBe(closeBraces);
    });
});
