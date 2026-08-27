import { describe, test, expect } from 'vitest'
import { manifestToSemanticTypes, manifestToContractInput } from '../../cli/src/generators/utils/manifest-to-types'
import { TypeScriptGeneratorPass } from '../../core/src/compiler/passes/TypeScriptGeneratorPass'
import { MapperGeneratorPass } from '../../core/src/compiler/passes/MapperGeneratorPass'
import { RouteManifest } from '../../core/src/types/route'

describe('Regression Test: Mapper Consistency & Type Safety (mapperConsistencyAndTypeSafety)', () => {
    test('should align LoginTransformed property names between api-read.ts and api-mapper.ts', () => {
        const manifest: RouteManifest = {
            routes: [
                {
                    domain: 'Auth',
                    path: '/login',
                    method: 'POST',
                    action: 'AuthController@login',
                    rules: {},
                    response: {
                        kind: 'object',
                        fields: {
                            success: { kind: 'primitive', type: 'boolean' },
                            message: { kind: 'primitive', type: 'string' },
                            data: {
                                kind: 'object',
                                fields: {
                                    token: { kind: 'primitive', type: 'string' },
                                    user: {
                                        kind: 'object',
                                        fields: {
                                            id: { kind: 'primitive', type: 'int' },
                                            name: { kind: 'primitive', type: 'string' },
                                            email: { kind: 'primitive', type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            ],
            resources: [],
            models: []
        }

        const semanticTypes = manifestToSemanticTypes(manifest)
        const tsPass = new TypeScriptGeneratorPass()
        const [tsArtifact] = tsPass.run([semanticTypes])

        const contractInput = manifestToContractInput(manifest)
        const mapperPass = new MapperGeneratorPass()
        const [mapperArtifact] = mapperPass.run([contractInput])

        // Verify LoginTransformed interface fields match toLoginRead mapper assignments
        expect(tsArtifact.code).toContain('dataUserId: number;')
        expect(mapperArtifact.code).toContain('dataUserId: api.data.user.id,')
        expect(mapperArtifact.code).not.toContain('userId: api.data.user?.id,')
    })

    test('should prevent property name collisions (gateway.order_id -> gatewayOrderId) and preserve nullability in PaymentResource', () => {
        const manifest: RouteManifest = {
            routes: [
                {
                    domain: 'Payment',
                    path: '/payment',
                    method: 'GET',
                    action: 'PaymentController@show',
                    rules: {},
                    response: {
                        kind: 'resource',
                        resource: 'PaymentResource'
                    }
                }
            ],
            resources: [
                {
                    name: 'PaymentResource',
                    fields: {
                        id: { kind: 'primitive', type: 'int' },
                        order_id: { kind: 'primitive', type: 'int', nullable: true },
                        gateway: {
                            kind: 'object',
                            fields: {
                                name: { kind: 'primitive', type: 'string' },
                                order_id: { kind: 'primitive', type: 'string' },
                                token: { kind: 'primitive', type: 'string' }
                            }
                        }
                    }
                }
            ],
            models: []
        }

        const semanticTypes = manifestToSemanticTypes(manifest)
        const tsPass = new TypeScriptGeneratorPass()
        const [tsArtifact] = tsPass.run([semanticTypes])

        const contractInput = manifestToContractInput(manifest)
        const mapperPass = new MapperGeneratorPass()
        const [mapperArtifact] = mapperPass.run([contractInput])

        // Verify nullability preservation
        expect(tsArtifact.code).toContain('orderId: number | null;')

        // Verify nested object prefixing (gateway.order_id -> gatewayOrderId)
        expect(tsArtifact.code).toContain('gatewayOrderId: string;')
        expect(mapperArtifact.code).toContain('gatewayOrderId: api.gateway.order_id,')
        expect(mapperArtifact.code).not.toContain('orderId: api.gateway.order_id,')
    })
})
