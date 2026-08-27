import { describe, test, expect } from 'vitest'
import { ContractGeneratorPass } from '../../core/src/compiler/passes/ContractGeneratorPass'
import { RequestTypesArtifact } from '../../core/src/compiler/artifacts/RequestTypesArtifact'
import { PrimitiveType, PrimitiveKind } from '../../core/src/compiler/types/SemanticType'

describe('Regression Test: Omit Empty Contract Schemas for GET-Only Resources (cleanEmptyContractSchema)', () => {
    test('should omit empty export const *ContractSchema = {} for resources with zero request actions', () => {
        const input: RequestTypesArtifact = {
            typeId: 'RequestTypes',
            requestTypes: [
                {
                    resourceName: 'categories',
                    formTypeName: 'CategoriesForm',
                    actions: [] // GET-only resource, zero POST/PUT/PATCH actions
                },
                {
                    resourceName: 'login',
                    formTypeName: 'LoginForm',
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
                }
            ],
            metadata: {
                hash: 'test-hash',
                producer: 'test',
                dependencies: [],
                timestamp: Date.now(),
                revision: '1.0.0'
            }
        }

        const pass = new ContractGeneratorPass()
        const [artifact] = pass.run([input])

        // Verify loginContractSchema is present because it has actions
        expect(artifact.code).toContain('export const loginContractSchema = {')

        // Verify empty categoriesContractSchema = {} is omitted
        expect(artifact.code).not.toContain('export const categoriesContractSchema = {')
        expect(artifact.code).not.toContain('categoriesContractSchema')
    })
})
