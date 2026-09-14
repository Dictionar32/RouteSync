import { describe, it, expect } from 'vitest';
import {
    MemoryCodeSink,
    deriveApiFieldKey,
    streamAllRequestFieldNames,
    projectApiFieldConstants,
    FormModelProjector,
    ContractProjector,
    ReadModelProjector,
    MapperProjector,
    PrimitiveType,
    PrimitiveKind,
    ObjectType,
    type RequestTypesArtifact,
    type SemanticTypesArtifact
} from '@routesync/core';
import { ImmutableSet, ImmutableMap } from '../../core/src/compiler/utils/ImmutableCollections';

describe('Rule 12: Catamorphic Projectors and CodeSink SSOT', () => {
    describe('MemoryCodeSink', () => {
        it('tracks lines, indentation, and metadata correctly', () => {
            const sink = new MemoryCodeSink({ name: 'test.ts', role: 'contract' });

            sink.writeLine('export const A = 1;');
            sink.indent();
            sink.writeLine('export const B = 2;');
            sink.dedent();
            sink.writeBlankLine();
            sink.writeBlock('export const C = 3;\nexport const D = 4;');

            const code = sink.toString();
            expect(code).toBe(
                'export const A = 1;\n' +
                '  export const B = 2;\n' +
                '\n' +
                'export const C = 3;\n' +
                'export const D = 4;'
            );
            expect(sink.getLineCount()).toBe(5);
            expect(sink.getMetadata().name).toBe('test.ts');
            expect(sink.getMetadata().role).toBe('contract');
        });
    });

    describe('ApiFieldProjector', () => {
        it('derives field key correctly', () => {
            expect(deriveApiFieldKey('username')).toBe('USERNAME');
            expect(deriveApiFieldKey('shipping_address')).toBe('SHIPPINGADDRESS');
            expect(deriveApiFieldKey('categoryId')).toBe('CATEGORYID');
            expect(deriveApiFieldKey('id')).toBe('ID');
        });

        it('streams all request field names in a single pass without duplicates', () => {
            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes: [
                    {
                        resourceName: 'User',
                        formTypeName: 'UserForm',
                        actions: [
                            {
                                name: 'store',
                                fields: [
                                    {
                                        originalName: 'email',
                                        transformedName: 'email',
                                        type: new PrimitiveType(PrimitiveKind.STRING),
                                        required: true,
                                        nullable: false
                                    },
                                    {
                                        originalName: 'password',
                                        transformedName: 'password',
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
                    }
                ]
            };

            const names = Array.from(new Set(streamAllRequestFieldNames(artifact)));
            expect(names).toEqual(['email', 'password']);
        });

        it('projects API field constants directly to MemoryCodeSink', () => {
            const sink = new MemoryCodeSink();
            projectApiFieldConstants(['user_id'], sink);

            expect(sink.toString()).toContain('export const ApiApiField = {');
            expect(sink.toString()).toContain('  USERID: "user_id",');
            expect(sink.toString()).toContain('} as const');
        });
    });

    describe('FormModelProjector', () => {
        it('projects RequestTypesArtifact directly to GeneratedFormArtifact and sink', () => {
            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes: [
                    {
                        resourceName: 'Post',
                        formTypeName: 'PostForm',
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
                ]
            };

            const projector = new FormModelProjector();
            const sink = new MemoryCodeSink();
            const result = projector.project(artifact, sink);

            expect(result.typeId).toBe('GeneratedForm');
            expect(result.code).toContain('Post');
            expect(result.formTypes.length).toBe(1);
            expect(result.formTypes[0].name).toBe('PostForm');
            expect(sink.toString()).toBe(result.code);
        });
    });

    describe('ContractProjector', () => {
        it('projects RequestTypesArtifact directly to GeneratedContractArtifact and sink', () => {
            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes: [
                    {
                        resourceName: 'Product',
                        formTypeName: 'ProductForm',
                        actions: [
                            {
                                name: 'store',
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
                ]
            };

            const projector = new ContractProjector();
            const sink = new MemoryCodeSink();
            const result = projector.project(artifact, sink);

            expect(result.typeId).toBe('GeneratedContract');
            expect(result.code).toContain('ProductContractSchema');
            expect(sink.toString()).toBe(result.code);
        });
    });

    describe('ReadModelProjector', () => {
        it('projects SemanticTypesArtifact directly to GeneratedTypeScriptArtifact and sink', () => {
            const objType = new ObjectType(
                new ImmutableMap(
                    new Map([
                        ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
                        ['name', new PrimitiveType(PrimitiveKind.STRING)]
                    ])
                ),
                new ImmutableSet(new Set(['id', 'name'])),
                undefined,
                [],
                new ImmutableMap(
                    new Map([
                        ['name', 'UserResource'],
                        ['kind', 'resource']
                    ])
                )
            );

            const artifact: SemanticTypesArtifact = {
                typeId: 'SemanticTypes' as const,
                metadata: {
                    hash: 'test',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                types: [objType]
            };

            const projector = new ReadModelProjector();
            const sink = new MemoryCodeSink();
            const result = projector.project(artifact, sink);

            expect(result.typeId).toBe('GeneratedTypeScript');
            expect(result.code).toContain('UserResource');
            expect(sink.toString()).toBe(result.code);
        });
    });

    describe('MapperProjector', () => {
        it('projects RequestTypesArtifact directly to GeneratedMapperArtifact and sink', () => {
            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: {
                    hash: 'test',
                    producer: 'test',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                },
                requestTypes: [
                    {
                        resourceName: 'Cart',
                        formTypeName: 'CartForm',
                        actions: [
                            {
                                name: 'store',
                                fields: [
                                    {
                                        originalName: 'quantity',
                                        transformedName: 'quantity',
                                        type: new PrimitiveType(PrimitiveKind.NUMBER),
                                        required: true,
                                        nullable: false
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };

            const projector = new MapperProjector();
            const sink = new MemoryCodeSink();
            const result = projector.project(artifact, sink);

            expect(result.typeId).toBe('GeneratedMapper');
            expect(sink.toString()).toBe(result.code);
        });
    });
});
