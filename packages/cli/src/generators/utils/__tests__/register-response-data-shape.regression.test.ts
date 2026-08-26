/**
 * Regression: register.post -> RegisterResponse.data -> api-contract.ts
 *
 * Purpose (per design discussion 2026-08-24):
 *   Lock the contract that manifest response shape is the single source of
 *   truth (SSOT) for wire response — never a silent fallback to an
 *   Eloquent model's own columns — and establish the current capability
 *   matrix for RegisterResponse.data across three shapes:
 *
 *     1. data as a (possibly nested) object          -> should already work
 *     2. data as an array of objects                 -> known limitation
 *     3. data as a nested array (array<object{array}>) -> known limitation
 *     4. data as an explicitly unknown shape          -> must stay z.unknown(),
 *        and must be distinguishable from (1) and (2), never silently
 *        upgraded to a guessed model shape.
 *
 *   Rule: a passing test here is a proven capability. A failing test is a
 *   known limitation and must NOT be quietly worked around by weakening
 *   the assertion — see docs/investigations/TEST_SUITE_INVESTIGATION_2026-08-24.md.
 */

import { describe, expect, test } from 'vitest'
import { manifestToContractInput } from '../manifest-to-types'
import { ContractGeneratorPass } from '../../../../../core/src/compiler/passes/ContractGeneratorPass'
import type { RouteManifest } from '../../../../../core/src/types/route'
import {
    PrimitiveType,
    ObjectType,
    ReferenceType,
    ReadonlyCollectionType,
    CollectionKind,
} from '../../../../../core/src/compiler/types/SemanticType'

/**
 * Base manifest: register.post -> RegisterResponse resource.
 *
 * A decoy `User` resource is included in every fixture below with fields
 * that DELIBERATELY differ from what RegisterResponse.data.user declares
 * (extra `password_hash` field, no `name` field). If the generated contract
 * ever leaks `password_hash` or fails to include the inline `name` field,
 * that proves the mapper silently fell back to resolving a same-named
 * model/resource instead of using the manifest response shape as SSOT.
 */
function baseManifest(dataField: unknown): RouteManifest {
    return {
        version: '1.0.0',
        baseURL: 'http://localhost',
        generatedAt: '2026-08-24T00:00:00.000Z',
        routes: [
            {
                name: 'register.post',
                method: 'POST',
                path: '/register',
                auth: false,
                middleware: ['api'],
                schema: {
                    rules: {
                        name: 'required|string|max:255',
                        email: 'required|email|unique:users,email',
                        password: 'required|min:6',
                    },
                },
                response: {
                    kind: 'resource',
                    resource: 'RegisterResponse',
                    collection: false,
                },
            },
        ],
        resources: [
            {
                name: 'RegisterResponse',
                fields: {
                    success: { kind: 'primitive', type: 'boolean' },
                    message: { kind: 'primitive', type: 'string' },
                    data: dataField,
                },
            },
            // Decoy — must NOT be used by RegisterResponse.data.user.
            {
                name: 'User',
                fields: {
                    id: { kind: 'primitive', type: 'number' },
                    password_hash: { kind: 'primitive', type: 'string' },
                },
            },
        ],
    } as RouteManifest
}

