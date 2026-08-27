import { describe, test, expect } from 'vitest'
import { manifestToContractInput } from '../../cli/src/generators/utils/manifest-to-types'
import { MapperGeneratorPass } from '../../core/src/compiler/passes/MapperGeneratorPass'
import { RouteManifest } from '../../core/src/types/route'

describe('Regression Test: Form Mapper Explicit Return Type Annotation (formMapperExplicitReturnType)', () => {
    test('should emit explicit return type annotation RegisterContract["create"] and import contract types in api-mapper.ts', () => {
        const manifest: RouteManifest = {
            routes: [
                {
                    domain: 'Auth',
                    path: '/register',
                    method: 'POST',
                    action: 'AuthController@register',
                    rules: {},
                    schema: {
                        rules: {
                            name: 'required|string|max:255',
                            email: 'required|email|max:255',
                            password: 'required|string|min:8'
                        }
                    },
                    response: {
                        kind: 'object',
                        fields: {
                            message: { kind: 'primitive', type: 'string' }
                        }
                    }
                }
            ],
            resources: [],
            models: []
        }

        const contractInput = manifestToContractInput(manifest)
        const mapperPass = new MapperGeneratorPass()
        const [mapperArtifact] = mapperPass.run([contractInput])

        // Verify imports from api-contract
        expect(mapperArtifact.code).toContain('RegisterContract')

        // Verify Form Mapper declaration with explicit return type annotation
        expect(mapperArtifact.code).toContain('export const toApiRegisterCreate = (form: RegisterForm[\'Create\']): RegisterContract[\'Create\'] => ({')
        expect(mapperArtifact.code).toContain('[ApiApiField.NAME]: form.name,')
        expect(mapperArtifact.code).toContain('[ApiApiField.EMAIL]: form.email,')
        expect(mapperArtifact.code).toContain('[ApiApiField.PASSWORD]: form.password,')
    })
})
