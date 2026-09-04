/**
 * FormGeneratorPass.test.ts
 * 
 * Unit tests for FormGeneratorPass - Pass orchestrator
 * Tests end-to-end form generation with dependency injection
 */

import { describe, test, expect, vi } from 'vitest';
import { FormGeneratorPass } from '../FormGeneratorPass';
import { FormFieldMapper } from '../../generators/form-generation/FormFieldMapper';
import { FormActionGenerator } from '../../generators/form-generation/FormActionGenerator';
import { FormCodeBuilder } from '../../generators/form-generation/FormCodeBuilder';
import { PrimitiveType, PrimitiveKind } from '../../types/SemanticType';
import type { RequestTypesArtifact, RequestType } from '../../artifacts/RequestTypesArtifact';
import { CompilationContext } from '../CompilationContext';

describe('FormGeneratorPass', () => {
    describe('Pass metadata', () => {
        test('should have correct pass name', () => {
            const pass = new FormGeneratorPass();

            expect(pass.name).toBe('FormGenerator');
        });

        test('should consume RequestTypes artifact', () => {
            const pass = new FormGeneratorPass();

            expect(pass.descriptor.consumes).toEqual(['RequestTypes']);
        });

        test('should produce GeneratedForm artifact', () => {
            const pass = new FormGeneratorPass();

            expect(pass.descriptor.produces).toEqual(['GeneratedForm']);
        });

        test('should have correct input witnesses', () => {
            const pass = new FormGeneratorPass();

            expect(pass.inputWitnesses).toHaveLength(1);
            expect(pass.inputWitnesses[0].key).toBe('RequestTypes');
        });

        test('should have correct output keys', () => {
            const pass = new FormGeneratorPass();

            expect(pass.outputKeys).toEqual(['GeneratedForm']);
        });
    });

    describe('Dependency injection', () => {
        test('should use default dependencies when none provided', () => {
            const pass = new FormGeneratorPass();

            // Pass should be constructed successfully with defaults
            expect(pass).toBeDefined();
            expect(pass.name).toBe('FormGenerator');
        });

        test('should accept custom FormFieldMapper', () => {
            const mockMapper = new FormFieldMapper();
            const pass = new FormGeneratorPass({ fieldMapper: mockMapper });

            expect(pass).toBeDefined();
        });

        test('should accept custom FormActionGenerator', () => {
            const mockGenerator = new FormActionGenerator();
            const pass = new FormGeneratorPass({ actionGenerator: mockGenerator });

            expect(pass).toBeDefined();
        });

        test('should accept custom FormCodeBuilder', () => {
            const mockBuilder = new FormCodeBuilder();
            const pass = new FormGeneratorPass({ codeBuilder: mockBuilder });

            expect(pass).toBeDefined();
        });

        test('should accept all custom dependencies', () => {
            const pass = new FormGeneratorPass({
                fieldMapper: new FormFieldMapper(),
                actionGenerator: new FormActionGenerator(),
                codeBuilder: new FormCodeBuilder()
            });

            expect(pass).toBeDefined();
        });
    });

    describe('Basic form generation', () => {
        test('should generate form from single request type', () => {
            const pass = new FormGeneratorPass();

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

            const [result] = pass.run([artifact], CompilationContext.default())

            expect(result.typeId).toBe('GeneratedForm');
            expect(result.code).toContain('export type UsersForm = {');
            expect(result.code).toContain('name: string');
            expect(result.formTypes).toHaveLength(1);
            expect(result.formTypes[0].name).toBe('UsersForm');
        });

        test('should generate forms from multiple request types', () => {
            const pass = new FormGeneratorPass();

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

            const [result] = pass.run([artifact], CompilationContext.default())

            expect(result.formTypes).toHaveLength(2);
            expect(result.formTypes[0].name).toBe('UsersForm');
            expect(result.formTypes[1].name).toBe('ProductsForm');
            expect(result.code).toContain('UsersForm');
            expect(result.code).toContain('ProductsForm');
        });

        test('should handle empty request types', () => {
            const pass = new FormGeneratorPass();

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

            const [result] = pass.run([artifact], CompilationContext.default())

            expect(result.typeId).toBe('GeneratedForm');
            expect(result.formTypes).toHaveLength(0);
            expect(result.generationMetadata.formTypeCount).toBe(0);
            expect(result.code).toContain('No validation rules found');
        });
    });

    describe('Multiple actions per form', () => {
        test('should generate form with create and update actions', () => {
            const pass = new FormGeneratorPass();

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

            const [result] = pass.run([artifact], CompilationContext.default())

            expect(result.formTypes[0].actions).toHaveLength(2);
            expect(result.formTypes[0].actions[0].name).toBe('create');
            expect(result.formTypes[0].actions[1].name).toBe('update');
            expect(result.code).toContain('Create:');
            expect(result.code).toContain('Update:');
        });

        test('should count total actions correctly', () => {
            const pass = new FormGeneratorPass();

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

            const [result] = pass.run([artifact], CompilationContext.default())

            expect(result.generationMetadata.totalActions).toBe(3);
        });
    });

    describe('Metadata generation', () => {
        test('should include generation metadata', () => {
            const pass = new FormGeneratorPass();

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

            const [result] = pass.run([artifact], CompilationContext.default())

            expect(result.generationMetadata).toBeDefined();
            expect(result.generationMetadata.generatorVersion).toBe('1.0.0');
            expect(result.generationMetadata.requestTypeCount).toBe(1);
            expect(result.generationMetadata.formTypeCount).toBe(1);
            expect(result.generationMetadata.totalActions).toBe(1);
            expect(result.generationMetadata.linesOfCode).toBeGreaterThan(0);
            expect(Array.isArray(result.generationMetadata.warnings)).toBe(true);
        });

        test('should include artifact metadata', () => {
            const pass = new FormGeneratorPass();

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

            const [result] = pass.run([artifact], CompilationContext.default())

            expect(result.metadata).toBeDefined();
            expect(result.metadata.producer).toBe('FormGenerator');
            expect(result.metadata.dependencies).toEqual(['RequestTypes']);
            expect(result.metadata.hash).toBeDefined();
            expect(result.metadata.timestamp).toBeGreaterThan(0);
        });

        test('should count lines of code correctly', () => {
            const pass = new FormGeneratorPass();

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

            const [result] = pass.run([artifact], CompilationContext.default())

            const actualLines = result.code.split('\n').length;
            expect(result.generationMetadata.linesOfCode).toBe(actualLines);
        });
    });

    describe('Real-world scenarios', () => {
        test('should generate cart items form', () => {
            const pass = new FormGeneratorPass();

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

            const [result] = pass.run([artifact], CompilationContext.default())

            expect(result.code).toContain('CartItemsForm');
            expect(result.code).toContain('produkItemId: string');
            expect(result.code).toContain('qty: number');
            expect(result.formTypes[0].actions).toHaveLength(2);
        });

        test('should generate profile form', () => {
            const pass = new FormGeneratorPass();

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

            const [result] = pass.run([artifact], CompilationContext.default())

            expect(result.code).toContain('ProfileForm');
            expect(result.code).toContain('email: string');
            expect(result.code).toContain('name?: string');
        });
    });

    describe('Error handling', () => {
        test('should handle request type processing errors gracefully', () => {
            const pass = new FormGeneratorPass();

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
            expect(() => pass.run([artifact], CompilationContext.default())).not.toThrow();
        });

        test('should include warnings in metadata', () => {
            const pass = new FormGeneratorPass();

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

            const [result] = pass.run([artifact], CompilationContext.default())

            expect(result.generationMetadata.warnings).toBeDefined();
            expect(Array.isArray(result.generationMetadata.warnings)).toBe(true);
        });
    });

    describe('Output validation', () => {
        test('should return single artifact in tuple', () => {
            const pass = new FormGeneratorPass();

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

            const result = pass.run([artifact], CompilationContext.default())

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].typeId).toBe('GeneratedForm');
        });

        test('should have valid TypeScript code', () => {
            const pass = new FormGeneratorPass();

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

            const [result] = pass.run([artifact], CompilationContext.default())

            // Check for valid TypeScript syntax elements
            expect(result.code).toMatch(/export type \w+Form = \{/);
            expect(result.code).toContain('/**');
            expect(result.code).toContain('*/');
        });
    });
});
