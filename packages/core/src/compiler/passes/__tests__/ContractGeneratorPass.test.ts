/**
 * ContractGeneratorPass.test.ts
 * 
 * Unit tests for ContractGeneratorPass - Pass orchestrator for contract generation
 * Tests end-to-end Zod contract generation with dependency injection
 */

import { describe, test, expect } from 'vitest';
import { ContractGeneratorPass } from '../ContractGeneratorPass';
import { ContractSchemaMapper } from '../../generators/contract-generation/ContractSchemaMapper';
import { ContractActionGenerator } from '../../generators/contract-generation/ContractActionGenerator';
import { ContractCodeBuilder } from '../../generators/contract-generation/ContractCodeBuilder';
import { PrimitiveType, PrimitiveKind } from '../../types/SemanticType';
import type { RequestTypesArtifact, RequestType } from '../../artifacts/RequestTypesArtifact';

describe('ContractGeneratorPass', () => {
    describe('Pass metadata', () => {
        test('should have correct pass name', () => {
            const pass = new ContractGeneratorPass();

            expect(pass.name).toBe('ContractGenerator');
        });

        test('should consume RequestTypes artifact', () => {
            const pass = new ContractGeneratorPass();

            expect(pass.descriptor.consumes).toEqual(['RequestTypes']);
        });

        test('should produce GeneratedContract artifact', () => {
            const pass = new ContractGeneratorPass();

            expect(pass.descriptor.produces).toEqual(['GeneratedContract']);
        });

        test('should have correct input witnesses', () => {
            const pass = new ContractGeneratorPass();

            expect(pass.inputWitnesses).toHaveLength(1);
            expect(pass.inputWitnesses[0].key).toBe('RequestTypes');
        });

        test('should have correct output keys', () => {
            const pass = new ContractGeneratorPass();

            expect(pass.outputKeys).toEqual(['GeneratedContract']);
        });
    });

    describe('Dependency injection', () => {
        test('should use default dependencies when none provided', () => {
            const pass = new ContractGeneratorPass();

            // Pass should be constructed successfully with defaults
            expect(pass).toBeDefined();
            expect(pass.name).toBe('ContractGenerator');
        });

        test('should accept custom ContractSchemaMapper', () => {
            const mockMapper = new ContractSchemaMapper();
            const pass = new ContractGeneratorPass({ schemaMapper: mockMapper });

            expect(pass).toBeDefined();
        });

        test('should accept custom ContractActionGenerator', () => {
            const mockGenerator = new ContractActionGenerator(new ContractSchemaMapper());
            const pass = new ContractGeneratorPass({ actionGenerator: mockGenerator });

            expect(pass).toBeDefined();
        });

        test('should accept custom ContractCodeBuilder', () => {
            const mockBuilder = new ContractCodeBuilder();
            const pass = new ContractGeneratorPass({ codeBuilder: mockBuilder });

            expect(pass).toBeDefined();
        });

        test('should accept all custom dependencies', () => {
            const mapper = new ContractSchemaMapper();
            const pass = new ContractGeneratorPass({
                schemaMapper: mapper,
                actionGenerator: new ContractActionGenerator(mapper),
                codeBuilder: new ContractCodeBuilder()
            });

            expect(pass).toBeDefined();
        });
    });

    describe('Basic contract generation', () => {
        test('should generate contract from single request type', () => {
            const pass = new ContractGeneratorPass();

            const requestType: RequestType = {
                resourceName: 'Users',
                formTypeName: 'UsersForm',
                actions: [
                    {
                        name: 'create',
                        fields: [
                            {
                                originalName: 'name',
                                transformedName: 'name',
                                type: new PrimitiveType(PrimitiveKind.STRING),
                                required: true,
                                nullable: false
                            }
                        ]
                    }
                ]
            };

            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test-hash',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes: [requestType]
            };

            const [result] = pass.run([artifact]);

            expect(result.typeId).toBe('GeneratedContract');
            expect(result.code).toContain('export const UsersContractSchema');
            expect(result.code).toContain('z.object');
            expect(result.code).toContain('name: z.string()');
            expect(result.contracts).toHaveLength(1);
            expect(result.contracts[0].name).toBe('Users');
        });

        test('should generate contracts from multiple request types', () => {
            const pass = new ContractGeneratorPass();

            const requestTypes: RequestType[] = [
                {
                    resourceName: 'Users',
                    formTypeName: 'UsersForm',
                    actions: [
                        {
                            name: 'create',
                            fields: [
                                {
                                    originalName: 'email',
                                    transformedName: 'email',
                                    type: new PrimitiveType(PrimitiveKind.STRING),
                                    required: true,
                                    nullable: false
                                }
                            ]
                        }
                    ]
                },
                {
                    resourceName: 'Products',
                    formTypeName: 'ProductsForm',
                    actions: [
                        {
                            name: 'create',
                            fields: [
                                {
                                    originalName: 'title',
                                    transformedName: 'title',
                                    type: new PrimitiveType(PrimitiveKind.STRING),
                                    required: true,
                                    nullable: false
                                }
                            ]
                        }
                    ]
                }
            ];

            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test-hash',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes
            };

            const [result] = pass.run([artifact]);

            expect(result.contracts).toHaveLength(2);
            expect(result.contracts[0].name).toBe('Users');
            expect(result.contracts[1].name).toBe('Products');
            expect(result.code).toContain('UsersContractSchema');
            expect(result.code).toContain('ProductsContractSchema');
        });

        test('should handle empty request types', () => {
            const pass = new ContractGeneratorPass();

            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test-hash',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes: []
            };

            const [result] = pass.run([artifact]);

            expect(result.typeId).toBe('GeneratedContract');
            expect(result.contracts).toHaveLength(0);
            expect(result.generationMetadata.contractCount).toBe(0);
            expect(result.generationMetadata.warnings).toContain('No validation rules found');
        });
    });

    describe('Multiple actions per contract', () => {
        test('should generate contract with create and update actions', () => {
            const pass = new ContractGeneratorPass();

            const requestType: RequestType = {
                resourceName: 'Users',
                formTypeName: 'UsersForm',
                actions: [
                    {
                        name: 'create',
                        fields: [
                            {
                                originalName: 'email',
                                transformedName: 'email',
                                type: new PrimitiveType(PrimitiveKind.STRING),
                                required: true,
                                nullable: false
                            }
                        ]
                    },
                    {
                        name: 'update',
                        fields: [
                            {
                                originalName: 'name',
                                transformedName: 'name',
                                type: new PrimitiveType(PrimitiveKind.STRING),
                                required: false,
                                nullable: false
                            }
                        ]
                    }
                ]
            };

            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test-hash',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes: [requestType]
            };

            const [result] = pass.run([artifact]);

            expect(result.contracts[0].actions).toHaveLength(2);
            expect(result.contracts[0].actions[0].name).toBe('create');
            expect(result.contracts[0].actions[1].name).toBe('update');
            expect(result.code).toContain('create:');
            expect(result.code).toContain('update:');
        });

        test('should count total actions correctly', () => {
            const pass = new ContractGeneratorPass();

            const requestTypes: RequestType[] = [
                {
                    resourceName: 'Users',
                    formTypeName: 'UsersForm',
                    actions: [
                        {
                            name: 'create',
                            fields: []
                        },
                        {
                            name: 'update',
                            fields: []
                        }
                    ]
                },
                {
                    resourceName: 'Products',
                    formTypeName: 'ProductsForm',
                    actions: [
                        {
                            name: 'create',
                            fields: []
                        }
                    ]
                }
            ];

            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test-hash',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes
            };

            const [result] = pass.run([artifact]);

            expect(result.generationMetadata.totalActions).toBe(3);
        });
    });

    describe('Zod schema generation', () => {
        test('should generate Zod schemas with correct syntax', () => {
            const pass = new ContractGeneratorPass();

            const requestType: RequestType = {
                resourceName: 'Users',
                formTypeName: 'UsersForm',
                actions: [
                    {
                        name: 'create',
                        fields: [
                            {
                                originalName: 'name',
                                transformedName: 'name',
                                type: new PrimitiveType(PrimitiveKind.STRING),
                                required: true,
                                nullable: false
                            }
                        ]
                    }
                ]
            };

            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test-hash',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes: [requestType]
            };

            const [result] = pass.run([artifact]);

            // Check Zod schema syntax
            expect(result.code).toContain('z.object');
            expect(result.code).toContain('z.string()');
            expect(result.code).toContain('import { z } from \'zod\'');
        });

        test('should preserve snake_case in field names', () => {
            const pass = new ContractGeneratorPass();

            const requestType: RequestType = {
                resourceName: 'Cart',
                formTypeName: 'CartForm',
                actions: [
                    {
                        name: 'create',
                        fields: [
                            {
                                originalName: 'produk_item_id',
                                transformedName: 'produkItemId',
                                type: new PrimitiveType(PrimitiveKind.STRING),
                                required: true,
                                nullable: false
                            }
                        ]
                    }
                ]
            };

            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test-hash',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes: [requestType]
            };

            const [result] = pass.run([artifact]);

            // Should preserve snake_case (originalName)
            expect(result.code).toContain('produk_item_id');
            // Should NOT contain camelCase (transformedName)
            expect(result.code).not.toContain('produkItemId');
        });

        test('should count Zod schemas correctly', () => {
            const pass = new ContractGeneratorPass();

            const requestType: RequestType = {
                resourceName: 'Users',
                formTypeName: 'UsersForm',
                actions: [
                    {
                        name: 'create',
                        fields: [
                            {
                                originalName: 'name',
                                transformedName: 'name',
                                type: new PrimitiveType(PrimitiveKind.STRING),
                                required: true,
                                nullable: false
                            }
                        ]
                    },
                    {
                        name: 'update',
                        fields: [
                            {
                                originalName: 'email',
                                transformedName: 'email',
                                type: new PrimitiveType(PrimitiveKind.STRING),
                                required: false,
                                nullable: false
                            }
                        ]
                    }
                ]
            };

            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test-hash',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes: [requestType]
            };

            const [result] = pass.run([artifact]);

            // 2 actions = 2 Zod schemas
            expect(result.generationMetadata.zodSchemasCount).toBe(2);
        });
    });

    describe('Metadata generation', () => {
        test('should include generation metadata', () => {
            const pass = new ContractGeneratorPass();

            const requestType: RequestType = {
                resourceName: 'Users',
                formTypeName: 'UsersForm',
                actions: [
                    {
                        name: 'create',
                        fields: [
                            {
                                originalName: 'name',
                                transformedName: 'name',
                                type: new PrimitiveType(PrimitiveKind.STRING),
                                required: true,
                                nullable: false
                            }
                        ]
                    }
                ]
            };

            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test-hash',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes: [requestType]
            };

            const [result] = pass.run([artifact]);

            expect(result.generationMetadata).toBeDefined();
            expect(result.generationMetadata.generatorVersion).toBe('1.0.0');
            expect(result.generationMetadata.requestTypeCount).toBe(1);
            expect(result.generationMetadata.contractCount).toBe(1);
            expect(result.generationMetadata.totalActions).toBe(1);
            expect(result.generationMetadata.zodSchemasCount).toBe(1);
            expect(result.generationMetadata.validatorsCount).toBe(1);
            expect(result.generationMetadata.linesOfCode).toBeGreaterThan(0);
            expect(Array.isArray(result.generationMetadata.warnings)).toBe(true);
        });

        test('should include artifact metadata', () => {
            const pass = new ContractGeneratorPass();

            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test-hash',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes: []
            };

            const [result] = pass.run([artifact]);

            expect(result.metadata).toBeDefined();
            expect(result.metadata.producer).toBe('ContractGenerator');
            expect(result.metadata.dependencies).toEqual(['RequestTypes']);
            expect(result.metadata.hash).toBeDefined();
            expect(result.metadata.timestamp).toBeGreaterThan(0);
        });

        test('should count lines of code correctly', () => {
            const pass = new ContractGeneratorPass();

            const requestType: RequestType = {
                resourceName: 'Users',
                formTypeName: 'UsersForm',
                actions: [
                    {
                        name: 'create',
                        fields: [
                            {
                                originalName: 'name',
                                transformedName: 'name',
                                type: new PrimitiveType(PrimitiveKind.STRING),
                                required: true,
                                nullable: false
                            }
                        ]
                    }
                ]
            };

            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test-hash',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes: [requestType]
            };

            const [result] = pass.run([artifact]);

            const actualLines = result.code.split('\n').length;
            expect(result.generationMetadata.linesOfCode).toBe(actualLines);
        });

        test('should track validator count', () => {
            const pass = new ContractGeneratorPass();

            const requestType: RequestType = {
                resourceName: 'Users',
                formTypeName: 'UsersForm',
                actions: [
                    {
                        name: 'create',
                        fields: []
                    },
                    {
                        name: 'update',
                        fields: []
                    }
                ]
            };

            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test-hash',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes: [requestType]
            };

            const [result] = pass.run([artifact]);

            // 2 actions = 2 validators
            expect(result.generationMetadata.validatorsCount).toBe(2);
        });
    });

    describe('Real-world scenarios', () => {
        test('should generate cart items contract', () => {
            const pass = new ContractGeneratorPass();

            const requestType: RequestType = {
                resourceName: 'CartItems',
                formTypeName: 'CartItemsForm',
                actions: [
                    {
                        name: 'create',
                        fields: [
                            {
                                originalName: 'produk_item_id',
                                transformedName: 'produkItemId',
                                type: new PrimitiveType(PrimitiveKind.STRING),
                                required: true,
                                nullable: false
                            },
                            {
                                originalName: 'qty',
                                transformedName: 'qty',
                                type: new PrimitiveType(PrimitiveKind.NUMBER),
                                required: true,
                                nullable: false
                            }
                        ]
                    },
                    {
                        name: 'update',
                        fields: [
                            {
                                originalName: 'qty',
                                transformedName: 'qty',
                                type: new PrimitiveType(PrimitiveKind.NUMBER),
                                required: true,
                                nullable: false
                            }
                        ]
                    }
                ]
            };

            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test-hash',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes: [requestType]
            };

            const [result] = pass.run([artifact]);

            expect(result.code).toContain('CartItemsContractSchema');
            expect(result.code).toContain('produk_item_id: z.string()');
            expect(result.code).toContain('qty: z.number()');
            expect(result.contracts[0].actions).toHaveLength(2);
        });

        test('should generate profile contract', () => {
            const pass = new ContractGeneratorPass();

            const requestType: RequestType = {
                resourceName: 'Profile',
                formTypeName: 'ProfileForm',
                actions: [
                    {
                        name: 'update',
                        fields: [
                            {
                                originalName: 'email',
                                transformedName: 'email',
                                type: new PrimitiveType(PrimitiveKind.STRING),
                                required: true,
                                nullable: false
                            },
                            {
                                originalName: 'name',
                                transformedName: 'name',
                                type: new PrimitiveType(PrimitiveKind.STRING),
                                required: false,
                                nullable: false
                            }
                        ]
                    }
                ]
            };

            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test-hash',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes: [requestType]
            };

            const [result] = pass.run([artifact]);

            expect(result.code).toContain('ProfileContractSchema');
            expect(result.code).toContain('email: z.string()');
            expect(result.code).toContain('name: z.string().optional()');
        });
    });

    describe('Error handling', () => {
        test('should handle request type processing errors gracefully', () => {
            const pass = new ContractGeneratorPass();

            const requestType: RequestType = {
                resourceName: 'Users',
                formTypeName: 'UsersForm',
                actions: [
                    {
                        name: 'create',
                        fields: [
                            {
                                originalName: 'name',
                                transformedName: 'name',
                                type: new PrimitiveType(PrimitiveKind.STRING),
                                required: true,
                                nullable: false
                            }
                        ]
                    }
                ]
            };

            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test-hash',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes: [requestType]
            };

            // Should not throw
            expect(() => pass.run([artifact])).not.toThrow();
        });

        test('should include warnings in metadata', () => {
            const pass = new ContractGeneratorPass();

            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test-hash',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes: []
            };

            const [result] = pass.run([artifact]);

            expect(result.generationMetadata.warnings).toBeDefined();
            expect(Array.isArray(result.generationMetadata.warnings)).toBe(true);
        });
    });

    describe('Output validation', () => {
        test('should return single artifact in tuple', () => {
            const pass = new ContractGeneratorPass();

            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test-hash',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes: []
            };

            const result = pass.run([artifact]);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].typeId).toBe('GeneratedContract');
        });

        test('should have valid TypeScript + Zod code', () => {
            const pass = new ContractGeneratorPass();

            const requestType: RequestType = {
                resourceName: 'Users',
                formTypeName: 'UsersForm',
                actions: [
                    {
                        name: 'create',
                        fields: [
                            {
                                originalName: 'name',
                                transformedName: 'name',
                                type: new PrimitiveType(PrimitiveKind.STRING),
                                required: true,
                                nullable: false
                            }
                        ]
                    }
                ]
            };

            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test-hash',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes: [requestType]
            };

            const [result] = pass.run([artifact]);

            // Check for valid Zod + TypeScript syntax elements
            expect(result.code).toMatch(/export const \w+ContractSchema/);
            expect(result.code).toContain('z.object');
            expect(result.code).toContain('/**');
            expect(result.code).toContain('*/');
            expect(result.code).toContain('import { z } from \'zod\'');
        });
    });
});

describe('ContractGeneratorPass - inline responses', () => {
    test('should generate schemas for inline responses', () => {
        const artifact: RequestTypesArtifact = {
            typeId: 'RequestTypes',
            requestTypes: [{
                resourceName: 'payment',
                formTypeName: 'PaymentContract',
                actions: [],
                responseData: {
                    resourceName: 'PaymentConfirm',
                    fields: {
                        success: new PrimitiveType(PrimitiveKind.BOOLEAN),
                        message: new PrimitiveType(PrimitiveKind.STRING)
                    }
                }
            }],
            metadata: {
                hash: 'test-hash',
                producer: 'test',
                dependencies: [],
                timestamp: Date.now(),
                revision: '1.0.0'
            }
        }

        const pass = new ContractGeneratorPass()
        const [result] = pass.run([artifact])

        // Should generate response schemas
        expect(result.code).toContain('paymentConfirmShow');
        expect(result.code).toContain('success: z.boolean()');
        expect(result.code).toContain('message: z.string()');
    })
})