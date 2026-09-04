import { describe, it, test, expect, expectTypeOf } from 'vitest';
import { TypeScriptGeneratorPass, CompilerPassName } from '../TypeScriptGeneratorPass';
import { TypeScriptCodeBuilder } from '../../domain/common/TypeScriptTypeLowerer';
import { PrimitiveKind } from '../../types/SemanticType';
import type { SemanticTypesArtifact } from '../../artifacts/SemanticTypesArtifact';
import { ArtifactTypeId } from '../../artifacts/types';

describe('TypeScriptGeneratorPass (Structured Pipeline)', () => {
    describe('Type Contract Tests (Rule 8 Step 4)', () => {
        test('1. Default constructor initializes cleanly without arguments', () => {
            expectTypeOf<typeof TypeScriptGeneratorPass>().toBeConstructibleWith();
            const pass = new TypeScriptGeneratorPass();
            expect(pass.name).toBe(CompilerPassName.TypeScriptGenerator);
            expect(pass.descriptor.consumes).toContain(ArtifactTypeId.SemanticTypes);
            expect(pass.descriptor.produces).toContain(ArtifactTypeId.GeneratedTypeScript);
        });

        test('2. Constructor accepts optional codeBuilder dependency', () => {
            expectTypeOf<typeof TypeScriptGeneratorPass>().toBeConstructibleWith({ codeBuilder: new TypeScriptCodeBuilder() });
            const pass = new TypeScriptGeneratorPass({ codeBuilder: new TypeScriptCodeBuilder() });
            expect(pass).toBeInstanceOf(TypeScriptGeneratorPass);
        });
    });

    describe('Flow & Output Transformation Tests (Rule 8 Step 5)', () => {
        it('should generate type-safe interfaces and aliases from SemanticTypesArtifact', () => {
            const pass = new TypeScriptGeneratorPass();

            const inputArtifact: SemanticTypesArtifact = {
                typeId: ArtifactTypeId.SemanticTypes,
                types: [
                    {
                        kind: 'object',
                        name: 'CartItemResourceTransformed',
                        baseName: 'CartItem',
                        properties: [
                            { name: 'id', type: { kind: 'primitive', type: PrimitiveKind.NUMBER } },
                            { name: 'produkItemId', type: { kind: 'primitive', type: PrimitiveKind.NUMBER } },
                            { name: 'qty', type: { kind: 'primitive', type: PrimitiveKind.NUMBER } },
                            {
                                name: 'note',
                                type: {
                                    kind: 'optional',
                                    innerType: {
                                        kind: 'nullable',
                                        innerType: { kind: 'primitive', type: PrimitiveKind.STRING }
                                    }
                                }
                            }
                        ]
                    }
                ],
                metadata: {
                    hash: 'test-hash',
                    producer: 'StaticLaravelScanner',
                    dependencies: [],
                    timestamp: Date.now(),
                    revision: '1.0.0'
                }
            };

            const [result] = pass.run([inputArtifact]);

            expect(result.typeId).toBe(ArtifactTypeId.GeneratedTypeScript);
            expect(result.code).toContain('export interface CartItemResourceTransformed {');
            expect(result.code).toContain('id: number;');
            expect(result.code).toContain('produkItemId: number;');
            expect(result.code).toContain('qty: number;');
            expect(result.code).toContain('note?: string | null;');
            expect(result.code).toContain('export type CartItemShow = CartItemResourceTransformed;');
            expect(result.code).toContain('export type CartItemIndex = Array<CartItemResourceTransformed>;');
            expect(result.generationMetadata.interfaceCount).toBe(1);
            expect(result.generationMetadata.linesOfCode).toBeGreaterThan(0);
            expect(result.interfaces[0].lineRange[0]).toBe(1);
            expect(result.interfaces[0].lineRange[1]).toBe(result.generationMetadata.linesOfCode);
        });

        it('should compute exact source line ranges across multiple interfaces', () => {
            const pass = new TypeScriptGeneratorPass();
            const inputArtifact: SemanticTypesArtifact = {
                typeId: ArtifactTypeId.SemanticTypes,
                types: [
                    {
                        kind: 'object',
                        name: 'A',
                        baseName: 'A',
                        properties: [{ name: 'id', type: { kind: 'primitive', type: PrimitiveKind.NUMBER } }]
                    },
                    {
                        kind: 'object',
                        name: 'B',
                        baseName: 'B',
                        properties: [{ name: 'name', type: { kind: 'primitive', type: PrimitiveKind.STRING } }]
                    }
                ],
                metadata: { hash: 'h', producer: 's', dependencies: [], timestamp: 0, revision: '1.0.0' }
            };

            const [result] = pass.run([inputArtifact]);
            expect(result.interfaces[0].lineRange[0]).toBe(1);
            expect(result.interfaces[1].lineRange[0]).toBe(result.interfaces[0].lineRange[1] + 2);
        });
    });
});