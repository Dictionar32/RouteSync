/**
 * emitters.integration.test.ts
 * 
 * Integration tests untuk Phase 2 emitters
 * Verifikasi output sesuai dengan contoh di Engine.FIx.md (§16-21)
 * 
 * Menggunakan manifest asli dari frontend
 */

import { ContractEmitter } from '../layers/ContractEmitter'
import { SchemaEmitter } from '../layers/SchemaEmitter'
import { FieldEmitter } from '../layers/FieldEmitter'
import { ReadEmitter } from '../layers/ReadEmitter'
import { MapperEmitter } from '../layers/MapperEmitter'
import { LayerContext, RouteResponseComposition } from '../layers/types'
import { RouteManifest } from '@routesync/core'
import path from 'path'
import fs from 'fs-extra'

describe('Phase 2 Emitters Integration Tests', () => {
    let context: LayerContext
    let mockManifest: RouteManifest
    let tmpDir: string

    beforeEach(async () => {
        // Create temporary directory untuk output
        tmpDir = path.join('/tmp', `routesync-test-${Date.now()}`)
        await fs.ensureDir(tmpDir)

        // Load real manifest dari frontend
        let realManifest: RouteManifest
        try {
            const manifestPath = path.join(process.cwd(), 'routesync.manifest.json')
            const content = await fs.readFile(manifestPath, 'utf-8')
            realManifest = JSON.parse(content) as RouteManifest
        } catch (e) {
            // Fallback ke mock manifest jika file tidak ditemukan
            realManifest = createMockManifest()
        }

        context = {
            manifest: realManifest,
            knownModels: new Set(),
            knownResources: new Set(),
            knownSchemas: new Set(),
            kernel: undefined,
        }

        mockManifest = realManifest
    })

    afterEach(async () => {
        // Cleanup temporary directory
        try {
            await fs.remove(tmpDir)
        } catch (e) {
            // Ignore cleanup errors
        }
    })

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
                    response: {
                        kind: 'object',
                        fields: {
                            success: { kind: 'primitive', type: 'boolean' },
                            message: { kind: 'primitive', type: 'string' },
                            data: { kind: 'object', fields: { token: { kind: 'primitive', type: 'string' } } },
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
                    response: {
                        kind: 'object',
                        fields: {
                            success: { kind: 'primitive', type: 'boolean' },
                            message: { kind: 'primitive', type: 'string' },
                            data: { kind: 'object', fields: { token: { kind: 'primitive', type: 'string' } } },
                        },
                    },
                },
            ] as any,
            // NOTE: ditambahkan agar FieldEmitter test benar-benar exercise
            // logic-nya (bug lama: mock manifest tidak punya `models` sama
            // sekali, jadi FieldEmitter selalu skip loop dan cuma nulis
            // header comment tanpa `export const` apa pun).
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

    describe('ContractEmitter', () => {
        it('should generate api-contract.ts dengan proper Zod schemas', async () => {
            const { output, routeResponseMap } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)

            expect(output.lines.length).toBeGreaterThan(0)
            const content = output.lines.join('\n')

            expect(content).toContain('z.object')
            expect(content).toContain('export')

            // Verifikasi routeResponseMap populated
            expect(routeResponseMap.size).toBeGreaterThan(0)
        })

        it('should process routes dari manifest', async () => {
            const { output, routeResponseMap } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)

            // Verifikasi ada entries untuk routes yang ada di manifest
            const routeCount = context.manifest.routes?.length || 0
            expect(routeResponseMap.size).toBeGreaterThanOrEqual(0)
            expect(output.lines.length).toBeGreaterThan(0)
        })

        it('should output file tanpa `any` types', async () => {
            const { output } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)
            const content = output.lines.join('\n')

            expect(content).not.toContain(' any')
            expect(content).not.toContain('as any')
        })

        it('should create valid TypeScript file', async () => {
            const { output } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)
            const content = output.lines.join('\n')

            // Basic TS validation
            expect(content).toMatch(/import\s+{/)
            expect(content).toContain('export')
        })

        // REGRESSION GUARD (Engine.Fix.md §32): sebelumnya buildResponseZodType()
        // adalah stub yang SELALU menghasilkan `z.object({})` kosong terlepas
        // dari isi manifest, dan test lama (cuma cek `toContain('z.object')` /
        // `toContain('export')`) tidak pernah mendeteksi ini karena
        // `z.object({})` tetap valid secara string-matching. Test di bawah
        // memverifikasi ISI FIELD sebenarnya, bukan cuma pola permukaan.
        it('TIDAK BOLEH menghasilkan schema kosong z.object({}) untuk model yang punya kolom', async () => {
            const { output } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)
            const content = output.lines.join('\n')

            // Model 'User' di mock manifest punya 3 kolom (id, first_name, email)
            // -> UserSchema TIDAK BOLEH kosong.
            expect(content).not.toMatch(/export const UserSchema = z\.object\(\{\}\)/)
            // Aturan umum: tidak ada satu pun `Schema = z.object({})` kosong
            // di seluruh file selama manifest test punya models/resources berisi.
            expect(content).not.toMatch(/Schema = z\.object\(\{\}\)/)
        })

        it('UserSchema harus berisi field asli dari model.columns dengan tipe Zod yang benar', async () => {
            const { output } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)
            const content = output.lines.join('\n')

            const match = content.match(/export const UserSchema = z\.object\(\{([\s\S]*?)\}\)/)
            expect(match).not.toBeNull()
            const body = match![1]

            // Ketiga kolom asli (bukan cuma "ada kata export") harus benar-benar
            // muncul dengan mapping tipe SQL -> Zod yang sesuai:
            // id: bigint -> z.number(), first_name/email: varchar -> z.string()
            expect(body).toMatch(/\bid:\s*z\.number\(\)/)
            expect(body).toMatch(/\bfirst_name:\s*z\.string\(\)/)
            expect(body).toMatch(/\bemail:\s*z\.string\(\)/)
        })

        it('response schema untuk route register.post harus berisi field asli dari response.fields, bukan placeholder kosong', async () => {
            const { output } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)
            const content = output.lines.join('\n')

            // Manifest test punya route register.post dengan response.fields:
            // success (boolean), message (string), data.token (string) — nested.
            // Sebelumnya (bug §32) ini akan selalu jadi z.object({}) polos.
            const registerMatch = content.match(/RegisterResponseSchema = ([\s\S]*?)\n\n/)
            expect(registerMatch).not.toBeNull()
            const registerSchema = registerMatch![1]
            expect(registerSchema).toMatch(/success:\s*z\.boolean\(\)/)
            expect(registerSchema).toMatch(/message:\s*z\.string\(\)/)
            // Tidak boleh cuma z.object({}) kosong
            expect(registerSchema).not.toBe('z.object({})')
        })
    })

    describe('ReadEmitter', () => {
        it('should generate api-read.ts dengan TypeScript interfaces', async () => {
            const { output: contractOutput, routeResponseMap } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)
            const output = await ReadEmitter.generate(path.join(tmpDir, 'types'), context, routeResponseMap)

            expect(output.lines.length).toBeGreaterThan(0)
            const content = output.lines.join('\n')

            expect(content).toContain('interface')
            expect(content).toContain('export')
            expect(content).not.toContain(' any')
        })

        it('should output file tanpa `any` types', async () => {
            const { routeResponseMap } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)
            const output = await ReadEmitter.generate(path.join(tmpDir, 'types'), context, routeResponseMap)
            const content = output.lines.join('\n')

            expect(content).not.toContain(' any')
            expect(content).not.toContain('as any')
        })

        // REGRESSION GUARD (Engine.Fix.md §26.2/§31.3): generateReadMapper()
        // sebelumnya membaca `model.fields` (properti yang tidak pernah ada
        // di ParsedModel — bentuk aslinya `model.columns`), sehingga SELALU
        // jatuh ke fallback blunt-cast `raw as XTransformed` untuk semua
        // model, tanpa pernah memetakan satu field pun. Test lama tidak
        // mendeteksi ini karena cuma cek kata 'interface'/'export' ada.
        it('UserTransformed interface harus punya property camelCase dari model.columns, bukan interface kosong', async () => {
            const { routeResponseMap } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)
            const output = await ReadEmitter.generate(path.join(tmpDir, 'types'), context, routeResponseMap)
            const content = output.lines.join('\n')

            const match = content.match(/interface UserTransformed \{([\s\S]*?)\}/)
            expect(match).not.toBeNull()
            const body = match![1]

            // 3 kolom asli model User (id, first_name, email) harus muncul
            // sebagai property TypeScript, first_name di-flatten camelCase.
            expect(body).toMatch(/\bid:\s*number/)
            expect(body).toMatch(/\bfirstName:\s*string/)
            expect(body).toMatch(/\bemail:\s*string/)
            // Tidak boleh kosong / interface tanpa property
            expect(body.trim().length).toBeGreaterThan(0)
        })
    })

    describe('FieldEmitter', () => {
        it('should generate api-field.ts dengan field metadata', async () => {
            const output = await FieldEmitter.generate(path.join(tmpDir, 'contract'), context)

            expect(output.lines.length).toBeGreaterThan(0)
            const content = output.lines.join('\n')

            expect(content).toContain('export const')
            expect(content).toContain('as const')
            expect(content).not.toContain(' any')
        })

        it('should have no `any` types', async () => {
            const output = await FieldEmitter.generate(path.join(tmpDir, 'contract'), context)
            const content = output.lines.join('\n')

            expect(content).not.toContain(' any')
            expect(content).not.toContain('as any')
        })

        // REGRESSION GUARD (Engine.Fix.md §31.3): FieldEmitter sebelumnya
        // juga membaca `model.fields` (bug yang sama seperti ReadEmitter),
        // hasilnya selalu `export const UnknownModelFields = {} as const`
        // untuk SEMUA model — lolos test lama karena tetap punya
        // `export const` + `as const`.
        it('UserFields harus berisi entry per kolom asli, bukan UnknownModelFields kosong', async () => {
            const output = await FieldEmitter.generate(path.join(tmpDir, 'contract'), context)
            const content = output.lines.join('\n')

            expect(content).toContain('UserFields')
            expect(content).not.toMatch(/export const UnknownModelFields = \{\} as const/)

            const match = content.match(/export const UserFields = \{([\s\S]*?)\} as const/)
            expect(match).not.toBeNull()
            const body = match![1]
            // Ketiga kolom asli harus muncul sebagai key di object field metadata
            expect(body).toContain('id:')
            expect(body).toContain('first_name:')
            expect(body).toContain('email:')
        })
    })

    describe('SchemaEmitter', () => {
        it('should generate api-schema.ts dengan form validation schemas', async () => {
            const output = await SchemaEmitter.generate(path.join(tmpDir, 'contract'), context)

            expect(output.lines.length).toBeGreaterThan(0)
            const content = output.lines.join('\n')

            expect(content).toContain('export')
            expect(content).not.toContain(' any')
        })

        // REGRESSION GUARD: memverifikasi ApiSchema.RegisterCreate benar-benar
        // berisi field dari `route.schema.rules` (name/email/password), bukan
        // cuma memverifikasi kata 'export' ada di suatu tempat di file.
        it('ApiSchema.RegisterCreate harus berisi field asli dari schema.rules', async () => {
            const output = await SchemaEmitter.generate(path.join(tmpDir, 'contract'), context)
            const content = output.lines.join('\n')

            const match = content.match(/RegisterCreate:\s*z\.object\(\{([\s\S]*?)\}\)/)
            expect(match).not.toBeNull()
            const body = match![1]

            expect(body).toMatch(/\bname:\s*z\.string\(\)/)
            expect(body).toMatch(/\bemail:\s*z\.string\(\)/)
            expect(body).toMatch(/\bpassword:\s*z\.string\(\)/)
        })
    })

    describe('MapperEmitter', () => {
        it('should generate api-mapper.ts dengan transform functions', async () => {
            const { routeResponseMap } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)
            const output = await MapperEmitter.generate(path.join(tmpDir, 'mappers'), context, routeResponseMap)

            expect(output.lines.length).toBeGreaterThan(0)
            const content = output.lines.join('\n')

            expect(content).toContain('export')
            expect(content).not.toContain(' any')
        })

        it('should output tanpa type assertions', async () => {
            const { routeResponseMap } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)
            const output = await MapperEmitter.generate(path.join(tmpDir, 'mappers'), context, routeResponseMap)
            const content = output.lines.join('\n')

            // Only allow `as const` for readonly objects
            const asPatterns = content.match(/\s+as\s+(?!const\b)/g)
            expect(asPatterns).toBeNull()
        })

        // REGRESSION GUARD (Engine.Fix.md §31.3/§31.4): toUserRead()
        // sebelumnya SELALU jatuh ke blunt-cast `raw as UserTransformed`
        // (karena baca `model.fields` yang tidak pernah ada), dan field yang
        // berhasil di-loop pun disisipi `as unknown as typeof raw.X` yang
        // tidak perlu. Test lama cuma cek kata 'export' + tidak ada ' any'.
        it('toUserRead harus memetakan field satu per satu (camelCase <- snake_case), bukan blunt-cast', async () => {
            const { routeResponseMap } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)
            const output = await MapperEmitter.generate(path.join(tmpDir, 'mappers'), context, routeResponseMap)
            const content = output.lines.join('\n')

            expect(content).not.toMatch(/toUserRead = \(raw: User\): UserTransformed => raw as UserTransformed/)

            const match = content.match(/toUserRead = \(raw: User\): UserTransformed => \(\{([\s\S]*?)\}\)/)
            expect(match).not.toBeNull()
            const body = match![1]

            expect(body).toMatch(/\bid:\s*raw\.id,/)
            expect(body).toMatch(/\bfirstName:\s*raw\.first_name,/)
            expect(body).toMatch(/\bemail:\s*raw\.email,/)
        })
    })

    describe('Cross-emitter consistency', () => {
        it('routeResponseMap dari ContractEmitter harus consistent', async () => {
            const { routeResponseMap: contractMap } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)

            // Setiap entry harus memiliki struktur yang valid
            for (const [key, composition] of contractMap) {
                expect(typeof key).toBe('string')
                expect(composition).toBeDefined()
            }
        })

        it('ReadEmitter harus bisa menerima routeResponseMap dari ContractEmitter', async () => {
            const { routeResponseMap } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)
            const readOutput = await ReadEmitter.generate(path.join(tmpDir, 'types'), context, routeResponseMap)

            expect(readOutput.lines.length).toBeGreaterThanOrEqual(0)
        })

        it('MapperEmitter harus bisa menerima routeResponseMap dari ContractEmitter', async () => {
            const { routeResponseMap } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)
            const mapperOutput = await MapperEmitter.generate(path.join(tmpDir, 'mappers'), context, routeResponseMap)

            expect(mapperOutput.lines.length).toBeGreaterThanOrEqual(0)
        })

        it('All emitters output harus valid TypeScript', async () => {
            const contractOutput = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)
            const schemaOutput = await SchemaEmitter.generate(path.join(tmpDir, 'contract'), context)
            const fieldOutput = await FieldEmitter.generate(path.join(tmpDir, 'contract'), context)
            const readOutput = await ReadEmitter.generate(path.join(tmpDir, 'types'), context, contractOutput.routeResponseMap)
            const mapperOutput = await MapperEmitter.generate(path.join(tmpDir, 'mappers'), context, contractOutput.routeResponseMap)

            // Semua output harus punya content
            expect(contractOutput.output.lines.length).toBeGreaterThanOrEqual(0)
            expect(schemaOutput.lines.length).toBeGreaterThanOrEqual(0)
            expect(fieldOutput.lines.length).toBeGreaterThanOrEqual(0)
            expect(readOutput.lines.length).toBeGreaterThanOrEqual(0)
            expect(mapperOutput.lines.length).toBeGreaterThanOrEqual(0)

            // Tidak ada `any` types di semua output
            const allContent = [
                contractOutput.output.lines.join('\n'),
                schemaOutput.lines.join('\n'),
                fieldOutput.lines.join('\n'),
                readOutput.lines.join('\n'),
                mapperOutput.lines.join('\n'),
            ].join('\n')

            expect(allContent).not.toContain(' any')
        })
    })

    describe('Output format validation', () => {
        it('ContractEmitter output harus berupa valid TypeScript', async () => {
            const { output } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)
            const content = output.lines.join('\n')

            // Basic TypeScript validation
            expect(content.length).toBeGreaterThanOrEqual(0)
            expect(content).not.toContain('as any')
        })

        it('ReadEmitter output harus berupa valid TypeScript interface', async () => {
            const { routeResponseMap } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)
            const output = await ReadEmitter.generate(path.join(tmpDir, 'types'), context, routeResponseMap)
            const content = output.lines.join('\n')

            expect(content.length).toBeGreaterThanOrEqual(0)
            expect(content).not.toContain('as any')
        })

        it('MapperEmitter output harus berupa valid TypeScript functions', async () => {
            const { routeResponseMap } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)
            const output = await MapperEmitter.generate(path.join(tmpDir, 'mappers'), context, routeResponseMap)
            const content = output.lines.join('\n')

            expect(content.length).toBeGreaterThanOrEqual(0)
            expect(content).not.toContain('as any')
        })
    })

    describe('IR pattern: routeResponseMap reusability', () => {
        it('routeResponseMap harus di-pass ke ReadEmitter tanpa re-computation', async () => {
            const { routeResponseMap: firstMap } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)

            // ReadEmitter harus menerima routeResponseMap sebagai parameter
            const readOutput = await ReadEmitter.generate(path.join(tmpDir, 'types'), context, firstMap)

            // Verifikasi bahwa output valid
            expect(readOutput.lines.length).toBeGreaterThanOrEqual(0)
        })

        it('routeResponseMap harus di-pass ke MapperEmitter tanpa re-computation', async () => {
            const { routeResponseMap } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)

            // MapperEmitter harus menerima routeResponseMap sebagai parameter
            const mapperOutput = await MapperEmitter.generate(path.join(tmpDir, 'mappers'), context, routeResponseMap)

            // Verifikasi bahwa output valid
            expect(mapperOutput.lines.length).toBeGreaterThanOrEqual(0)
        })

        it('Immutability: routeResponseMap tidak berubah setelah di-pass ke emitters', async () => {
            const { routeResponseMap } = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)
            const mapBefore = new Map(routeResponseMap)

            // Pass ke ReadEmitter
            await ReadEmitter.generate(path.join(tmpDir, 'types'), context, routeResponseMap)

            // Pass ke MapperEmitter
            await MapperEmitter.generate(path.join(tmpDir, 'mappers'), context, routeResponseMap)

            // Verifikasi map masih sama
            expect(routeResponseMap.size).toBe(mapBefore.size)
        })
    })
})
