/**
 * TDD contract test for MapperGeneratorPass.
 *
 * 1 pass = 1 artifact:
 *   - Input: RequestTypesArtifact ONLY
 *   - Output: GeneratedMapperArtifact { code: string } (mappers/api-mapper.ts)
 * 
 * ApiApiField constant table generation is handled by ApiFieldGeneratorPass (contract/api-field.ts).
 */

import { describe, expect, test } from 'vitest'
import { MapperGeneratorPass } from '../MapperGeneratorPass'
import type {
    RequestTypesArtifact,
    RequestType,
} from '../../artifacts/RequestTypesArtifact'
import {
    PrimitiveType,
    ObjectType,
} from '../../types/SemanticType'
import { ImmutableMap, ImmutableSet } from '../../utils/ImmutableCollections'

function metadata() {
    return {
        hash: 'test-hash',
        producer: 'test',
        dependencies: [],
        timestamp: Date.now(),
        revision: '1.0.0',
    }
}

function requestTypesArtifact(requestTypes: readonly RequestType[]): RequestTypesArtifact {
    return {
        typeId: 'RequestTypes',
        metadata: metadata(),
        requestTypes,
    }
}

describe('MapperGeneratorPass', () => {
    describe('read mapper — from responseData', () => {
        test('generates toXRead + toXReadList referencing ApiResponse/Transformed types', () => {
            const input = requestTypesArtifact([
                {
                    resourceName: 'CategoryResource',
                    formTypeName: 'CategoryForm',
                    actions: [],
                    responseData: {
                        resourceName: 'CategoryResource',
                        fields: {
                            id: new PrimitiveType('number'),
                            nama: new PrimitiveType('string'),
                            created_at: new PrimitiveType('string'),
                        },
                    },
                },
            ])

            const pass = new MapperGeneratorPass()
            const [result] = pass.run([input])

            expect(result.typeId).toBe('GeneratedMapper')

            expect(result.code).toContain(
                'export const toCategoryResourceRead = (api: CategoryResourceApiResponse): CategoryResourceTransformed =>'
            )
            expect(result.code).toContain(
                'export const toCategoryResourceReadList = (api: CategoryResourceApiResponse[]): CategoryResourceTransformed[] =>'
            )
            expect(result.code).toContain('api.map(toCategoryResourceRead)')

            expect(result.code).toContain('id: api.id')
            expect(result.code).toContain('nama: api.nama')
            expect(result.code).toContain('createdAt: api.created_at')
        })

        test('nested object field keeps nested shape, not flattened or ReferenceType-degraded', () => {
            const userFields = new ImmutableMap<string, unknown>(new Map([
                ['id', new PrimitiveType('number')],
                ['name', new PrimitiveType('string')],
            ]))

            const input = requestTypesArtifact([
                {
                    resourceName: 'LoginResource',
                    formTypeName: 'LoginForm',
                    actions: [],
                    responseData: {
                        resourceName: 'LoginResource',
                        fields: {
                            token: new PrimitiveType('string'),
                            user: new ObjectType(
                                userFields as never,
                                new ImmutableSet<string>(new Set([]))
                            ),
                        },
                    },
                },
            ])

            const pass = new MapperGeneratorPass()
            const [result] = pass.run([input])

            expect(result.code).toContain('token: api.token')
            expect(result.code).toContain('userId: api.user?.id')
            expect(result.code).toContain('userName: api.user?.name')
        })

        test('route without responseData produces no read mapper for that resource', () => {
            const input = requestTypesArtifact([
                {
                    resourceName: 'logout',
                    formTypeName: 'LogoutForm',
                    actions: [],
                },
            ])

            const pass = new MapperGeneratorPass()
            const [result] = pass.run([input])

            expect(result.code).not.toContain('toLogoutRead')
        })
    })

    describe('form mapper — from actions', () => {
        test('generates toApiXCreate using ApiApiField.<KEY> bracket notation', () => {
            const input = requestTypesArtifact([
                {
                    resourceName: 'register',
                    formTypeName: 'RegisterForm',
                    actions: [
                        {
                            name: 'create',
                            fields: [
                                {
                                    originalName: 'name',
                                    transformedName: 'name',
                                    type: new PrimitiveType('string'),
                                    required: true,
                                    nullable: false,
                                },
                                {
                                    originalName: 'redirect_to',
                                    transformedName: 'redirectTo',
                                    type: new PrimitiveType('string'),
                                    required: true,
                                    nullable: false,
                                },
                            ],
                        },
                    ],
                },
            ])

            const pass = new MapperGeneratorPass()
            const [result] = pass.run([input])

            expect(result.code).toContain(
                "export const toApiRegisterCreate = (form: RegisterForm['Create'])"
            )

            expect(result.code).toContain("import { ApiApiField } from '../contracts/api-field';")
            expect(result.code).toContain("import type {\n  RegisterForm\n} from '../types/api-form';")
            expect(result.code).toContain('[ApiApiField.NAME]: form.name')
            expect(result.code).toContain('[ApiApiField.REDIRECTTO]: form.redirectTo')
        })

        test('multiple actions on the same resource each get their own mapper function', () => {
            const input = requestTypesArtifact([
                {
                    resourceName: 'profile',
                    formTypeName: 'ProfileForm',
                    actions: [
                        {
                            name: 'create',
                            fields: [
                                {
                                    originalName: 'email',
                                    transformedName: 'email',
                                    type: new PrimitiveType('string'),
                                    required: true,
                                    nullable: false,
                                },
                            ],
                        },
                        {
                            name: 'update',
                            fields: [
                                {
                                    originalName: 'email',
                                    transformedName: 'email',
                                    type: new PrimitiveType('string'),
                                    required: false,
                                    nullable: true,
                                },
                            ],
                        },
                    ],
                },
            ])

            const pass = new MapperGeneratorPass()
            const [result] = pass.run([input])

            expect(result.code).toContain("toApiProfileCreate = (form: ProfileForm['Create'])")
            expect(result.code).toContain("toApiProfileUpdate = (form: ProfileForm['Update'])")
            expect(result.code).toContain('[ApiApiField.EMAIL]: form.email')
        })
    })

    describe('empty / deterministic behavior', () => {
        test('empty requestTypes produces a valid empty GeneratedMapper artifact', () => {
            const input = requestTypesArtifact([])

            const pass = new MapperGeneratorPass()
            const result = pass.run([input])

            expect(Array.isArray(result)).toBe(true)
            expect(result).toHaveLength(1)
            expect(result[0].typeId).toBe('GeneratedMapper')
            expect(typeof result[0].code).toBe('string')
        })

        test('running the pass twice on the same input produces identical code (deterministic)', () => {
            const input = requestTypesArtifact([
                {
                    resourceName: 'wishlist',
                    formTypeName: 'WishlistForm',
                    actions: [],
                    responseData: {
                        resourceName: 'wishlist',
                        fields: {
                            id: new PrimitiveType('number'),
                            user_id: new PrimitiveType('number'),
                        },
                    },
                },
            ])

            const pass = new MapperGeneratorPass()
            const [a] = pass.run([input])
            const [b] = new MapperGeneratorPass().run([input])

            expect(a.code).toBe(b.code)
        })
    })
})
