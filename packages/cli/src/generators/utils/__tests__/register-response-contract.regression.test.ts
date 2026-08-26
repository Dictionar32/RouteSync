/**
 * Regression: register.post -> RegisterResponse -> api-contract.ts
 *
 * Purpose:
 * - Prove contract generation uses the response shape carried by the manifest.
 * - Do NOT resolve the response from an Eloquent model.
 * - Preserve nested response data.
 * - Preserve resource collections as arrays in the generated Zod contract.
 *
 * This fixture intentionally models the desired post-parser manifest shape.
 * It is not a Laravel controller fixture.
 */

import { describe, expect, test } from 'vitest'
import { manifestToContractInput } from '../manifest-to-types'
import { ContractGeneratorPass } from '../../../../../core/src/compiler/passes/ContractGeneratorPass'
import type { RouteManifest } from '../../../../../core/src/types/route'

function buildRegisterManifest(): RouteManifest {
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
                        password: 'required|min:6'
                    }
                },
                response: {
                    kind: 'resource',
                    resource: 'RegisterResponse',
                    collection: false
                }
            }
        ],
        resources: [
            {
                name: 'RegisterResponse',
                fields: {
                    success: { kind: 'primitive', type: 'boolean' },
                    message: { kind: 'primitive', type: 'string' },
                    data: {
                        kind: 'object',
                        fields: {
                            id: { kind: 'primitive', type: 'number' },
                            name: { kind: 'primitive', type: 'string' },
                            email: { kind: 'primitive', type: 'string' },
                            token: { kind: 'primitive', type: 'string' }
                        }
                    }
                }
            }
        ]
    }
}

function buildRegisterCollectionManifest(): RouteManifest {
    const manifest = buildRegisterManifest()

    manifest.resources![0].fields.data = {
        kind: 'resource',
        resource: 'RegisteredUserResource',
        collection: true
    }

    manifest.resources!.push({
        name: 'RegisteredUserResource',
        fields: {
            id: { kind: 'primitive', type: 'number' },
            name: { kind: 'primitive', type: 'string' }
        }
    })

    return manifest
}

describe('register.post -> RegisterResponse -> api-contract.ts', () => {
    test('generates the response contract from RegisterResponse in the manifest', () => {
        const input = manifestToContractInput(buildRegisterManifest())
        const register = input.requestTypes.find(r => r.resourceName === 'register')

        expect(register).toBeDefined()
        expect(register?.responseData?.resourceName).toBe('RegisterResponse')
        expect(register?.responseData?.fields.success).toBeDefined()
        expect(register?.responseData?.fields.message).toBeDefined()
        expect(register?.responseData?.fields.data).toBeDefined()

        const [artifact] = new ContractGeneratorPass().run([input])

        expect(artifact.code).toContain('RegisterResponse')
        expect(artifact.code).toContain('success')
        expect(artifact.code).toContain('message')
        expect(artifact.code).toContain('data')
        expect(artifact.code).toContain('token')
        expect(artifact.code).toContain('z.object')
    })

    test('generates array schema when RegisterResponse.data resolves to a resource collection', () => {
        const input = manifestToContractInput(buildRegisterCollectionManifest())
        const register = input.requestTypes.find(r => r.resourceName === 'register')
        const data = register?.responseData?.fields.data

        expect(data).toBeDefined()
        expect(data?.kind).toBe('readonly_collection')

        const [artifact] = new ContractGeneratorPass().run([input])

        expect(artifact.code).toContain('RegisterResponse')
        expect(artifact.code).toContain('data')
        expect(artifact.code).toContain('z.array')
        expect(artifact.code).toContain('id')
        expect(artifact.code).toContain('name')
    })
})
