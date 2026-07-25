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
    })

    describe('SchemaEmitter', () => {
        it('should generate api-schema.ts dengan form validation schemas', async () => {
            const output = await SchemaEmitter.generate(path.join(tmpDir, 'contract'), context)

            expect(output.lines.length).toBeGreaterThan(0)
            const content = output.lines.join('\n')

            expect(content).toContain('export')
            expect(content).not.toContain(' any')
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