describe('register.post -> RegisterResponse.data -> api-contract.ts (data shape fidelity)', () => {
    describe('1. data as nested object — no model fallback', () => {
        test('data.token and data.user are read from the manifest shape, not from the User model', () => {
            const manifest = baseManifest({
                kind: 'object',
                fields: {
                    token: { kind: 'primitive', type: 'string' },
                    user: {
                        kind: 'object',
                        fields: {
                            id: { kind: 'primitive', type: 'number' },
                            name: { kind: 'primitive', type: 'string' },
                        },
                    },
                },
            })

            const input = manifestToContractInput(manifest)
            const register = input.requestTypes.find(r => r.resourceName === 'register')
            const data = register?.responseData?.fields.data

            expect(data).toBeInstanceOf(ObjectType)

            const dataObject = data as ObjectType
            expect(dataObject.properties.get('token')).toBeInstanceOf(PrimitiveType)

            const user = dataObject.properties.get('user')
            expect(user).toBeInstanceOf(ObjectType)

            const userObject = user as ObjectType
            expect(userObject.properties.get('id')).toBeInstanceOf(PrimitiveType)
            expect(userObject.properties.get('name')).toBeInstanceOf(PrimitiveType)

            // Proof of no model fallback: the decoy User model's extra field
            // must never appear, and User has no `name` field — if it showed
            // up here it could only have come from the manifest shape.
            expect(userObject.properties.get('password_hash')).toBeUndefined()

            const [artifact] = new ContractGeneratorPass().run([input])
            expect(artifact.code).toContain('RegisterResponse')
            expect(artifact.code).toContain('token')
            expect(artifact.code).toContain('user')
            expect(artifact.code).toContain('name')
            expect(artifact.code).not.toContain('password_hash')
        })
    })

    describe('2. data as array of objects — CAPABILITY TARGET (known limitation)', () => {
        /**
         * If this fails, `kind: 'array'` on a plain (non-resource) field is
         * not yet handled by mapResourceFieldToNestedType — the field falls
         * through to the `default:` branch and becomes a ReferenceType
         * (-> z.unknown() in the generated contract) instead of
         * ReadonlyCollectionType<ObjectType>. Do NOT weaken this assertion;
         * implement `kind: 'array'` handling instead.
         */
        test('data resolves to ReadonlyCollectionType<ObjectType>, not ReferenceType', () => {
            const manifest = baseManifest({
                kind: 'array',
                element: {
                    kind: 'object',
                    fields: {
                        id: { kind: 'primitive', type: 'number' },
                        name: { kind: 'primitive', type: 'string' },
                    },
                },
            })

            const input = manifestToContractInput(manifest)
            const register = input.requestTypes.find(r => r.resourceName === 'register')
            const data = register?.responseData?.fields.data

            expect(data).not.toBeInstanceOf(ReferenceType)
            expect(data).toBeInstanceOf(ReadonlyCollectionType)

            const collection = data as ReadonlyCollectionType
            expect(collection.collectionKind).toBe(CollectionKind.ARRAY)
            expect(collection.elementType).toBeInstanceOf(ObjectType)

            const element = collection.elementType as ObjectType
            expect(element.properties.get('id')).toBeInstanceOf(PrimitiveType)
            expect(element.properties.get('name')).toBeInstanceOf(PrimitiveType)

            const [artifact] = new ContractGeneratorPass().run([input])
            expect(artifact.code).toContain('z.array')
            expect(artifact.code).not.toContain('z.unknown()')
        })
    })

    describe('3. nested array: data[] -> items[] -> object — CAPABILITY TARGET (known limitation)', () => {
        /**
         * Proves the array mapping is recursive, not a single flat
         * unwrap. If this fails while test #2 above passes, that means
         * array handling was implemented non-recursively (one level only).
         */
        test('data and data[].items both resolve to ReadonlyCollectionType, nested correctly', () => {
            const manifest = baseManifest({
                kind: 'array',
                element: {
                    kind: 'object',
                    fields: {
                        items: {
                            kind: 'array',
                            element: {
                                kind: 'object',
                                fields: {
                                    id: { kind: 'primitive', type: 'number' },
                                },
                            },
                        },
                    },
                },
            })

            const input = manifestToContractInput(manifest)
            const register = input.requestTypes.find(r => r.resourceName === 'register')
            const data = register?.responseData?.fields.data

            expect(data).toBeInstanceOf(ReadonlyCollectionType)
            const outer = data as ReadonlyCollectionType
            expect(outer.elementType).toBeInstanceOf(ObjectType)

            const outerElement = outer.elementType as ObjectType
            const items = outerElement.properties.get('items')
            expect(items).toBeInstanceOf(ReadonlyCollectionType)

            const inner = items as ReadonlyCollectionType
            expect(inner.elementType).toBeInstanceOf(ObjectType)
            expect((inner.elementType as ObjectType).properties.get('id')).toBeInstanceOf(PrimitiveType)
        })
    })

    describe('4. data: unknown vs object vs array must stay distinguishable', () => {
        test('unknown shape stays honestly unknown (z.unknown()), never guesses a model shape', () => {
            const manifest = baseManifest({ kind: 'unknown' })

            const input = manifestToContractInput(manifest)
            const register = input.requestTypes.find(r => r.resourceName === 'register')
            const data = register?.responseData?.fields.data

            // Must not be silently upgraded to a concrete shape.
            expect(data).not.toBeInstanceOf(ObjectType)
            expect(data).not.toBeInstanceOf(ReadonlyCollectionType)

            const [artifact] = new ContractGeneratorPass().run([input])
            // Honest unknown IS expected to surface as z.unknown() — the
            // failure mode we guard against is a KNOWN shape silently
            // becoming z.unknown(), not an unknown shape staying z.unknown().
            expect(artifact.code).toContain('z.unknown()')
            expect(artifact.code).not.toContain('password_hash')
        })

        test('object shape never degrades to z.unknown() anywhere in the generated contract', () => {
            const manifest = baseManifest({
                kind: 'object',
                fields: {
                    token: { kind: 'primitive', type: 'string' },
                },
            })

            const input = manifestToContractInput(manifest)
            const register = input.requestTypes.find(r => r.resourceName === 'register')
            const data = register?.responseData?.fields.data

            expect(data).toBeInstanceOf(ObjectType)

            const [artifact] = new ContractGeneratorPass().run([input])
            expect(artifact.code).not.toContain('z.unknown()')
        })

        test('array shape must not collapse into the same representation as unknown (known limitation)', () => {
            const manifest = baseManifest({
                kind: 'array',
                element: { kind: 'primitive', type: 'string' },
            })

            const input = manifestToContractInput(manifest)
            const register = input.requestTypes.find(r => r.resourceName === 'register')
            const data = register?.responseData?.fields.data

            // The important distinction under test: an array shape is NOT
            // the same information as "unknown". Today this fails because
            // `kind: 'array'` falls through to the same ReferenceType
            // default branch that `kind: 'unknown'` also uses — i.e. the
            // two currently ARE indistinguishable, which is exactly the
            // bug this test documents.
            expect(data).toBeInstanceOf(ReadonlyCollectionType)
        })
    })

    describe('5. end-to-end: manifest -> manifestToContractInput -> ContractGeneratorPass -> api-contract.ts', () => {
        test('fully-known nested register response compiles to a fully-typed contract', () => {
            const manifest = baseManifest({
                kind: 'object',
                fields: {
                    token: { kind: 'primitive', type: 'string' },
                    user: {
                        kind: 'object',
                        fields: {
                            id: { kind: 'primitive', type: 'number' },
                            name: { kind: 'primitive', type: 'string' },
                        },
                    },
                },
            })

            const input = manifestToContractInput(manifest)
            const [artifact] = new ContractGeneratorPass().run([input])

            expect(artifact.code).toContain('RegisterResponse')
            expect(artifact.code).toContain('data')
            expect(artifact.code).toContain('token')
            expect(artifact.code).toContain('user')
            expect(artifact.code).toContain('id')
            expect(artifact.code).toContain('name')

            // The core assertion for the project's goal: nothing in this
            // fully-known response shape should ever degrade to
            // z.unknown() — that would mean the contract stopped being
            // derived from the manifest's actual response shape.
            expect(artifact.code).not.toContain('z.unknown()')

            // No leakage from the decoy User model.
            expect(artifact.code).not.toContain('password_hash')
        })
    })
})
