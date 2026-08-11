/**
 * emitters.integration.test.ts
 *
 * Integration tests untuk Phase 2 emitters (Contract IR Architecture)
 * Verifikasi output sesuai arsitektur baru: emitters adalah thin projection
 * functions yang consume ContractIR dan menghasilkan GeneratedFile[].
 *
 * Pola test: build ContractIR dari mock manifest via ContractIRBuilder +
 * ContractGenerator['adaptManifest'], lalu panggil emitter.emit(ir).
 *
 * REGRESSION GUARD yang dipertahankan dari fase lama (Engine.Fix.md):
 * - Tidak boleh ada schema kosong untuk model yang punya kolom
 * - Tidak boleh ada interface kosong / blunt-cast di mappers
 * - Tidak boleh ada `any` types di output
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ContractEmitter } from '../layers/ContractEmitter'
import { SchemaEmitter } from '../layers/SchemaEmitter'
import { FieldEmitter } from '../layers/FieldEmitter'
import { ReadEmitter } from '../layers/ReadEmitter'
import { MapperEmitter } from '../layers/MapperEmitter'
import { OptimizedContractIRBuilder } from '../../../../core/src/ir/ContractIRBuilder'
import { ContractGenerator } from '../ContractGenerator'
import type { RouteManifest } from '../../../../core/src/types/route'
import type { GenerationContext, ContractIR } from '../../../../core/src/types/ir'

// Mock context untuk testing (sama dengan contract-ir.integration.test.ts)
const mockContext: GenerationContext = {
    projectRoot: '.',
    outputDir: './output',
    config: {
        typescript: {
            strict: true,
            target: 'ES2020',
            moduleResolution: 'node'
        },
        validation: {
            useZod: true,
            useLaravel: false
        },
        naming: {
            caseTransform: 'camel',
            resourceSuffix: 'Resource',
            requestSuffix: 'Request'
        }
    },
    manifest: {
        resources: [],
        requests: [],
        routes: [],
        metadata: {
            version: '1.0.0',
            scanned_at: new Date().toISOString(),
            source_files: []
        }
    }
}

/**
 * Mock manifest untuk test fixture yang konsisten:
 * - Route GET users.show dengan response kind:'model' → model User reachable
 *   (adaptManifest hanya memasukkan model yang reachable dari response route)
 * - Model User dengan 3 kolom (id, first_name, email)
 */
function createMockManifest(): RouteManifest {
    return {
        version: '1.0.0',
        baseURL: 'http://localhost/api',
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
            },
            {
                name: 'login.post',
                method: 'POST',
                path: '/login',
                auth: false,
                middleware: ['api'],
                schema: {
                    rules: {
                        email: 'required|email',
                        password: 'required',
                    },
                },
            },
            {
                name: 'users.show',
                method: 'GET',
                path: '/users/{id}',
                auth: true,
                middleware: ['auth'],
                response: {
                    kind: 'model',
                    model: 'User',
                },
            },
        ] as any,
        models: [
            {
                name: 'User',
                table: 'users',
                columns: [
                    { name: 'id', type: 'bigint', nullable: false },
                    { name: 'first_name', type: 'varchar', nullable: false },
                    { name: 'email', type: 'varchar', nullable: false },
                ],
            },
        ] as any,
    } as any
}

function buildIR(manifest: RouteManifest): ContractIR {
    const builder = new OptimizedContractIRBuilder(mockContext)
    const generator = new ContractGenerator()
    return builder.buildFromManifest(generator['adaptManifest'](manifest))
}

