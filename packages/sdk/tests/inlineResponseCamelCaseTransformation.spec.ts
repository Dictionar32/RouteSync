import { describe, test, expect } from 'vitest'
import { manifestToSemanticTypes, manifestToContractInput } from '../../cli/src/generators/utils/manifest-to-types'
import { TypeScriptGeneratorPass } from '../../core/src/compiler/passes/TypeScriptGeneratorPass'
import { MapperGeneratorPass } from '../../core/src/compiler/passes/MapperGeneratorPass'
import { RouteManifest } from '../../core/src/types/route'

describe('Regression Test: Inline Response Transformed Types (api-read.ts) & CamelCase Mappers (api-mapper.ts)', () => {
    test('should generate ProfileTransformed in api-read.ts and camelCase mapper toProfileRead in api-mapper.ts for inline responses', () => {
        const manifest: RouteManifest = {
            routes: [
                {
                    domain: 'Profile',
                    path: '/profile',
                    method: 'GET',
                    action: 'ProfileController@show',
                    rules: {},
                    response: {
                        kind: 'object',
                        fields: {
                            user_id: { kind: 'primitive', type: 'int' },
                            created_at: { kind: 'primitive', type: 'string' },
                            avatar_url: { kind: 'primitive', type: 'string' }
                        }
                    }
                }
            ],
            resources: [],
            models: []
        }

        // 1. Verify api-read.ts (TypeScriptGeneratorPass) generates ProfileTransformed with camelCase fields
        const semanticTypes = manifestToSemanticTypes(manifest)
        const tsPass = new TypeScriptGeneratorPass()
        const [tsArtifact] = tsPass.run([semanticTypes])

        expect(tsArtifact.code).toContain('export interface ProfileTransformed')
        expect(tsArtifact.code).toContain('userId: number;')
        expect(tsArtifact.code).toContain('createdAt: string;')
        expect(tsArtifact.code).toContain('avatarUrl: string;')

        // 2. Verify api-mapper.ts (MapperGeneratorPass) generates toProfileRead mapping ProfileApiResponse -> ProfileTransformed
        const contractInput = manifestToContractInput(manifest)
        const mapperPass = new MapperGeneratorPass()
        const [mapperArtifact] = mapperPass.run([contractInput])

        expect(mapperArtifact.code).toContain('import type {\n  ProfileTransformed\n} from \'../types/api-read\';')
        expect(mapperArtifact.code).toContain('export const toProfileRead = (api: ProfileApiResponse): ProfileTransformed => ({')
        expect(mapperArtifact.code).toContain('userId: api.user_id,')
        expect(mapperArtifact.code).toContain('createdAt: api.created_at,')
        expect(mapperArtifact.code).toContain('avatarUrl: api.avatar_url,')
    })
})
