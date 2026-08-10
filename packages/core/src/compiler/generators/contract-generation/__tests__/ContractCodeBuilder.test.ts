/**
 * ContractCodeBuilder Tests
 * 
 * Tests for bug fixes:
 * - Bug #1 & #2: Unique validator function names
 * - Bug #3: Correct schema references in exports
 * - Bug #4: Index schema reuses show schema
 */

import { describe, test, expect } from 'vitest';
import { ContractCodeBuilder } from '../ContractCodeBuilder';
import type { GeneratedContract, ResponseSchema } from '../ContractCodeBuilder';

describe('ContractCodeBuilder', () => {
    describe('Bug #1 & #2: Unique validator function names', () => {
        test('should generate unique validateSchema names for each resource', () => {
            const schemas: ResponseSchema[] = [
                {
                    schemaName: 'produkItemResourceShowSchema',
                    zodSchema: 'z.object({ id: z.number() })',
                    action: 'show',
                    resourceName: 'produkItemResource'
                },
                {
                    schemaName: 'orderResourceShowSchema',
                    zodSchema: 'z.object({ id: z.number() })',
                    action: 'show',
                    resourceName: 'orderResource'
                }
            ];

            const builder = new ContractCodeBuilder();
            const result = builder.buildContractFile([], schemas);

            // Should NOT have duplicate validateSchema
            const validateSchemaCount = (result.code.match(/export const validateSchema =/g) || []).length;
            expect(validateSchemaCount).toBe(0); // Should be 0 (all have resource prefix)

            // Should have unique names with resource prefix
            expect(result.code).toContain('export const validateProdukItemResourceSchema =');
            expect(result.code).toContain('export const validateOrderResourceSchema =');
        });

        test('should generate unique validateIndex names for each resource', () => {
            const schemas: ResponseSchema[] = [
                {
                    schemaName: 'produkItemResourceShowSchema',
                    zodSchema: 'z.object({ id: z.number() })',
                    action: 'show',
                    resourceName: 'produkItemResource'
                },
                {
                    schemaName: 'produkItemResourceIndexSchema',
                    zodSchema: 'z.array(z.object({ id: z.number() }))',
                    action: 'index',
                    resourceName: 'produkItemResource'
                },
                {
                    schemaName: 'orderResourceShowSchema',
                    zodSchema: 'z.object({ id: z.number() })',
                    action: 'show',
                    resourceName: 'orderResource'
                },
                {
                    schemaName: 'orderResourceIndexSchema',
                    zodSchema: 'z.array(z.object({ id: z.number() }))',
                    action: 'index',
                    resourceName: 'orderResource'
                }
            ];

            const builder = new ContractCodeBuilder();
            const result = builder.buildContractFile([], schemas);

            // Should NOT have duplicate validateIndex
            const validateIndexCount = (result.code.match(/export const validateIndex =/g) || []).length;
            expect(validateIndexCount).toBe(0); // Should be 0 (all have resource prefix)

            // Should have unique names with resource prefix
            expect(result.code).toContain('export const validateProdukItemResourceIndex =');
            expect(result.code).toContain('export const validateOrderResourceIndex =');
        });
    });

    describe('Bug #3: Correct schema references in exports', () => {
        test('should use actual schema names in exports object', () => {
            const schemas: ResponseSchema[] = [
                {
                    schemaName: 'orderShowSchema',
                    zodSchema: 'z.object({ id: z.number() })',
                    action: 'show',
                    resourceName: 'order'
                },
                {
                    schemaName: 'orderIndexSchema',
                    zodSchema: 'z.array(z.object({ id: z.number() }))',
                    action: 'index',
                    resourceName: 'order'
                }
            ];

            const builder = new ContractCodeBuilder();
            const result = builder.buildContractFile([], schemas);

            // Should NOT use undefined shorthand
            expect(result.code).not.toContain('{ Schema, IndexSchema }');

            // Should use full object syntax with actual names
            expect(result.code).toContain('Schema: orderShowSchema');
            expect(result.code).toContain('IndexSchema: orderIndexSchema');
        });

        test('should handle missing show schema gracefully', () => {
            const schemasOnlyIndex: ResponseSchema[] = [
                {
                    schemaName: 'orderIndexSchema',
                    zodSchema: 'z.array(z.object({ id: z.number() }))',
                    action: 'index',
                    resourceName: 'order'
                }
            ];

            const builder = new ContractCodeBuilder();
            const result = builder.buildContractFile([], schemasOnlyIndex);

            // Should only export IndexSchema (no Schema)
            expect(result.code).toContain('IndexSchema: orderIndexSchema');
            expect(result.code).not.toContain('Schema: undefined');
        });

        test('should handle missing index schema gracefully', () => {
            const schemasOnlyShow: ResponseSchema[] = [
                {
                    schemaName: 'orderShowSchema',
                    zodSchema: 'z.object({ id: z.number() })',
                    action: 'show',
                    resourceName: 'order'
                }
            ];

            const builder = new ContractCodeBuilder();
            const result = builder.buildContractFile([], schemasOnlyShow);

            // Should only export Schema (no IndexSchema)
            expect(result.code).toContain('Schema: orderShowSchema');
            expect(result.code).not.toContain('IndexSchema: undefined');
        });
    });

    describe('Bug #4: Index schema reuses show schema', () => {
        test('should reference show schema instead of duplicating', () => {
            const schemas: ResponseSchema[] = [
                {
                    schemaName: 'orderShowSchema',
                    zodSchema: 'z.object({ id: z.number(), name: z.string() })',
                    action: 'show',
                    resourceName: 'order'
                },
                {
                    schemaName: 'orderIndexSchema',
                    zodSchema: 'z.array(orderShowSchema)', // ✅ Correct: already references show schema
                    action: 'index',
                    resourceName: 'order'
                }
            ];

            const builder = new ContractCodeBuilder();
            const result = builder.buildContractFile([], schemas);

            // Should NOT duplicate field definitions
            const duplicateObjectCount = (result.code.match(/z\.array\(z\.object\(/g) || []).length;
            expect(duplicateObjectCount).toBe(0);

            // Should reference show schema
            expect(result.code).toContain('export const orderIndexSchema = z.array(orderShowSchema);');
        });

        test('should fallback to inline schema when show schema missing', () => {
            const schemas: ResponseSchema[] = [
                {
                    schemaName: 'orderIndexSchema',
                    zodSchema: 'z.array(z.object({ id: z.number() }))',
                    action: 'index',
                    resourceName: 'order'
                }
            ];

            const builder = new ContractCodeBuilder();
            const result = builder.buildContractFile([], schemas);

            // Should use inline schema (no show to reference)
            expect(result.code).toContain('z.array(z.object({');
        });

        test('should reduce file size significantly', () => {
            // Simulate resource with 11 fields (like ProdukItemResource)
            const fields = Array.from({ length: 11 }, (_, i) => `field${i}: z.string()`).join(', ');
            const showZodSchema = `z.object({ ${fields} })`;
            const indexZodSchema = `z.array(z.object({ ${fields} }))`; // Duplicate

            const schemas: ResponseSchema[] = [
                {
                    schemaName: 'produkShowSchema',
                    zodSchema: showZodSchema,
                    action: 'show',
                    resourceName: 'produk'
                },
                {
                    schemaName: 'produkIndexSchema',
                    zodSchema: indexZodSchema,
                    action: 'index',
                    resourceName: 'produk'
                }
            ];

            const builder = new ContractCodeBuilder();
            const result = builder.buildContractFile([], schemas);

            // With fix: should reference show schema
            expect(result.code).toContain('z.array(produkShowSchema)');

            // Should NOT contain duplicate z.array(z.object({ with all fields
            const codeLines = result.code.split('\n');
            const schemasSection = codeLines.filter(line =>
                line.includes('produkShowSchema') || line.includes('produkIndexSchema')
            );

            // Index schema line should be short (just a reference)
            const indexSchemaLine = schemasSection.find(line => line.includes('produkIndexSchema'));
            expect(indexSchemaLine).toBeDefined();
            expect(indexSchemaLine!.length).toBeLessThan(100); // Short reference, not full definition
        });
    });

    describe('Integration: All fixes together', () => {
        test('should generate valid TypeScript code with all fixes', () => {
            const schemas: ResponseSchema[] = [
                {
                    schemaName: 'produkItemResourceShowSchema',
                    zodSchema: 'z.object({ id: z.number(), nama: z.string() })',
                    action: 'show',
                    resourceName: 'produkItemResource'
                },
                {
                    schemaName: 'produkItemResourceIndexSchema',
                    zodSchema: 'z.array(z.object({ id: z.number(), nama: z.string() }))',
                    action: 'index',
                    resourceName: 'produkItemResource'
                },
                {
                    schemaName: 'orderResourceShowSchema',
                    zodSchema: 'z.object({ id: z.number(), total: z.number() })',
                    action: 'show',
                    resourceName: 'orderResource'
                },
                {
                    schemaName: 'orderResourceIndexSchema',
                    zodSchema: 'z.array(z.object({ id: z.number(), total: z.number() }))',
                    action: 'index',
                    resourceName: 'orderResource'
                }
            ];

            const builder = new ContractCodeBuilder();
            const result = builder.buildContractFile([], schemas);

            // No duplicate validator names
            expect(result.code).not.toContain('export const validateSchema =');
            expect(result.code).not.toContain('export const validateIndex =');

            // Has unique validator names
            expect(result.code).toContain('validateProdukItemResourceSchema');
            expect(result.code).toContain('validateProdukItemResourceIndex');
            expect(result.code).toContain('validateOrderResourceSchema');
            expect(result.code).toContain('validateOrderResourceIndex');

            // Exports use actual schema names
            expect(result.code).toContain('Schema: produkItemResourceShowSchema');
            expect(result.code).toContain('IndexSchema: produkItemResourceIndexSchema');

            // Index schemas reference show schemas
            expect(result.code).toContain('z.array(produkItemResourceShowSchema)');
            expect(result.code).toContain('z.array(orderResourceShowSchema)');
        });

        test('should work with both request and response schemas', () => {
            const requestContracts: GeneratedContract[] = [
                {
                    resourceName: 'Register',
                    actions: [
                        {
                            name: 'create',
                            schemaLines: [
                                '  create: z.object({',
                                '    name: z.string(),',
                                '    email: z.string()',
                                '  })'
                            ],
                            typeLines: [
                                '  create: {',
                                '    name: string,',
                                '    email: string',
                                '  }'
                            ],
                            fieldCount: 2
                        }
                    ]
                }
            ];

            const responseSchemas: ResponseSchema[] = [
                {
                    schemaName: 'orderShowSchema',
                    zodSchema: 'z.object({ id: z.number() })',
                    action: 'show',
                    resourceName: 'order'
                },
                {
                    schemaName: 'orderIndexSchema',
                    zodSchema: 'z.array(z.object({ id: z.number() }))',
                    action: 'index',
                    resourceName: 'order'
                }
            ];

            const builder = new ContractCodeBuilder();
            const result = builder.buildContractFile(requestContracts, responseSchemas);

            // Should have both request and response sections
            expect(result.code).toContain('// ========== RESPONSE SCHEMAS ==========');
            expect(result.code).toContain('// ========== REQUEST SCHEMAS ==========');

            // Should have all exports
            expect(result.code).toContain('Register: RegisterContractSchema');
            expect(result.code).toContain('OrderResponse: { Schema: orderShowSchema, IndexSchema: orderIndexSchema }');
        });
    });

    describe('Edge cases', () => {
        test('should handle empty response schemas', () => {
            const builder = new ContractCodeBuilder();
            const result = builder.buildContractFile([], []);

            expect(result.code).toContain("import { z } from 'zod'");
            expect(result.contractCount).toBe(0);
        });

        test('should handle multiple resources with same structure', () => {
            const schemas: ResponseSchema[] = [
                {
                    schemaName: 'user1ShowSchema',
                    zodSchema: 'z.object({ id: z.number() })',
                    action: 'show',
                    resourceName: 'user1'
                },
                {
                    schemaName: 'user1IndexSchema',
                    zodSchema: 'z.array(z.object({ id: z.number() }))',
                    action: 'index',
                    resourceName: 'user1'
                },
                {
                    schemaName: 'user2ShowSchema',
                    zodSchema: 'z.object({ id: z.number() })',
                    action: 'show',
                    resourceName: 'user2'
                },
                {
                    schemaName: 'user2IndexSchema',
                    zodSchema: 'z.array(z.object({ id: z.number() }))',
                    action: 'index',
                    resourceName: 'user2'
                }
            ];

            const builder = new ContractCodeBuilder();
            const result = builder.buildContractFile([], schemas);

            // All validators should be unique
            expect(result.code).toContain('validateUser1Schema');
            expect(result.code).toContain('validateUser1Index');
            expect(result.code).toContain('validateUser2Schema');
            expect(result.code).toContain('validateUser2Index');

            // All exports should be unique
            expect(result.code).toContain('User1Response:');
            expect(result.code).toContain('User2Response:');
        });
    });
});