describe('Phase 2 Emitters Integration Tests', () => {
    let ir: ContractIR

    beforeEach(() => {
        ir = buildIR(createMockManifest())
    })

    describe('ContractEmitter', () => {
        it('should generate api-contract.ts dengan proper Zod schemas', () => {
            const files = new ContractEmitter().emit(ir)

            expect(files).toHaveLength(1)
            expect(files[0].path).toBe('contract/api-contract.ts')

            const content = files[0].content
            expect(content).toContain('z.object')
            expect(content).toContain('export')
            expect(content).toContain("import { z } from 'zod'")
        })

        it('should output file tanpa `any` types', () => {
            const content = new ContractEmitter().emit(ir)[0].content

            expect(content).not.toContain(' any')
            expect(content).not.toContain('as any')
        })

        // REGRESSION GUARD (Engine.Fix.md §32): sebelumnya buildResponseZodType()
        // selalu menghasilkan `z.object({})` kosong terlepas dari isi manifest.
        it('TIDAK BOLEH menghasilkan schema kosong z.object({}) untuk model yang punya kolom', () => {
            const content = new ContractEmitter().emit(ir)[0].content

            // Model 'User' di mock manifest punya 3 kolom (id, first_name, email)
            // -> UserSchema TIDAK BOLEH kosong.
            expect(content).not.toMatch(/export const UserSchema = z\.object\(\{\}\)/)
            expect(content).not.toMatch(/Schema = z\.object\(\{\}\)/)
        })

        it('UserSchema harus berisi field asli dari model.columns dengan tipe Zod yang benar', () => {
            const content = new ContractEmitter().emit(ir)[0].content

            const match = content.match(/export const UserSchema = z\.object\(\{([\s\S]*?)\}\)/)
            expect(match).not.toBeNull()
            const body = match![1]

            // Ketiga kolom asli dengan mapping SQL -> Zod:
            // id: bigint -> z.number(), first_name/email: varchar -> z.string()
            // Nama field pakai snake_case asli backend (Laravel).
            expect(body).toMatch(/\bid:\s*z\.number\(\)/)
            expect(body).toMatch(/\bfirst_name:\s*z\.string\(\)/)
            expect(body).toMatch(/\bemail:\s*z\.string\(\)/)
        })

        it('should generate collection response schema + validator functions', () => {
            const content = new ContractEmitter().emit(ir)[0].content

            expect(content).toContain('export const UsersResponseSchema = z.object({')
            expect(content).toContain('data: z.array(UserSchema)')
            expect(content).toContain('export const validateUserCollectionResponse')
            expect(content).toContain('export const validateUserResponse')
            expect(content).toContain('export type UserResponse = z.infer<typeof UserSchema>')
        })
    })

    describe('ReadEmitter', () => {
        it('should generate api-read.ts dengan TypeScript interfaces', () => {
            const files = new ReadEmitter().emit(ir)

            expect(files).toHaveLength(1)
            expect(files[0].path).toBe('types/api-read.ts')

            const content = files[0].content
            expect(content).toContain('interface')
            expect(content).toContain('export')
            expect(content).not.toContain(' any')
        })

        // REGRESSION GUARD (Engine.Fix.md §26.2/§31.3): ReadEmitter sebelumnya
        // membaca `model.fields` (properti yang tidak pernah ada), sehingga
        // selalu jatuh ke interface kosong. Sekarang field diambil dari
        // model.columns yang sudah di-transform ke camelCase di IR.
        it('UserTransformed interface harus punya property camelCase dari model.columns, bukan interface kosong', () => {
            const content = new ReadEmitter().emit(ir)[0].content

            const match = content.match(/interface UserTransformed \{([\s\S]*?)\}/)
            expect(match).not.toBeNull()
            const body = match![1]

            expect(body).toMatch(/\bid:\s*number/)
            expect(body).toMatch(/\bfirstName:\s*string/)
            expect(body).toMatch(/\bemail:\s*string/)
            expect(body.trim().length).toBeGreaterThan(0)
        })

        it('should generate Show/Index aliases', () => {
            const content = new ReadEmitter().emit(ir)[0].content

            expect(content).toContain('export type UserShow = UserTransformed')
            expect(content).toContain('export type UserIndex = UserTransformed[]')
        })
    })

    describe('FieldEmitter', () => {
        it('should generate api-field.ts dengan field metadata', () => {
            const files = new FieldEmitter().emit(ir)

            expect(files).toHaveLength(1)
            expect(files[0].path).toBe('contract/api-field.ts')

            const content = files[0].content
            expect(content).toContain('export const ApiApiField = {')
            expect(content).toContain('} as const')
            expect(content).not.toContain(' any')
        })

        // REGRESSION GUARD (Engine.Fix.md §31.3): FieldEmitter lama selalu
        // menghasilkan `UnknownModelFields = {} as const`. Sekarang menghasilkan
        // ApiApiField global dengan SNAKE_UPPER key -> snake_case value.
        it('ApiApiField harus berisi entry per kolom asli, bukan UnknownModelFields kosong', () => {
            const content = new FieldEmitter().emit(ir)[0].content

            expect(content).not.toMatch(/export const UnknownModelFields = \{\} as const/)

            expect(content).toContain('ID: "id",')
            expect(content).toContain('FIRST_NAME: "first_name",')
            expect(content).toContain('EMAIL: "email",')
        })
    })

    describe('SchemaEmitter', () => {
        it('should generate api-schema.ts dengan form validation schemas', () => {
            const files = new SchemaEmitter().emit(ir)

            expect(files).toHaveLength(1)
            expect(files[0].path).toBe('schemas/api-schema.ts')

            const content = files[0].content
            expect(content).toContain("import { z } from 'zod'")
            expect(content).toContain('export const ApiSchema = {')
            expect(content).toContain('export type ApiFormValues = {')
            expect(content).toContain('export const ApiDefaultValues = {')
            expect(content).not.toContain(' any')
        })
    })

    describe('MapperEmitter', () => {
        it('should generate api-mapper.ts dengan transform functions', () => {
            const files = new MapperEmitter().emit(ir)

            expect(files).toHaveLength(1)
            expect(files[0].path).toBe('mappers/api-mapper.ts')

            const content = files[0].content
            expect(content).toContain('export const toUserRead =')
            expect(content).toContain('export const toUserReadList =')
            expect(content).not.toContain(' any')
        })

        // REGRESSION GUARD (Engine.Fix.md §31.3/§31.4): toUserRead sebelumnya
        // selalu jatuh ke blunt-cast `raw as UserTransformed`. Sekarang field
        // dipetakan satu per satu dari snake_case ke camelCase.
        it('toUserRead harus memetakan field satu per satu (camelCase <- snake_case), bukan blunt-cast', () => {
            const content = new MapperEmitter().emit(ir)[0].content

            expect(content).not.toMatch(/toUserRead = \(api: UserResponse\): UserTransformed => api as UserTransformed/)

            const match = content.match(/toUserRead = \(api: UserResponse\): UserTransformed => \(\{([\s\S]*?)\}\)/)
            expect(match).not.toBeNull()
            const body = match![1]

            expect(body).toMatch(/\bid:\s*api\.id,/)
            expect(body).toMatch(/\bfirstName:\s*api\.first_name,/)
            expect(body).toMatch(/\bemail:\s*api\.email,/)
        })
    })

    describe('Cross-emitter consistency', () => {
        it('field naming harus konsisten antar emitters', () => {
            const contractContent = new ContractEmitter().emit(ir)[0].content
            const readContent = new ReadEmitter().emit(ir)[0].content
            const mapperContent = new MapperEmitter().emit(ir)[0].content
            const fieldContent = new FieldEmitter().emit(ir)[0].content

            // Contract pakai snake_case asli backend
            expect(contractContent).toContain('first_name: z.string()')
            // Read types pakai camelCase frontend
            expect(readContent).toContain('readonly firstName:')
            // Mapper menjembatani snake_case -> camelCase
            expect(mapperContent).toContain('firstName: api.first_name')
            // Field lookup SNAKE_UPPER -> snake_case
            expect(fieldContent).toContain('FIRST_NAME: "first_name"')
        })

        it('emitters harus deterministic: emit dua kali menghasilkan output identik', () => {
            const first = new ReadEmitter().emit(ir)[0].content
            const second = new ReadEmitter().emit(ir)[0].content

            expect(second).toBe(first)
        })
    })
})
